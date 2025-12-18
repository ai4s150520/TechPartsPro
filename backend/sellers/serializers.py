from rest_framework import serializers
from django.db.models import Sum, Q
from decimal import Decimal
from .models import Payout
from accounts.models import SellerProfile
from django.core.exceptions import ValidationError as DjangoValidationError

class SellerProfileSerializer(serializers.ModelSerializer):
    """ Used to show the seller their own profile status """
    email = serializers.ReadOnlyField(source='user.email')
    bank_account_number = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = SellerProfile
        fields = [
            'business_name', 'business_email', 'business_phone',
            'gst_number', 'pan_number', 'warehouse_address',
            'bank_account_number', 'bank_ifsc_code', 'bank_account_holder_name', 'bank_name',
            'is_approved', 'rating', 'email'
        ]
        read_only_fields = ['is_approved', 'rating', 'razorpay_contact_id', 'razorpay_fund_account_id']
    
    def update(self, instance, validated_data):
        # Handle bank account number separately to trigger encryption
        bank_account = validated_data.pop('bank_account_number', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Set bank account number (triggers property setter for encryption)
        if bank_account is not None:
            instance.bank_account_number = bank_account
        try:
            instance.save()
        except DjangoValidationError as e:
            # Convert model ValidationError to serializer ValidationError for proper 400 response
            raise serializers.ValidationError({'detail': e.messages})
        return instance

class PayoutSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='order.order_id', read_only=True)
    
    class Meta:
        model = Payout
        fields = ['id', 'order_id', 'amount', 'status', 'created_at', 'updated_at', 'transaction_reference', 'admin_note', 'razorpay_payout_id', 'utr_number']
        read_only_fields = ['status', 'transaction_reference', 'admin_note', 'created_at', 'updated_at', 'razorpay_payout_id', 'utr_number']

    def validate_amount(self, value):
        """ Business Logic: Minimum withdrawal limit """
        if value < Decimal('100.00'):
            raise serializers.ValidationError("Minimum payout amount is ₹100.")
        return value

class DashboardStatsSerializer(serializers.Serializer):
    """ Read-only stats for the dashboard charts """
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_orders = serializers.IntegerField()
    total_products = serializers.IntegerField()
    pending_payouts = serializers.DecimalField(max_digits=12, decimal_places=2)
    approved_payouts = serializers.DecimalField(max_digits=12, decimal_places=2)
    paid_payouts = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    @staticmethod
    def get_stats(seller):
        """Calculate dashboard stats for seller"""
        from orders.models import OrderItem
        from catalog.models import Product
        
        # Calculate total revenue from delivered items
        delivered_items = OrderItem.objects.filter(
            seller=seller,
            status='DELIVERED'
        ).aggregate(
            total=Sum('price', default=Decimal('0'))
        )
        
        total_revenue = delivered_items['total'] or Decimal('0')
        
        # Count orders
        total_orders = OrderItem.objects.filter(seller=seller).values('order').distinct().count()
        
        # Count products
        total_products = Product.objects.filter(seller=seller, is_active=True, is_deleted=False).count()
        
        # Calculate payouts
        pending_payouts = Payout.objects.filter(
            seller=seller,
            status='REQUESTED'
        ).aggregate(total=Sum('amount', default=Decimal('0')))['total'] or Decimal('0')
        
        approved_payouts = Payout.objects.filter(
            seller=seller,
            status__in=['APPROVED', 'PROCESSING']
        ).aggregate(total=Sum('amount', default=Decimal('0')))['total'] or Decimal('0')
        
        paid_payouts = Payout.objects.filter(
            seller=seller,
            status='PAID'
        ).aggregate(total=Sum('amount', default=Decimal('0')))['total'] or Decimal('0')
        
        return {
            'total_revenue': total_revenue,
            'total_orders': total_orders,
            'total_products': total_products,
            'pending_payouts': pending_payouts,
            'approved_payouts': approved_payouts,
            'paid_payouts': paid_payouts
        }