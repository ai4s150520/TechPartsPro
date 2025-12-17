from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import ReturnRequest
from .serializers import ReturnRequestSerializer, ReturnRequestCreateSerializer
from wallet.services import WalletService
from notifications.models import Notification
import razorpay
from django.conf import settings

class ReturnRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReturnRequestCreateSerializer
        return ReturnRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SELLER':
            return ReturnRequest.objects.filter(seller=user)
        elif user.role == 'ADMIN':
            return ReturnRequest.objects.all()
        else:
            return ReturnRequest.objects.filter(customer=user)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return_request = serializer.save()
        
        # Notify seller
        Notification.objects.create(
            user=return_request.seller,
            title=f'New {return_request.request_type} Request',
            message=f'Customer requested {return_request.request_type.lower()} for order #{return_request.order.order_id}',
            notification_type='WARNING',
            target_url='/seller/returns'
        )
        
        # Notify customer
        Notification.objects.create(
            user=return_request.customer,
            title='Return Request Submitted',
            message=f'Your {return_request.request_type.lower()} request has been submitted. Seller will review it soon.',
            notification_type='INFO',
            target_url='/account/returns'
        )
        
        return Response(
            ReturnRequestSerializer(return_request).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        """Seller approves return request"""
        return_request = self.get_object()
        
        if request.user != return_request.seller and request.user.role != 'ADMIN':
            return Response({'error': 'Only seller can approve'}, status=status.HTTP_403_FORBIDDEN)
        
        if return_request.status != 'REQUESTED':
            return Response({'error': 'Can only approve requested returns'}, status=status.HTTP_400_BAD_REQUEST)
        
        return_request.status = 'APPROVED'
        return_request.seller_response = request.data.get('response', 'Approved')
        return_request.save()
        
        # Notify customer
        Notification.objects.create(
            user=return_request.customer,
            title='Return Approved',
            message=f'Your return request for order #{return_request.order.order_id} has been approved. Pickup will be scheduled soon.',
            notification_type='SUCCESS',
            target_url='/account/returns'
        )
        
        return Response({'message': 'Return request approved'})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Seller rejects return request"""
        return_request = self.get_object()
        
        if request.user != return_request.seller and request.user.role != 'ADMIN':
            return Response({'error': 'Only seller can reject'}, status=status.HTTP_403_FORBIDDEN)
        
        if return_request.status != 'REQUESTED':
            return Response({'error': 'Can only reject requested returns'}, status=status.HTTP_400_BAD_REQUEST)
        
        rejection_reason = request.data.get('reason')
        if not rejection_reason:
            return Response({'error': 'Rejection reason required'}, status=status.HTTP_400_BAD_REQUEST)
        
        return_request.status = 'REJECTED'
        return_request.rejection_reason = rejection_reason
        return_request.save()
        
        # Notify customer
        Notification.objects.create(
            user=return_request.customer,
            title='Return Rejected',
            message=f'Your return request for order #{return_request.order.order_id} was rejected. Reason: {rejection_reason}',
            notification_type='WARNING',
            target_url='/account/returns'
        )
        
        return Response({'message': 'Return request rejected'})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_received(self, request, pk=None):
        """Seller marks product as received"""
        return_request = self.get_object()
        
        if request.user != return_request.seller and request.user.role != 'ADMIN':
            return Response({'error': 'Only seller can mark as received'}, status=status.HTTP_403_FORBIDDEN)
        
        return_request.status = 'RECEIVED'
        return_request.received_at = timezone.now()
        return_request.save()
        
        return Response({'message': 'Marked as received. Please inspect the product.'})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def inspect(self, request, pk=None):
        """Seller inspects returned product"""
        return_request = self.get_object()
        
        if request.user != return_request.seller and request.user.role != 'ADMIN':
            return Response({'error': 'Only seller can inspect'}, status=status.HTTP_403_FORBIDDEN)
        
        if return_request.status != 'RECEIVED':
            return Response({'error': 'Product must be received first'}, status=status.HTTP_400_BAD_REQUEST)
        
        inspection_result = request.data.get('result')
        inspection_notes = request.data.get('notes', '')
        
        if inspection_result not in ['APPROVED', 'REJECTED', 'PARTIAL']:
            return Response({'error': 'Invalid inspection result'}, status=status.HTTP_400_BAD_REQUEST)
        
        return_request.inspection_result = inspection_result
        return_request.inspection_notes = inspection_notes
        return_request.status = 'INSPECTED'
        return_request.save()
        
        # If approved, process refund/exchange
        if inspection_result == 'APPROVED':
            self._process_return(return_request)
        
        return Response({'message': 'Inspection completed'})
    
    def _process_return(self, return_request):
        """Process refund or exchange"""
        from decimal import Decimal
        
        # Calculate refund amount
        total_amount = return_request.order.total_amount
        
        # Determine shipping charge
        if return_request.reason in ['DEFECTIVE', 'WRONG_ITEM', 'NOT_AS_DESCRIBED']:
            shipping_charge = Decimal('0.00')  # Free return (seller's fault)
        else:
            shipping_charge = Decimal('50.00')  # Customer pays shipping
        
        refund_amount = total_amount - shipping_charge
        return_request.refund_amount = refund_amount
        return_request.shipping_charge = shipping_charge
        
        if return_request.request_type == 'RETURN':
            # Process refund
            self._process_refund(return_request, refund_amount)
        else:
            # Process exchange
            self._process_exchange(return_request)
        
        return_request.status = 'COMPLETED'
        return_request.refund_processed_at = timezone.now()
        return_request.save()
        
        # Update order status
        return_request.order.status = 'RETURNED'
        return_request.order.save()
    
    def _process_refund(self, return_request, refund_amount):
        """Process refund to customer"""
        from payments.models import Transaction
        from decimal import Decimal
        
        # Debit seller wallet
        commission = return_request.order.total_amount * Decimal(str(settings.PLATFORM_COMMISSION_RATE))
        seller_amount = return_request.order.total_amount - commission - return_request.shipping_charge
        
        try:
            WalletService.debit_wallet(
                user=return_request.seller,
                amount=seller_amount,
                source='ORDER_REFUND',
                order=return_request.order,
                description=f'Refund for returned order #{return_request.order.order_id}'
            )
        except Exception as e:
            pass  # Wallet might be negative
        
        # Debit admin wallet (commission)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admin = User.objects.filter(role='ADMIN', is_active=True).first()
        if admin:
            try:
                WalletService.debit_wallet(
                    user=admin,
                    amount=commission,
                    source='ORDER_REFUND',
                    order=return_request.order,
                    description=f'Commission reversal for order #{return_request.order.order_id}'
                )
            except Exception:
                pass
        
        # Refund customer via Razorpay
        transaction = return_request.order.transactions.filter(status='SUCCESS').first()
        if transaction:
            try:
                client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                client.payment.refund(
                    transaction.payment_id,
                    {"amount": int(refund_amount * 100)}
                )
                transaction.status = 'REFUNDED'
                transaction.save()
            except Exception as e:
                pass
        
        # Notify customer
        Notification.objects.create(
            user=return_request.customer,
            title='Refund Processed',
            message=f'₹{refund_amount} refunded for order #{return_request.order.order_id}. Amount will be credited in 5-7 business days.',
            notification_type='SUCCESS',
            target_url='/account/returns'
        )
    
    def _process_exchange(self, return_request):
        """Process product exchange"""
        # Create new order for exchange product
        # (Simplified - you can expand this)
        
        Notification.objects.create(
            user=return_request.customer,
            title='Exchange Approved',
            message=f'Your exchange request has been approved. New product will be shipped soon.',
            notification_type='SUCCESS',
            target_url='/account/returns'
        )
