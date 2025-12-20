# Generated migration to fix dependencies

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0003_alter_orderitem_status'),
        ('coupons', '0001_initial'),
    ]

    operations = [
        # This migration ensures proper dependency order
        # No actual changes needed as models are already correct
    ]