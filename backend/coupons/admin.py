from django.contrib import admin
from .models import Coupon

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'active', 'valid_to', 'used_count')
    list_filter = ('active', 'discount_type', 'valid_from', 'valid_to')
    search_fields = ('code',)
    ordering = ('-valid_to',)
    
    fieldsets = (
        (None, {
            'fields': ('code', 'active')
        }),
        ('Discount Details', {
            'fields': ('discount_type', 'discount_value', 'min_purchase_amount')
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_to', 'usage_limit', 'used_count')
        }),
    )