from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

class ReturnRequest(models.Model):
    class Status(models.TextChoices):
        REQUESTED = 'REQUESTED', 'Requested'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        PICKUP_SCHEDULED = 'PICKUP_SCHEDULED', 'Pickup Scheduled'
        IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
        RECEIVED = 'RECEIVED', 'Received by Seller'
        INSPECTED = 'INSPECTED', 'Inspected'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    class Reason(models.TextChoices):
        DEFECTIVE = 'DEFECTIVE', 'Defective/Damaged'
        WRONG_ITEM = 'WRONG_ITEM', 'Wrong Item Received'
        NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED', 'Not as Described'
        SIZE_ISSUE = 'SIZE_ISSUE', 'Size/Fit Issue'
        QUALITY_ISSUE = 'QUALITY_ISSUE', 'Quality Issue'
        CHANGED_MIND = 'CHANGED_MIND', 'Changed Mind'
        BETTER_PRICE = 'BETTER_PRICE', 'Found Better Price'
        OTHER = 'OTHER', 'Other'
    
    class RequestType(models.TextChoices):
        RETURN = 'RETURN', 'Return (Refund)'
        EXCHANGE = 'EXCHANGE', 'Exchange (Replace)'
    
    class InspectionResult(models.TextChoices):
        PENDING = 'PENDING', 'Pending Inspection'
        APPROVED = 'APPROVED', 'Approved - Product OK'
        REJECTED = 'REJECTED', 'Rejected - Product Damaged by Customer'
        PARTIAL = 'PARTIAL', 'Partial - Missing Items'
    
    # Basic Info
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='return_requests')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='return_requests')
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='seller_returns')
    
    request_type = models.CharField(max_length=20, choices=RequestType.choices, default=RequestType.RETURN)
    reason = models.CharField(max_length=50, choices=Reason.choices)
    description = models.TextField(help_text="Detailed explanation")
    
    # Evidence
    images = models.JSONField(default=list, help_text="URLs of uploaded images")
    video_url = models.URLField(blank=True, null=True, help_text="Video evidence URL")
    
    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    
    # Seller Response
    seller_response = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Inspection
    inspection_result = models.CharField(max_length=20, choices=InspectionResult.choices, default=InspectionResult.PENDING)
    inspection_notes = models.TextField(blank=True)
    inspection_images = models.JSONField(default=list)
    
    # Logistics
    return_tracking_number = models.CharField(max_length=100, blank=True)
    pickup_scheduled_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    
    # Refund/Exchange
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refund_processed_at = models.DateTimeField(null=True, blank=True)
    
    # Exchange Details (if type is EXCHANGE)
    exchange_product = models.ForeignKey('catalog.Product', on_delete=models.SET_NULL, null=True, blank=True)
    exchange_tracking_number = models.CharField(max_length=100, blank=True)
    
    # Fraud Prevention
    is_flagged = models.BooleanField(default=False, help_text="Flagged for suspicious activity")
    fraud_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    admin_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['order']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.request_type} - {self.order.order_id} - {self.status}"
    
    def calculate_fraud_score(self):
        """Calculate fraud risk score (0-100)"""
        score = 0
        
        # Check customer's return history
        customer_returns = ReturnRequest.objects.filter(
            customer=self.customer,
            status='COMPLETED'
        ).count()
        
        customer_orders = self.customer.orders.filter(status='DELIVERED').count()
        
        if customer_orders > 0:
            return_rate = (customer_returns / customer_orders) * 100
            if return_rate > 50:
                score += 30  # High return rate
            elif return_rate > 30:
                score += 15
        
        # Check if return requested too quickly after delivery
        from django.utils import timezone
        days_since_delivery = (timezone.now() - self.order.updated_at).days
        if days_since_delivery < 1:
            score += 20  # Suspicious - returned within 24 hours
        
        # Check if reason is "Changed Mind" or "Better Price"
        if self.reason in ['CHANGED_MIND', 'BETTER_PRICE']:
            score += 10
        
        # Check if no images provided for defective/wrong item
        if self.reason in ['DEFECTIVE', 'WRONG_ITEM', 'NOT_AS_DESCRIBED']:
            if not self.images:
                score += 25  # No evidence provided
        
        # Check order value
        if self.order.total_amount > 10000:
            score += 10  # High value order
        
        self.fraud_score = min(score, 100)
        self.is_flagged = score >= 50
        self.save()
        
        return score


class ReturnItem(models.Model):
    """Individual items in a return request"""
    return_request = models.ForeignKey(ReturnRequest, on_delete=models.CASCADE, related_name='items')
    order_item = models.ForeignKey('orders.OrderItem', on_delete=models.CASCADE)
    
    quantity = models.PositiveIntegerField(default=1)
    reason = models.CharField(max_length=50, choices=ReturnRequest.Reason.choices)
    
    # For partial returns
    is_approved = models.BooleanField(default=False)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        unique_together = ['return_request', 'order_item']
    
    def __str__(self):
        return f"{self.order_item.product_name} x {self.quantity}"
