from django.urls import path
from .views import CartAPIView, AddToCartView, UpdateCartItemView, ApplyCouponView

urlpatterns = [
    # Get active cart / Clear cart
    path('', CartAPIView.as_view(), name='cart-detail'),
    
    # Add product to cart
    path('add/', AddToCartView.as_view(), name='cart-add'),
    
    # Update/Delete specific item
    path('item/<int:item_id>/', UpdateCartItemView.as_view(), name='cart-item-update'),

    # Apply Coupon
    path('apply-coupon/', ApplyCouponView.as_view(), name='cart-apply-coupon'),
]