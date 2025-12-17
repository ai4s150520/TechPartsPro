from rest_framework import serializers
from .models import ShippingMethod, Shipment, ShippingZone

class ShippingMethodSerializer(serializers.ModelSerializer):
    """
    Used in the Cart/Checkout page to show options.
    """
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = ShippingMethod
        fields = ['id', 'name', 'estimated_delivery_days_min', 'estimated_delivery_days_max', 'total_cost']

    def get_total_cost(self, obj):
        # We retrieve the weight passed from the View context
        weight = self.context.get('weight', 0.5) # Default 0.5kg
        return obj.calculate_price(weight)

class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = '__all__'