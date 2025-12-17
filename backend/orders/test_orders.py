from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from catalog.models import Product, Category
from cart.models import Cart, CartItem
from accounts.models import Address
from .models import Order

User = get_user_model()

class OrderTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.category = Category.objects.create(name='Electronics', slug='electronics')
        self.product = Product.objects.create(
            name='Test Product',
            slug='test-product',
            price=100.00,
            stock_quantity=10,
            category=self.category,
            seller=self.user
        )
        
        self.address = Address.objects.create(
            user=self.user,
            full_name='Test User',
            phone_number='1234567890',
            street_address='123 Test St',
            city='Test City',
            state='Test State',
            postal_code='12345',
            country='India'
        )
        
        self.cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2
        )
    
    def test_create_order_cod(self):
        response = self.client.post('/api/orders/checkout/', {
            'address_id': self.address.id,
            'payment_method': 'COD'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)
    
    def test_view_orders(self):
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_order_without_address(self):
        response = self.client.post('/api/orders/checkout/', {
            'payment_method': 'COD'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
