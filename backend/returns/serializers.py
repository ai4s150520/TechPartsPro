from rest_framework import serializers
from .models import ReturnRequest, ReturnItem
from orders.models import Order, OrderItem
from django.utils import timezone
from datetime import timedelta

class ReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='order_item.product_name', read_only=True)
    product_price = serializers.DecimalField(source='order_item.price', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = ReturnItem
        fields = ['id', 'order_item', 'product_name', 'product_price', 'quantity', 'reason', 'is_approved', 'refund_amount']
        read_only_fields = ['is_approved', 'refund_amount']


class ReturnRequestSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True, read_only=True)
    order_id = serializers.CharField(source='order.order_id', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    seller_email = serializers.CharField(source='seller.email', read_only=True)
    
    class Meta:
        model = ReturnRequest
        fields = [
            'id', 'order', 'order_id', 'customer_email', 'seller_email',
            'request_type', 'reason', 'description', 'images', 'video_url',
            'status', 'seller_response', 'rejection_reason',
            'inspection_result', 'inspection_notes',
            'return_tracking_number', 'refund_amount', 'shipping_charge',
            'exchange_product', 'exchange_tracking_number',
            'is_flagged', 'fraud_score', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'customer_email', 'seller_email', 'status', 'seller_response',
            'rejection_reason', 'inspection_result', 'inspection_notes',
            'return_tracking_number', 'refund_amount', 'is_flagged',
            'fraud_score', 'created_at', 'updated_at'
        ]


class ReturnRequestCreateSerializer(serializers.Serializer):
    order_id = serializers.CharField()
    request_type = serializers.ChoiceField(choices=ReturnRequest.RequestType.choices)
    reason = serializers.ChoiceField(choices=ReturnRequest.Reason.choices)
    description = serializers.CharField(max_length=1000)
    images = serializers.ListField(child=serializers.URLField(), required=False, allow_empty=True)
    video_url = serializers.URLField(required=False, allow_blank=True)
    items = serializers.ListField(child=serializers.DictField())
    exchange_product_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_order_id(self, value):
        try:
            order = Order.objects.get(order_id=value)
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found")
        
        # Check if order belongs to user
        request = self.context.get('request')
        if order.user != request.user:
            raise serializers.ValidationError("This order doesn't belong to you")
        
        # Check if order is delivered
        if order.status != 'DELIVERED':
            raise serializers.ValidationError("Can only return delivered orders")
        
        # Check return window (3 days)
        days_since_delivery = (timezone.now() - order.updated_at).days
        if days_since_delivery > 3:
            raise serializers.ValidationError("Return window expired (3 days from delivery)")
        
        # Check if already returned
        existing_return = ReturnRequest.objects.filter(
            order=order,
            status__in=['REQUESTED', 'APPROVED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'RECEIVED']
        ).exists()
        
        if existing_return:
            raise serializers.ValidationError("Return request already exists for this order")
        
        return value
    
    def validate(self, attrs):
        # Validate evidence for defective/wrong items
        if attrs['reason'] in ['DEFECTIVE', 'WRONG_ITEM', 'NOT_AS_DESCRIBED']:
            if not attrs.get('images') and not attrs.get('video_url'):
                raise serializers.ValidationError({
                    "images": "Please provide images or video as evidence for defective/wrong items"
                })
        # Require a concise description for any return
        desc = attrs.get('description', '')
        if not desc or len(desc.strip()) < 10:
            raise serializers.ValidationError({
                "description": "Please provide a brief reason (at least 10 characters) explaining why you want to return this item"
            })
        
        # Validate exchange product
        if attrs['request_type'] == 'EXCHANGE':
            if not attrs.get('exchange_product_id'):
                raise serializers.ValidationError({
                    "exchange_product_id": "Please select a product for exchange"
                })
        
        return attrs
    
    def create(self, validated_data):
        from catalog.models import Product
        
        request = self.context.get('request')
        order = Order.objects.get(order_id=validated_data['order_id'])
        items_data = validated_data.pop('items')
        exchange_product_id = validated_data.pop('exchange_product_id', None)
        
        # Get seller from first item
        seller = order.items.first().seller
        
        # Create return request
        return_request = ReturnRequest.objects.create(
            order=order,
            customer=request.user,
            seller=seller,
            request_type=validated_data['request_type'],
            reason=validated_data['reason'],
            description=validated_data['description'],
            images=validated_data.get('images', []),
            video_url=validated_data.get('video_url', ''),
            exchange_product=Product.objects.get(id=exchange_product_id) if exchange_product_id else None
        )
        
        # Create return items
        for item_data in items_data:
            order_item = OrderItem.objects.get(id=item_data['order_item_id'])
            ReturnItem.objects.create(
                return_request=return_request,
                order_item=order_item,
                quantity=item_data.get('quantity', order_item.quantity),
                reason=item_data.get('reason', validated_data['reason'])
            )
        
        # Calculate fraud score
        return_request.calculate_fraud_score()
        
        return return_request
