from django.db import transaction
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .models import Order, OrderItem
from cart.models import Cart
from accounts.models import Address
from notifications.services import NotificationService
import logging

logger = logging.getLogger(__name__)

class OrderService:
    @staticmethod
    def create_order_from_cart(user, address_id, payment_method, clear_cart=True):
        """
        The Atomic Checkout Process.
        Added 'clear_cart' param to control when items are removed.
        """
        
        # 1. Fetch Data
        try:
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            raise ValidationError("Cart is empty")

        if not cart.items.exists():
            raise ValidationError("Cart is empty")

        address = get_object_or_404(Address, id=address_id, user=user)

        # 2. Start Atomic Transaction
        with transaction.atomic():
            # Calculate Totals
            subtotal = cart.total_price
            discount = 0
            
            # Apply Coupon if exists
            if cart.coupon:
                discount = cart.coupon.get_discount_amount(subtotal)
            
            final_total = subtotal - discount

            # Create Order Object
            order = Order.objects.create(
                user=user,
                total_amount=final_total,
                discount_amount=discount,
                coupon=cart.coupon,
                shipping_address={
                    "full_name": address.full_name,
                    "street": address.street_address,
                    "city": address.city,
                    "state": address.state,
                    "zip": address.postal_code,
                    "phone": address.phone_number
                },
                payment_method=payment_method,
                status='PENDING' 
            )

            # Move Items & Deduct Stock
            for cart_item in cart.items.select_related('product').all():
                product = cart_item.product
                
                # Lock product row
                product = product.__class__.objects.select_for_update().get(id=product.id)
                
                if product.stock_quantity < cart_item.quantity:
                    raise ValidationError(f"Insufficient stock for {product.name}")
                
                # Snapshot Price
                item_price = product.discount_price if product.discount_price else product.price
                
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    price=item_price,
                    quantity=cart_item.quantity
                )
                
                # Deduct Stock
                product.stock_quantity -= cart_item.quantity
                product.save()

            # --- MODIFIED LOGIC: Conditional Cart Clearing ---
            if clear_cart:
                cart.items.all().delete()
                cart.coupon = None
                cart.save()
            
            # Trigger Notification (FAIL-SAFE)
            try:
                NotificationService.order_created(user, order)
            except Exception as e:
                logger.error(f"Failed to send order notification: {str(e)}")
                print(f"WARNING: Email failed for Order {order.order_id}, but order was created successfully.")

            return order