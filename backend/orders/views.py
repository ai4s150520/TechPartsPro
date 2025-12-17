from rest_framework import generics, permissions, status, views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer, CreateOrderSerializer
from .services import OrderService
from django.core.exceptions import ValidationError
from payments.services import PaymentService 

class OrderListView(generics.ListAPIView):
    """ List all orders for the logged-in user """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

class OrderDetailView(generics.RetrieveAPIView):
    """ Get single order details """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id' # Look up by UUID

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

class CheckoutView(views.APIView):
    """
    POST: Converts Cart to Order.
    Payload: { "address_id": 1, "payment_method": "COD" | "CARD" }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if serializer.is_valid():
            try:
                payment_method = serializer.validated_data['payment_method']
                
                # --- MODIFIED LOGIC: Determine if cart should be cleared ---
                # COD: Clear immediately. CARD: Keep items until payment success.
                should_clear_cart = (payment_method == 'COD')

                # 1. Create Order
                order = OrderService.create_order_from_cart(
                    user=request.user,
                    address_id=serializer.validated_data['address_id'],
                    payment_method=payment_method,
                    clear_cart=should_clear_cart # Pass flag here
                )

                # 2. Logic Fork based on Payment Method
                if payment_method == 'COD':
                    # Cash on Delivery: Success immediately
                    return Response({
                        "status": "success",
                        "order_id": order.order_id,
                        "payment_required": False
                    }, status=status.HTTP_201_CREATED)

                elif payment_method == 'CARD':
                    # Online Payment: Use Razorpay Logic now
                    try:
                        # Use create_razorpay_order
                        return Response({
                            "status": "pending_payment",
                            "order_id": order.order_id,
                            "id": order.id, 
                            "payment_required": True
                        }, status=status.HTTP_200_OK)
                        
                    except Exception as e:
                        # If Payment Setup fails, delete the pending order
                        order.delete() 
                        return Response({"error": f"Payment Gateway Error: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)
            
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({"error": f"Checkout failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_order(request, order_id):
    """
    Cancel an order if it's in PENDING or PROCESSING status
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        
        # Only allow cancellation for PENDING or PROCESSING orders
        if order.status not in ['PENDING', 'PROCESSING']:
            return Response(
                {"error": f"Cannot cancel order with status {order.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'CANCELLED'
        order.save()
        
        return Response(
            {"message": "Order cancelled successfully", "order_id": order.order_id},
            status=status.HTTP_200_OK
        )
        
    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def pay_now(request, order_id):
    """
    Convert COD order to online payment
    Allows customer to pay online for a COD order
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)
        
        # Only allow payment for COD orders that are not paid yet
        if order.payment_method != 'COD':
            return Response(
                {"error": "This order is not a COD order"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if order.payment_status:
            return Response(
                {"error": "This order is already paid"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only allow for PENDING or PROCESSING orders
        if order.status not in ['PENDING', 'PROCESSING']:
            return Response(
                {"error": f"Cannot pay for order with status {order.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create Razorpay order for payment
        try:
            razorpay_order = PaymentService.create_razorpay_order(str(order.id), request.user)
            
            return Response({
                "status": "success",
                "order_id": order.order_id,
                "razorpay_order_id": razorpay_order,
                "amount": float(order.total_amount),
                "currency": "INR",
                "message": "Payment gateway initialized"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Payment gateway error: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY
            )
        
    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found"},
            status=status.HTTP_404_NOT_FOUND
        )