from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, BrandViewSet, BulkUploadProductsView


router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'brands', BrandViewSet)

urlpatterns = [
    path('products/bulk-upload/', BulkUploadProductsView.as_view(), name='product-bulk-upload'),


    path('', include(router.urls)),
]