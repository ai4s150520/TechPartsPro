from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse
import json
import logging
from .services import PaymentService
from .models import Transaction
from orders.models import Order

logger = logging.getLogger(__name__)

class CreateRazorpayOrderView(APIView):
    """
    POST: /api/payments/create-order/
    Payload: { "order_id": "uuid" }
    Creates a Razorpay Order ID and a Pending Transaction record.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        if not order_id:
            return Response({"error": "Order ID required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Generate Razorpay Order ID
            rzp_order_id = PaymentService.create_razorpay_order(order_id, request.user)
            
            if not rzp_order_id:
                 return Response({"error": "Order already processed"}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Save Pending Transaction in DB so we can verify later
            order = Order.objects.get(id=order_id)
            
            # Prevent duplicate transaction records for same attempt if needed, 
            # or creates new one for retry. Here we create new.
            Transaction.objects.create(
                order=order,
                user=request.user,
                payment_id=rzp_order_id, # Store RZP Order ID here
                amount=order.total_amount,
                provider='RAZORPAY',
                status='PENDING'
            )

            return Response({
                "id": rzp_order_id,
                "amount": order.total_amount,
                "currency": "INR",
                "key": settings.RAZORPAY_KEY_ID
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class VerifyRazorpayPaymentView(APIView):
    """
    POST: /api/payments/verify/
    Payload: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        success = PaymentService.verify_payment_signature(request.data)
        if success:
            return Response({"status": "success"}, status=status.HTTP_200_OK)
        return Response({"status": "failure", "error": "Signature verification failed"}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):
    """
    POST: /api/payments/webhook/
    Razorpay webhook handler for payment events
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            # Get webhook signature
            signature = request.headers.get('X-Razorpay-Signature')
            if not signature:
                logger.warning("Webhook received without signature")
                return HttpResponse(status=400)
            
            # Get raw payload
            payload = request.body.decode('utf-8')
            
            # Verify signature
            if not PaymentService.verify_webhook_signature(payload, signature):
                logger.error("Webhook signature verification failed")
                return HttpResponse(status=400)
            
            # Parse event
            event = json.loads(payload)
            event_type = event.get('event')
            
            logger.info(f"Webhook received: {event_type}")
            
            # Handle payment.captured event
            if event_type == 'payment.captured':
                payment_entity = event.get('payload', {}).get('payment', {}).get('entity', {})
                
                razorpay_order_id = payment_entity.get('order_id')
                razorpay_payment_id = payment_entity.get('id')
                
                if razorpay_order_id and razorpay_payment_id:
                    # Process payment
                    webhook_data = {
                        'razorpay_order_id': razorpay_order_id,
                        'razorpay_payment_id': razorpay_payment_id,
                        'razorpay_signature': 'webhook'  # Signature already verified
                    }
                    
                    # Use internal verification (skip signature check as already done)
                    try:
                        txn = Transaction.objects.get(payment_id=razorpay_order_id)
                        if txn.status != Transaction.Status.SUCCESS:
                            order = txn.order
                            order.payment_status = True
                            order.status = 'PROCESSING'
                            order.save()
                            
                            txn.status = Transaction.Status.SUCCESS
                            txn.gateway_response = payment_entity
                            txn.save()
                            
                            logger.info(f"Webhook processed payment for order {order.order_id}")
                    except Transaction.DoesNotExist:
                        logger.error(f"Transaction not found for webhook: {razorpay_order_id}")
            
            # Handle payment.failed event
            elif event_type == 'payment.failed':
                payment_entity = event.get('payload', {}).get('payment', {}).get('entity', {})
                razorpay_order_id = payment_entity.get('order_id')
                
                if razorpay_order_id:
                    try:
                        txn = Transaction.objects.get(payment_id=razorpay_order_id)
                        txn.status = Transaction.Status.FAILED
                        txn.gateway_response = payment_entity
                        txn.save()
                        logger.info(f"Payment failed for order {txn.order.order_id}")
                    except Transaction.DoesNotExist:
                        pass
            
            return HttpResponse(status=200)
            
        except Exception as e:
            logger.error(f"Webhook processing error: {str(e)}", exc_info=True)
            return HttpResponse(status=500)