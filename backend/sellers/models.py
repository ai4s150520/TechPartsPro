from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from decimal import Decimal

class Payout(models.Model):
    class Status(models.TextChoices):
        REQUESTED = 'REQUESTED', 'Requested'
        APPROVED = 'APPROVED', 'Approved'
        PROCESSING = 'PROCESSING', 'Processing'
        PAID = 'PAID', 'Paid'
        REJECTED = 'REJECTED', 'Rejected'

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payouts')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payouts', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('100.00'))])
    
    # Banking Details Snapshot (In case they change it later)
    bank_details_snapshot = models.TextField(help_text="Bank Account/UPI used for this request", blank=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    
    # Razorpay Payout Details
    razorpay_payout_id = models.CharField(max_length=100, blank=True, null=True, help_text="Razorpay Payout ID")
    utr_number = models.CharField(max_length=100, blank=True, null=True, help_text="UTR/Transaction Reference")
    
    # Admin Fields
    transaction_reference = models.CharField(max_length=100, blank=True, help_text="Bank Ref ID after payment")
    admin_note = models.TextField(blank=True, help_text="Reason for rejection or notes")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['order']),
            models.Index(fields=['-created_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['seller', 'order'],
                condition=models.Q(status__in=['APPROVED', 'PROCESSING', 'PAID']),
                name='unique_active_payout_per_order'
            )
        ]

    def __str__(self):
        return f"{self.seller.email} - {self.amount} ({self.status})"