import os
import sys
from django.core.management.base import BaseCommand

def validate_environment():
    """Validate required environment variables on startup"""
    required_vars = [
        'SECRET_KEY',
        'DATABASE_URL',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
    ]
    
    production_vars = [
        'SENTRY_DSN',
        'EMAIL_HOST_USER',
        'EMAIL_HOST_PASSWORD',
    ]
    
    missing = []
    for var in required_vars:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        print(f"ERROR: Missing required environment variables: {', '.join(missing)}")
        print("Please check your .env file")
        sys.exit(1)
    
    # Warn about production vars
    if not os.getenv('DEBUG', 'False').lower() == 'true':
        missing_prod = [var for var in production_vars if not os.getenv(var)]
        if missing_prod:
            print(f"WARNING: Missing production variables: {', '.join(missing_prod)}")
    
    print("✓ Environment validation passed")
