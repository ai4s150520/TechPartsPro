from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShippingRateView, ShipmentViewSet

router = DefaultRouter()
router.register(r'shipments', ShipmentViewSet)

urlpatterns = [
    path('calculate/', ShippingRateView.as_view(), name='shipping-calculate'),
    path('', include(router.urls)),
]