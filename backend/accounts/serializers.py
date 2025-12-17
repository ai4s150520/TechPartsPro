from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from .models import SellerProfile, Address

User = get_user_model()

# --- USER SERIALIZER (READ ONLY) ---
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'is_verified')

# --- REGISTRATION SERIALIZER ---
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    # Extra fields for Seller
    business_name = serializers.CharField(write_only=True, required=False)
    gst_number = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm', 'first_name', 'last_name', 'role', 'phone_number', 'business_name', 'gst_number')

    def validate_email(self, value):
        # Check for disposable email domains
        disposable_domains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'throwaway.email']
        domain = value.split('@')[1].lower()
        if domain in disposable_domains:
            raise serializers.ValidationError("Disposable email addresses are not allowed")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Specific Validation for Sellers
        if attrs.get('role') == 'SELLER':
            if not attrs.get('business_name'):
                raise serializers.ValidationError({"business_name": "Business Name is required for Sellers."})
            if not attrs.get('gst_number'):
                raise serializers.ValidationError({"gst_number": "GST Number is required for Sellers."})
                
        return attrs

    def create(self, validated_data):
        from django.db import IntegrityError
        
        # Extract extra fields
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')
        business_name = validated_data.pop('business_name', None)
        gst_number = validated_data.pop('gst_number', None)
        
        # Check if GST number already exists for sellers
        if validated_data.get('role') == 'SELLER' and gst_number:
            if SellerProfile.objects.filter(gst_number=gst_number).exists():
                raise serializers.ValidationError({"gst_number": "This GST number is already registered."})
        
        # Create User
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'CUSTOMER'),
            phone_number=validated_data.get('phone_number', '')
        )

        # Update Seller Profile if exists (Created by Signal)
        if user.role == 'SELLER':
            try:
                profile = user.seller_profile
                profile.business_name = business_name
                profile.gst_number = gst_number
                profile.save()
            except IntegrityError:
                user.delete()  # Rollback user creation
                raise serializers.ValidationError({"gst_number": "This GST number is already registered."})

        return user

# --- CHANGE PASSWORD SERIALIZER ---
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is not correct")
        return value

# --- SELLER PROFILE SERIALIZER ---
class SellerProfileSerializer(serializers.ModelSerializer):
    aadhaar_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    aadhaar_masked = serializers.SerializerMethodField()
    
    class Meta:
        model = SellerProfile
        fields = '__all__'
        read_only_fields = ('user', 'is_approved', 'rating', 'total_sales', 'aadhaar_verified', 'aadhaar_verified_at', 'pan_verified', 'pan_verified_at')
    
    def get_aadhaar_masked(self, obj):
        if obj.aadhaar_number:
            return f"XXXX-XXXX-{obj.aadhaar_number[-4:]}"
        return None
    
    def update(self, instance, validated_data):
        aadhaar = validated_data.pop('aadhaar_number', None)
        if aadhaar:
            instance.aadhaar_number = aadhaar
        return super().update(instance, validated_data)

# --- PASSWORD RESET REQUEST SERIALIZER ---
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value

# --- PASSWORD RESET CONFIRM SERIALIZER ---
class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        # 1. Decode UID
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            self.user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid link")

        # 2. Check Token
        if not default_token_generator.check_token(self.user, attrs['token']):
            raise serializers.ValidationError("Invalid or expired token")

        return attrs

    def save(self):
        self.user.set_password(self.validated_data['new_password'])
        self.user.save()
        return self.user

# --- ADDRESS SERIALIZER (ADDED) ---
class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ('user',)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)