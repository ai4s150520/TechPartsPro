from django.core.management.base import BaseCommand
from orders.models import Order
from wallet.services import WalletService
from wallet.models import WalletTransaction
from django.contrib.auth import get_user_model
from decimal import Decimal
from django.conf import settings

User = get_user_model()

class Command(BaseCommand):
    help = 'Manually credit wallet for delivered orders (for testing)'

    def add_arguments(self, parser):
        parser.add_argument('order_id', type=str, help='Order ID (e.g., ORD-ABC123)')

    def handle(self, *args, **options):
        order_id = options['order_id']
        
        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Order {order_id} not found'))
            return
        
        # Check status
        if order.status != 'DELIVERED':
            self.stdout.write(self.style.WARNING(f'Order status is {order.status}, not DELIVERED'))
            self.stdout.write('Do you want to continue anyway? (yes/no): ')
            # For automation, we'll proceed
        
        if not order.payment_status:
            self.stdout.write(self.style.ERROR('Order payment_status is False. Cannot credit wallet.'))
            return
        
        # Check if already credited
        already_credited = WalletTransaction.objects.filter(
            order=order,
            source='ORDER_PAYMENT'
        ).exists()
        
        if already_credited:
            self.stdout.write(self.style.WARNING(f'Wallet already credited for order {order_id}'))
            return
        
        # Get sellers
        sellers = set(item.seller for item in order.items.all() if item.seller)
        
        if not sellers:
            self.stdout.write(self.style.ERROR('No sellers found in order items'))
            return
        
        self.stdout.write(f'Found {len(sellers)} seller(s) in order')
        
        for seller in sellers:
            # Calculate earnings
            seller_items = order.items.filter(seller=seller)
            total = sum(
                (item.price or Decimal('0')) * item.quantity 
                for item in seller_items
            )
            
            commission = total * Decimal(str(settings.PLATFORM_COMMISSION_RATE))
            seller_amount = total - commission
            
            self.stdout.write(f'\nSeller: {seller.email}')
            self.stdout.write(f'  Total: ₹{total}')
            self.stdout.write(f'  Commission (10%): ₹{commission}')
            self.stdout.write(f'  Seller gets: ₹{seller_amount}')
            
            try:
                # Credit seller wallet
                WalletService.credit_wallet(
                    user=seller,
                    amount=seller_amount,
                    source='ORDER_PAYMENT',
                    order=order,
                    description=f'Payment for order #{order.order_id}'
                )
                self.stdout.write(self.style.SUCCESS(f'  ✓ Credited ₹{seller_amount} to seller wallet'))
                
                # Credit admin wallet
                admin = User.objects.filter(role='ADMIN', is_active=True).first()
                if admin:
                    WalletService.credit_wallet(
                        user=admin,
                        amount=commission,
                        source='COMMISSION',
                        order=order,
                        description=f'Commission from order #{order.order_id}'
                    )
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Credited ₹{commission} to admin wallet'))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ✗ Failed: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Wallet credit completed for order {order_id}'))
