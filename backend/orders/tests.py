from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from catalog.models import Category, Product
from accounts.models import Address
from .models import Order

User = get_user_model()

class OrderTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='customer@example.com',
            password='CustomerPass123!',
            role='CUSTOMER'
        )
        self.seller_user = User.objects.create_user(
            email='seller@example.com',
            password='SellerPass123!',
            role='SELLER'
        )
        # Approve seller with bank details to auto-approve
        from accounts.models import SellerProfile
        seller_profile = self.seller_user.seller_profile
        seller_profile.business_name = 'Test Store'
        seller_profile.bank_account_number = '1234567890'
        seller_profile.bank_ifsc_code = 'SBIN0001234'
        seller_profile.save()
        
        self.category = Category.objects.create(name='Electronics', slug='electronics')
        self.product = Product.objects.create(
            seller=self.seller_user,
            category=self.category,
            name='Test Product',
            sku='TEST-001',
            description='Test description',
            price=100,
            stock_quantity=10,
            is_active=True
        )
        self.address = Address.objects.create(
            user=self.user,
            full_name='Test User',
            phone_number='1234567890',
            street_address='123 Test St',
            city='Test City',
            state='Test State',
            postal_code='123456',
            is_default=True
        )
    
    def test_create_order(self):
        self.client.force_authenticate(user=self.user)
        # Add product to cart first
        from cart.models import Cart, CartItem
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        
        response = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id,
            'payment_method': 'COD'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Order.objects.filter(user=self.user).exists())
    
    def test_list_orders(self):
        self.client.force_authenticate(user=self.user)
        # Create order through checkout
        from cart.models import Cart, CartItem
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        
        self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id,
            'payment_method': 'COD'
        })
        
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
