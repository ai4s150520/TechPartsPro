from django.urls import path
from .views import WishlistListView, WishlistToggleView, CheckItemStatusView

urlpatterns = [
    # List all items
    path('', WishlistListView.as_view(), name='wishlist-list'),
    
    # Toggle (Add/Remove)
    path('toggle/', WishlistToggleView.as_view(), name='wishlist-toggle'),
    
    # Check status for a single product (for UI state)
    path('check/<int:product_id>/', CheckItemStatusView.as_view(), name='wishlist-check'),
]