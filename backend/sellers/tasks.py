from celery import shared_task
from django.utils import timezone
from django.db import transaction, IntegrityError
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

MINIMUM_PAYOUT_AMOUNT = Decimal('100.00')

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def schedule_automatic_payout(self, order_id):
    """
    Automatically create payout 7 days after delivery with complex validation
    """
    from orders.models import Order
    from sellers.models import Payout
    from notifications.models import Notification
    from accounts.models import SellerProfile
    from django.conf import settings
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    try:
        # Enhanced logging
        logger.info(f"Starting auto-payout task for order: {order_id}")
        
        order = Order.objects.select_related('user').prefetch_related(
            'items__seller__seller_profile'
        ).get(id=order_id)
        
        logger.info(f"Processing order {order.order_id} - Status: {order.status}, Payment: {order.payment_status}")
        
        # Validation 1: Order must be delivered and paid
        if order.status != 'DELIVERED':
            logger.warning(f"Order {order.order_id} status is {order.status}, not DELIVERED")
            return f"Order {order.order_id} not delivered yet - Status: {order.status}"
        
        if not order.payment_status:
            logger.warning(f"Order {order.order_id} payment not completed")
            return f"Order {order.order_id} payment pending"
        
        sellers_processed = []
        sellers_failed = []
        
        # Get unique sellers from delivered items
        delivered_items = order.items.filter(status='DELIVERED').select_related('seller')
        unique_sellers = {item.seller for item in delivered_items if item.seller}
        
        logger.info(f"Found {len(unique_sellers)} unique sellers for order {order.order_id}")
        
        for seller in unique_sellers:
            try:
                with transaction.atomic():
                    logger.info(f"Processing payout for seller {seller.id} ({seller.email})")
                    
                    # Validation 2: Check seller profile exists and approved
                    try:
                        seller_profile = seller.seller_profile
                        if not seller_profile.is_approved:
                            logger.warning(f"Seller {seller.id} not approved, skipping payout")
                            continue
                    except SellerProfile.DoesNotExist:
                        logger.error(f"Seller {seller.id} has no profile")
                        continue
                    
                    # Validation 3: Check if payout already exists
                    existing_payout = Payout.objects.filter(
                        seller=seller,
                        order=order,
                        status__in=['APPROVED', 'PROCESSING', 'PAID']
                    ).exists()
                    
                    if existing_payout:
                        logger.info(f"Payout already exists for seller {seller.id} order {order.order_id}")
                        continue
                    
                    # Calculate seller earnings
                    seller_items = delivered_items.filter(seller=seller)
                    total_amount = sum(
                        (item.price or Decimal('0')) * item.quantity 
                        for item in seller_items
                    )
                    
                    logger.info(f"Seller {seller.id} total amount: ₹{total_amount}")
                    
                    # Validation 4: Check if total amount is valid
                    if total_amount <= 0:
                        logger.warning(f"Invalid total amount {total_amount} for seller {seller.id}")
                        continue
                    
                    # Deduct commission
                    commission = total_amount * Decimal(str(settings.PLATFORM_COMMISSION_RATE))
                    payout_amount = total_amount - commission
                    
                    logger.info(f"Seller {seller.id} payout calculation: Total=₹{total_amount}, Commission=₹{commission}, Payout=₹{payout_amount}")
                    
                    # Validation 5: Check minimum payout threshold
                    if payout_amount < MINIMUM_PAYOUT_AMOUNT:
                        logger.info(
                            f"Payout amount ₹{payout_amount} below minimum ₹{MINIMUM_PAYOUT_AMOUNT} "
                            f"for seller {seller.id}"
                        )
                        # Notify seller about low amount
                        Notification.objects.create(
                            user=seller,
                            title='Payout Below Minimum',
                            message=f'Order #{order.order_id} earnings (₹{payout_amount}) below minimum threshold (₹{MINIMUM_PAYOUT_AMOUNT})',
                            notification_type='INFO',
                            target_url='/seller/payouts'
                        )
                        continue
                    
                    # Validation 6: Verify bank details exist
                    if not seller_profile.bank_account_number or not seller_profile.bank_ifsc_code:
                        logger.error(f"Seller {seller.id} missing bank details")
                        Notification.objects.create(
                            user=seller,
                            title='Payout Failed - Missing Bank Details',
                            message=f'Please update your bank details to receive payout for order #{order.order_id}',
                            notification_type='WARNING',
                            target_url='/seller/profile'
                        )
                        sellers_failed.append(seller.id)
                        continue
                    
                    # Create bank details snapshot
                    bank_snapshot = f"{seller_profile.bank_account_holder_name}|{seller_profile.bank_ifsc_code}|{seller_profile.bank_name or 'N/A'}"
                    
                    # Create payout
                    payout = Payout.objects.create(
                        seller=seller,
                        order=order,
                        amount=payout_amount,
                        status='APPROVED',
                        bank_details_snapshot=bank_snapshot,
                        admin_note=f'Auto-approved after 7 days. Commission: ₹{commission:.2f}'
                    )
                    
                    # Notify seller
                    Notification.objects.create(
                        user=seller,
                        title='Payout Approved',
                        message=f'₹{payout_amount:.2f} approved for order #{order.order_id}. Amount will be transferred within 2-3 business days.',
                        notification_type='SUCCESS',
                        target_url='/seller/payouts'
                    )
                    
                    sellers_processed.append(seller.id)
                    logger.info(
                        f"✅ Auto-payout created successfully: ID={payout.id}, Seller={seller.id}, "
                        f"Amount=₹{payout_amount:.2f}, Order={order.order_id}"
                    )
                    
            except IntegrityError as e:
                logger.warning(f"Duplicate payout prevented for seller {seller.id}: {e}")
                continue
            except Exception as e:
                logger.error(f"❌ Failed to create payout for seller {seller.id}: {str(e)}", exc_info=True)
                sellers_failed.append(seller.id)
                continue
        
        # Notify admin if any failures
        if sellers_failed:
            admin_users = User.objects.filter(role='ADMIN', is_active=True)
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    title='Auto-Payout Failures',
                    message=f'Order #{order.order_id}: {len(sellers_failed)} seller(s) failed payout creation',
                    notification_type='WARNING',
                    target_url='/admin/sellers/payout/'
                )
        
        result = f"✅ Processed: {len(sellers_processed)}, ❌ Failed: {len(sellers_failed)}"
        logger.info(f"🎯 Auto-payout task completed for order {order.order_id}: {result}")
        return result
        
    except Order.DoesNotExist:
        error_msg = f"❌ Order {order_id} not found"
        logger.error(error_msg)
        return "Order not found"
    except Exception as e:
        error_msg = f"❌ Auto-payout task failed for order {order_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
