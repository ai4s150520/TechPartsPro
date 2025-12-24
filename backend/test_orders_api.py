#!/usr/bin/env python
"""
Test script to check orders API functionality
"""
import os
import sys
import django
import requests

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from orders.models import Order, OrderItem
from catalog.models import Product, Category
from accounts.models import Address

User = get_user_model()

def test_orders_api():
    print("=== Testing Orders API ===\n")
    
    # Check if customer user exists
    customer = User.objects.filter(email='customer@test.com').first()
    if not customer:
        print("❌ Customer user not found. Creating one...")
        customer = User.objects.create_user(
            email='customer@test.com',
            password='customer123',
            first_name='Test',
            last_name='Customer',
            role='CUSTOMER'
        )
        print("✅ Customer created")
    
    # Check if customer has any orders
    orders_count = Order.objects.filter(user=customer).count()
    print(f"📦 Customer has {orders_count} orders")
    
    if orders_count == 0:
        print("Creating a test order...")
        
        # Create a test product if needed
        category, _ = Category.objects.get_or_create(
            name='Test Category',
            defaults={'slug': 'test-category'}
        )
        
        seller = User.objects.filter(role='SELLER').first()
        if not seller:
            seller = User.objects.create_user(
                email='testseller@test.com',
                password='seller123',
                first_name='Test',
                last_name='Seller',
                role='SELLER'
            )
        
        product, _ = Product.objects.get_or_create(
            name='Test Product',
            defaults={
                'slug': 'test-product',
                'seller': seller,
                'category': category,
                'price': 100.00,
                'stock_quantity': 10,
                'is_active': True,
                'description': 'Test product for orders'
            }
        )
        
        # Create test order
        order = Order.objects.create(
            user=customer,
            total_amount=100.00,
            status='PENDING',
            payment_method='COD',
            shipping_address={
                'full_name': 'Test Customer',
                'phone_number': '1234567890',
                'street_address': 'Test Address',
                'city': 'Test City',
                'state': 'Test State',
                'postal_code': '123456',
                'country': 'India'
            }
        )
        
        # Create order item
        OrderItem.objects.create(
            order=order,
            product=product,
            seller=seller,
            product_name=product.name,
            price=product.price,
            quantity=1
        )
        
        print(f"✅ Created test order: {order.order_id}")
    
    # Test API endpoint directly
    print("\n=== Testing API Endpoint ===")
    try:
        # Login to get token
        login_response = requests.post('http://localhost:8000/api/accounts/login/', {
            'email': 'customer@test.com',
            'password': 'customer123'
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get('access')
            print("✅ Login successful")
            
            # Test orders API
            headers = {'Authorization': f'Bearer {token}'}
            orders_response = requests.get('http://localhost:8000/api/orders/', headers=headers)
            
            print(f"📡 Orders API Status: {orders_response.status_code}")
            
            if orders_response.status_code == 200:
                data = orders_response.json()
                print(f"✅ Orders API working. Found {len(data.get('results', data))} orders")
                print("Sample response:", data)
            else:
                print(f"❌ Orders API failed: {orders_response.text}")
        else:
            print(f"❌ Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        print("Make sure Django server is running on localhost:8000")

if __name__ == '__main__':
    test_orders_api()