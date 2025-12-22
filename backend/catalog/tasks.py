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
    logger.info(f"Starting bulk upload task for user_id={user_id} file_path={file_path}")
    
    try:
        user = User.objects.get(id=user_id)
        logger.info(f"Found user: {user.email}")
        
        # Read file
        df_iter = None
        try:
            BATCH_SIZE = 500

            if os.path.exists(file_path):
                if file_path.lower().endswith('.csv'):
                    df_iter = pd.read_csv(file_path, chunksize=BATCH_SIZE)
                else:
                    full_df = pd.read_excel(file_path)
                    df_iter = (full_df[i:i+BATCH_SIZE] for i in range(0, len(full_df), BATCH_SIZE))
            else:
                with default_storage.open(file_path, 'rb') as f:
                    content = f.read()
                if file_path.lower().endswith('.csv'):
                    df_iter = pd.read_csv(_io.StringIO(content.decode('utf-8')), chunksize=BATCH_SIZE)
                else:
                    full_df = pd.read_excel(BytesIO(content))
                    df_iter = (full_df[i:i+BATCH_SIZE] for i in range(0, len(full_df), BATCH_SIZE))
        except Exception as e:
            logger.error(f"Failed to read uploaded file at {file_path}: {e}")
            return {'status': 'failed', 'error': f'Could not read uploaded file: {str(e)}'}
        
        created_count = 0
        updated_count = 0
        errors = []
        total_processed = 0
        
        for chunk_num, chunk in enumerate(df_iter):
            rows = []
            # Normalize column names
            column_mapping = {
                'sku': 'sku', 'name': 'name', 'category': 'category', 'brand': 'brand',
                'mrp': 'mrp', 'gst_percent': 'gst_percent', 'discount_percent': 'discount_percent',
                'stock': 'stock', 'description': 'description', 'image_urls': 'image_urls'
            }
            
            col_map = {}
            for c in list(chunk.columns):
                nc = str(c).strip().lower().replace(' ', '_')
                col_map[c] = column_mapping.get(nc, nc)
            chunk = chunk.rename(columns=col_map)

            for index, row in chunk.iterrows():
                total_processed += 1

                if total_processed > 10000:
                    errors.append("Maximum 10,000 rows limit reached")
                    break

                sku = str(row.get('sku', '')).strip()
                if not sku or sku.lower() in ('nan', 'none', '') or len(sku) < 3:
                    errors.append(f"Row {total_processed}: Invalid or missing SKU")
                    continue
                
                name = str(row.get('name', '')).strip()
                if not name or name.lower() in ('nan', 'none', ''):
                    errors.append(f"Row {total_processed}: Missing product name for SKU {sku}")
                    continue

                rows.append((sku, row))

            if not rows:
                continue

            # Prefetch existing products
            skus = [r[0] for r in rows]
            existing_qs = Product.objects.filter(sku__in=skus)
            existing_map = {p.sku: p for p in existing_qs}

            to_create = []
            to_update = []

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
                    try:
                        mrp = Decimal(str(row.get('mrp', 0)).replace(',', ''))
                        if mrp <= 0:
                            mrp = Decimal('100')
                    except (ValueError, TypeError, Exception):
                        mrp = Decimal('100')
                    
                    try:
                        gst = Decimal(str(row.get('gst_percent', 18)).replace('%', ''))
                        if gst < 0 or gst > 100:
                            gst = Decimal('18')
                    except (ValueError, TypeError, Exception):
                        gst = Decimal('18')
                    
                    try:
                        discount_pct = int(float(str(row.get('discount_percent', 0)).replace('%', '')))
                        if discount_pct < 0 or discount_pct > 99:
                            discount_pct = 0
                    except (ValueError, TypeError, Exception):
                        discount_pct = 0
                    
                    try:
                        base_price = mrp / (Decimal('1') + (gst / Decimal('100')))
                    except Exception:
                        base_price = mrp

                    try:
                        stock_qty = int(float(str(row.get('stock', 0)).replace(',', '')))
                        if stock_qty < 0:
                            stock_qty = 0
                    except (ValueError, TypeError, Exception):
                        stock_qty = 0

                    if sku in existing_map:
                        # Update existing product
                        prod = existing_map[sku]
                        prod.seller = user
                        prod.name = row.get('name', f"Product {sku}")
                        prod.category = category
                        prod.brand = brand
                        prod.price = base_price
                        prod.discount_percentage = discount_pct
                        prod.tax_rate = gst
                        prod.stock_quantity = stock_qty
                        prod.description = row.get('description', '')
                        prod.is_active = True
                        prod.specifications = {'GST': f"{gst}%", 'Type': 'Spare Part'}
                        to_update.append(prod)
                    else:
                        # Create new product
                        prod = Product(
                            seller=user,
                            sku=sku,
                            name=row.get('name', f"Product {sku}"),
                            category=category,
                            brand=brand,
                            price=base_price,
                            discount_percentage=discount_pct,
                            tax_rate=gst,
                            stock_quantity=stock_qty,
                            description=row.get('description', ''),
                            is_active=True,
                            specifications={'GST': f"{gst}%", 'Type': 'Spare Part'}
                        )
                        base_slug = slugify(prod.name)
                        prod.slug = f"{base_slug}-{slugify(prod.sku)}"
                        
                        if prod.discount_percentage > 0:
                            discount_amount = (prod.price * Decimal(prod.discount_percentage)) / Decimal(100)
                            prod.discount_price = prod.price - discount_amount
                        else:
                            prod.discount_price = None
                        to_create.append((prod, row))

                except Exception as e:
                    err = f"Row {total_processed}: {str(e)}"
                    logger.exception(err)
                    errors.append(err)

            # Bulk create new products
            if to_create:
                create_objs = [p for p, _ in to_create]
                
                # Batch check for slug uniqueness to avoid individual queries
                all_slugs = [p.slug for p in create_objs]
                existing_slugs = set(Product.objects.filter(slug__in=all_slugs).values_list('slug', flat=True))
                used_slugs = set()
                
                # Fix slug conflicts
                for prod in create_objs:
                    original_slug = prod.slug
                    counter = 1
                    while prod.slug in existing_slugs or prod.slug in used_slugs:
                        prod.slug = f"{original_slug}-{counter}"
                        counter += 1
                    used_slugs.add(prod.slug)
                
                try:
                    Product.objects.bulk_create(create_objs, batch_size=BATCH_SIZE)
                    created_count += len(create_objs)
                    logger.info(f"Successfully created {len(create_objs)} products in batch {chunk_num}")
                except Exception as e:
                    logger.error(f"Failed to bulk create products in batch {chunk_num}: {e}")
                    # Try individual saves as fallback
                    for prod, _ in to_create:
                        try:
                            prod.save()
                            created_count += 1
                        except Exception as save_error:
                            errors.append(f"Failed to save product {prod.sku}: {save_error}")

            # Bulk update existing products
            if to_update:
                update_fields = [
                    'seller', 'name', 'category', 'brand', 'price', 'discount_percentage',
                    'tax_rate', 'stock_quantity', 'description', 'is_active', 'specifications'
                ]
                try:
                    for i in range(0, len(to_update), BATCH_SIZE):
                        batch = to_update[i:i+BATCH_SIZE]
                        Product.objects.bulk_update(batch, update_fields, batch_size=BATCH_SIZE)
                    updated_count += len(to_update)
                    logger.info(f"Successfully updated {len(to_update)} products in batch {chunk_num}")
                except Exception as e:
                    logger.error(f"Failed to bulk update products in batch {chunk_num}: {e}")
                    # Try individual saves as fallback
                    for prod in to_update:
                        try:
                            prod.save()
                            updated_count += 1
                        except Exception as save_error:
                            errors.append(f"Failed to update product {prod.sku}: {save_error}")

            # Update progress (guarded for synchronous runs where task id may be missing)
            try:
                self.update_state(
                    state='PROGRESS',
                    meta={'current': total_processed, 'total': 10000}
                )
            except Exception as e:
                logger.debug(f"Could not update task state (likely running synchronously): {e}")
            
        logger.info(f"Bulk upload finished for user_id={user_id}: created={created_count} updated={updated_count}")
        return {
            'status': 'success',
            'created': created_count,
            'updated': updated_count,
            'total_processed': total_processed,
            'errors': errors[:100]
        }
    
    except Exception as e:
        logger.error(f"Bulk upload failed: {str(e)}")
        return {'status': 'failed', 'error': str(e)}


@shared_task(max_retries=2)
def download_product_images(product_id, urls, sku):
    """Async task to download and attach product images"""
    try:
        product = Product.objects.get(id=product_id)
        
        for i, url in enumerate(urls[:5]):
            if not url.startswith('http'):
                continue
            
            try:
                res = requests.get(url, timeout=10)
                
                if res.status_code == 200:
                    if len(res.content) > 5 * 1024 * 1024:
                        continue
                    
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
    
    except Product.DoesNotExist:
        logger.error(f"Product id={product_id} does not exist")
    except Exception as e:
        logger.error(f"Image download task failed: {e}")