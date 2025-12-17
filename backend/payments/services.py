import razorpay
import hmac
import hashlib
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
import logging
from .models import Transaction
from orders.models import Order
from notifications.services import NotificationService
from cart.models import Cart

logger = logging.getLogger(__name__)
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class PaymentService:
    
    @staticmethod
    def create_razorpay_order(order_id, user):
        try:
            order = Order.objects.get(id=order_id, user=user)
        except Order.DoesNotExist:
            raise ValidationError("Order not found")

        if order.status != Order.Status.PENDING:
            if order.payment_status:
                 return None 
            if order.status == Order.Status.CANCELLED:
                 raise ValidationError("Order is cancelled")

        amount_in_paise = int(order.total_amount * 100)

        try:
            razorpay_order = client.order.create({
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": str(order.order_id),
                "payment_capture": 1
            })
            return razorpay_order['id']

        except Exception as e:
            raise ValidationError(f"Razorpay Error: {str(e)}")

    @staticmethod
    def verify_payment_signature(data):
        """Verify payment signature with complex validation"""
        try:
            # Validation 1: Check required fields
            required_fields = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature']
            for field in required_fields:
                if not data.get(field):
                    logger.error(f"Missing required field: {field}")
                    return False
            
            # Validation 2: Verify signature
            try:
                client.utility.verify_payment_signature({
                    'razorpay_order_id': data.get('razorpay_order_id'),
                    'razorpay_payment_id': data.get('razorpay_payment_id'),
                    'razorpay_signature': data.get('razorpay_signature')
                })
            except razorpay.errors.SignatureVerificationError as e:
                logger.error(f"Signature verification failed: {e}")
                return False

            with transaction.atomic():
                # Validation 3: Get transaction
                try:
                    txn = Transaction.objects.select_for_update().get(
                        payment_id=data.get('razorpay_order_id')
                    )
                except Transaction.DoesNotExist:
                    logger.error(f"Transaction not found for RZP Order {data.get('razorpay_order_id')}")
                    return False
                
                # Validation 4: Check if already processed
                if txn.status == Transaction.Status.SUCCESS:
                    logger.warning(f"Transaction {txn.id} already processed")
                    return True
                
                order = txn.order
                
                # Validation 5: Check order state
                if order.payment_status:
                    logger.warning(f"Order {order.order_id} already paid")
                    return True
                
                if order.status == 'CANCELLED':
                    logger.error(f"Cannot process payment for cancelled order {order.order_id}")
                    return False
                
                # Update order
                if order.payment_method == 'COD':
                    order.payment_method = 'CARD'
                
                order.payment_status = True
                order.status = 'PROCESSING'
                order.save()

                # Update transaction
                txn.status = Transaction.Status.SUCCESS
                txn.gateway_response = data
                txn.save()

                # Clear cart
                try:
                    cart = Cart.objects.get(user=order.user)
                    cart.items.all().delete()
                    cart.coupon = None
                    cart.save()
                    logger.info(f"Cart cleared for user {order.user.id}")
                except Cart.DoesNotExist:
                    pass

                # Send notification
                NotificationService.create_notification(
                    user=order.user,
                    title="Payment Received",
                    message=f"Order #{order.order_id} confirmed. Amount: ₹{order.total_amount}",
                    type='SUCCESS'
                )
                
                logger.info(
                    f"Payment verified successfully: Order={order.order_id}, "
                    f"Payment={data.get('razorpay_payment_id')}, Amount=₹{order.total_amount}"
                )
                return True

        except Exception as e:
            logger.error(f"Payment verification failed: {str(e)}", exc_info=True)
            return False
    
    @staticmethod
    def verify_webhook_signature(payload, signature):
        """Verify Razorpay webhook signature"""
        try:
            expected_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            logger.error(f"Webhook signature verification failed: {e}")
            return False