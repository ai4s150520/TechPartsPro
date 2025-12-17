from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count
from .models import Review
from catalog.models import Product

@receiver([post_save, post_delete], sender=Review)
def update_product_rating(sender, instance, **kwargs):
    """
    When a review is added or deleted, recalculate the 
    Product's average rating and store it.
    """
    product = instance.product
    
    # Calculate Aggregates
    aggregates = Review.objects.filter(product=product).aggregate(
        avg_rating=Avg('rating'),
        count=Count('id')
    )
    
    # Ideally, add 'rating' and 'review_count' to Product model in catalog app.
    if hasattr(product, 'rating') and hasattr(product, 'review_count'):
        product.rating = aggregates['avg_rating'] or 0
        product.review_count = aggregates['count'] or 0
        product.save(update_fields=['rating', 'review_count'])