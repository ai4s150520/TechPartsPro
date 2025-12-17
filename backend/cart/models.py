from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from coupons.models import Coupon

# We import Product dynamically to avoid circular import errors
from catalog.models import Product 

class Cart(models.Model):
    """
    Represents a Shopping Cart. 
    Can be linked to a User OR a Session ID (for future guest checkout features).
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='cart',
        null=True, 
        blank=True
    )
    session_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['session_id']),
        ]

    def __str__(self):
        return f"Cart {self.id} - {self.user.email if self.user else 'Guest'}"

    @property
    def total_price(self):
        """Calculates total value of the cart dynamically."""
        return sum(item.subtotal for item in self.items.all())

    @property
    def total_items(self):
        """Count total individual items (quantity sum)."""
        return sum(item.quantity for item in self.items.all())
    
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    
    # Snapshot of price when added (Optional, usually handled in Orders, 
    # but good for notifying users of price changes)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'product')
        ordering = ['-added_at']
        indexes = [
            models.Index(fields=['cart', 'product']),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    @property
    def subtotal(self):
        # Checks if product has a discount price, else uses regular price
        price = self.product.discount_price if self.product.discount_price else self.product.price
        return price * self.quantity