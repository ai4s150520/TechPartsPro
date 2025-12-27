from django.contrib import admin
from .models import SEOMetadata, SitemapEntry, RobotsRule, StructuredData

@admin.register(SEOMetadata)
class SEOMetadataAdmin(admin.ModelAdmin):
    list_display = ['content_object', 'title', 'updated_at']
    list_filter = ['content_type', 'updated_at']
    search_fields = ['title', 'description', 'keywords']

@admin.register(SitemapEntry)
class SitemapEntryAdmin(admin.ModelAdmin):
    list_display = ['url', 'priority', 'changefreq', 'lastmod', 'is_active']
    list_filter = ['priority', 'changefreq', 'is_active']
    search_fields = ['url']

@admin.register(RobotsRule)
class RobotsRuleAdmin(admin.ModelAdmin):
    list_display = ['user_agent', 'crawl_delay', 'is_active']

@admin.register(StructuredData)
class StructuredDataAdmin(admin.ModelAdmin):
    list_display = ['content_object', 'schema_type', 'is_active']
    list_filter = ['schema_type', 'is_active']