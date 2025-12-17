from celery import shared_task
from orders.models import Order
from .shiprocket_service import shiprocket_service
from notifications.models import Notification

@shared_task
def sync_tracking_updates():
    """
    Celery task to sync tracking updates for all shipped items
    Run every 30 minutes - handles multiple sellers per order
    """
    from orders.models import OrderItem
    
    shipped_items = OrderItem.objects.filter(
        status='SHIPPED',
        tracking_number__isnull=False
    ).select_related('order', 'seller')
    
    synced_count = 0
    
    for item in shipped_items:
        try:
            # Get latest tracking updates from Shiprocket
            updates = shiprocket_service.track_shipment(item.tracking_number)
            
            if updates:
                # Update item tracking history
                item.tracking_updates = updates
                
                # Check if delivered
                latest_status = updates[0].get('status', '').lower() if updates else ''
                if 'delivered' in latest_status and item.status != 'DELIVERED':
                    item.status = 'DELIVERED'
                    
                    # Notify customer about this item
                    Notification.objects.create(
                        user=item.order.user,
                        title=f"Item Delivered from {item.seller.first_name}!",
                        message=f"{item.product_name} has been delivered",
                        notification_type='SUCCESS',
                        target_url=f'/account/orders/{item.order.id}/track'
                    )
                
                item.save()
                synced_count += 1
                
                # Update main order status if ALL items delivered
                order = item.order
                if not order.items.exclude(status='DELIVERED').exists():
                    order.status = 'DELIVERED'
                    order.save()
        
        except Exception as e:
            print(f"Failed to sync tracking for item {item.id}: {e}")
            continue
    
    return f"Synced {synced_count} items"


@shared_task
def update_single_order_tracking(order_id):
    """
    Update tracking for a single order
    """
    try:
        order = Order.objects.get(id=order_id, tracking_number__isnull=False)
        updates = shiprocket_service.track_shipment(order.tracking_number)
        
        if updates:
            order.tracking_updates = updates
            order.save()
            return f"Updated tracking for {order.order_id}"
    except Order.DoesNotExist:
        return "Order not found"
    except Exception as e:
        return f"Error: {str(e)}"
