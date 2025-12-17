from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Count, Avg
from catalog.models import Product, Category
from catalog.serializers import ProductListSerializer

class AdvancedSearchView(APIView):
    def get(self, request):
        query = request.query_params.get('q', '')
        category = request.query_params.get('category', '')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        min_rating = request.query_params.get('min_rating')
        in_stock = request.query_params.get('in_stock')
        
        products = Product.objects.filter(is_active=True)
        
        if query:
            products = products.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(category__name__icontains=query)
            )
        
        if category:
            products = products.filter(category__slug=category)
        
        if min_price:
            products = products.filter(price__gte=min_price)
        
        if max_price:
            products = products.filter(price__lte=max_price)
        
        if min_rating:
            products = products.annotate(avg_rating=Avg('reviews__rating')).filter(avg_rating__gte=min_rating)
        
        if in_stock == 'true':
            products = products.filter(stock__gt=0)
        
        products = products.distinct()[:50]
        serializer = ProductListSerializer(products, many=True)
        
        return Response({
            'count': products.count(),
            'results': serializer.data
        })

class AutocompleteView(APIView):
    def get(self, request):
        query = request.query_params.get('q', '')
        
        if len(query) < 2:
            return Response([])
        
        products = Product.objects.filter(
            Q(name__icontains=query) | Q(category__name__icontains=query),
            is_active=True
        ).values('name', 'slug')[:10]
        
        return Response(list(products))
