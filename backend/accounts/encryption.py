from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib

def get_encryption_key():
    """Generate encryption key from SECRET_KEY"""
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
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
    except:
        return encrypted_data  # Return as-is if decryption fails
