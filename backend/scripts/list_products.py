import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalog.models import Product

print('TOTAL_PRODUCTS:', Product.objects.count())
for p in Product.objects.order_by('-created_at')[:30]:
    print(p.sku, '|', p.name, '| seller_id=', getattr(p.seller, 'id', None))
