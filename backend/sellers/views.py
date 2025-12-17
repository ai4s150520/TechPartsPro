from rest_framework import viewsets, views, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, F, Count, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from shipping.shiprocket_service import shiprocket_service

from .models import Payout
from .permissions import IsSeller, IsOwner
from .serializers import PayoutSerializer, DashboardStatsSerializer, SellerProfileSerializer
from accounts.models import SellerProfile
from catalog.models import Product
from orders.models import OrderItem, Order

# --- NEW SERIALIZER FOR SELLER ORDERS ---
class SellerOrderItemSerializer(serializers.ModelSerializer):
    order_id = serializers.ReadOnlyField(source='order.order_id')
    order_date = serializers.ReadOnlyField(source='order.created_at')
    order_status = serializers.ReadOnlyField(source='order.status')
    product_name = serializers.ReadOnlyField(source='product.name')
    customer_email = serializers.ReadOnlyField(source='order.user.email')
    
    class Meta:
        model = OrderItem
        fields = ['id', 'order_id', 'order_date', 'order_status', 'product_name', 'quantity', 'price', 'customer_email']

# --- NEW VIEWSET ---
class SellerOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SellerOrderItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get_queryset(self):
        return OrderItem.objects.filter(product__seller=self.request.user).order_by('-order__created_at')
    
    @action(detail=False, methods=['post'], url_path='(?P<order_id>[^/.]+)/ship')
    def ship_order(self, request, order_id=None):
        """
        Ship seller's items in an order with Shiprocket integration
        POST /api/sellers/orders/{order_id}/ship/
        
        Each seller ships only THEIR items with separate tracking
        """
        try:
            order = Order.objects.get(id=order_id)
            
            # Get only THIS seller's items from the order
            seller_items = order.items.filter(product__seller=request.user, status='PENDING')
            
            if not seller_items.exists():
                return Response({'error': 'No items to ship'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Step 1: Create shipment in Shiprocket (only seller's items)
            shiprocket_order = shiprocket_service.create_order(order)
            if not shiprocket_order:
                return Response({'error': 'Failed to create shipment'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Step 2: Generate AWB (tracking number)
            awb_data = shiprocket_service.generate_awb(shiprocket_order['shipment_id'])
            if not awb_data:
                return Response({'error': 'Failed to generate tracking number'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Step 3: Schedule pickup
            shiprocket_service.schedule_pickup(shiprocket_order['shipment_id'])
            
            # Step 4: Update ONLY seller's items
            seller_items.update(
                status='SHIPPED',
                tracking_number=awb_data['awb_code'],
                courier_name=awb_data['courier_name'],
                estimated_delivery=timezone.now().date() + timedelta(days=5),
                shiprocket_shipment_id=shiprocket_order['shipment_id']
            )
            
            # Step 5: Update main order status if ALL items shipped
            if not order.items.filter(status__in=['PENDING', 'PROCESSING']).exists():
                order.status = 'SHIPPED'
                order.save()
            
            return Response({
                'message': f'{seller_items.count()} items shipped successfully',
                'tracking_number': awb_data['awb_code'],
                'courier': awb_data['courier_name'],
                'items_shipped': seller_items.count()
            })
            
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SellerDashboardView(views.APIView):
    """
    GET /api/sellers/dashboard/
    Aggregates financial data + Graph Data for the logged-in seller.
    """
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get(self, request):
        seller = request.user
        
        # --- 1. EXISTING STATS (Total) ---
        revenue_data = OrderItem.objects.filter(
            product__seller=seller,
            order__status='DELIVERED'
        ).aggregate(total=Sum(F('price') * F('quantity')))
        total_revenue = revenue_data['total'] or 0.00

        total_orders = OrderItem.objects.filter(product__seller=seller).values('order').distinct().count()
        total_products = Product.objects.filter(seller=seller).count()
        
        pending_payouts = Payout.objects.filter(
            seller=seller, 
            status__in=['REQUESTED', 'PROCESSING']
        ).aggregate(total=Sum('amount'))['total'] or 0.00

        # --- 2. NEW: GRAPH DATA (Last 7 Days) ---
        today = timezone.now().date()
        graph_data = []

        # Loop backwards from 6 days ago to today
        for i in range(6, -1, -1):
            target_date = today - timedelta(days=i)
            day_name = target_date.strftime("%a") # "Mon", "Tue"

            # Sum revenue for this specific date
            daily_revenue = OrderItem.objects.filter(
                product__seller=seller,
                order__status='DELIVERED', # Only delivered sales count
                order__created_at__date=target_date
            ).aggregate(
                total=Sum(F('price') * F('quantity'))
            )['total'] or 0.00

            graph_data.append({
                "name": day_name,
                "revenue": daily_revenue
            })

        data = {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "total_products": total_products,
            "pending_payouts": pending_payouts,
            "revenue_graph": graph_data # <--- Sending this to Frontend
        }
        
        return Response(data)

class PayoutViewSet(viewsets.ModelViewSet):
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller, IsOwner]

    def get_queryset(self):
        return Payout.objects.filter(seller=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        bank_info = "Bank Acct linked to Profile" 
        serializer.save(seller=self.request.user, bank_details_snapshot=bank_info)

class SellerProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get(self, request):
        profile, _ = SellerProfile.objects.get_or_create(user=request.user)
        serializer = SellerProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile, _ = SellerProfile.objects.get_or_create(user=request.user)
        serializer = SellerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)