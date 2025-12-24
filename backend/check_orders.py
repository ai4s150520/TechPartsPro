#!/usr/bin/env python
"""
Quick check and fix for orders issue
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from orders.models import Order
from accounts.models import Address

User = get_user_model()

def check_and_fix_orders():
    print("=== Checking Orders Database ===")
    
    # Find customer user
    customer = User.objects.filter(email__icontains='customer').first()
    if not customer:
        customer = User.objects.filter(role='CUSTOMER').first()
    
    if not customer:
        print("❌ No customer found")
        return
    
    print(f"✅ Found customer: {customer.email}")
    
    # Check orders
    orders = Order.objects.filter(user=customer)
    print(f"📦 Customer has {orders.count()} orders")
    
    if orders.exists():
        for order in orders:
            print(f"  - Order {order.order_id}: {order.status} - ₹{order.total_amount}")
    else:
        print("ℹ️  No orders found. This explains the empty orders page.")
        print("   The customer needs to place an order first.")
    
    # Check all orders in system
    all_orders = Order.objects.all()
    print(f"\n📊 Total orders in system: {all_orders.count()}")
    
    if all_orders.exists():
        print("Recent orders:")
        for order in all_orders.order_by('-created_at')[:5]:
            print(f"  - {order.order_id} by {order.user.email}: {order.status}")

if __name__ == '__main__':
    check_and_fix_orders()