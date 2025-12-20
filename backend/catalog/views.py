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
            # Validate file size (max 50MB)
            if file_obj.size > 50 * 1024 * 1024:
                return Response({"error": "File too large. Max 50MB"}, status=status.HTTP_400_BAD_REQUEST)

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
            task = process_bulk_upload.delay(fs_path, request.user.id)

            # Return saved storage path and detected row_count for accurate frontend progress
            resp = {
                "task_id": task.id,
                "saved_path": saved_path,
                "message": "File accepted and queued for processing. You will be notified when complete."
            }
            if row_count is not None:
                resp['row_count'] = int(row_count)

            return Response(resp, status=status.HTTP_202_ACCEPTED)

        except Exception as e:
            logger.exception("Failed to accept bulk upload")
            return Response({"error": f"File error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class BulkUploadStatusView(APIView):
    """Check bulk upload task status"""
    permission_classes = [permissions.IsAuthenticated, IsSellerProfileComplete]
    
    def get(self, request, task_id):
        from celery.result import AsyncResult
        
        task = AsyncResult(task_id)

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