from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal

class Wallet(models.Model):
    """Virtual wallet for users (sellers/customers)"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    is_active = models.BooleanField(default=True)
    is_locked = models.BooleanField(default=False, help_text="Lock wallet if negative balance or fraud")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - ₹{self.balance}"


class WalletTransaction(models.Model):
    """Record every credit/debit to wallet"""
    class TransactionType(models.TextChoices):
        CREDIT = 'CREDIT', 'Credit'
        DEBIT = 'DEBIT', 'Debit'
    
    class Source(models.TextChoices):
        ORDER_PAYMENT = 'ORDER_PAYMENT', 'Order Payment'
        ORDER_REFUND = 'ORDER_REFUND', 'Order Refund'
        WITHDRAWAL = 'WITHDRAWAL', 'Withdrawal'
        COMMISSION = 'COMMISSION', 'Platform Commission'
        ADJUSTMENT = 'ADJUSTMENT', 'Manual Adjustment'
    
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    source = models.CharField(max_length=20, choices=Source.choices)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    balance_before = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    
    order = models.ForeignKey('orders.Order', on_delete=models.SET_NULL, null=True, blank=True)
    withdrawal = models.ForeignKey('Withdrawal', on_delete=models.SET_NULL, null=True, blank=True)
    
    description = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['wallet', '-created_at']),
            models.Index(fields=['order']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type} ₹{self.amount} - {self.wallet.user.email}"


class Withdrawal(models.Model):
    """Withdrawal requests from wallet to bank"""
    class Status(models.TextChoices):
        REQUESTED = 'REQUESTED', 'Requested'
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        REJECTED = 'REJECTED', 'Rejected'
    
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='withdrawals')
    
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('100.00'))])
    
    bank_account_number = models.CharField(max_length=100)
    bank_ifsc_code = models.CharField(max_length=11)
    bank_account_holder = models.CharField(max_length=255)
    bank_name = models.CharField(max_length=255, blank=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    
    razorpay_payout_id = models.CharField(max_length=100, blank=True)
    utr_number = models.CharField(max_length=100, blank=True)
    
    rejection_reason = models.TextField(blank=True)
    admin_note = models.TextField(blank=True)
    
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['wallet', '-requested_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.wallet.user.email} - ₹{self.amount} ({self.status})"
