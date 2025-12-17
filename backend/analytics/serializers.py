from rest_framework import serializers
from .models import ProductView, SearchTerm, DailyMetric

class DailyMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMetric
        fields = '__all__'

class SearchTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchTerm
        fields = ('term', 'result_count', 'timestamp')

class DashboardStatSerializer(serializers.Serializer):
    """
    Custom Serializer for the Seller/Admin Dashboard cards.
    Not tied to a model directly.
    """
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_orders = serializers.IntegerField()
    total_products = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()