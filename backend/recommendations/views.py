from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q
from catalog.models import Product
from catalog.serializers import ProductListSerializer
from orders.models import OrderItem

class RecommendedProductsView(APIView):
    def get(self, request, product_id=None):
        if product_id:
            # Similar products based on category
            try:
                product = Product.objects.get(id=product_id)
                recommended = Product.objects.filter(
                    category=product.category,
                    is_active=True
                ).exclude(id=product_id)[:8]
            except Product.DoesNotExist:
                recommended = Product.objects.filter(is_active=True)[:8]
        else:
            # Popular products
            recommended = Product.objects.filter(
                is_active=True
            ).annotate(
                order_count=Count('orderitem')
            ).order_by('-order_count')[:8]
        
        serializer = ProductListSerializer(recommended, many=True)
        return Response(serializer.data)

class TrendingProductsView(APIView):
    def get(self, request):
        trending = Product.objects.filter(
            is_active=True
        ).annotate(
            recent_orders=Count('orderitem', filter=Q(orderitem__created_at__gte='2024-01-01'))
        ).order_by('-recent_orders')[:10]
        
        serializer = ProductListSerializer(trending, many=True)
        return Response(serializer.data)

class FrequentlyBoughtTogetherView(APIView):
    def get(self, request, product_id):
        # Get products frequently bought with this product
        order_items = OrderItem.objects.filter(product_id=product_id)
        order_ids = order_items.values_list('order_id', flat=True)
        
        related_products = OrderItem.objects.filter(
            order_id__in=order_ids
        ).exclude(
            product_id=product_id
        ).values('product_id').annotate(
            count=Count('product_id')
        ).order_by('-count')[:5]
        
        product_ids = [item['product_id'] for item in related_products]
        products = Product.objects.filter(id__in=product_ids, is_active=True)
        
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)
