from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from .models import Wallet, WalletTransaction

User = get_user_model()

class WalletTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='seller@example.com',
            password='SellerPass123!',
            role='SELLER'
        )
        # Wallet is auto-created by signal, just get it
        self.wallet = Wallet.objects.get(user=self.user)
        self.wallet.balance = Decimal('1000.00')
        self.wallet.save()
        
        # Setup seller profile with bank details
        from accounts.models import SellerProfile
        self.seller_profile = self.user.seller_profile
        self.seller_profile.business_name = 'Test Business'
        self.seller_profile.bank_account_number = '1234567890'
        self.seller_profile.bank_ifsc_code = 'SBIN0001234'
        self.seller_profile.bank_account_holder_name = 'Test Seller'
        self.seller_profile.save()
    
    def test_get_wallet(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/wallet/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['balance']), Decimal('1000.00'))
    
    def test_get_transactions(self):
        self.client.force_authenticate(user=self.user)
        WalletTransaction.objects.create(
            wallet=self.wallet,
            transaction_type='CREDIT',
            source='ORDER',
            amount=Decimal('100.00'),
            balance_before=Decimal('1000.00'),
            balance_after=Decimal('1100.00')
        )
        response = self.client.get('/api/wallet/transactions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
    
    def test_withdrawal_validation(self):
        self.client.force_authenticate(user=self.user)
        # Test minimum amount validation
        response = self.client.post('/api/wallet/withdrawals/', {'amount': '50.00'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_request_withdrawal(self):
        self.client.force_authenticate(user=self.user)
        # Test insufficient balance
        response = self.client.post('/api/wallet/withdrawals/', {'amount': '5000.00'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('error' in response.data or 'message' in response.data)
