from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class Coupon(models.Model):
    class DiscountTypes(models.TextChoices):
        PERCENTAGE = 'PERCENTAGE', 'Percentage Off (%)'
        FIXED = 'FIXED', 'Fixed Amount Off ($)'

    code = models.CharField(max_length=50, unique=True, help_text="e.g. SUMMER20")
    
    # Discount Logic
    discount_type = models.CharField(max_length=20, choices=DiscountTypes.choices, default=DiscountTypes.PERCENTAGE)
    discount_value = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    # Constraints
    min_purchase_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0, 
        help_text="Minimum cart total required to apply this coupon"
    )
    
    # Duration
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    
    # Usage Controls
    active = models.BooleanField(default=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Total times this coupon can be used by anyone")
    used_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.code

    @property
    def is_valid(self):
        now = timezone.now()
        return self.active and self.valid_from <= now <= self.valid_to

    def get_discount_amount(self, cart_total):
        """
        Calculates the actual money saved based on the cart total.
        """
        if self.min_purchase_amount > cart_total:
            return 0
        
        if self.discount_type == self.DiscountTypes.FIXED:
            return min(self.discount_value, cart_total) # Cannot discount more than total
        
        elif self.discount_type == self.DiscountTypes.PERCENTAGE:
            discount = (self.discount_value / 100) * cart_total
            return discount
            
        return 0