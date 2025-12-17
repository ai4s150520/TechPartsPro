from django.db import models
from django.conf import settings
from catalog.models import Product

class WishlistItem(models.Model):
    """
    Represents a specific product saved by a specific user.
    We use an explicit model instead of ManyToMany on User to track 'added_at'.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # A user cannot wishlist the same product twice
        unique_together = ('user', 'product')
        ordering = ['-added_at']
        verbose_name = "Wishlist Item"
        verbose_name_plural = "Wishlist Items"

    def __str__(self):
        return f"{self.user.email} - {self.product.name}"