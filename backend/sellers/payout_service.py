import razorpay
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class RazorpayPayoutService:
    """
    Service to handle automatic payouts to seller bank accounts using Razorpay Payout API
    """
    
    def __init__(self):
        self.client = razorpay.Client(auth=(
            settings.RAZORPAY_PAYOUT_KEY_ID,
            settings.RAZORPAY_PAYOUT_KEY_SECRET
        ))
        self.account_number = settings.RAZORPAY_PAYOUT_ACCOUNT_NUMBER
    
    def create_contact(self, seller_profile):
        """
        Create a contact in Razorpay for the seller
        Returns: contact_id
        """
        try:
            contact = self.client.contact.create({
                "name": seller_profile.business_name or seller_profile.user.get_full_name(),
                "email": seller_profile.business_email or seller_profile.user.email,
                "contact": seller_profile.business_phone or "",
                "type": "vendor",
                "reference_id": f"seller_{seller_profile.user.id}"
            })
            return contact['id']
        except Exception as e:
            logger.error(f"Failed to create contact: {str(e)}")
            raise
    
    def create_fund_account(self, contact_id, bank_details):
        """
        Create a fund account (bank account) for the contact
        bank_details = {
            'account_number': '1234567890',
            'ifsc': 'HDFC0000123',
            'name': 'Account Holder Name'
        }
        Returns: fund_account_id
        """
        try:
            fund_account = self.client.fund_account.create({
                "contact_id": contact_id,
                "account_type": "bank_account",
                "bank_account": {
                    "name": bank_details['name'],
                    "ifsc": bank_details['ifsc'],
                    "account_number": bank_details['account_number']
                }
            })
            return fund_account['id']
        except Exception as e:
            logger.error(f"Failed to create fund account: {str(e)}")
            raise
    
    def create_payout(self, fund_account_id, amount, payout_id, purpose="payout"):
        """
        Create a payout to seller's bank account
        amount: in rupees (will be converted to paise)
        Returns: payout response with transaction details
        """
        try:
            # Convert rupees to paise (Razorpay uses paise)
            amount_in_paise = int(float(amount) * 100)
            
            payout = self.client.payout.create({
                "account_number": self.account_number,
                "fund_account_id": fund_account_id,
                "amount": amount_in_paise,
                "currency": "INR",
                "mode": "IMPS",  # IMPS, NEFT, RTGS, UPI
                "purpose": purpose,
                "queue_if_low_balance": True,
                "reference_id": f"payout_{payout_id}",
                "narration": f"Seller Payout #{payout_id}"
            })
            
            return {
                'success': True,
                'payout_id': payout['id'],
                'status': payout['status'],
                'utr': payout.get('utr', ''),
                'reference_id': payout.get('reference_id', '')
            }
        except Exception as e:
            logger.error(f"Failed to create payout: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_payout_status(self, razorpay_payout_id):
        """
        Check the status of a payout
        Returns: payout status (processing, processed, reversed, cancelled)
        """
        try:
            payout = self.client.payout.fetch(razorpay_payout_id)
            return {
                'status': payout['status'],
                'utr': payout.get('utr', ''),
                'failure_reason': payout.get('failure_reason', '')
            }
        except Exception as e:
            logger.error(f"Failed to fetch payout status: {str(e)}")
            return {'status': 'error', 'error': str(e)}
