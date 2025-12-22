#!/usr/bin/env python3
"""
Test script to validate bulk upload functionality with the sample CSV
"""
import os
import sys
import django
from decimal import Decimal

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalog.tasks import process_bulk_upload
from accounts.models import User
from catalog.models import Product, Category, Brand

def test_csv_processing():
    """Test CSV processing with sample data"""
    
    # Get or create a test seller user
    try:
        seller = User.objects.get(email='seller@example.com')
    except User.DoesNotExist:
        seller = User.objects.create_user(
            email='seller@example.com',
            password='testpass123',
            role='SELLER',
            first_name='Test',
            last_name='Seller'
        )
    
    # Path to sample CSV
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'sample_bulk_upload.csv')
    
    if not os.path.exists(csv_path):
        print(f"Sample CSV not found at: {csv_path}")
        return False
    
    print(f"Testing bulk upload with: {csv_path}")
    print(f"Seller ID: {seller.id}")
    
    # Count products before
    initial_count = Product.objects.filter(seller=seller).count()
    print(f"Initial product count: {initial_count}")
    
    # Process the CSV
    try:
        # Call the task synchronously via its bound run() method so `self` is correct
        result = process_bulk_upload.run(csv_path, seller.id)
        print(f"Processing result: {result}")
        
        # Count products after
        final_count = Product.objects.filter(seller=seller).count()
        print(f"Final product count: {final_count}")
        
        # Show some sample products
        sample_products = Product.objects.filter(seller=seller)[:5]
        print("\nSample products created:")
        for product in sample_products:
            print(f"- {product.sku}: {product.name} (₹{product.price})")
        
        return result.get('status') == 'success'
        
    except Exception as e:
        print(f"Error processing CSV: {e}")
        return False

if __name__ == '__main__':
    success = test_csv_processing()
    print(f"\nTest {'PASSED' if success else 'FAILED'}")