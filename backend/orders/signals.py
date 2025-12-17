from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order
from notifications.models import Notification
from django.utils import timezone
from datetime import timedelta

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
        
        # Auto-create payout when delivered
        if instance.status == 'DELIVERED' and instance.payment_status:
            from sellers.tasks import schedule_automatic_payout
            # Schedule payout after 7 days (return period)
            payout_date = timezone.now() + timedelta(days=7)
            schedule_automatic_payout.apply_async(
                args=[str(instance.id)],
                eta=payout_date
            )
