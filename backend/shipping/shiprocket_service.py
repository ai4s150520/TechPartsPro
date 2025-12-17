import requests
from django.conf import settings
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class ShiprocketService:
    """
    Shiprocket API Integration for automatic shipment creation and tracking
    """
    BASE_URL = "https://apiv2.shiprocket.in/v1/external"
    
    def __init__(self):
        self.token = None
    
    def get_token(self):
        """Get authentication token"""
        if self.token:
            return self.token
            
        url = f"{self.BASE_URL}/auth/login"
        payload = {
            "email": settings.SHIPROCKET_EMAIL,
            "password": settings.SHIPROCKET_PASSWORD
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            self.token = response.json()['token']
            return self.token
        except requests.exceptions.RequestException as e:
            logger.error(f"Shiprocket auth failed: {e}")
            return None
        except KeyError as e:
            logger.error(f"Shiprocket auth response missing token: {e}")
            return None
    
    def create_order(self, order):
        """
        Create order in Shiprocket
        Returns: order_id, shipment_id
        """
        token = self.get_token()
        if not token:
            return None
        
        url = f"{self.BASE_URL}/orders/create/adhoc"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Prepare order data
        payload = {
            "order_id": order.order_id,
            "order_date": order.created_at.strftime("%Y-%m-%d %H:%M"),
            "pickup_location": "Primary",  # Your warehouse name in Shiprocket
            "billing_customer_name": order.shipping_address.get('full_name'),
            "billing_last_name": "",
            "billing_address": order.shipping_address.get('address_line1'),
            "billing_address_2": order.shipping_address.get('address_line2', ''),
            "billing_city": order.shipping_address.get('city'),
            "billing_pincode": order.shipping_address.get('postal_code'),
            "billing_state": order.shipping_address.get('state'),
            "billing_country": "India",
            "billing_email": order.user.email,
            "billing_phone": order.shipping_address.get('phone_number'),
            "shipping_is_billing": True,
            "order_items": [
                {
                    "name": item.product_name,
                    "sku": item.product.sku if item.product else "SKU",
                    "units": item.quantity,
                    "selling_price": str(item.price),
                    "discount": "0",
                    "tax": "0",
                    "hsn": ""
                }
                for item in order.items.all()
            ],
            "payment_method": "Prepaid" if order.payment_status else "COD",
            "sub_total": str(order.total_amount),
            "length": 10,  # Package dimensions (cm)
            "breadth": 10,
            "height": 10,
            "weight": 0.5  # Weight in kg
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            data = response.json()
            return {
                'order_id': data.get('order_id'),
                'shipment_id': data.get('shipment_id')
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Shiprocket order creation failed for {order.order_id}: {e}")
            return None
        except (KeyError, ValueError) as e:
            logger.error(f"Shiprocket order response parsing failed: {e}")
            return None
    
    def generate_awb(self, shipment_id, courier_id=None):
        """
        Generate AWB (tracking number) for shipment
        If courier_id not provided, uses recommended courier
        """
        token = self.get_token()
        if not token:
            return None
        
        # Step 1: Get available couriers if not specified
        if not courier_id:
            courier_id = self.get_recommended_courier(shipment_id)
        
        # Step 2: Assign courier and generate AWB
        url = f"{self.BASE_URL}/courier/assign/awb"
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "shipment_id": shipment_id,
            "courier_id": courier_id
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            data = response.json()
            return {
                'awb_code': data.get('response', {}).get('data', {}).get('awb_code'),
                'courier_name': data.get('response', {}).get('data', {}).get('courier_name'),
                'courier_id': courier_id
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"AWB generation failed for shipment {shipment_id}: {e}")
            return None
        except (KeyError, ValueError) as e:
            logger.error(f"AWB response parsing failed: {e}")
            return None
    
    def get_recommended_courier(self, shipment_id):
        """Get cheapest/fastest courier for shipment"""
        token = self.get_token()
        if not token:
            return 1  # Default courier ID
        
        url = f"{self.BASE_URL}/courier/serviceability/"
        headers = {"Authorization": f"Bearer {token}"}
        params = {"shipment_id": shipment_id}
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            couriers = response.json().get('data', {}).get('available_courier_companies', [])
            
            if couriers:
                # Return cheapest courier
                cheapest = min(couriers, key=lambda x: float(x.get('rate', 999999)))
                return cheapest.get('courier_company_id')
            return 1
        except requests.exceptions.RequestException as e:
            logger.warning(f"Courier recommendation failed for shipment {shipment_id}: {e}")
            return 1
        except (KeyError, ValueError) as e:
            logger.warning(f"Courier response parsing failed: {e}")
            return 1
    
    def schedule_pickup(self, shipment_id):
        """Schedule pickup from warehouse"""
        token = self.get_token()
        if not token:
            return None
        
        url = f"{self.BASE_URL}/courier/generate/pickup"
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "shipment_id": [shipment_id]
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Pickup scheduling failed for shipment {shipment_id}: {e}")
            return None
        except ValueError as e:
            logger.error(f"Pickup response parsing failed: {e}")
            return None
    
    def track_shipment(self, awb_code):
        """
        Track shipment by AWB code
        Returns: tracking updates array
        """
        token = self.get_token()
        if not token:
            return []
        
        url = f"{self.BASE_URL}/courier/track/awb/{awb_code}"
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            tracking_data = data.get('tracking_data', {})
            shipment_track = tracking_data.get('shipment_track', [])
            
            # Convert to our format
            updates = []
            for track in shipment_track:
                updates.append({
                    'timestamp': track.get('date'),
                    'location': track.get('location', 'Unknown'),
                    'status': track.get('status', 'In Transit'),
                    'description': track.get('activity', '')
                })
            
            return updates
        except requests.exceptions.RequestException as e:
            logger.warning(f"Tracking failed for AWB {awb_code}: {e}")
            return []
        except (KeyError, ValueError) as e:
            logger.warning(f"Tracking response parsing failed: {e}")
            return []
    
    def get_shipment_status(self, shipment_id):
        """Get current status of shipment"""
        token = self.get_token()
        if not token:
            return None
        
        url = f"{self.BASE_URL}/shipments/show/{shipment_id}"
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.warning(f"Status check failed for shipment {shipment_id}: {e}")
            return None
        except ValueError as e:
            logger.warning(f"Status response parsing failed: {e}")
            return None


# Singleton instance
shiprocket_service = ShiprocketService()
