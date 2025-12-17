from django.contrib import admin
from .models import ProductView, SearchTerm, DailyMetric

@admin.register(SearchTerm)
class SearchTermAdmin(admin.ModelAdmin):
    list_display = ('term', 'result_count', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('term',)

@admin.register(DailyMetric)
class DailyMetricAdmin(admin.ModelAdmin):
    list_display = ('date', 'total_revenue', 'total_orders')
    ordering = ('-date',)

admin.site.register(ProductView)