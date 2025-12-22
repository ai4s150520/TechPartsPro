from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, BrandViewSet, BulkUploadProductsView, BulkUploadStatusView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .tasks import process_bulk_upload

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_celery(request):
    """Test endpoint to check Celery connectivity"""
    try:
        # Try to queue a simple task
        from celery import current_app
        i = current_app.control.inspect()
        stats = i.stats()
        return Response({'celery_status': 'connected', 'workers': stats})
    except Exception as e:
        return Response({'celery_status': 'error', 'error': str(e)})


router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'brands', BrandViewSet)

urlpatterns = [
    path('products/bulk-upload/', BulkUploadProductsView.as_view(), name='product-bulk-upload'),
    path('products/bulk-upload/status/<str:task_id>/', BulkUploadStatusView.as_view(), name='bulk-upload-status'),
    path('test-celery/', test_celery, name='test-celery'),
    path('', include(router.urls)),
]