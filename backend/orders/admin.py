from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name', 'price', 'subtotal')
    can_delete = False

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'user', 'status', 'total_amount', 'created_at', 'payment_status')
    list_filter = ('status', 'payment_status', 'created_at')
    search_fields = ('order_id', 'user__email', 'tracking_number')
    readonly_fields = ('order_id', 'total_amount', 'shipping_address', 'created_at')
    inlines = [OrderItemInline]
    
    actions = ['mark_as_processing', 'mark_as_shipped']

    @admin.action(description='Mark selected orders as Processing')
    def mark_as_processing(self, request, queryset):
        for order in queryset:
            order.status = Order.Status.PROCESSING
            order.save()

    @admin.action(description='Mark selected orders as Shipped')
    def mark_as_shipped(self, request, queryset):
        for order in queryset:
            order.status = Order.Status.SHIPPED
            order.save()