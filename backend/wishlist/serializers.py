from rest_framework import serializers
from .models import WishlistItem
from catalog.serializers import ProductListSerializer
from catalog.models import Product

class WishlistItemSerializer(serializers.ModelSerializer):
    """
    Read Serializer: Nests the product details so the UI can show the card.
    """
    product = ProductListSerializer(read_only=True)
    
    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'added_at']

class WishlistToggleSerializer(serializers.Serializer):
    """
    Write Serializer: Validates the input product_id.
    """
    product_id = serializers.IntegerField(required=True)

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value).exists():
            raise serializers.ValidationError("Product not found.")
        return value