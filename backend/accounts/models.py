from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator, MinLengthValidator, MaxLengthValidator
from django.core.exceptions import ValidationError
from .encryption import encrypt_data, decrypt_data
import re

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        SELLER = "SELLER", "Seller"
        CUSTOMER = "CUSTOMER", "Customer"

    username = None
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.CUSTOMER)
    
    phone_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$')
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    is_verified = models.BooleanField(default=False)
    
    # 2FA fields
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)
    backup_codes = models.JSONField(default=list, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return f"{self.email} ({self.role})"

class SellerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_profile')
    business_name = models.CharField(max_length=255)
    business_email = models.EmailField(blank=True, null=True)
    business_phone = models.CharField(max_length=15, blank=True, null=True)
    gst_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    pan_number = models.CharField(max_length=20, blank=True, null=True)
    warehouse_address = models.TextField(blank=True)
    
    # Aadhaar Verification
    _aadhaar_number = models.TextField(blank=True, null=True, db_column='aadhaar_number')
    aadhaar_verified = models.BooleanField(default=False)
    aadhaar_verified_at = models.DateTimeField(null=True, blank=True)
    
    # PAN Verification
    pan_verified = models.BooleanField(default=False)
    pan_verified_at = models.DateTimeField(null=True, blank=True)
    pan_holder_name = models.CharField(max_length=255, blank=True, null=True)
    
    # Bank Account Details (Encrypted)
    _bank_account_number = models.TextField(blank=True, null=True, db_column='bank_account_number')
    bank_ifsc_code = models.CharField(
        max_length=11,
        blank=True,
        null=True,
        validators=[
            MinLengthValidator(11),
            MaxLengthValidator(11)
        ],
        help_text="11-character IFSC code (e.g., SBIN0001234)"
    )
    bank_account_holder_name = models.CharField(max_length=255, blank=True, null=True)
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    
    # Razorpay Payout IDs (stored after first payout)
    razorpay_contact_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_fund_account_id = models.CharField(max_length=100, blank=True, null=True)
    
    is_approved = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['is_approved']),
        ]
    
    @property
    def bank_account_number(self):
        """Decrypt and return bank account number"""
        return decrypt_data(self._bank_account_number) if self._bank_account_number else None
    
    @bank_account_number.setter
    def bank_account_number(self, value):
        """Encrypt and store bank account number with validation"""
        if value:
            clean_value = str(value).strip()
            if not re.match(r'^\d{9,18}$', clean_value):
                raise ValidationError("Bank account number must be 9-18 digits")
            self._bank_account_number = encrypt_data(clean_value)
        else:
            self._bank_account_number = None
    
    @property
    def aadhaar_number(self):
        """Decrypt and return aadhaar number"""
        return decrypt_data(self._aadhaar_number) if self._aadhaar_number else None
    
    @aadhaar_number.setter
    def aadhaar_number(self, value):
        """Encrypt and store aadhaar number with validation"""
        if value:
            clean_value = str(value).strip().replace(' ', '')
            if not re.match(r'^\d{12}$', clean_value):
                raise ValidationError("Aadhaar number must be 12 digits")
            self._aadhaar_number = encrypt_data(clean_value)
        else:
            self._aadhaar_number = None
    
    def validate_ifsc_code(self):
        """Validate IFSC code format"""
        if self.bank_ifsc_code:
            # IFSC format: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0001234)
            if not re.match(r'^[A-Z]{4}0[A-Z0-9]{6}$', self.bank_ifsc_code.upper()):
                raise ValidationError("Invalid IFSC code format. Example: SBIN0001234")
    
    def save(self, *args, **kwargs):
        # Validate IFSC code
        if self.bank_ifsc_code:
            self.validate_ifsc_code()
            self.bank_ifsc_code = self.bank_ifsc_code.upper()
        
        # Auto-approve if all required details provided
        # KYC verification is optional but recommended
        if self._bank_account_number and self.bank_ifsc_code and self.business_name:
            self.is_approved = True
        else:
            self.is_approved = False
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.business_name

class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    street_address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='India')
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "Addresses"

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user).update(is_default=False)
        super().save(*args, **kwargs)