from django.http import HttpResponse
from django.template.response import TemplateResponse
from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import SitemapEntry, RobotsRule, SEOMetadata
from .services import SEOService
from catalog.models import Product, Category

class ProductSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.8

    def items(self):
        return Product.objects.filter(is_active=True, is_deleted=False)

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return f"/products/{obj.slug}/"

class CategorySitemap(Sitemap):
    changefreq = "monthly"
    priority = 0.6

    def items(self):
        return Category.objects.all()

    def location(self, obj):
        return f"/categories/{obj.slug}/"

def robots_txt(request):
    rules = RobotsRule.objects.filter(is_active=True)
    lines = []
    
    for rule in rules:
        lines.append(f"User-agent: {rule.user_agent}")
        if rule.disallow:
            for path in rule.disallow.split('\n'):
                if path.strip():
                    lines.append(f"Disallow: {path.strip()}")
        if rule.allow:
            for path in rule.allow.split('\n'):
                if path.strip():
                    lines.append(f"Allow: {path.strip()}")
        if rule.crawl_delay:
            lines.append(f"Crawl-delay: {rule.crawl_delay}")
        lines.append("")
    
    lines.append(f"Sitemap: {request.build_absolute_uri('/sitemap.xml')}")
    
    return HttpResponse('\n'.join(lines), content_type='text/plain')

@api_view(['GET'])
def get_seo_metadata(request, content_type, object_id):
    try:
        from django.contrib.contenttypes.models import ContentType
        ct = ContentType.objects.get(model=content_type)
        obj = ct.get_object_for_this_type(pk=object_id)
        metadata = SEOService.get_or_create_metadata(obj)
        
        return Response({
            'title': metadata.title,
            'description': metadata.description,
            'keywords': metadata.keywords,
            'canonical_url': metadata.canonical_url,
            'og_title': metadata.og_title,
            'og_description': metadata.og_description,
            'og_image': metadata.og_image,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=404)