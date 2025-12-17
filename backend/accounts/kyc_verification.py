import random
import re
from django.core.cache import cache
from django.conf import settings
from core.external_apis import UIDAPIClient, IncomeTaxAPIClient, KarzaAPIClient

class KYCVerificationService:
    """Service for Aadhaar and PAN verification with OTP"""
    
    @staticmethod
    def validate_aadhaar(aadhaar_number):
        """Validate Aadhaar number format"""
        clean = str(aadhaar_number).replace(' ', '').strip()
        return bool(re.match(r'^\d{12}$', clean))
    
    @staticmethod
    def validate_pan(pan_number):
        """Validate PAN number format (ABCDE1234F)"""
        clean = str(pan_number).upper().strip()
        return bool(re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]$', clean))
    
    @staticmethod
    def generate_otp():
        """Generate 6-digit OTP"""
        return str(random.randint(100000, 999999))
    
    @staticmethod
    def send_aadhaar_otp(aadhaar_number, user_id):
        """Send OTP to Aadhaar registered mobile"""
        if not KYCVerificationService.validate_aadhaar(aadhaar_number):
            return {'success': False, 'error': 'Invalid Aadhaar number format'}
        
        # Use real API if configured, otherwise mock
        if settings.UIDAI_API_KEY:
            result = UIDAPIClient.send_otp(aadhaar_number)
            if result.get('success'):
                cache.set(f'aadhaar_txn_{user_id}', result.get('transaction_id'), timeout=300)
            return result
        else:
            # Mock implementation for testing
            otp = KYCVerificationService.generate_otp()
            cache.set(f'aadhaar_otp_{user_id}', otp, timeout=300)
            return {
                'success': True,
                'message': 'OTP sent to Aadhaar registered mobile',
                'otp': otp,  # Remove in production
                'masked_mobile': 'XXXXXX' + aadhaar_number[-4:]
            }
    
    @staticmethod
    def verify_aadhaar_otp(aadhaar_number, otp, user_id):
        """Verify Aadhaar OTP"""
        # Use real API if configured
        if settings.UIDAI_API_KEY:
            txn_id = cache.get(f'aadhaar_txn_{user_id}')
            if not txn_id:
                return {'success': False, 'error': 'Transaction expired'}
            result = UIDAPIClient.verify_otp(txn_id, otp)
            if result.get('success'):
                cache.delete(f'aadhaar_txn_{user_id}')
            return result
        else:
            # Mock implementation
            stored_otp = cache.get(f'aadhaar_otp_{user_id}')
            if not stored_otp:
                return {'success': False, 'error': 'OTP expired or not found'}
            if str(stored_otp) != str(otp):
                return {'success': False, 'error': 'Invalid OTP'}
            cache.delete(f'aadhaar_otp_{user_id}')
            return {
                'success': True,
                'message': 'Aadhaar verified successfully',
                'name': 'Mock Name',
                'dob': '01/01/1990',
                'address': 'Mock Address'
            }
    
    @staticmethod
    def send_pan_otp(pan_number, user_id):
        """Send OTP for PAN verification"""
        if not KYCVerificationService.validate_pan(pan_number):
            return {'success': False, 'error': 'Invalid PAN number format'}
        
        # Use real API if configured
        if settings.IT_API_KEY:
            result = IncomeTaxAPIClient.send_otp(pan_number)
            if result.get('success'):
                cache.set(f'pan_txn_{user_id}', result.get('transaction_id'), timeout=300)
            return result
        else:
            # Mock implementation
            otp = KYCVerificationService.generate_otp()
            cache.set(f'pan_otp_{user_id}', otp, timeout=300)
            return {
                'success': True,
                'message': 'OTP sent to PAN registered mobile',
                'otp': otp,  # Remove in production
                'masked_mobile': 'XXXXXX' + pan_number[-4:]
            }
    
    @staticmethod
    def verify_pan_otp(pan_number, otp, user_id):
        """Verify PAN OTP"""
        # Use real API if configured
        if settings.IT_API_KEY:
            txn_id = cache.get(f'pan_txn_{user_id}')
            if not txn_id:
                return {'success': False, 'error': 'Transaction expired'}
            result = IncomeTaxAPIClient.verify_otp(txn_id, otp)
            if result.get('success'):
                cache.delete(f'pan_txn_{user_id}')
            return result
        else:
            # Mock implementation
            stored_otp = cache.get(f'pan_otp_{user_id}')
            if not stored_otp:
                return {'success': False, 'error': 'OTP expired or not found'}
            if str(stored_otp) != str(otp):
                return {'success': False, 'error': 'Invalid OTP'}
            cache.delete(f'pan_otp_{user_id}')
            return {
                'success': True,
                'message': 'PAN verified successfully',
                'name': 'Mock PAN Holder Name',
                'status': 'Valid'
            }
