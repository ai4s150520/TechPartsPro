from django.contrib import admin
from .models import ReturnRequest, ReturnItem

@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'customer', 'request_type', 'reason', 'status', 'fraud_score', 'is_flagged', 'created_at']
    list_filter = ['status', 'request_type', 'reason', 'is_flagged', 'created_at']
    search_fields = ['order__order_id', 'customer__email', 'seller__email']
    readonly_fields = ['fraud_score', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('order', 'customer', 'seller', 'request_type', 'reason', 'description')
        }),
        ('Evidence', {
            'fields': ('images', 'video_url')
        }),
        ('Status', {
            'fields': ('status', 'seller_response', 'rejection_reason')
        }),
        ('Inspection', {
            'fields': ('inspection_result', 'inspection_notes', 'inspection_images')
        }),
        ('Logistics', {
            'fields': ('return_tracking_number', 'pickup_scheduled_at', 'received_at')
        }),
        ('Refund/Exchange', {
            'fields': ('refund_amount', 'shipping_charge', 'refund_processed_at', 'exchange_product', 'exchange_tracking_number')
        }),
        ('Fraud Prevention', {
            'fields': ('is_flagged', 'fraud_score', 'admin_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(ReturnItem)
class ReturnItemAdmin(admin.ModelAdmin):
    list_display = ['return_request', 'order_item', 'quantity', 'reason', 'is_approved']
    list_filter = ['is_approved', 'reason']
