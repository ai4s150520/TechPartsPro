from rest_framework import status, generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from .tokens import email_verification_token
import json

from .models import Address, SellerProfile
from .kyc_verification import KYCVerificationService
from .serializers import (
    RegisterSerializer, UserSerializer, ChangePasswordSerializer, 
    SellerProfileSerializer, PasswordResetRequestSerializer, 
    PasswordResetConfirmSerializer, AddressSerializer
)

User = get_user_model()

# --- CUSTOM LOGIN ---
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'role': self.user.role,
            'name': f"{self.user.first_name} {self.user.last_name}".strip() or self.user.email
        }
        return data

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# --- REGISTER ---
@method_decorator(ratelimit(key='ip', rate='3/h', method='POST'), name='post')
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user = User.objects.get(email=request.data['email'])
        
        # Send verification email
        token = email_verification_token.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        verification_link = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
        
        send_mail(
            'Verify Your Email',
            f'Click here to verify: {verification_link}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return response

# --- PROFILE & PASSWORD ---
class UserProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(generics.UpdateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ChangePasswordSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response({"status": "success", "message": "Password updated successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- PASSWORD RESET FLOW ---
@method_decorator(ratelimit(key='ip', rate='3/h', method='POST'), name='post')
class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            reset_link = None
            try:
                user = User.objects.get(email=email)
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                link = f"{settings.FRONTEND_URL}/auth/reset-password?uid={uid}&token={token}"
                reset_link = link
                
                # Print in multiple formats for easy copying
                print("\n" + "="*80)
                print("PASSWORD RESET LINK (Copy this exact link):")
                print(link)
                print("="*80)
                print(f"UID: {uid}")
                print(f"TOKEN: {token}")
                print("="*80 + "\n")
                
                send_mail(
                    "Password Reset Request",
                    f"Click here to reset your password: {link}",
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
            except User.DoesNotExist:
                pass # Security: Don't reveal if user exists
            
            response_data = {"message": "If email exists, reset link sent."}
            # In DEBUG mode, return the link for testing
            if settings.DEBUG and reset_link:
                response_data["reset_link"] = reset_link
            
            return Response(response_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            if email_verification_token.check_token(user, token):
                user.is_verified = True
                user.save()
                return Response({"message": "Email verified successfully"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"error": "Invalid verification link"}, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        user = request.user
        if user.is_verified:
            return Response({"message": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST)
        
        token = email_verification_token.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        verification_link = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"
        
        send_mail(
            'Verify Your Email',
            f'Click here to verify: {verification_link}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return Response({"message": "Verification email sent"}, status=status.HTTP_200_OK)

class Enable2FAView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        from .two_factor import TwoFactorAuth
        
        user = request.user
        if user.two_factor_enabled:
            return Response({"error": "2FA already enabled"}, status=status.HTTP_400_BAD_REQUEST)
        
        secret = TwoFactorAuth.generate_secret()
        uri = TwoFactorAuth.get_totp_uri(user, secret)
        qr_code = TwoFactorAuth.generate_qr_code(uri)
        backup_codes = TwoFactorAuth.generate_backup_codes()
        
        user.two_factor_secret = secret
        user.backup_codes = backup_codes
        user.save()
        
        return Response({
            "qr_code": qr_code,
            "secret": secret,
            "backup_codes": backup_codes
        })

class Verify2FAView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        from .two_factor import TwoFactorAuth
        
        user = request.user
        token = request.data.get('token')
        
        if not user.two_factor_secret:
            return Response({"error": "2FA not set up"}, status=status.HTTP_400_BAD_REQUEST)
        
        if TwoFactorAuth.verify_token(user.two_factor_secret, token):
            user.two_factor_enabled = True
            user.save()
            return Response({"message": "2FA enabled successfully"})
        
        return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class Disable2FAView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        user = request.user
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.backup_codes = []
        user.save()
        return Response({"message": "2FA disabled"})

# --- ADDRESSES (CRUD) ---
class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

# --- KYC VERIFICATION ---
class SendAadhaarOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'SELLER':
            return Response({"error": "Only sellers can verify KYC"}, status=status.HTTP_403_FORBIDDEN)
        
        aadhaar_number = request.data.get('aadhaar_number')
        if not aadhaar_number:
            return Response({"error": "Aadhaar number required"}, status=status.HTTP_400_BAD_REQUEST)
        
        result = KYCVerificationService.send_aadhaar_otp(aadhaar_number, request.user.id)
        
        if result['success']:
            profile = request.user.seller_profile
            profile.aadhaar_number = aadhaar_number
            profile.save()
            return Response(result)
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

class VerifyAadhaarOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'SELLER':
            return Response({"error": "Only sellers can verify KYC"}, status=status.HTTP_403_FORBIDDEN)
        
        aadhaar_number = request.data.get('aadhaar_number')
        otp = request.data.get('otp')
        
        if not aadhaar_number or not otp:
            return Response({"error": "Aadhaar number and OTP required"}, status=status.HTTP_400_BAD_REQUEST)
        
        result = KYCVerificationService.verify_aadhaar_otp(aadhaar_number, otp, request.user.id)
        
        if result['success']:
            from django.utils import timezone
            profile = request.user.seller_profile
            profile.aadhaar_verified = True
            profile.aadhaar_verified_at = timezone.now()
            profile.save()
            return Response(result)
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

class SendPANOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'SELLER':
            return Response({"error": "Only sellers can verify KYC"}, status=status.HTTP_403_FORBIDDEN)
        
        pan_number = request.data.get('pan_number')
        if not pan_number:
            return Response({"error": "PAN number required"}, status=status.HTTP_400_BAD_REQUEST)
        
        result = KYCVerificationService.send_pan_otp(pan_number, request.user.id)
        
        if result['success']:
            profile = request.user.seller_profile
            profile.pan_number = pan_number.upper()
            profile.save()
            return Response(result)
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

class VerifyPANOTPView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if request.user.role != 'SELLER':
            return Response({"error": "Only sellers can verify KYC"}, status=status.HTTP_403_FORBIDDEN)
        
        pan_number = request.data.get('pan_number')
        otp = request.data.get('otp')
        
        if not pan_number or not otp:
            return Response({"error": "PAN number and OTP required"}, status=status.HTTP_400_BAD_REQUEST)
        
        result = KYCVerificationService.verify_pan_otp(pan_number, otp, request.user.id)
        
        if result['success']:
            from django.utils import timezone
            profile = request.user.seller_profile
            profile.pan_verified = True
            profile.pan_verified_at = timezone.now()
            profile.pan_holder_name = result.get('name', '')
            profile.save()
            return Response(result)
        return Response(result, status=status.HTTP_400_BAD_REQUEST)