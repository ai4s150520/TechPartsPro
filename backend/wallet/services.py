from django.db import transaction
from decimal import Decimal
from .models import Wallet, WalletTransaction
import logging

logger = logging.getLogger(__name__)

class WalletService:
    """Service to handle wallet operations"""
    
    @staticmethod
    def get_or_create_wallet(user):
        """Get or create wallet for user"""
        wallet, created = Wallet.objects.get_or_create(user=user)
        return wallet
    
    @staticmethod
    @transaction.atomic
    def credit_wallet(user, amount, source, order=None, description=""):
        """Credit amount to user's wallet"""
        wallet = WalletService.get_or_create_wallet(user)
        
        if wallet.is_locked:
            raise ValueError("Wallet is locked")
        
        balance_before = wallet.balance
        wallet.balance += Decimal(str(amount))
        wallet.save()
        
        WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type='CREDIT',
            source=source,
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            order=order,
            description=description
        )
        
        logger.info(f"Credited ₹{amount} to {user.email} wallet. New balance: ₹{wallet.balance}")
        return wallet
    
    @staticmethod
    @transaction.atomic
    def debit_wallet(user, amount, source, order=None, withdrawal=None, description=""):
        """Debit amount from user's wallet"""
        wallet = WalletService.get_or_create_wallet(user)
        
        if wallet.is_locked:
            raise ValueError("Wallet is locked")
        
        balance_before = wallet.balance
        wallet.balance -= Decimal(str(amount))
        wallet.save()
        
        # Lock wallet if negative balance
        if wallet.balance < 0:
            wallet.is_locked = True
            wallet.save()
            logger.warning(f"Wallet locked for {user.email} due to negative balance: ₹{wallet.balance}")
        
        WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type='DEBIT',
            source=source,
            amount=amount,
            balance_before=balance_before,
            balance_after=wallet.balance,
            order=order,
            withdrawal=withdrawal,
            description=description
        )
        
        logger.info(f"Debited ₹{amount} from {user.email} wallet. New balance: ₹{wallet.balance}")
        return wallet
    
    @staticmethod
    def get_balance(user):
        """Get user's wallet balance"""
        wallet = WalletService.get_or_create_wallet(user)
        return wallet.balance
    
    @staticmethod
    def can_withdraw(user, amount):
        """Check if user can withdraw amount"""
        wallet = WalletService.get_or_create_wallet(user)
        
        if wallet.is_locked:
            return False, "Wallet is locked"
        
        if not wallet.is_active:
            return False, "Wallet is inactive"
        
        if amount < Decimal('100.00'):
            return False, "Minimum withdrawal amount is ₹100"
        
        if amount > wallet.balance:
            return False, f"Insufficient balance. Available: ₹{wallet.balance}"
        
        return True, "Can withdraw"
