from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Add performance indexes'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_active ON catalog_product(is_active, created_at DESC);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_seller ON catalog_product(seller_id);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_order_user ON orders_order(user_id, created_at DESC);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_order_status ON orders_order(status);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_payment_order ON payments_payment(order_id);")
            
        self.stdout.write(self.style.SUCCESS('Indexes added'))
