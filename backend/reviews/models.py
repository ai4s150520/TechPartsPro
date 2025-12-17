from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from catalog.models import Product

class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    
    # Rating Logic
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating between 1 and 5"
    )
    title = models.CharField(max_length=255, blank=True)
    comment = models.TextField()
    
    # Trust Signals
    is_verified_purchase = models.BooleanField(default=False)
    helpful_count = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        # Prevent spam: One review per product per user
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.rating}★ - {self.product.name}"


class ReviewImage(models.Model):
    """
    Allow users to upload multiple images for a single review.
    """
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reviews/')
    
    def __str__(self):
        return f"Image for Review {self.review.id}"


class ReviewVote(models.Model):
    """
    Tracks 'Helpful' votes on reviews.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='votes')
    
    class Meta:
        unique_together = ('user', 'review')