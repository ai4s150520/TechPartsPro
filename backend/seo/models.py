from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.core.validators import MinLengthValidator, MaxLengthValidator

class SEOMetadata(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    title = models.CharField(
        max_length=60, 
        validators=[MinLengthValidator(30), MaxLengthValidator(60)],
        help_text="SEO title (30-60 characters)"
    )
    description = models.CharField(
        max_length=160,
        validators=[MinLengthValidator(120), MaxLengthValidator(160)],
        help_text="Meta description (120-160 characters)"
    )
    keywords = models.CharField(max_length=255, blank=True)
    canonical_url = models.URLField(blank=True)
    og_title = models.CharField(max_length=60, blank=True)
    og_description = models.CharField(max_length=160, blank=True)
    og_image = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('content_type', 'object_id')
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
        ]

class SitemapEntry(models.Model):
    PRIORITY_CHOICES = [
        (0.1, '0.1'), (0.2, '0.2'), (0.3, '0.3'), (0.4, '0.4'), (0.5, '0.5'),
        (0.6, '0.6'), (0.7, '0.7'), (0.8, '0.8'), (0.9, '0.9'), (1.0, '1.0'),
    ]
    
    FREQUENCY_CHOICES = [
        ('always', 'Always'),
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
        ('never', 'Never'),
    ]
    
    url = models.URLField(unique=True)
    priority = models.FloatField(choices=PRIORITY_CHOICES, default=0.5)
    changefreq = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, default='weekly')
    lastmod = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

class RobotsRule(models.Model):
    user_agent = models.CharField(max_length=100, default='*')
    disallow = models.TextField(blank=True)
    allow = models.TextField(blank=True)
    crawl_delay = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

class StructuredData(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    schema_type = models.CharField(max_length=50)  # Product, Organization, etc.
    json_ld = models.JSONField()
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('content_type', 'object_id', 'schema_type')