# External API Setup Guide

## Overview
All external API integrations are centralized in one place for easy management and updates.

---

## 📁 File Structure

```
backend/
├── core/
│   └── external_apis.py          ← ALL API CLIENTS HERE
├── config/
│   └── settings.py                ← API KEYS HERE
└── .env                           ← SECRET KEYS HERE
```

---

## 🔑 Step 1: Add API Keys to .env

**File**: `backend/.env`

```env
# KYC Verification
UIDAI_API_KEY=your_uidai_key_here
IT_API_KEY=your_income_tax_key_here
KARZA_API_KEY=your_karza_key_here

# Payment Gateways
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=secret_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx

# Shipping
SHIPROCKET_EMAIL=your@email.com
SHIPROCKET_PASSWORD=your_password

# SMS Gateway
SMS_API_KEY=your_msg91_key
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_token

# Email Service
SENDGRID_API_KEY=SG.xxxxx
```

---

## 🔧 Step 2: Update API Client Code

**File**: `backend/core/external_apis.py`

### Example: Update UIDAI API

```python
class UIDAPIClient:
    BASE_URL = "https://api.uidai.gov.in"  # ← Change this to real URL
    
    @staticmethod
    def send_otp(aadhaar_number: str):
        response = requests.post(
            f"{UIDAPIClient.BASE_URL}/otp/generate",  # ← Real endpoint
            headers={
                'Authorization': f'Bearer {settings.UIDAI_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={'aadhaar_number': aadhaar_number},
            timeout=10
        )
        return response.json()
```

---

## 📋 Available API Clients

### 1. KYC Verification
- **UIDAPIClient** - Aadhaar verification (UIDAI)
- **IncomeTaxAPIClient** - PAN verification
- **KarzaAPIClient** - Third-party KYC provider

### 2. Payment Gateways
- **RazorpayAPIClient** - Payment processing
- **StripeAPIClient** - International payments

### 3. Shipping
- **ShiprocketAPIClient** - Shipping & tracking

### 4. Communication
- **SMSAPIClient** - SMS notifications
- **EmailAPIClient** - Email service

---

## 🚀 How to Use API Clients

### Example 1: Using KYC API

```python
from core.external_apis import UIDAPIClient

# Send Aadhaar OTP
result = UIDAPIClient.send_otp("123456789012")
if result.get('success'):
    print("OTP sent successfully")
```

### Example 2: Using Payment API

```python
from core.external_apis import RazorpayAPIClient

# Create payment order
order = RazorpayAPIClient.create_order(amount=50000, currency="INR")
print(order['id'])
```

### Example 3: Using Shipping API

```python
from core.external_apis import ShiprocketAPIClient

# Create shipping order
order_data = {
    'order_id': '12345',
    'order_date': '2025-01-01',
    # ... other fields
}
result = ShiprocketAPIClient.create_order(order_data)
```

---

## 🔄 Automatic Fallback

The system automatically uses mock data if API keys are not configured:

```python
# In kyc_verification.py
if settings.UIDAI_API_KEY:
    result = UIDAPIClient.send_otp(aadhaar_number)  # Real API
else:
    result = mock_otp_response()  # Mock for testing
```

---

## 📝 Adding New API Integration

### Step 1: Add API Key to settings.py

```python
# In backend/config/settings.py
NEW_API_KEY = env('NEW_API_KEY', default='')
```

### Step 2: Add to .env

```env
NEW_API_KEY=your_api_key_here
```

### Step 3: Create API Client

```python
# In backend/core/external_apis.py
class NewAPIClient:
    BASE_URL = "https://api.example.com"
    
    @staticmethod
    def some_method(param: str):
        response = requests.post(
            f"{NewAPIClient.BASE_URL}/endpoint",
            headers={'Authorization': f'Bearer {settings.NEW_API_KEY}'},
            json={'param': param},
            timeout=10
        )
        return response.json()
```

### Step 4: Use in Your Code

```python
from core.external_apis import NewAPIClient

result = NewAPIClient.some_method("test")
```

---

## 🔐 Security Best Practices

1. **Never commit .env file** - Add to .gitignore
2. **Use environment variables** - Never hardcode keys
3. **Rotate keys regularly** - Update in production
4. **Use different keys** - Separate test/production keys
5. **Monitor API usage** - Track API calls and costs

---

## 🧪 Testing

### Test with Mock Data (No API Keys)
```bash
# Don't set API keys in .env
python manage.py test
```

### Test with Real APIs (Sandbox)
```bash
# Set sandbox API keys in .env
UIDAI_API_KEY=sandbox_key_here
python manage.py test
```

---

## 📊 API Providers

### KYC Verification
- **UIDAI** - https://uidai.gov.in (Government)
- **Karza** - https://karza.in (Third-party)
- **Signzy** - https://signzy.com (Third-party)
- **IDfy** - https://idfy.com (Third-party)

### Payment Gateways
- **Razorpay** - https://razorpay.com
- **Stripe** - https://stripe.com
- **PayU** - https://payu.in

### Shipping
- **Shiprocket** - https://shiprocket.in
- **Delhivery** - https://delhivery.com
- **Blue Dart** - https://bluedart.com

### SMS Gateway
- **MSG91** - https://msg91.com
- **Twilio** - https://twilio.com
- **AWS SNS** - https://aws.amazon.com/sns

### Email Service
- **SendGrid** - https://sendgrid.com
- **AWS SES** - https://aws.amazon.com/ses
- **Mailgun** - https://mailgun.com

---

## 🎯 Quick Reference

| Service | File | Line | API Key Variable |
|---------|------|------|------------------|
| Aadhaar | `external_apis.py` | 12 | `UIDAI_API_KEY` |
| PAN | `external_apis.py` | 48 | `IT_API_KEY` |
| Razorpay | `external_apis.py` | 124 | `RAZORPAY_KEY_ID` |
| Shiprocket | `external_apis.py` | 162 | `SHIPROCKET_EMAIL` |
| Stripe | `external_apis.py` | 218 | `STRIPE_SECRET_KEY` |
| SMS | `external_apis.py` | 238 | `SMS_API_KEY` |
| Email | `external_apis.py` | 258 | `SENDGRID_API_KEY` |

---

## ✅ Summary

**3 Simple Steps:**
1. Add API key to `.env` file
2. Update API endpoint in `external_apis.py`
3. Use the API client in your code

**All APIs in ONE place** - Easy to manage, update, and maintain!
