from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SellerDashboardView, PayoutViewSet, SellerProfileView, SellerOrderViewSet # Import new ViewSet

router = DefaultRouter()
router.register(r'payouts', PayoutViewSet, basename='payout')
router.register(r'orders', SellerOrderViewSet, basename='seller-orders') # Add this line

urlpatterns = [
    path('dashboard/', SellerDashboardView.as_view(), name='seller-dashboard'),
    path('profile/', SellerProfileView.as_view(), name='seller-profile'),
    path('', include(router.urls)),
]