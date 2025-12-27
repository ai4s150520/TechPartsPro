from django.core.management.base import BaseCommand
from catalog.models import Product, Category
from seo.services import SEOService
from seo.models import RobotsRule, SitemapEntry

class Command(BaseCommand):
    help = 'Generate SEO data for existing products and categories'

    def handle(self, *args, **options):
        self.stdout.write('Generating SEO data...')
        
        # Generate SEO metadata for products
        products = Product.objects.filter(is_active=True, is_deleted=False)
        for product in products:
            SEOService.get_or_create_metadata(product)
            SEOService.update_sitemap_entry(
                f"/products/{product.slug}/",
                priority=0.8,
                changefreq='weekly'
            )
        
        self.stdout.write(f'Generated SEO data for {products.count()} products')
        
        # Generate SEO metadata for categories
        categories = Category.objects.all()
        for category in categories:
            SEOService.get_or_create_metadata(category)
            SEOService.update_sitemap_entry(
                f"/categories/{category.slug}/",
                priority=0.6,
                changefreq='monthly'
            )
        
        self.stdout.write(f'Generated SEO data for {categories.count()} categories')
        
        # Create default robots.txt rules
        RobotsRule.objects.get_or_create(
            user_agent='*',
            defaults={
                'disallow': '/admin/\n/api/\n/media/bulk_uploads/',
                'allow': '/media/products/\n/media/categories/',
                'crawl_delay': 1,
                'is_active': True
            }
        )
        
        # Add static pages to sitemap
        static_pages = [
            ('/', 1.0, 'daily'),
            ('/shop/', 0.9, 'daily'),
            ('/about/', 0.5, 'monthly'),
            ('/contact/', 0.5, 'monthly'),
            ('/help/', 0.5, 'monthly'),
        ]
        
        for url, priority, changefreq in static_pages:
            SitemapEntry.objects.get_or_create(
                url=url,
                defaults={
                    'priority': priority,
                    'changefreq': changefreq,
                    'is_active': True
                }
            )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully generated SEO data!')
        )