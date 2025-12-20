from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Cart
import logging

logger = logging.getLogger(__name__)

@shared_task
def cleanup_expired_carts():
    """Remove cart items older than 7 days"""
    try:
        cutoff_date = timezone.now() - timedelta(days=7)
        expired_carts = Cart.objects.filter(updated_at__lt=cutoff_date)
        
        count = 0
        for cart in expired_carts:
            cart.items.all().delete()
            count += 1
        
        logger.info(f"Cleaned up {count} expired carts")
        return f"Cleaned up {count} expired carts"
    except Exception as e:
        logger.error(f"Cart cleanup failed: {e}")
        return f"Cart cleanup failed: {e}"