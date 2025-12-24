from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import top_sellers, seller_profile, seller_orders, get_customer_addresses

router = DefaultRouter()

urlpatterns = [
    path('top-sellers/', top_sellers, name='top-sellers'),
    path('profile/', seller_profile, name='seller-profile'),
    path('orders/', seller_orders, name='seller-orders'),
    path('orders/<str:item_id>/customer-addresses/', get_customer_addresses, name='customer-addresses'),
    path('', include(router.urls)),
]