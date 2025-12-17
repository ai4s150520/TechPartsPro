from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from orders.models import Order
from .models import Wallet
from .services import WalletService
from decimal import Decimal
from django.conf import settings
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    """Create wallet when user is created"""
    if created:
        Wallet.objects.create(user=instance)
        logger.info(f"Wallet created for user: {instance.email}")


@receiver(post_save, sender=Order)
def handle_order_wallet_transactions(sender, instance, created, **kwargs):
    """Credit seller wallet when order is delivered"""
    if not created and instance.status == 'DELIVERED' and instance.payment_status:
        # Check if already credited
        from wallet.models import WalletTransaction
        already_credited = WalletTransaction.objects.filter(
            order=instance,
            source='ORDER_PAYMENT'
        ).exists()
        
        if already_credited:
            return
        
        # Get unique sellers from order items
        sellers = set(item.seller for item in instance.items.all() if item.seller)
        
        for seller in sellers:
            try:
                # Calculate seller's earnings
                seller_items = instance.items.filter(seller=seller)
                total = sum(
                    (item.price or Decimal('0')) * item.quantity 
                    for item in seller_items
                )
                
                # Deduct commission
                commission = total * Decimal(str(settings.PLATFORM_COMMISSION_RATE))
                seller_amount = total - commission
                
                # Credit seller wallet
                WalletService.credit_wallet(
                    user=seller,
                    amount=seller_amount,
                    source='ORDER_PAYMENT',
                    order=instance,
                    description=f'Payment for order #{instance.order_id}'
                )
                
                # Credit admin wallet (commission)
                admin = User.objects.filter(role='ADMIN', is_active=True).first()
                if admin:
                    WalletService.credit_wallet(
                        user=admin,
                        amount=commission,
                        source='COMMISSION',
                        order=instance,
                        description=f'Commission from order #{instance.order_id}'
                    )
                
                logger.info(f"Credited ₹{seller_amount} to seller {seller.email} for order {instance.order_id}")
            
            except Exception as e:
                logger.error(f"Failed to credit wallet for seller {seller.email}: {str(e)}")
