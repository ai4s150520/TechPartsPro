from rest_framework import viewsets, filters, permissions, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.core.files.base import ContentFile
from django.utils.text import slugify
from decimal import Decimal
import pandas as pd
import requests
import logging

# --- NEW IMPORTS FOR IMAGE SECURITY ---
from PIL import Image
from io import BytesIO

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
    search_fields = ['name', 'description', 'sku', 'compatible_devices__name']
    ordering_fields = ['price', 'created_at', 'stock_quantity']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_staff or (user.is_authenticated and user.role == 'ADMIN'):
            return queryset

        # Sellers should only see their own products in list view
        if user.is_authenticated and user.role == 'SELLER':
            if self.action == 'list':
                return queryset.filter(seller=user)
            # For other actions, sellers can access their own products
            return queryset.filter(Q(is_active=True) | Q(seller=user))
        
        # Regular customers see only active products
        return queryset.filter(is_active=True)

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


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.prefetch_related('devices').all().order_by('name')
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]


# --- SECURE BULK UPLOAD VIEW ---

class BulkUploadProductsView(APIView):
    """
    Handles Excel/CSV upload.
    Fixes:
    1. Uses update_or_create to prevent 'SKU exists' error.
    2. Auto-creates Categories if slug/name doesn't match.
    3. Downloads images from URLs SECURELY (Pillow validation).
    """
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Read Data
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            else:
                df = pd.read_excel(file_obj)

            created_count = 0
            updated_count = 0
            errors = []

            for index, row in df.iterrows():
                try:
                    # SKU Logic
                    sku = str(row.get('SKU', '')).strip()
                    if not sku or sku.lower() == 'nan':
                        continue 

                    # 1. Smart Category Logic
                    cat_raw = str(row.get('Category', 'General')).strip()
                    cat_slug = slugify(cat_raw)
                    
                    category = Category.objects.filter(slug=cat_slug).first()
                    if not category:
                        category = Category.objects.filter(name__iexact=cat_raw).first()
                    if not category:
                        category = Category.objects.create(name=cat_raw, slug=cat_slug)

                    # 2. Brand Logic
                    brand = None
                    brand_name = str(row.get('Brand', '')).strip()
                    if brand_name and brand_name.lower() != 'nan':
                        brand, _ = Brand.objects.get_or_create(name=brand_name)

                    # 3. Price & GST Logic
                    mrp = Decimal(str(row.get('MRP', 0)))
                    gst = Decimal(str(row.get('GST_Percent', 18)))
                    discount_pct = int(row.get('Discount_Percent', 0))
                    
                    # Calculate base price (price before discount)
                    base_price = mrp / (Decimal('1') + (gst / Decimal('100')))
                    
                    # 4. Update or Create Product
                    product, created = Product.objects.update_or_create(
                        sku=sku,
                        defaults={
                            'seller': request.user,
                            'name': row.get('Name', f"Product {sku}"),
                            'category': category,
                            'brand': brand,
                            'price': base_price,
                            'discount_percentage': discount_pct,
                            'tax_rate': gst,
                            'stock_quantity': int(row.get('Stock', 0)),
                            'description': row.get('Description', ''),
                            'is_active': True,
                            'specifications': {
                                'GST': f"{gst}%",
                                'Type': 'Spare Part'
                            }
                        }
                    )

                    # 5. SECURE IMAGE HANDLING (URLs)
                    img_urls_raw = str(row.get('Image_URLs', ''))
                    if img_urls_raw and img_urls_raw.lower() != 'nan':
                        urls = [u.strip() for u in img_urls_raw.split(',')]
                        
                        # Only process if product needs images (or forcing update)
                        # We allow appending images if not present
                        if not product.images.exists():
                            for i, url in enumerate(urls):
                                if not url.startswith('http'): continue
                                
                                try:
                                    # Timeout added
                                    res = requests.get(url, timeout=10)
                                    
                                    if res.status_code == 200:
                                        # A. Size Validation (Max 5MB)
                                        if len(res.content) > 5 * 1024 * 1024:
                                            logger.warning(f"Skipping image {url}: Too large (>5MB)")
                                            continue

                                        # B. Type Verification (Pillow)
                                        try:
                                            image = Image.open(BytesIO(res.content))
                                            image.verify() # Check integrity
                                            
                                            # Get correct extension from file header
                                            ext = image.format.lower()
                                            if ext == 'jpeg': ext = 'jpg'
                                            
                                            img_name = f"{sku}_{i}.{ext}"
                                            
                                            prod_img = ProductImage(product=product)
                                            # Save secure content
                                            prod_img.image.save(img_name, ContentFile(res.content), save=False)
                                            
                                            if i == 0: prod_img.is_feature = True
                                            prod_img.save()
                                            
                                        except Exception as img_error:
                                            logger.warning(f"Invalid image file at {url}: {img_error}")
                                            continue

                                except Exception as req_error:
                                    logger.warning(f"Failed to download image {url}: {req_error}")
                                    continue

                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

                except Exception as e:
                    errors.append(f"Row {index+2} (SKU {sku}): {str(e)}")

            return Response({
                "status": "success",
                "created": created_count,
                "updated": updated_count,
                "errors": errors
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"File error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)