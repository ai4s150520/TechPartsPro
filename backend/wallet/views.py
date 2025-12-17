from rest_framework import viewsets, views, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from .models import Wallet, WalletTransaction, Withdrawal
from .serializers import WalletSerializer, WalletTransactionSerializer, WithdrawalSerializer, WithdrawalCreateSerializer
from .services import WalletService
from sellers.payout_service import RazorpayPayoutService
import logging

logger = logging.getLogger(__name__)

class WalletView(views.APIView):
    """Get wallet details"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        wallet = WalletService.get_or_create_wallet(request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)


class WalletTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """View wallet transaction history"""
    serializer_class = WalletTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        wallet = WalletService.get_or_create_wallet(self.request.user)
        return WalletTransaction.objects.filter(wallet=wallet)


class WithdrawalViewSet(viewsets.ModelViewSet):
    """Manage withdrawal requests"""
    serializer_class = WithdrawalSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'retrieve']
    
    def get_queryset(self):
        wallet = WalletService.get_or_create_wallet(self.request.user)
        return Withdrawal.objects.filter(wallet=wallet)
    
    def create(self, request, *args, **kwargs):
        """Create withdrawal request"""
        serializer = WithdrawalCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        amount = serializer.validated_data['amount']
        wallet = WalletService.get_or_create_wallet(request.user)
        
        # Validate withdrawal
        can_withdraw, message = WalletService.can_withdraw(request.user, amount)
        if not can_withdraw:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get bank details
        if request.user.role == 'SELLER':
            try:
                seller_profile = request.user.seller_profile
                bank_account = seller_profile.bank_account_number
                bank_ifsc = seller_profile.bank_ifsc_code
                bank_holder = seller_profile.bank_account_holder_name
                bank_name = seller_profile.bank_name or ''
                
                if not bank_account or not bank_ifsc:
                    return Response(
                        {'error': 'Please add bank details in your profile first'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                return Response(
                    {'error': 'Seller profile not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # For customers, they need to provide bank details
            return Response(
                {'error': 'Customer withdrawals not yet implemented. Please contact support.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create withdrawal request
        withdrawal = Withdrawal.objects.create(
            wallet=wallet,
            amount=amount,
            bank_account_number=bank_account,
            bank_ifsc_code=bank_ifsc,
            bank_account_holder=bank_holder,
            bank_name=bank_name,
            status='REQUESTED'
        )
        
        # Debit wallet immediately
        try:
            WalletService.debit_wallet(
                user=request.user,
                amount=amount,
                source='WITHDRAWAL',
                withdrawal=withdrawal,
                description=f'Withdrawal request #{withdrawal.id}'
            )
        except Exception as e:
            withdrawal.delete()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Process payout via Razorpay
        try:
            payout_service = RazorpayPayoutService()
            
            # Create contact and fund account if not exists
            if not seller_profile.razorpay_contact_id:
                contact_id = payout_service.create_contact(seller_profile)
                seller_profile.razorpay_contact_id = contact_id
                seller_profile.save()
            
            if not seller_profile.razorpay_fund_account_id:
                fund_account_id = payout_service.create_fund_account(
                    seller_profile.razorpay_contact_id,
                    {
                        'account_number': bank_account,
                        'ifsc': bank_ifsc,
                        'name': bank_holder
                    }
                )
                seller_profile.razorpay_fund_account_id = fund_account_id
                seller_profile.save()
            
            # Create payout
            result = payout_service.create_payout(
                seller_profile.razorpay_fund_account_id,
                amount,
                withdrawal.id
            )
            
            if result['success']:
                withdrawal.status = 'PROCESSING'
                withdrawal.razorpay_payout_id = result['payout_id']
                withdrawal.utr_number = result.get('utr', '')
                withdrawal.save()
                
                return Response({
                    'message': 'Withdrawal request submitted successfully',
                    'withdrawal_id': withdrawal.id,
                    'amount': amount,
                    'status': 'PROCESSING'
                }, status=status.HTTP_201_CREATED)
            else:
                # Payout failed, credit back to wallet
                WalletService.credit_wallet(
                    user=request.user,
                    amount=amount,
                    source='ADJUSTMENT',
                    description=f'Withdrawal failed - refund for request #{withdrawal.id}'
                )
                withdrawal.status = 'FAILED'
                withdrawal.rejection_reason = result.get('error', 'Payout failed')
                withdrawal.save()
                
                return Response({
                    'error': 'Withdrawal failed. Amount credited back to wallet.',
                    'reason': result.get('error', 'Unknown error')
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            logger.error(f"Withdrawal processing error: {str(e)}")
            # Credit back to wallet
            WalletService.credit_wallet(
                user=request.user,
                amount=amount,
                source='ADJUSTMENT',
                description=f'Withdrawal failed - refund for request #{withdrawal.id}'
            )
            withdrawal.status = 'FAILED'
            withdrawal.rejection_reason = str(e)
            withdrawal.save()
            
            return Response({
                'error': 'Withdrawal processing failed. Amount credited back to wallet.',
                'reason': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
