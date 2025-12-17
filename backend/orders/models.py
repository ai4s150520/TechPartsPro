from django.db import models
from django.conf import settings
from django.utils.crypto import get_random_string
import uuid

# Import dependency models
from catalog.models import Product
from coupons.models import Coupon

class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Payment'
        PROCESSING = 'PROCESSING', 'Processing' 
        SHIPPED = 'SHIPPED', 'Shipped'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'
        RETURNED = 'RETURNED', 'Returned'

    # Identifiers
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_id = models.CharField(max_length=20, unique=True, editable=False) 
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    
    # Financials
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_status = models.BooleanField(default=False)
    payment_method = models.CharField(max_length=50, default='CARD') 
    
    # Logistics 
    shipping_address = models.JSONField() 
    billing_address = models.JSONField(null=True, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    courier_name = models.CharField(max_length=100, blank=True, null=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    tracking_updates = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['order_id']),
            models.Index(fields=['-created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.order_id:
            random_str = get_random_string(8).upper()
            self.order_id = f"ORD-{random_str}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_id} - {self.user.email}"


class OrderItem(models.Model):
    """
    Individual line items with per-seller tracking
    """
    class ItemStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSING = 'PROCESSING', 'Processing'
        SHIPPED = 'SHIPPED', 'Shipped'
        DELIVERED = 'DELIVERED', 'Delivered'
        CANCELLED = 'CANCELLED', 'Cancelled'
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True) 
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sold_items')
    
    # Snapshots
    product_name = models.CharField(max_length=255) 
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) 
    quantity = models.PositiveIntegerField(default=1)
    
    # Per-item tracking (each seller ships separately)
    status = models.CharField(max_length=20, choices=ItemStatus.choices, default=ItemStatus.PENDING)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    courier_name = models.CharField(max_length=100, blank=True, null=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    tracking_updates = models.JSONField(default=list, blank=True)
    shiprocket_shipment_id = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['seller']),
            models.Index(fields=['order']),
            models.Index(fields=['tracking_number']),
        ]

    def save(self, *args, **kwargs):
        # Auto-set seller from product
        if self.product and not self.seller:
            self.seller = self.product.seller
        # Validate price is set
        if self.price is None and self.product:
            self.price = self.product.discount_price or self.product.price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.quantity} x {self.product_name}"

    @property
    def subtotal(self):
        if self.price is None:
            return 0
        return self.price * self.quantity