from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WalletView, WalletTransactionViewSet, WithdrawalViewSet

router = DefaultRouter()
router.register(r'transactions', WalletTransactionViewSet, basename='wallet-transaction')
router.register(r'withdrawals', WithdrawalViewSet, basename='withdrawal')

urlpatterns = [
    path('', WalletView.as_view(), name='wallet-detail'),
    path('', include(router.urls)),
]
