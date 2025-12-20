# Generated migration to add missing indexes

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0004_fix_dependencies'),
    ]

    operations = [
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders_order(payment_status);",
            reverse_sql="DROP INDEX IF EXISTS idx_orders_payment_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders_order(created_at DESC);",
            reverse_sql="DROP INDEX IF EXISTS idx_orders_created_at;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_orderitem_seller ON orders_orderitem(seller_id);",
            reverse_sql="DROP INDEX IF EXISTS idx_orderitem_seller;"
        ),
    ]