from celery import shared_task
from django.core.files.base import ContentFile
from django.utils.text import slugify
from decimal import Decimal
import pandas as pd
import requests
import logging
from PIL import Image
from io import BytesIO

from .models import Product, Category, Brand, ProductImage
from accounts.models import User

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_bulk_upload(self, file_path, user_id):
    """
    Async task to process bulk product upload
    Supports up to 10,000 rows with batch processing
    """
    try:
        user = User.objects.get(id=user_id)
        
        # Read file
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path, chunksize=500)  # Process in chunks
        else:
            df = pd.read_excel(file_path, chunksize=500)
        
        created_count = 0
        updated_count = 0
        errors = []
        total_processed = 0
        
        # Process in batches of 500 rows
        for chunk_num, chunk in enumerate(df):
            batch_products = []
            
            for index, row in chunk.iterrows():
                try:
                    total_processed += 1
                    
                    # Limit to 10,000 rows
                    if total_processed > 10000:
                        errors.append("Maximum 10,000 rows limit reached")
                        break
                    
                    sku = str(row.get('SKU', '')).strip()
                    if not sku or sku.lower() == 'nan':
                        continue
                    
                    # Category
                    cat_raw = str(row.get('Category', 'General')).strip()
                    cat_slug = slugify(cat_raw)
                    category = Category.objects.filter(slug=cat_slug).first()
                    if not category:
                        category = Category.objects.filter(name__iexact=cat_raw).first()
                    if not category:
                        category = Category.objects.create(name=cat_raw, slug=cat_slug)
                    
                    # Brand
                    brand = None
                    brand_name = str(row.get('Brand', '')).strip()
                    if brand_name and brand_name.lower() != 'nan':
                        brand, _ = Brand.objects.get_or_create(name=brand_name)
                    
                    # Pricing
                    mrp = Decimal(str(row.get('MRP', 0)))
                    gst = Decimal(str(row.get('GST_Percent', 18)))
                    discount_pct = int(row.get('Discount_Percent', 0))
                    base_price = mrp / (Decimal('1') + (gst / Decimal('100')))
                    
                    # Update or Create
                    product, created = Product.objects.update_or_create(
                        sku=sku,
                        defaults={
                            'seller': user,
                            'name': row.get('Name', f"Product {sku}"),
                            'category': category,
                            'brand': brand,
                            'price': base_price,
                            'discount_percentage': discount_pct,
                            'tax_rate': gst,
                            'stock_quantity': int(row.get('Stock', 0)),
                            'description': row.get('Description', ''),
                            'is_active': True,
                            'specifications': {'GST': f"{gst}%", 'Type': 'Spare Part'}
                        }
                    )
                    
                    # Images (async download)
                    img_urls_raw = str(row.get('Image_URLs', ''))
                    if img_urls_raw and img_urls_raw.lower() != 'nan':
                        urls = [u.strip() for u in img_urls_raw.split(',')]
                        if not product.images.exists():
                            download_product_images.delay(product.id, urls, sku)
                    
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                    
                    # Update progress
                    self.update_state(
                        state='PROGRESS',
                        meta={'current': total_processed, 'total': 10000}
                    )
                
                except Exception as e:
                    errors.append(f"Row {total_processed}: {str(e)}")
            
            # Bulk operations can be added here if needed
            
        return {
            'status': 'success',
            'created': created_count,
            'updated': updated_count,
            'total_processed': total_processed,
            'errors': errors[:100]  # Limit error list
        }
    
    except Exception as e:
        logger.error(f"Bulk upload failed: {str(e)}")
        return {'status': 'failed', 'error': str(e)}


@shared_task(max_retries=2)
def download_product_images(product_id, urls, sku):
    """Async task to download and attach product images"""
    try:
        product = Product.objects.get(id=product_id)
        
        for i, url in enumerate(urls[:5]):  # Max 5 images
            if not url.startswith('http'):
                continue
            
            try:
                res = requests.get(url, timeout=10)
                
                if res.status_code == 200:
                    # Size check (5MB)
                    if len(res.content) > 5 * 1024 * 1024:
                        continue
                    
                    # Validate image
                    image = Image.open(BytesIO(res.content))
                    image.verify()
                    
                    ext = image.format.lower()
                    if ext == 'jpeg':
                        ext = 'jpg'
                    
                    img_name = f"{sku}_{i}.{ext}"
                    
                    prod_img = ProductImage(product=product)
                    prod_img.image.save(img_name, ContentFile(res.content), save=False)
                    
                    if i == 0:
                        prod_img.is_feature = True
                    prod_img.save()
            
            except Exception as e:
                logger.warning(f"Failed to download image {url}: {e}")
                continue
    
    except Exception as e:
        logger.error(f"Image download task failed: {e}")
