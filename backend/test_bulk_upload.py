#!/usr/bin/env python
"""
Test script for bulk upload functionality
Run this to verify the bulk upload fixes work correctly
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from catalog.tasks import process_bulk_upload
from accounts.models import User
from catalog.models import Product, Category, Brand
import tempfile
import csv

def create_test_csv():
    """Create a small test CSV file"""
    test_data = [
        ['SKU', 'Name', 'Category', 'Brand', 'MRP', 'GST_Percent', 'Discount_Percent', 'Stock', 'Description'],
        ['TEST001', 'Test Product 1', 'Electronics', 'TestBrand', '1000', '18', '10', '50', 'Test description 1'],
        ['TEST002', 'Test Product 2', 'Electronics', 'TestBrand', '2000', '18', '5', '30', 'Test description 2'],
    ]
    
    # Create temporary CSV file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, newline='')
    writer = csv.writer(temp_file)
    writer.writerows(test_data)
    temp_file.close()
    
    return temp_file.name

def test_bulk_upload():
    """Test the bulk upload functionality"""
    print("Testing bulk upload functionality...")
    
    # Create or get test user
    try:
        user = User.objects.get(email='test@example.com')
    except User.DoesNotExist:
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='SELLER',
            first_name='Test',
            last_name='User'
        )
    
    print(f"Using test user: {user.email}")
    
    # Create test CSV
    csv_file = create_test_csv()
    print(f"Created test CSV: {csv_file}")
    
    try:
        # Test the bulk upload task (call run() on the bound task when running
        # synchronously so the task instance is provided as `self`).
        result = process_bulk_upload.run(csv_file, user.id)
        
        print("Bulk upload result:")
        print(f"  Status: {result.get('status')}")
        print(f"  Created: {result.get('created', 0)}")
        print(f"  Updated: {result.get('updated', 0)}")
        print(f"  Errors: {len(result.get('errors', []))}")
        
        if result.get('errors'):
            print("  Error details:")
            for error in result.get('errors', [])[:5]:  # Show first 5 errors
                print(f"    - {error}")
        
        # Check if products were actually created
        created_products = Product.objects.filter(seller=user, sku__startswith='TEST')
        print(f"\nProducts in database: {created_products.count()}")
        
        for product in created_products:
            print(f"  - {product.sku}: {product.name} (Category: {product.category})")
        
        return result.get('status') == 'success'
        
    except Exception as e:
        print(f"Error during bulk upload test: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Clean up test file
        try:
            os.unlink(csv_file)
        except:
            pass

if __name__ == '__main__':
    success = test_bulk_upload()
    if success:
        print("\n✅ Bulk upload test PASSED!")
    else:
        print("\n❌ Bulk upload test FAILED!")
    
    sys.exit(0 if success else 1)