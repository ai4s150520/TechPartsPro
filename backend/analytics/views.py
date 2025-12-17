from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta

# Import Models from other apps
from .models import ProductView, SearchTerm, DailyMetric
from orders.models import Order, OrderItem
from catalog.models import Product
from .serializers import DashboardStatSerializer, DailyMetricSerializer
from .permissions import IsAdminUser, IsSellerUser

# --- 1. ADMIN DASHBOARD (Platform Wide) ---
class AdminDashboardStats(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        # 1. Calculate Total Revenue (Completed orders only)
        revenue = Order.objects.filter(status='DELIVERED').aggregate(
            total=Sum('total_amount')
        )['total'] or 0

        # 2. Counts
        order_count = Order.objects.count()
        product_count = Product.objects.count()
        user_count = Product.objects.count() # Just for example

        # 3. Response
        data = {
            "total_revenue": revenue,
            "total_orders": order_count,
            "total_products": product_count,
            "total_users": user_count,
        }
        return Response(data)

# --- 2. SELLER DASHBOARD (Specific to Logged In Seller) ---
class SellerDashboardStats(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSellerUser]

    def get(self, request):
        user = request.user
        
        # We assume Product model has a 'seller' field (we will add this in Catalog app)
        # We assume OrderItem links to Product
        
        # 1. Get Seller's Products
        my_products = Product.objects.filter(seller=user)
        
        # 2. Calculate Revenue from OrderItems related to these products
        # Logic: Join OrderItem -> Product -> Seller
        seller_revenue = OrderItem.objects.filter(product__seller=user).aggregate(
            total=Sum(F('price') * F('quantity'))
        )['total'] or 0
        
        # 3. Low Stock Alert
        low_stock = my_products.filter(stock_quantity__lt=5).count()
        
        data = {
            "total_revenue": seller_revenue,
            "total_products": my_products.count(),
            "low_stock_count": low_stock,
            # "orders_pending": ... (Logic would go here)
        }
        
        serializer = DashboardStatSerializer(data)
        return Response(serializer.data)

# --- 3. TRACKING EVENTS (Public/Private) ---
class TrackProductView(APIView):
    """
    Hit this endpoint when a user opens a Product Detail Page
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, product_id):
        # Get IP Address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')

        try:
            ProductView.objects.create(
                product_id=product_id,
                user=request.user if request.user.is_authenticated else None,
                ip_address=ip
            )
            return Response({"status": "tracked"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)