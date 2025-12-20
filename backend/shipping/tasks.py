from celery import shared_task
from django.utils import timezone
from .shiprocket_service import shiprocket_service
from orders.models import OrderItem
import logging

logger = logging.getLogger(__name__)

@shared_task
def sync_tracking_updates():
    """Sync tracking updates for all active shipments"""
    try:
        # Get all order items that are shipped but not delivered
        active_items = OrderItem.objects.filter(
            status__in=['SHIPPED'],
            tracking_number__isnull=False
        ).exclude(tracking_number='')
        
        updated_count = 0
        for item in active_items:
            try:
                updates = shiprocket_service.track_shipment(item.tracking_number)
                if updates:
                    item.tracking_updates = updates
                    # Update status based on latest update
                    if updates:
                        latest_status = updates[-1].get('status', '').upper()
                        if 'DELIVERED' in latest_status:
                            item.status = 'DELIVERED'
                        elif 'OUT FOR DELIVERY' in latest_status:
                            item.status = 'SHIPPED'  # Keep as shipped until delivered
                    item.save()
                    updated_count += 1
            except Exception as e:
                logger.warning(f"Failed to update tracking for item {item.id}: {e}")
                continue
        
        logger.info(f"Updated tracking for {updated_count} shipments")
        return f"Updated tracking for {updated_count} shipments"
    except Exception as e:
        logger.error(f"Tracking sync failed: {e}")
        return f"Tracking sync failed: {e}"