from django.urls import path, include
from rest_framework.routers import DefaultRouter
# FIX: Import TokenBlacklistView
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from .views import (
    RegisterView, 
    CustomLoginView, 
    UserProfileView, 
    ChangePasswordView,
    PasswordResetRequestView, 
    PasswordResetConfirmView,
    VerifyEmailView,
    ResendVerificationView,
    Enable2FAView,
    Verify2FAView,
    Disable2FAView,
    AddressViewSet,
    SendAadhaarOTPView,
    VerifyAadhaarOTPView,
    SendPANOTPView,
    VerifyPANOTPView
)

# Router for ViewSets (like Addresses)
router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')

urlpatterns = [
    # Auth Endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    
    # JWT Standard Endpoints
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'), # FIX: Added this
    
    # Password Management
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Email Verification
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend_verification'),
    
    # 2FA
    path('2fa/enable/', Enable2FAView.as_view(), name='enable_2fa'),
    path('2fa/verify/', Verify2FAView.as_view(), name='verify_2fa'),
    path('2fa/disable/', Disable2FAView.as_view(), name='disable_2fa'),
    
    # User Profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # KYC Verification
    path('kyc/aadhaar/send-otp/', SendAadhaarOTPView.as_view(), name='send_aadhaar_otp'),
    path('kyc/aadhaar/verify-otp/', VerifyAadhaarOTPView.as_view(), name='verify_aadhaar_otp'),
    path('kyc/pan/send-otp/', SendPANOTPView.as_view(), name='send_pan_otp'),
    path('kyc/pan/verify-otp/', VerifyPANOTPView.as_view(), name='verify_pan_otp'),

    # Include Router URLs (e.g. /addresses/)
    path('', include(router.urls)),
]