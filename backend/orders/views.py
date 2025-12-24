from rest_framework import generics, permissions, status, views
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Order
from .serializers import OrderSerializer, CreateOrderSerializer
from .services import OrderService
from django.core.exceptions import ValidationError
from payments.services import PaymentService 
from payments.models import RefundRequest
import logging

logger = logging.getLogger(__name__)

class OrderListView(generics.ListAPIView):
    """ List all orders for the logged-in user """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            user = self.request.user
            logger.info(f"OrderListView: User {user.id} ({user.email}) requesting orders")
            
            # Enhanced queryset with proper filtering and ordering
            queryset = Order.objects.filter(
                user=user
            ).select_related(
                'user'
            ).prefetch_related(
                'items__product', 'items__seller'
            ).order_by('-created_at')
            
            count = queryset.count()
            logger.info(f"OrderListView: Found {count} orders for user {user.id}")
            
            if count == 0:
                logger.info(f"OrderListView: No orders found for user {user.email}. This is normal for new customers.")
            
            return queryset
        except Exception as e:
            logger.error(f"OrderListView error for user {self.request.user.id}: {str(e)}")
            return Order.objects.none()

class OrderDetailView(generics.RetrieveAPIView):
    """ Get single order details """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        try:
            user = self.request.user
            logger.info(f"OrderDetailView: User {user.id} requesting order details")
            
            queryset = Order.objects.filter(
                user=user
            ).select_related(
                'user'
            ).prefetch_related(
                'items__product', 'items__seller'
            )
            
            logger.info(f"OrderDetailView: Queryset prepared for user {user.id}")
            return queryset
        except Exception as e:
            logger.error(f"OrderDetailView error for user {self.request.user.id}: {str(e)}")
            return Order.objects.none()

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

        # If any shipment is already out for delivery, disallow cancellation
        try:
            if order.shipments.filter(status='OUT_FOR_DELIVERY').exists():
                return Response({"error": "Cannot cancel order after it is out for delivery"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            # If shipments relation is missing or any error occurs, be conservative and deny cancellation
            return Response({"error": "Cannot cancel order at this time"}, status=status.HTTP_400_BAD_REQUEST)
        
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


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def replace_order(request, order_id):
    """Create a replacement order for a given order when allowed.
    If original order was paid, attempt refund via PaymentService.
    Returns the new order id and whether payment is required.
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)

        # Only allow replacement before out for delivery and for allowed statuses
        if order.status not in ['PENDING', 'PROCESSING']:
            return Response({"error": f"Cannot replace order with status {order.status}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if order.shipments.filter(status='OUT_FOR_DELIVERY').exists():
                return Response({"error": "Cannot replace order after it is out for delivery"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"error": "Cannot replace order at this time"}, status=status.HTTP_400_BAD_REQUEST)

        # Create replacement order (will deduct stock)
        try:
            new_order = OrderService.clone_order_for_replace(order, request.user)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # If original was paid, enqueue an asynchronous refund request (non-blocking)
        if order.payment_status:
            try:
                rr = RefundRequest.objects.create(order=order, requested_by=request.user, status=RefundRequest.Status.PENDING)
                # import task locally to avoid circular imports
                from payments.tasks import refund_order_task
                refund_order_task.delay(str(rr.id))
            except Exception as e:
                # Log error but do not rollback replacement; admin can retry
                # Keep user flow uninterrupted
                return Response({"error": f"Failed to enqueue refund: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # For CARD payments, frontend should initiate payment for the new order
        payment_required = (new_order.payment_method == 'CARD')

        return Response({
            "message": "Replacement order created",
            "new_order_id": new_order.id,
            "payment_required": payment_required
        }, status=status.HTTP_201_CREATED)

    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def refund_order(request, order_id):
    """Attempt to refund an order's payment via configured gateway.
    Rules:
    - Order must exist and belong to requester
    - Order must have payment_status True
    - Disallow if any shipment is OUT_FOR_DELIVERY
    """
    try:
        order = Order.objects.get(id=order_id, user=request.user)

        if not order.payment_status:
            return Response({"error": "Order is not paid"}, status=status.HTTP_400_BAD_REQUEST)

        # Disallow refund while any shipment is out for delivery
        try:
            if order.shipments.filter(status='OUT_FOR_DELIVERY').exists():
                return Response({"error": "Cannot refund while order is out for delivery"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({"error": "Cannot process refund at this time"}, status=status.HTTP_400_BAD_REQUEST)

        # Create RefundRequest and enqueue background refund task
        try:
            rr = RefundRequest.objects.create(order=order, requested_by=request.user, status=RefundRequest.Status.PENDING)
            from payments.tasks import refund_order_task
            refund_order_task.delay(str(rr.id))
        except Exception as e:
            return Response({"error": f"Failed to enqueue refund: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Mark order as RETURNED for clarity (if not cancelled already)
        if order.status not in ['CANCELLED', 'RETURNED']:
            order.status = 'RETURNED'
            order.save()

        return Response({"message": "Refund queued"}, status=status.HTTP_202_ACCEPTED)

    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def track_order(request, id):
    """Track order status and shipment details"""
    try:
        order = Order.objects.get(id=id, user=request.user)
        
        # Return tracking information
        tracking_data = {
            'order_id': order.order_id,
            'status': order.status,
            'tracking_number': order.tracking_number,
            'courier_name': order.courier_name,
            'estimated_delivery': order.estimated_delivery,
            'tracking_updates': order.tracking_updates,
            'items': []
        }
        
        # Add item-level tracking
        for item in order.items.all():
            tracking_data['items'].append({
                'product_name': item.product_name,
                'status': item.status,
                'tracking_number': item.tracking_number,
                'courier_name': item.courier_name
            })
        
        return Response(tracking_data)
        
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)