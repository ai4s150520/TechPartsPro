from rest_framework import serializers
from .models import SEOMetadata, StructuredData

class SEOMetadataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SEOMetadata
        fields = ['title', 'description', 'keywords', 'canonical_url', 
                 'og_title', 'og_description', 'og_image']

class StructuredDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = StructuredData
        fields = ['schema_type', 'json_ld']