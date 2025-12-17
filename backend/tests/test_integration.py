from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from catalog.models import Category, Product
from orders.models import Order
from accounts.models import Address
from decimal import Decimal

User = get_user_model()

class EndToEndCheckoutTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.seller = User.objects.create_user(email='seller@test.com', password='seller123', role='SELLER')
        profile = self.seller.seller_profile
        profile.business_name = 'Test Store'
        profile.bank_account_number = '1234567890'
        profile.bank_ifsc_code = 'SBIN0001234'
        profile.save()
        self.category = Category.objects.create(name='Electronics', slug='electronics')
        self.product = Product.objects.create(
            seller=self.seller, category=self.category, name='Test Product',
            sku='TEST-001', description='Test', price=Decimal('1000'),
            stock_quantity=10, is_active=True
        )
    
    def test_complete_checkout_flow(self):
        response = self.client.post('/api/accounts/register/', {
            'email': 'customer@test.com', 'password': 'customer123',
            'password_confirm': 'customer123', 'first_name': 'Test',
            'last_name': 'Customer', 'phone_number': '1234567890'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        response = self.client.post('/api/accounts/login/', {
            'email': 'customer@test.com', 'password': 'customer123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')
        
        response = self.client.post('/api/cart/add/', {'product_id': self.product.id, 'quantity': 2})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        user = User.objects.get(email='customer@test.com')
        address = Address.objects.create(
            user=user, full_name='Test Customer', phone_number='1234567890',
            street_address='123 Test St', city='Test City', state='Test State',
            postal_code='123456', is_default=True
        )
        
        response = self.client.post('/api/orders/checkout/', {
            'address_id': address.id, 'payment_method': 'COD'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Order.objects.filter(user=user).exists())
