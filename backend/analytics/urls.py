from django.urls import path
from .views import AdminDashboardStats, SellerDashboardStats, TrackProductView

urlpatterns = [
    # Dashboards
    path('admin/stats/', AdminDashboardStats.as_view(), name='admin-stats'),
    path('seller/stats/', SellerDashboardStats.as_view(), name='seller-stats'),
    
    # Tracking
    path('track/product/<int:product_id>/', TrackProductView.as_view(), name='track-product-view'),
]