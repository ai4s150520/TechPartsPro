from django.core.management.base import BaseCommand
from coupons.models import Coupon
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Create a new coupon code'

    def add_arguments(self, parser):
        parser.add_argument('code', type=str, help='Coupon code (e.g., SAVE20)')
        parser.add_argument('--type', type=str, default='PERCENTAGE', choices=['PERCENTAGE', 'FIXED'], help='Discount type')
        parser.add_argument('--value', type=float, required=True, help='Discount value (20 for 20%% or 100 for Rs.100)')
        parser.add_argument('--min', type=float, default=0, help='Minimum purchase amount')
        parser.add_argument('--days', type=int, default=30, help='Valid for how many days')
        parser.add_argument('--limit', type=int, default=None, help='Usage limit (optional)')

    def handle(self, *args, **options):
        try:
            coupon = Coupon.objects.create(
                code=options['code'].upper(),
                discount_type=options['type'],
                discount_value=options['value'],
                min_purchase_amount=options['min'],
                valid_from=timezone.now(),
                valid_to=timezone.now() + timedelta(days=options['days']),
                active=True,
                usage_limit=options['limit']
            )
            
            self.stdout.write(self.style.SUCCESS('[OK] Coupon created successfully!'))
            self.stdout.write(f'  Code: {coupon.code}')
            self.stdout.write(f'  Type: {coupon.discount_type}')
            self.stdout.write(f'  Value: {coupon.discount_value}')
            self.stdout.write(f'  Min Purchase: Rs.{coupon.min_purchase_amount}')
            self.stdout.write(f'  Valid Until: {coupon.valid_to.strftime("%Y-%m-%d")}')
            if coupon.usage_limit:
                self.stdout.write(f'  Usage Limit: {coupon.usage_limit}')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'[FAIL] Failed to create coupon: {str(e)}'))
