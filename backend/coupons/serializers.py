from rest_framework import serializers
from django.utils import timezone
from .models import Coupon

class CouponApplySerializer(serializers.Serializer):
    code = serializers.CharField(required=True)
    cart_total = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)

    def validate(self, data):
        code = data.get('code')
        cart_total = data.get('cart_total')

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid coupon code.")

        # 1. Check Active Status
        if not coupon.active:
            raise serializers.ValidationError("This coupon is no longer active.")

        # 2. Check Expiry
        now = timezone.now()
        if now < coupon.valid_from:
            raise serializers.ValidationError("This coupon is not valid yet.")
        if now > coupon.valid_to:
            raise serializers.ValidationError("This coupon has expired.")

        # 3. Check Usage Limits
        if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
            raise serializers.ValidationError("This coupon has reached its usage limit.")

        # 4. Check Minimum Spend
        if cart_total < coupon.min_purchase_amount:
            raise serializers.ValidationError(
                f"Minimum purchase of ${coupon.min_purchase_amount} required for this coupon."
            )

        return {
            "coupon": coupon,
            "cart_total": cart_total
        }