from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from catalog.models import Category, Brand, Product, ProductImage
from accounts.models import SellerProfile
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')

        # Create users
        admin_user, created = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'first_name': 'Admin',
                'last_name': 'User'
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write('Created admin user')

        seller_user, created = User.objects.get_or_create(
            email='seller@example.com',
            defaults={
                'role': 'SELLER',
                'first_name': 'Test',
                'last_name': 'Seller'
            }
        )
        if created:
            seller_user.set_password('seller123')
            seller_user.save()
            self.stdout.write('Created seller user')

        customer_user, created = User.objects.get_or_create(
            email='customer@example.com',
            defaults={
                'role': 'CUSTOMER',
                'first_name': 'Test',
                'last_name': 'Customer'
            }
        )
        if created:
            customer_user.set_password('customer123')
            customer_user.save()
            self.stdout.write('Created customer user')

        # Create seller profile
        seller_profile, created = SellerProfile.objects.get_or_create(
            user=seller_user,
            defaults={
                'business_name': 'TechParts Store',
                'business_email': 'business@techparts.com',
                'business_phone': '+1234567890',
                'warehouse_address': '123 Tech Street, Silicon Valley',
                'is_approved': True
            }
        )
        if created:
            self.stdout.write('Created seller profile')

        # Create categories
        categories_data = [
            'Screens & Displays',
            'Batteries',
            'Charging Ports',
            'Back Panels',
            'Repair Tools'
        ]

        categories = {}
        for cat_name in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_name,
                defaults={'slug': cat_name.lower().replace(' ', '-').replace('&', 'and')}
            )
            categories[cat_name] = category
            if created:
                self.stdout.write(f'Created category: {cat_name}')

        # Create brands
        brands_data = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Google']
        brands = {}
        for brand_name in brands_data:
            brand, created = Brand.objects.get_or_create(name=brand_name)
            brands[brand_name] = brand
            if created:
                self.stdout.write(f'Created brand: {brand_name}')

        # Create sample products
        products_data = [
            {
                'name': 'iPhone 14 Pro OLED Display',
                'category': 'Screens & Displays',
                'brand': 'Apple',
                'price': Decimal('299.99'),
                'stock': 50,
                'description': 'High-quality OLED display replacement for iPhone 14 Pro'
            },
            {
                'name': 'Samsung Galaxy S23 Battery',
                'category': 'Batteries',
                'brand': 'Samsung',
                'price': Decimal('49.99'),
                'stock': 100,
                'description': 'Original capacity battery for Samsung Galaxy S23'
            },
            {
                'name': 'OnePlus 11 Charging Port',
                'category': 'Charging Ports',
                'brand': 'OnePlus',
                'price': Decimal('29.99'),
                'stock': 75,
                'description': 'USB-C charging port assembly for OnePlus 11'
            },
            {
                'name': 'iPhone 13 Back Panel',
                'category': 'Back Panels',
                'brand': 'Apple',
                'price': Decimal('89.99'),
                'stock': 30,
                'description': 'Glass back panel replacement for iPhone 13'
            },
            {
                'name': 'Professional Repair Tool Kit',
                'category': 'Repair Tools',
                'brand': 'Generic',
                'price': Decimal('24.99'),
                'stock': 200,
                'description': 'Complete tool kit for mobile phone repairs'
            }
        ]

        for product_data in products_data:
            sku = f"SKU-{product_data['name'][:10].upper().replace(' ', '')}"
            product, created = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'seller': seller_user,
                    'name': product_data['name'],
                    'category': categories[product_data['category']],
                    'brand': brands.get(product_data['brand']),
                    'price': product_data['price'],
                    'stock_quantity': product_data['stock'],
                    'description': product_data['description'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'Created product: {product_data["name"]}')

        self.stdout.write(
            self.style.SUCCESS('Sample data created successfully!')
        )
        self.stdout.write('Login credentials:')
        self.stdout.write('Admin: admin@example.com / admin123')
        self.stdout.write('Seller: seller@example.com / seller123')
        self.stdout.write('Customer: customer@example.com / customer123')