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
import io as _io
from django.conf import settings
import uuid
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
from .permissions import IsSellerOrReadOnly, IsSeller, IsSellerProfileComplete

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
        try:
            queryset = super().get_queryset()
            user = self.request.user
            
            logger.info(f"ProductViewSet.get_queryset - User: {user}, Role: {getattr(user, 'role', 'None')}, Authenticated: {user.is_authenticated}")

            # Admin users see all products
            if user.is_staff or (user.is_authenticated and user.role == 'ADMIN'):
                logger.info("Returning all products for admin/staff")
                return queryset

            # Check if this is a seller requesting only their products (seller dashboard)
            my_products_only = self.request.query_params.get('my_products', 'false').lower() == 'true'
            
            if user.is_authenticated and user.role == 'SELLER' and my_products_only:
                # Seller dashboard - show only seller's own products
                seller_products = queryset.filter(seller=user)
                logger.info(f"Returning {seller_products.count()} seller products for user {user.id}")
                return seller_products
            
            # For ALL other cases (customers, anonymous users, sellers browsing marketplace)
            # Show ALL active products with stock from ALL sellers
            queryset = queryset.filter(
                is_active=True,
                stock_quantity__gt=0
            )
            
            # Handle category filter
            category_slug = self.request.query_params.get('category')
            if category_slug:
                queryset = queryset.filter(category__slug=category_slug)
            
            # Handle brand filter
            brand = self.request.query_params.get('brand')
            if brand:
                queryset = queryset.filter(brand__name__icontains=brand)
            
            logger.info(f"Returning {queryset.count()} active products from ALL sellers for marketplace view")
            return queryset
        except Exception as e:
            logger.error(f"ProductViewSet.get_queryset error: {str(e)}")
            return Product.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'by_device']:
            return [permissions.AllowAny()]
        if self.action == 'create':
            # Creating products requires seller role and a completed seller profile
            return [permissions.IsAuthenticated(), IsSellerProfileComplete()]
        if self.action in ['update', 'partial_update', 'destroy']:
            # Updates/deletes require ownership checks
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
    permission_classes = [permissions.IsAuthenticated, IsSellerProfileComplete]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Validate file extension
            allowed_extensions = ['.csv', '.xlsx', '.xls']
            file_ext = os.path.splitext(file_obj.name)[1].lower()
            if file_ext not in allowed_extensions:
                return Response({"error": "Invalid file format. Only CSV and Excel files are supported."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate file size (max 50MB)
            if file_obj.size > 50 * 1024 * 1024:
                return Response({"error": "File too large. Max 50MB"}, status=status.HTTP_400_BAD_REQUEST)

            # Quick validation of CSV headers
            if file_ext == '.csv':
                try:
                    # Read first few lines to validate headers
                    file_obj.seek(0)
                    first_line = file_obj.readline().decode('utf-8').strip()
                    headers = [h.strip().lower() for h in first_line.split(',')]
                    required_headers = ['sku', 'name', 'category', 'mrp']
                    missing_headers = [h for h in required_headers if h not in headers]
                    if missing_headers:
                        return Response({
                            "error": f"Missing required columns: {', '.join(missing_headers)}. Please check your CSV format."
                        }, status=status.HTTP_400_BAD_REQUEST)
                    file_obj.seek(0)  # Reset file pointer
                except Exception as e:
                    return Response({"error": "Could not validate CSV headers"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Save file to media storage for background processing
            upload_dir = 'bulk_uploads'
            filename = f"{uuid.uuid4().hex}_{file_obj.name}"
            saved_path = default_storage.save(os.path.join(upload_dir, filename), file_obj)

            # Resolve filesystem path if storage supports it, otherwise pass storage path
            try:
                fs_path = default_storage.path(saved_path)
            except Exception:
                fs_path = saved_path

            # Fast streamed row count for progress accuracy (CSV: stream lines, Excel: quick pandas read)
            row_count = None
            try:
                lower = filename.lower()
                if lower.endswith('.csv'):
                    # Open via storage and count lines excluding header
                    with default_storage.open(saved_path, 'rb') as fh:
                        # wrap in text IO for correct newline handling
                        text_stream = _io.TextIOWrapper(fh, encoding='utf-8', errors='ignore')
                        # count non-empty lines
                        cnt = 0
                        for _ in text_stream:
                            cnt += 1
                        # subtract header if present
                        row_count = max(0, cnt - 1)
                else:
                    # For Excel files use pandas (reads into memory but OK for typical sizes)
                    try:
                        df_count = pd.read_excel(default_storage.open(saved_path, 'rb'))
                        row_count = len(df_count)
                    except Exception:
                        row_count = None
            except Exception:
                row_count = None

            # Enqueue Celery task to process the saved file asynchronously
            # Add fallback for development when Celery worker might not be running
            task = None
            try:
                from django.conf import settings
                if settings.DEBUG:
                    # In debug mode, process synchronously. Call the task's bound `run`
                    # method so the `self` (task instance) is provided correctly.
                    result = process_bulk_upload.run(fs_path, request.user.id)
                    return Response({
                        "status": "completed",
                        "message": "File processed successfully",
                        **result
                    }, status=status.HTTP_200_OK)
                else:
                    # Production: use async processing
                    task = process_bulk_upload.delay(fs_path, request.user.id)
                    logger.info(f"Celery task queued: {task.id}")
                    
                    # Return response for async processing
                    resp = {
                        "task_id": task.id,
                        "saved_path": saved_path,
                        "message": "File accepted and queued for processing."
                    }
                    if row_count is not None:
                        resp['row_count'] = int(row_count)
                    return Response(resp, status=status.HTTP_202_ACCEPTED)
                    
            except Exception as e:
                logger.error(f"Processing failed: {e}")
                return Response({"error": f"Processing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            logger.exception("Failed to accept bulk upload")
            return Response({"error": f"File error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class BulkUploadStatusView(APIView):
    """Check bulk upload task status"""
    permission_classes = [permissions.IsAuthenticated, IsSellerProfileComplete]
    
    def get(self, request, task_id):
        from celery.result import AsyncResult
        
        try:
            task = AsyncResult(task_id)
            logger.info(f"Checking task {task_id}: state={task.state}, info={task.info}")
        except Exception as e:
            logger.error(f"Error checking task {task_id}: {e}")
            return Response({'error': 'Task lookup failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # task.info may be None for PENDING or on some broker configurations.
        info = task.info or {}

        if task.state == 'PENDING':
            response = {'state': 'PENDING', 'status': 'Task is waiting...'}
        elif task.state == 'PROGRESS':
            response = {
                'state': 'PROGRESS',
                'current': info.get('current', 0),
                'total': info.get('total', 0),
                'status': 'Processing...'
            }
        elif task.state == 'SUCCESS':
            # If the task returned a failure payload (e.g. {'status': 'failed', 'error': '...'}),
            # surface it as FAILURE so frontend treats it appropriately.
            if isinstance(info, dict) and info.get('status') == 'failed':
                response = {
                    'state': 'FAILURE',
                    'status': info.get('error', 'Processing failed'),
                    'result': info,
                }
            else:
                response = {
                    'state': 'SUCCESS',
                    'result': info if isinstance(info, dict) else {'result': info}
                }
        else:
            response = {
                'state': task.state,
                'status': str(info)
            }
        
        return Response(response)