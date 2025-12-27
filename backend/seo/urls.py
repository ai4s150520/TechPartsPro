from django.urls import path
from django.contrib.sitemaps.views import sitemap
from .views import ProductSitemap, CategorySitemap, robots_txt, get_seo_metadata

sitemaps = {
    'products': ProductSitemap,
    'categories': CategorySitemap,
}

urlpatterns = [
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='sitemap'),
    path('robots.txt', robots_txt, name='robots_txt'),
    path('api/seo/<str:content_type>/<int:object_id>/', get_seo_metadata, name='seo_metadata'),
]