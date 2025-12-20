from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order
from notifications.models import Notification
from django.utils import timezone
from datetime import timedelta
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@receiver(post_save, sender=Order)
def create_order_notifications(sender, instance, created, **kwargs):
    """Create notifications for order status changes"""
    
    if created:
        # New order - notify sellers (get from order items)
        sellers = set()
        for item in instance.items.all():
            if item.seller:
                sellers.add(item.seller)
        
        for seller in sellers:
            Notification.objects.create(
                user=seller,
                title="New Order Received!",
                message=f"Order #{instance.order_id} for ₹{instance.total_amount}",
                notification_type='SUCCESS',
                target_url=f'/seller/orders'
            )
            # Send real-time notification to seller via channel layer
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'notifications_user_{seller.id}',
                    {
                        'type': 'notification_message',
                        'message': {
                            'title': 'New Order Received!',
                            'body': f'Order #{instance.order_id} for ₹{instance.total_amount}'
                        }
                    }
                )
            except Exception:
                pass
        
        # New order - notify customer (user field, not customer)
        Notification.objects.create(
            user=instance.user,
            title="Order Placed Successfully",
            message=f"Your order #{instance.order_id} has been confirmed",
            notification_type='SUCCESS',
            target_url=f'/account/orders'
        )
    
    else:
        # Status changed - notify customer
        status_messages = {
            'PROCESSING': 'Your order is being processed',
            'SHIPPED': 'Your order has been shipped',
            'DELIVERED': 'Your order has been delivered',
            'CANCELLED': 'Your order has been cancelled',
        }
        
        if instance.status in status_messages:
            Notification.objects.create(
                user=instance.user,
                title=f"Order {instance.status.title()}",
                message=f"Order #{instance.order_id}: {status_messages[instance.status]}",
                notification_type='INFO' if instance.status != 'CANCELLED' else 'WARNING',
                target_url=f'/account/orders'
            )
            # Send real-time notification to customer
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'notifications_user_{instance.user.id}',
                    {
                        'type': 'notification_message',
                        'message': {
                            'title': f'Order {instance.status.title()}',
                            'body': f'Order #{instance.order_id}: {status_messages[instance.status]}'
                        }
                    }
                )
            except Exception:
                pass
            # Broadcast order-specific update to order group
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'order_{instance.id}',
                    {
                        'type': 'order_update',
                        'status': instance.status,
                        'message': status_messages[instance.status]
                    }
                )
            except Exception:
                pass
        
        # Auto-create payout when delivered
        if instance.status == 'DELIVERED' and instance.payment_status:
            from sellers.tasks import schedule_automatic_payout
            # Schedule payout after 7 days (return period)
            payout_date = timezone.now() + timedelta(days=7)
            schedule_automatic_payout.apply_async(
                args=[str(instance.id)],
                eta=payout_date
            )

@receiver(post_save, sender=Order)
def sync_order_status_to_items(sender, instance, created, **kwargs):
    """
    Synchronize OrderItem statuses with the main Order status.
    This ensures that when an admin updates the Order status, 
    sellers see the update in their OrderItems list.
    """
    if not created:
        # Statuses common to both models
        syncable_statuses = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']
        
        if instance.status in syncable_statuses:
            # We use .update() here to avoid recursive signals or redundant processing
            # since we just want to force the status change down to the items.
            instance.items.all().update(status=instance.status)
            
            # Broadcast the update for the specific order items via WS if needed
            # (Front-end Seller Dashboard uses OrderItem.status)
            try:
                channel_layer = get_channel_layer()
                for item in instance.items.all():
                    if item.seller:
                        async_to_sync(channel_layer.group_send)(
                            f'notifications_user_{item.seller.id}',
                            {
                                'type': 'order_update',
                                'order_id': str(item.id), # Seller frontend tracks OrderItem id
                                'status': instance.status
                            }
                        )
            except Exception:
                pass
