from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from catalog.models import Product, Category
from .services import SEOService
from .models import StructuredData
from django.contrib.contenttypes.models import ContentType

@receiver(post_save, sender=Product)
def create_product_seo_data(sender, instance, created, **kwargs):
    if created or not instance.seo_title:
        # Generate SEO metadata
        SEOService.get_or_create_metadata(instance)
        
        # Generate structured data
        content_type = ContentType.objects.get_for_model(Product)
        structured_data = SEOService.generate_product_structured_data(instance)
        
        StructuredData.objects.update_or_create(
            content_type=content_type,
            object_id=instance.pk,
            schema_type='Product',
            defaults={
                'json_ld': structured_data,
                'is_active': True
            }
        )
        
        # Update sitemap
        SEOService.update_sitemap_entry(
            f"/products/{instance.slug}/",
            priority=0.8,
            changefreq='weekly'
        )

@receiver(post_save, sender=Category)
def create_category_seo_data(sender, instance, created, **kwargs):
    if created or not instance.seo_title:
        SEOService.get_or_create_metadata(instance)
        
        SEOService.update_sitemap_entry(
            f"/categories/{instance.slug}/",
            priority=0.6,
            changefreq='monthly'
        )

@receiver(post_delete, sender=Product)
def remove_product_seo_data(sender, instance, **kwargs):
    # Remove from sitemap when product is deleted
    from .models import SitemapEntry
    SitemapEntry.objects.filter(url=f"/products/{instance.slug}/").delete()

@receiver(post_delete, sender=Category)
def remove_category_seo_data(sender, instance, **kwargs):
    from .models import SitemapEntry
    SitemapEntry.objects.filter(url=f"/categories/{instance.slug}/").delete()