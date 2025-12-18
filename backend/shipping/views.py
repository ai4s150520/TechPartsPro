from rest_framework.views import APIView
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .serializers import ShippingMethodSerializer, ShipmentSerializer
from .models import Shipment, ShippingZone, ShippingMethod # Added Missing Imports
from orders.models import Order
from notifications.services import NotificationService

class ShippingRateView(APIView):
    """
    Public Endpoint (Authenticated optional).
    Calculates shipping options based on Pincode and Cart Weight.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        pincode = str(request.data.get('pincode', '')).strip()
        
        # Default weight to 0.5kg if not provided
        try:
            weight = float(request.data.get('weight', 0.5))
        except (ValueError, TypeError):
            weight = 0.5
        
        if not pincode:
            return Response({"error": "Pincode is required"}, status=status.HTTP_400_BAD_REQUEST)

        # --- 1. Identify Zone Logic ---
        # Logic: Look for a zone where the 'regions' field contains the Pincode prefix (first 3 digits)
        # Example: Pincode 110001 -> Prefix 110
        prefix = pincode[:3]
        
        zone = ShippingZone.objects.filter(regions__contains=prefix).first()
        
        # Fallback: If no specific zone found, look for a 'National' or 'Default' zone
        # or simply take the first available zone to ensure checkout doesn't block.
        if not zone:
            zone = ShippingZone.objects.filter(name__icontains='National').first()
        
        if not zone:
            # Ultimate fallback: Just grab any zone so the user can checkout
            zone = ShippingZone.objects.first()

        if not zone:
            return Response({"error": "Shipping not available for this area."}, status=status.HTTP_404_NOT_FOUND)

        # --- 2. Get Methods for Zone ---
        methods = ShippingMethod.objects.filter(zone=zone, is_active=True)
        
        # --- 3. Serialize ---
        # We pass 'weight' to context so the Serializer's get_total_cost method works
        serializer = ShippingMethodSerializer(methods, many=True, context={'weight': weight})
        
        return Response(serializer.data)

class CouriersListView(APIView):
    """Return a list of supported courier partners (static or from settings)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Try to read from Django settings if configured
        from django.conf import settings

        carriers = getattr(settings, 'SUPPORTED_CARRIERS', None)
        if not carriers:
            # Fallback static list
            carriers = [
                {'id': 'delhivery', 'name': 'Delhivery'},
                {'id': 'bluedart', 'name': 'Bluedart'},
                {'id': 'ekart', 'name': 'Ekart'},
                {'id': 'shadowfax', 'name': 'Shadowfax'},
                {'id': 'ecomexpress', 'name': 'Ecom Express'},
                {'id': 'shiprocket', 'name': 'Shiprocket (auto)'}
            ]

        return Response(carriers)
class ShipmentViewSet(viewsets.ModelViewSet):
    """
    Admin/Seller only: Create Tracking Numbers.
    """
    queryset = Shipment.objects.all()
    serializer_class = ShipmentSerializer
    permission_classes = [permissions.IsAdminUser] # Only Staff can create shipments

    def perform_create(self, serializer):
        shipment = serializer.save()
        
        # Update Order Status automatically
        order = shipment.order
        order.status = 'SHIPPED'
        order.tracking_number = shipment.tracking_number
        order.courier_name = shipment.carrier_name
        order.save()

        # Notify User
        try:
            NotificationService.create_notification(
                user=order.user,
                title="Order Shipped!",
                message=f"Your order #{order.order_id} has been shipped via {shipment.carrier_name}.",
                notification_type='SUCCESS' # Fixed param name from 'type' to 'notification_type'
            )
        except Exception as e:
            # Don't crash if notification fails
            print(f"Notification failed: {e}")