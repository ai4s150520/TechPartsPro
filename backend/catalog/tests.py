from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category, Product

User = get_user_model()

class ProductTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.seller_user = User.objects.create_user(
            email='seller@example.com',
            password='SellerPass123!',
            role='SELLER'
        )
        self.category = Category.objects.create(name='Electronics', slug='electronics')
        self.product_data = {
            'name': 'Test Product',
            'description': 'Test Description',
            'price': '99.99',
            'stock_quantity': 10,
            'sku': 'TEST-001',
            'category': self.category.id
        }
    
    def test_list_products(self):
        Product.objects.create(
            seller=self.seller_user,
            category=self.category,
            name='Product 1',
            sku='PROD-001',
            price=100,
            stock_quantity=5
        )
        response = self.client.get('/api/catalog/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_create_product_as_seller(self):
        self.client.force_authenticate(user=self.seller_user)
        response = self.client.post('/api/catalog/products/', self.product_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Product.objects.filter(name=self.product_data['name']).exists())
    
    def test_create_product_unauthorized(self):
        response = self.client.post('/api/catalog/products/', self.product_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
