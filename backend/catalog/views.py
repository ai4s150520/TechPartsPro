from rest_framework import viewsets, filters, permissions, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.core.files.base import ContentFile
from django.utils.text import slugify
from django.core.files.storage import default_storage
from decimal import Decimal
import pandas as pd
import requests
import logging
import os

# --- NEW IMPORTS FOR IMAGE SECURITY ---
from PIL import Image
from io import BytesIO

# --- CELERY TASK ---
from .tasks import process_bulk_upload

from .models import Product, Category, Brand, ProductImage
from .serializers import (
    ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer,
    CategorySerializer, BrandSerializer
)
from .permissions import IsSellerOrReadOnly, IsSeller

# Setup Logger
logger = logging.getLogger(__name__)

class ProductViewSet(viewsets.ModelViewSet):
    """
    Public: List/Retrieve Products.
    Seller: Create/Update/Delete their own products.
    """
    queryset = Product.objects.all().select_related('category', 'seller').prefetch_related('images')
    lookup_field = 'slug'
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'stock_quantity', 'seller', 'is_active'] 
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['price', 'created_at', 'stock_quantity', 'review_count']
    ordering = ['-created_at']  # Default ordering

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_staff or (user.is_authenticated and user.role == 'ADMIN'):
            return queryset

        # Sellers can only access their own products
        if user.is_authenticated and user.role == 'SELLER':
            return queryset.filter(seller=user)
        
        # Regular customers see only active products
        queryset = queryset.filter(is_active=True)
        
        # Handle category filter (accept both 'category' and 'category__slug')
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'by_device']:
            return [permissions.AllowAny()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsSellerOrReadOnly()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user, is_active=True)
    
    def perform_destroy(self, instance):
        # Ensure seller can only delete their own products
        if instance.seller != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own products")
        instance.delete()

    @action(detail=False, methods=['get'])
    def by_device(self, request):
        device_id = request.query_params.get('device_id')
        if not device_id:
            return Response({"error": "device_id required"}, status=status.HTTP_400_BAD_REQUEST)
        
        products = self.queryset.filter(compatible_devices__id=device_id, is_active=True)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Disable pagination for categories


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.prefetch_related('devices').all().order_by('name')
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Disable pagination for brands


# --- SECURE BULK UPLOAD VIEW ---

class BulkUploadProductsView(APIView):
    """
    Async bulk upload handler - Supports up to 10,000 rows
    Uses Celery for background processing
    """
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Validate file size (max 50MB)
            if file_obj.size > 50 * 1024 * 1024:
                return Response({"error": "File too large. Max 50MB"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Read file
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            else:
                df = pd.read_excel(file_obj)
            
            row_count = len(df)
            
            if row_count > 10000:
                return Response({
                    "error": f"Too many rows ({row_count}). Maximum 10,000 rows allowed"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Process synchronously (works without Celery)
            created_count = 0
            updated_count = 0
            errors = []
            
            logger.info(f"Starting bulk upload for user {request.user.username}: {row_count} rows")
            
            for index, row in df.iterrows():
                try:
                    # Get SKU and validate
                    sku_raw = row.get('SKU')
                    if pd.isna(sku_raw):
                        errors.append(f"Row {index+2}: Missing SKU")
                        continue
                    
                    sku = str(sku_raw).strip()
                    if not sku:
                        errors.append(f"Row {index+2}: Empty SKU")
                        continue
                    
                    # Get product name
                    name_raw = row.get('Name')
                    if pd.isna(name_raw) or not str(name_raw).strip():
                        name = f"Product {sku}"
                    else:
                        name = str(name_raw).strip()
                    
                    # Category
                    cat_raw = row.get('Category', 'General')
                    if pd.isna(cat_raw):
                        cat_raw = 'General'
                    cat_raw = str(cat_raw).strip()
                    cat_slug = slugify(cat_raw)
                    category = Category.objects.filter(slug=cat_slug).first()
                    if not category:
                        category = Category.objects.filter(name__iexact=cat_raw).first()
                    if not category:
                        category = Category.objects.create(name=cat_raw, slug=cat_slug)
                    
                    # Brand
                    brand = None
                    brand_raw = row.get('Brand')
                    if not pd.isna(brand_raw):
                        brand_name = str(brand_raw).strip()
                        if brand_name:
                            brand, _ = Brand.objects.get_or_create(name=brand_name)
                    
                    # Pricing
                    mrp_raw = row.get('MRP', 0)
                    mrp = Decimal(str(mrp_raw)) if not pd.isna(mrp_raw) else Decimal('0')
                    
                    gst_raw = row.get('GST_Percent', 18)
                    gst = Decimal(str(gst_raw)) if not pd.isna(gst_raw) else Decimal('18')
                    
                    discount_raw = row.get('Discount_Percent', 0)
                    discount_pct = int(discount_raw) if not pd.isna(discount_raw) else 0
                    
                    base_price = mrp / (Decimal('1') + (gst / Decimal('100')))
                    
                    # Stock
                    stock_raw = row.get('Stock', 0)
                    stock = int(stock_raw) if not pd.isna(stock_raw) else 0
                    
                    # Description
                    desc_raw = row.get('Description', '')
                    description = str(desc_raw).strip() if not pd.isna(desc_raw) else ''
                    
                    # Create/Update Product
                    product, created = Product.objects.update_or_create(
                        sku=sku,
                        defaults={
                            'seller': request.user,
                            'name': name,
                            'category': category,
                            'brand': brand,
                            'price': base_price,
                            'discount_percentage': discount_pct,
                            'tax_rate': gst,
                            'stock_quantity': stock,
                            'description': description,
                            'is_active': True,
                            'specifications': {'GST': f"{gst}%", 'Type': 'Spare Part'}
                        }
                    )
                    
                    # Images (skip for speed)
                    img_urls_raw = row.get('Image_URLs')
                    if not pd.isna(img_urls_raw) and not product.images.exists():
                        img_urls_str = str(img_urls_raw).strip()
                        if img_urls_str:
                            urls = [u.strip() for u in img_urls_str.split(',')][:3]  # Max 3 images
                            for i, url in enumerate(urls):
                                if not url.startswith('http'):
                                    continue
                                try:
                                    res = requests.get(url, timeout=5)
                                    if res.status_code == 200 and len(res.content) < 5 * 1024 * 1024:
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
                                except:
                                    continue
                    
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                
                except Exception as e:
                    error_msg = f"Row {index+2}: {str(e)}"
                    errors.append(error_msg)
                    logger.error(error_msg)
            
            logger.info(f"Bulk upload completed: {created_count} created, {updated_count} updated, {len(errors)} errors")
            
            return Response({
                "status": "success",
                "created": created_count,
                "updated": updated_count,
                "total_processed": created_count + updated_count,
                "errors": errors[:50]  # Limit errors
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"File error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class BulkUploadStatusView(APIView):
    """Check bulk upload task status"""
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    
    def get(self, request, task_id):
        from celery.result import AsyncResult
        
        task = AsyncResult(task_id)
        
        if task.state == 'PENDING':
            response = {'state': 'PENDING', 'status': 'Task is waiting...'}
        elif task.state == 'PROGRESS':
            response = {
                'state': 'PROGRESS',
                'current': task.info.get('current', 0),
                'total': task.info.get('total', 0),
                'status': 'Processing...'
            }
        elif task.state == 'SUCCESS':
            response = {
                'state': 'SUCCESS',
                'result': task.info
            }
        else:
            response = {
                'state': task.state,
                'status': str(task.info)
            }
        
        return Response(response)