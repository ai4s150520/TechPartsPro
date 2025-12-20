from celery import shared_task
from django.core.files.base import ContentFile
from django.utils.text import slugify
from decimal import Decimal
import pandas as pd
import requests
import logging
from PIL import Image
from io import BytesIO
import io as _io
import os

from django.core.files.storage import default_storage

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
        logger.info(f"Starting bulk upload task for user_id={user_id} file_path={file_path}")
        
        # Read file (support local filesystem paths and storage backends like S3)
        # If the worker can access the path directly, use it. Otherwise read via default_storage.
        df_iter = None
        try:
            # Use a common batch size for chunking
            BATCH_SIZE = 500

            if os.path.exists(file_path):
                if file_path.lower().endswith('.csv'):
                    df_iter = pd.read_csv(file_path, chunksize=BATCH_SIZE)
                else:
                    # pandas.read_excel does not support chunksize; read full DF then chunk
                    full_df = pd.read_excel(file_path)
                    df_iter = (full_df[i:i+BATCH_SIZE] for i in range(0, len(full_df), BATCH_SIZE))
            else:
                # Read bytes from storage (S3 or remote storage)
                with default_storage.open(file_path, 'rb') as f:
                    content = f.read()
                if file_path.lower().endswith('.csv'):
                    # CSV -> decode and use StringIO
                    df_iter = pd.read_csv(_io.StringIO(content.decode('utf-8')), chunksize=BATCH_SIZE)
                else:
                    # Excel -> BytesIO and then chunk manually
                    full_df = pd.read_excel(BytesIO(content))
                    df_iter = (full_df[i:i+BATCH_SIZE] for i in range(0, len(full_df), BATCH_SIZE))
        except Exception as e:
            logger.error(f"Failed to read uploaded file at {file_path}: {e}")
            return {'status': 'failed', 'error': f'Could not read uploaded file: {str(e)}'}
        
        created_count = 0
        updated_count = 0
        errors = []
        total_processed = 0
        
        # Process in batches using bulk_create / bulk_update to improve throughput.
        # df_iter is either a pandas TextFileReader (for CSV) or a generator yielding DataFrames
        for chunk_num, chunk in enumerate(df_iter):
            # Normalize and collect rows for processing
            rows = []
            # Normalize column names to lower-case keys to tolerate variations in uploaded files
            col_map = {}
            for c in list(chunk.columns):
                nc = str(c).strip().lower()
                # map common variants
                nc = nc.replace(' ', '_')
                col_map[c] = nc
            chunk = chunk.rename(columns=col_map)

            for index, row in chunk.iterrows():
                total_processed += 1

                # Limit to 10,000 rows
                if total_processed > 10000:
                    errors.append("Maximum 10,000 rows limit reached")
                    break

                sku = str(row.get('sku', '')).strip()
                if not sku or sku.lower() in ('nan', 'none', ''):
                    continue

                rows.append((sku, row))

            if not rows:
                continue

            # Prefetch existing products by SKU
            skus = [r[0] for r in rows]
            existing_qs = Product.objects.filter(sku__in=skus)
            existing_map = {p.sku: p for p in existing_qs}

            to_create = []
            to_update = []

            # Cache category and brand creations in-memory for this chunk to avoid repeated DB hits
            category_cache = {}
            brand_cache = {}

            for sku, row in rows:
                try:
                    # Category
                    cat_raw = str(row.get('category', 'General')).strip()
                    cat_slug = slugify(cat_raw)
                    category = category_cache.get(cat_slug)
                    if category is None:
                        category = Category.objects.filter(slug=cat_slug).first()
                        if not category:
                            category = Category.objects.filter(name__iexact=cat_raw).first()
                        if not category:
                            category = Category.objects.create(name=cat_raw, slug=cat_slug)
                        category_cache[cat_slug] = category

                    # Brand
                    brand = None
                    brand_name = str(row.get('brand', '')).strip()
                    if brand_name and brand_name.lower() != 'nan':
                        brand = brand_cache.get(brand_name)
                        if brand is None:
                            brand, _ = Brand.objects.get_or_create(name=brand_name)
                            brand_cache[brand_name] = brand

                    # Pricing
                    # numeric fields - tolerate missing or malformed values
                    try:
                        mrp = Decimal(str(row.get('mrp', 0)))
                    except Exception:
                        mrp = Decimal('0')
                    try:
                        gst = Decimal(str(row.get('gst_percent', 18)))
                    except Exception:
                        gst = Decimal('18')
                    try:
                        discount_pct = int(row.get('discount_percent', 0) or 0)
                    except Exception:
                        discount_pct = 0
                    # avoid division by zero
                    try:
                        base_price = mrp / (Decimal('1') + (gst / Decimal('100')))
                    except Exception:
                        base_price = mrp

                    if sku in existing_map:
                        # Prepare existing product for update
                        prod = existing_map[sku]
                        prod.seller = user
                        prod.name = row.get('name', f"Product {sku}")
                        prod.category = category
                        prod.brand = brand
                        prod.price = base_price
                        prod.discount_percentage = discount_pct
                        prod.tax_rate = gst
                        try:
                            prod.stock_quantity = int(row.get('stock', 0) or 0)
                        except Exception:
                            prod.stock_quantity = 0
                        prod.description = row.get('description', '')
                        prod.is_active = True
                        prod.specifications = {'GST': f"{gst}%", 'Type': 'Spare Part'}
                        to_update.append(prod)
                    else:
                        # Create new product instance (not saved yet)
                        prod = Product(
                            seller=user,
                            sku=sku,
                            name=row.get('name', f"Product {sku}"),
                            category=category,
                            brand=brand,
                            price=base_price,
                            discount_percentage=discount_pct,
                            tax_rate=gst,
                            stock_quantity=(int(row.get('stock', 0) or 0)),
                            description=row.get('description', ''),
                            is_active=True,
                            specifications={'GST': f"{gst}%", 'Type': 'Spare Part'}
                        )
                        to_create.append((prod, row))

                except Exception as e:
                    err = f"Row {total_processed}: {str(e)}"
                    logger.exception(err)
                    errors.append(err)

            # Bulk create new products
            if to_create:
                # Pre-generate slugs and discount prices BEFORE bulk_create
                for prod, row in to_create:
                    # Generate unique slug
                    base_slug = slugify(prod.name)
                    prod.slug = f"{base_slug}-{slugify(prod.sku)}"
                    
                    # Calculate discount price
                    if prod.discount_percentage > 0:
                        discount_amount = (prod.price * Decimal(prod.discount_percentage)) / Decimal(100)
                        prod.discount_price = prod.price - discount_amount
                    else:
                        prod.discount_price = None
                
                create_objs = [p for p, _ in to_create]
                Product.objects.bulk_create(create_objs, batch_size=BATCH_SIZE)
                created_count += len(create_objs)

                # Schedule image downloads for newly created products
                created_skus = [p.sku for p in create_objs]
                created_products = Product.objects.filter(sku__in=created_skus)
                row_map = {p.sku: row for p, row in to_create}
                
                for product in created_products:
                    row = row_map.get(product.sku)
                    if row is not None:
                        img_urls_raw = str(row.get('Image_URLs', ''))
                        if img_urls_raw and img_urls_raw.lower() != 'nan':
                            urls = [u.strip() for u in img_urls_raw.split(',') if u.strip()]
                            if urls and not product.images.exists():
                                download_product_images.delay(product.id, urls, product.sku)

            # Bulk update existing products
            if to_update:
                # Choose which fields to update
                update_fields = [
                    'seller', 'name', 'category', 'brand', 'price', 'discount_percentage',
                    'tax_rate', 'stock_quantity', 'description', 'is_active', 'specifications'
                ]
                for i in range(0, len(to_update), BATCH_SIZE):
                    batch = to_update[i:i+BATCH_SIZE]
                    Product.objects.bulk_update(batch, update_fields, batch_size=BATCH_SIZE)
                updated_count += len(to_update)

            # Update progress
            self.update_state(
                state='PROGRESS',
                meta={'current': total_processed, 'total': 10000}
            )
            
        logger.info(f"Bulk upload finished for user_id={user_id}: created={created_count} updated={updated_count} processed={total_processed} errors={len(errors)}")
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
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            logger.error(f"Image download task failed: Product id={product_id} does not exist")
            return
        
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
