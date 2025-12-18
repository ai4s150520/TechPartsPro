from rest_framework import serializers
from .models import Order, OrderItem
from catalog.serializers import ProductListSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    # We nest the product details for the frontend to show images
    product_details = ProductListSerializer(source='product', read_only=True)
    product = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'price', 'quantity', 'subtotal', 'product_details', 'product', 'status', 'tracking_number', 'courier_name']
    
    def get_product(self, obj):
        """Return minimal product info with feature_image for order list"""
        if obj.product:
            from catalog.models import ProductImage
            feature_img = ProductImage.objects.filter(product=obj.product, is_feature=True).first()
            if not feature_img:
                feature_img = ProductImage.objects.filter(product=obj.product).first()
            
            return {
                'id': obj.product.id,
                'name': obj.product.name,
                'slug': obj.product.slug,
                'feature_image': feature_img.image.url if feature_img else None
            }
        return None

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    cancellable = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'status', 'payment_status', 'payment_method', 'total_amount', 
            'discount_amount', 'shipping_address', 'items', 'created_at', 'updated_at',
            'tracking_number', 'courier_name', 'estimated_delivery', 'tracking_updates'
        ]
        # Add computed flag
        fields = fields + ['cancellable']

    def get_cancellable(self, obj):
        """An order is cancellable if it's in PENDING or PROCESSING and no shipment is OUT_FOR_DELIVERY."""
        if obj.status not in [Order.Status.PENDING, Order.Status.PROCESSING]:
            return False

        # If any shipment exists with OUT_FOR_DELIVERY, cannot cancel
        try:
            if obj.shipments.filter(status='OUT_FOR_DELIVERY').exists():
                return False
        except Exception:
            # If shipments relation isn't available or any error, be conservative
            return False

        return True

class CreateOrderSerializer(serializers.Serializer):
    """
    Input serializer for the Checkout Process.
    Expects address_id to fetch from User's address book.
    """
    address_id = serializers.IntegerField(required=True)
    payment_method = serializers.CharField(required=True)