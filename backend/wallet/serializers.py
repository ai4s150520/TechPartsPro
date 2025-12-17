from rest_framework import serializers
from .models import Wallet, WalletTransaction, Withdrawal
from decimal import Decimal

class WalletSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    
    class Meta:
        model = Wallet
        fields = ['id', 'user_email', 'balance', 'is_active', 'is_locked', 'created_at', 'updated_at']
        read_only_fields = ['balance', 'is_active', 'is_locked']


class WalletTransactionSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source='order.order_id', read_only=True)
    
    class Meta:
        model = WalletTransaction
        fields = [
            'id', 'transaction_type', 'source', 'amount', 
            'balance_before', 'balance_after', 'order_id', 
            'description', 'created_at'
        ]
        read_only_fields = [
            'id', 'transaction_type', 'source', 'amount', 
            'balance_before', 'balance_after', 'order_id', 
            'description', 'created_at'
        ]


class WithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Withdrawal
        fields = [
            'id', 'amount', 'bank_account_number', 'bank_ifsc_code', 
            'bank_account_holder', 'bank_name', 'status', 
            'razorpay_payout_id', 'utr_number', 'rejection_reason',
            'requested_at', 'processed_at'
        ]
        read_only_fields = ['status', 'razorpay_payout_id', 'utr_number', 'rejection_reason', 'processed_at']
    
    def validate_amount(self, value):
        if value < Decimal('100.00'):
            raise serializers.ValidationError("Minimum withdrawal amount is ₹100")
        return value
    
    def validate(self, attrs):
        request = self.context.get('request')
        if request and request.user:
            wallet = request.user.wallet
            
            if wallet.is_locked:
                raise serializers.ValidationError("Wallet is locked. Please contact support.")
            
            if attrs['amount'] > wallet.balance:
                raise serializers.ValidationError(f"Insufficient balance. Available: ₹{wallet.balance}")
        
        return attrs


class WithdrawalCreateSerializer(serializers.Serializer):
    """Simplified serializer for withdrawal creation"""
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('100.00'))
    
    def validate_amount(self, value):
        request = self.context.get('request')
        if request and request.user:
            wallet = request.user.wallet
            
            if value > wallet.balance:
                raise serializers.ValidationError(f"Insufficient balance. Available: ₹{wallet.balance}")
        
        return value
