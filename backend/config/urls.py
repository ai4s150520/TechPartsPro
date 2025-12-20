"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# --- IMPORT SWAGGER/OPENAPI VIEWS ---
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from core.health import health_check, readiness_check

urlpatterns = [
    path('health/', health_check, name='health'),
    path('ready/', readiness_check, name='readiness'),
    # --- API DOCUMENTATION (Swagger UI) ---
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # --- ADMIN INTERFACE ---
    path("admin/", admin.site.urls),
    
    # --- FUNCTIONAL APPS ---
    path("api/auth/", include("accounts.urls")),     # Login/Register
    path("api/accounts/", include("accounts.urls")), # User Profile/Addresses
    
    path("api/sellers/", include("sellers.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/cart/", include("cart.urls")),
    path("api/wishlist/", include("wishlist.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/coupons/", include("coupons.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/shipping/", include("shipping.urls")),
    path("api/reviews/", include("reviews.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/wallet/", include("wallet.urls")),
    path("api/returns/", include("returns.urls")),
    path("api/search/", include("search.urls")),
    path("api/recommendations/", include("recommendations.urls")),
]

# --- SERVE MEDIA FILES (IMAGES) IN DEVELOPMENT ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)