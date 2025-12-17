from rest_framework import serializers
from .models import Cart, CartItem
from catalog.models import Product
from catalog.serializers import ProductListSerializer 

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), 
        source='product', 
        write_only=True
    )
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax_amount = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal', 'tax_amount']

    def get_tax_amount(self, obj):
        # Tax per unit * quantity
        if hasattr(obj.product, 'tax_amount'):
            total_tax = obj.product.tax_amount * obj.quantity
            return round(total_tax, 2)
        return 0.00

    def validate(self, data):
        product = data['product']
        quantity = data['quantity']

        if quantity > product.stock_quantity:
            raise serializers.ValidationError(
                f"Sorry, only {product.stock_quantity} units of '{product.name}' are available."
            )
        
        if quantity < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")

        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    
    # New Fields for Summary
    total_tax = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total_price', 'total_items', 'total_tax', 'grand_total', 'updated_at']

    def get_total_tax(self, obj):
        # Sum up tax of all items
        tax = 0
        for item in obj.items.all():
            if hasattr(item.product, 'tax_amount'):
                tax += item.product.tax_amount * item.quantity
        return round(tax, 2)

    def get_grand_total(self, obj):
        # Subtotal + Tax
        tax = self.get_total_tax(obj)
        # obj.total_price is the subtotal (selling price * qty)
        return round(obj.total_price + tax, 2)