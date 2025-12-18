from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShippingRateView, ShipmentViewSet, CouriersListView

router = DefaultRouter()
router.register(r'shipments', ShipmentViewSet)

urlpatterns = [
    path('calculate/', ShippingRateView.as_view(), name='shipping-calculate'),
    path('couriers/', CouriersListView.as_view(), name='shipping-couriers'),
    path('', include(router.urls)),
]