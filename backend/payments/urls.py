from django.urls import path
from .views import CreateRazorpayOrderView, VerifyRazorpayPaymentView, RazorpayWebhookView

urlpatterns = [
    path('create-order/', CreateRazorpayOrderView.as_view(), name='create-razorpay-order'),
    path('verify/', VerifyRazorpayPaymentView.as_view(), name='verify-razorpay-payment'),
    path('webhook/', RazorpayWebhookView.as_view(), name='razorpay-webhook'),
]