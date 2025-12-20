from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib
import os

def get_encryption_key():
    """Generate encryption key from SECRET_KEY with salt"""
    # Use a fixed salt for consistency but add SECRET_KEY for security
    salt = b'ecommerce_salt_2024'
    key_material = settings.SECRET_KEY.encode() + salt
    key = hashlib.pbkdf2_hmac('sha256', key_material, salt, 100000)[:32]
    return base64.urlsafe_b64encode(key)

def encrypt_data(data: str) -> str:
    """Encrypt sensitive data"""
    if not data:
        return data
    
    fernet = Fernet(get_encryption_key())
    encrypted = fernet.encrypt(data.encode())
    return encrypted.decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    if not encrypted_data:
        return encrypted_data
    
    try:
        fernet = Fernet(get_encryption_key())
        decrypted = fernet.decrypt(encrypted_data.encode())
        return decrypted.decode()
    except Exception:
        return encrypted_data  # Return as-is if decryption fails
