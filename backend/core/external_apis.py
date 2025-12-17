"""
Centralized External API Client
Store all third-party API integrations here
"""
import requests
from django.conf import settings
from typing import Dict, Any


class UIDAPIClient:
    """Aadhaar Verification API (UIDAI)"""
    
    BASE_URL = "https://api.uidai.gov.in"  # Replace with actual URL
    
    @staticmethod
    def send_otp(aadhaar_number: str) -> Dict[str, Any]:
        """Send OTP to Aadhaar registered mobile"""
        try:
            response = requests.post(
                f"{UIDAPIClient.BASE_URL}/otp/generate",
                headers={
                    'Authorization': f'Bearer {settings.UIDAI_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={'aadhaar_number': aadhaar_number, 'consent': 'Y'},
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def verify_otp(transaction_id: str, otp: str) -> Dict[str, Any]:
        """Verify Aadhaar OTP"""
        try:
            response = requests.post(
                f"{UIDAPIClient.BASE_URL}/otp/verify",
                headers={
                    'Authorization': f'Bearer {settings.UIDAI_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={'transaction_id': transaction_id, 'otp': otp},
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'success': False, 'error': str(e)}


class IncomeTaxAPIClient:
    """PAN Verification API (Income Tax Department)"""
    
    BASE_URL = "https://api.incometax.gov.in"  # Replace with actual URL
    
    @staticmethod
    def send_otp(pan_number: str) -> Dict[str, Any]:
        """Send OTP for PAN verification"""
        try:
            response = requests.post(
                f"{IncomeTaxAPIClient.BASE_URL}/pan/otp/send",
                headers={
                    'Authorization': f'Bearer {settings.IT_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={'pan_number': pan_number},
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def verify_otp(transaction_id: str, otp: str) -> Dict[str, Any]:
        """Verify PAN OTP"""
        try:
            response = requests.post(
                f"{IncomeTaxAPIClient.BASE_URL}/pan/otp/verify",
                headers={
                    'Authorization': f'Bearer {settings.IT_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={'transaction_id': transaction_id, 'otp': otp},
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'success': False, 'error': str(e)}


class KarzaAPIClient:
    """Third-party KYC API (Alternative to government APIs)"""
    
    BASE_URL = "https://api.karza.in/v2"
    
    @staticmethod
    def verify_aadhaar(aadhaar_number: str) -> Dict[str, Any]:
        """Instant Aadhaar verification"""
        try:
            response = requests.post(
                f"{KarzaAPIClient.BASE_URL}/aadhaar-verification",
                headers={
                    'x-karza-key': settings.KARZA_API_KEY,
                    'Content-Type': 'application/json'
                },
                json={'aadhaar': aadhaar_number, 'consent': 'Y'},
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def verify_pan(pan_number: str) -> Dict[str, Any]:
        """Instant PAN verification"""
        try:
            response = requests.post(
                f"{KarzaAPIClient.BASE_URL}/pan-verification",
                headers={
                    'x-karza-key': settings.KARZA_API_KEY,
                    'Content-Type': 'application/json'
                },
                json={'pan': pan_number, 'consent': 'Y'},
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'success': False, 'error': str(e)}


class RazorpayAPIClient:
    """Payment Gateway API"""
    
    BASE_URL = "https://api.razorpay.com/v1"
    
    @staticmethod
    def create_order(amount: int, currency: str = "INR") -> Dict[str, Any]:
        """Create payment order"""
        try:
            response = requests.post(
                f"{RazorpayAPIClient.BASE_URL}/orders",
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                json={'amount': amount, 'currency': currency},
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    @staticmethod
    def verify_payment(order_id: str, payment_id: str, signature: str) -> bool:
        """Verify payment signature"""
        import hmac
        import hashlib
        
        message = f"{order_id}|{payment_id}"
        generated_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return generated_signature == signature


class ShiprocketAPIClient:
    """Shipping API"""
    
    BASE_URL = "https://apiv2.shiprocket.in/v1/external"
    _token = None
    
    @classmethod
    def get_token(cls) -> str:
        """Get authentication token"""
        if cls._token:
            return cls._token
        
        try:
            response = requests.post(
                f"{cls.BASE_URL}/auth/login",
                json={
                    'email': settings.SHIPROCKET_EMAIL,
                    'password': settings.SHIPROCKET_PASSWORD
                },
                timeout=10
            )
            cls._token = response.json().get('token')
            return cls._token
        except Exception:
            return None
    
    @classmethod
    def create_order(cls, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create shipping order"""
        try:
            response = requests.post(
                f"{cls.BASE_URL}/orders/create/adhoc",
                headers={
                    'Authorization': f'Bearer {cls.get_token()}',
                    'Content-Type': 'application/json'
                },
                json=order_data,
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}
    
    @classmethod
    def track_shipment(cls, shipment_id: str) -> Dict[str, Any]:
        """Track shipment status"""
        try:
            response = requests.get(
                f"{cls.BASE_URL}/courier/track/shipment/{shipment_id}",
                headers={'Authorization': f'Bearer {cls.get_token()}'},
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}


class StripeAPIClient:
    """Stripe Payment API"""
    
    BASE_URL = "https://api.stripe.com/v1"
    
    @staticmethod
    def create_payment_intent(amount: int, currency: str = "inr") -> Dict[str, Any]:
        """Create payment intent"""
        try:
            response = requests.post(
                f"{StripeAPIClient.BASE_URL}/payment_intents",
                auth=(settings.STRIPE_SECRET_KEY, ''),
                data={'amount': amount, 'currency': currency},
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}


class SMSAPIClient:
    """SMS Gateway API (e.g., Twilio, MSG91)"""
    
    BASE_URL = "https://api.msg91.com/api/v5"
    
    @staticmethod
    def send_sms(mobile: str, message: str) -> Dict[str, Any]:
        """Send SMS"""
        try:
            response = requests.post(
                f"{SMSAPIClient.BASE_URL}/flow",
                headers={'authkey': settings.SMS_API_KEY},
                json={'mobile': mobile, 'message': message},
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}


class EmailAPIClient:
    """Email Service API (e.g., SendGrid, AWS SES)"""
    
    BASE_URL = "https://api.sendgrid.com/v3"
    
    @staticmethod
    def send_email(to: str, subject: str, html_content: str) -> Dict[str, Any]:
        """Send email"""
        try:
            response = requests.post(
                f"{EmailAPIClient.BASE_URL}/mail/send",
                headers={
                    'Authorization': f'Bearer {settings.SENDGRID_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'personalizations': [{'to': [{'email': to}]}],
                    'from': {'email': settings.DEFAULT_FROM_EMAIL},
                    'subject': subject,
                    'content': [{'type': 'text/html', 'value': html_content}]
                },
                timeout=10
            )
            return response.json()
        except Exception as e:
            return {'error': str(e)}


# Export all clients
__all__ = [
    'UIDAPIClient',
    'IncomeTaxAPIClient',
    'KarzaAPIClient',
    'RazorpayAPIClient',
    'ShiprocketAPIClient',
    'StripeAPIClient',
    'SMSAPIClient',
    'EmailAPIClient',
]
