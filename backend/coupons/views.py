from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import CouponApplySerializer
from .models import Coupon

class ApplyCouponView(APIView):
    """
    Validates a coupon code against a cart total.
    Returns the discount amount and final price.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CouponApplySerializer(data=request.data)
        
        if serializer.is_valid():
            coupon = serializer.validated_data['coupon']
            cart_total = serializer.validated_data['cart_total']
            
            # Calculate Savings
            discount_amount = coupon.get_discount_amount(cart_total)
            final_total = cart_total - discount_amount

            return Response({
                "code": coupon.code,
                "discount_amount": discount_amount,
                "final_total": final_total,
                "message": "Coupon applied successfully!"
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)