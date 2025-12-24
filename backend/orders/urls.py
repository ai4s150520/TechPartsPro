from django.urls import path
from .views import OrderListView, OrderDetailView, CheckoutView, cancel_order, pay_now, track_order, replace_order, refund_order

urlpatterns = [
    path('', OrderListView.as_view(), name='order-list'),
    path('<uuid:id>/', OrderDetailView.as_view(), name='order-detail'),
    path('<uuid:id>/track/', track_order, name='track-order'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('<uuid:order_id>/cancel/', cancel_order, name='cancel-order'),
    path('<uuid:order_id>/pay-now/', pay_now, name='pay-now'),
    path('<uuid:order_id>/replace/', replace_order, name='replace-order'),
    path('<uuid:order_id>/refund/', refund_order, name='refund-order'),
]