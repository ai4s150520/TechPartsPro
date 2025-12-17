from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from catalog.models import Category, Product
from .models import Cart, CartItem

User = get_user_model()

class CartTests(TestCase):
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
    
    def test_add_to_cart(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/cart/add/', {
            'product_id': self.product.id,
            'quantity': 2
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(CartItem.objects.filter(cart__user=self.user, product=self.product).exists())
    
    def test_get_cart(self):
        self.client.force_authenticate(user=self.user)
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 1)
    
    def test_update_cart_item(self):
        self.client.force_authenticate(user=self.user)
        cart = Cart.objects.create(user=self.user)
        item = CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        response = self.client.patch(f'/api/cart/item/{item.id}/', {'quantity': 3})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 3)
