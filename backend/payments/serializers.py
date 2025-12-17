from rest_framework import serializers

class CreatePaymentIntentSerializer(serializers.Serializer):
    order_id = serializers.UUIDField(required=True)