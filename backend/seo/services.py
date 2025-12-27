from django.contrib.contenttypes.models import ContentType
from .models import SEOMetadata, StructuredData, SitemapEntry
from catalog.models import Product, Category
from django.conf import settings

class SEOService:
    @staticmethod
    def get_or_create_metadata(obj):
        content_type = ContentType.objects.get_for_model(obj)
        metadata, created = SEOMetadata.objects.get_or_create(
            content_type=content_type,
            object_id=obj.pk,
            defaults=SEOService._generate_default_metadata(obj)
        )
        return metadata

    @staticmethod
    def _generate_default_metadata(obj):
        if isinstance(obj, Product):
            return {
                'title': f"{obj.name} - Buy Online at Best Price",
                'description': f"Buy {obj.name} online at best price. {obj.description[:100]}... Free shipping, genuine products, easy returns.",
                'keywords': f"{obj.name}, {obj.category.name if obj.category else ''}, mobile parts, buy online",
                'og_title': obj.name,
                'og_description': obj.description[:160],
            }
        elif isinstance(obj, Category):
            return {
                'title': f"{obj.name} - Mobile Parts & Accessories",
                'description': f"Shop {obj.name} online. Wide range of genuine mobile parts and accessories with fast delivery and easy returns.",
                'keywords': f"{obj.name}, mobile parts, accessories, buy online",
                'og_title': f"{obj.name} Collection",
                'og_description': f"Explore our {obj.name} collection",
            }
        return {}

    @staticmethod
    def generate_product_structured_data(product):
        structured_data = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "sku": product.sku,
            "brand": {
                "@type": "Brand",
                "name": product.brand.name if product.brand else "Generic"
            },
            "offers": {
                "@type": "Offer",
                "price": str(product.selling_price),
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock" if product.stock_quantity > 0 else "https://schema.org/OutOfStock",
                "seller": {
                    "@type": "Organization",
                    "name": product.seller.seller_profile.business_name if hasattr(product.seller, 'seller_profile') else "TechParts Pro"
                }
            }
        }
        
        if product.images.exists():
            structured_data["image"] = [f"{settings.MEDIA_URL}{img.image}" for img in product.images.all()[:3]]
        
        if product.rating > 0:
            structured_data["aggregateRating"] = {
                "@type": "AggregateRating",
                "ratingValue": str(product.rating),
                "reviewCount": str(product.review_count)
            }
        
        return structured_data

    @staticmethod
    def update_sitemap_entry(url, priority=0.5, changefreq='weekly'):
        SitemapEntry.objects.update_or_create(
            url=url,
            defaults={
                'priority': priority,
                'changefreq': changefreq,
                'is_active': True
            }
        )