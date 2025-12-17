from django.db import models
from django.conf import settings
from orders.models import Order

class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    class Provider(models.TextChoices):
        STRIPE = 'STRIPE', 'Stripe'
        RAZORPAY = 'RAZORPAY', 'Razorpay'
        PAYPAL = 'PAYPAL', 'PayPal'

    # Link to Order
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    # Gateway Details
    payment_id = models.CharField(max_length=100, unique=True, help_text="Transaction ID from Gateway")
    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.STRIPE)
    
    # Financials
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default='USD')
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Audit Trail
    gateway_response = models.JSONField(default=dict, blank=True) # Store raw response for debugging
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.payment_id} - {self.status}"