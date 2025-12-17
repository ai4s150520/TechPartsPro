from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from catalog.models import Category, Brand, Product
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create admin user
        if not User.objects.filter(email='admin@example.com').exists():
            User.objects.create_superuser(
                email='admin@example.com',
                password='admin123',
                role='ADMIN'
            )
            self.stdout.write(self.style.SUCCESS('Admin user created'))
        
        # Create seller
        if not User.objects.filter(email='seller@example.com').exists():
            seller = User.objects.create_user(
                email='seller@example.com',
                password='seller123',
                role='SELLER',
                first_name='Test',
                last_name='Seller'
            )
            profile = seller.seller_profile
            profile.business_name = 'Tech Parts Store'
            profile.bank_account_number = '1234567890'
            profile.bank_ifsc_code = 'SBIN0001234'
            profile.save()
            self.stdout.write(self.style.SUCCESS('Seller created'))
        else:
            seller = User.objects.get(email='seller@example.com')
        
        # Create customer
        if not User.objects.filter(email='customer@example.com').exists():
            User.objects.create_user(
                email='customer@example.com',
                password='customer123',
                role='CUSTOMER',
                first_name='Test',
                last_name='Customer'
            )
            self.stdout.write(self.style.SUCCESS('Customer created'))
        
        # Create categories
        categories = ['Screens & Displays', 'Batteries', 'Charging Ports', 'Back Panels', 'Repair Tools']
        for cat_name in categories:
            Category.objects.get_or_create(name=cat_name, defaults={'slug': cat_name.lower().replace(' ', '-')})
        self.stdout.write(self.style.SUCCESS(f'{len(categories)} categories created'))
        
        # Create brands
        brands = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Realme']
        for brand_name in brands:
            Brand.objects.get_or_create(name=brand_name, defaults={'slug': brand_name.lower()})
        self.stdout.write(self.style.SUCCESS(f'{len(brands)} brands created'))
        
        # Create sample products
        category = Category.objects.first()
        brand = Brand.objects.first()
        
        products = [
            {'name': 'iPhone 14 Pro Display', 'price': 12999, 'stock': 50},
            {'name': 'Samsung S23 Battery', 'price': 1999, 'stock': 100},
            {'name': 'OnePlus 11 Charging Port', 'price': 899, 'stock': 75},
        ]
        
        for prod_data in products:
            if not Product.objects.filter(name=prod_data['name']).exists():
                Product.objects.create(
                    seller=seller,
                    category=category,
                    brand=brand,
                    name=prod_data['name'],
                    sku=f"SKU-{prod_data['name'][:5].upper()}",
                    description=f"High quality {prod_data['name']}",
                    price=Decimal(prod_data['price']),
                    stock_quantity=prod_data['stock'],
                    is_active=True
                )
        
        self.stdout.write(self.style.SUCCESS(f'{len(products)} products created'))
        self.stdout.write(self.style.SUCCESS('\nSample data created successfully!'))
        self.stdout.write('\nLogin credentials:')
        self.stdout.write('Admin: admin@example.com / admin123')
        self.stdout.write('Seller: seller@example.com / seller123')
        self.stdout.write('Customer: customer@example.com / customer123')
