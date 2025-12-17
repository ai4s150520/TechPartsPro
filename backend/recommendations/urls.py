from django.urls import path
from .views import RecommendedProductsView, TrendingProductsView, FrequentlyBoughtTogetherView

urlpatterns = [
    path('', RecommendedProductsView.as_view(), name='recommended'),
    path('<int:product_id>/', RecommendedProductsView.as_view(), name='recommended-for-product'),
    path('trending/', TrendingProductsView.as_view(), name='trending'),
    path('bought-together/<int:product_id>/', FrequentlyBoughtTogetherView.as_view(), name='bought-together'),
]
