from django.contrib import admin
from .models import ShippingZone, ShippingMethod, Shipment

class ShippingMethodInline(admin.TabularInline):
    model = ShippingMethod
    extra = 1

@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'countries')
    search_fields = ('name', 'regions')
    inlines = [ShippingMethodInline]

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('tracking_number', 'order', 'carrier_name', 'status', 'estimated_arrival')
    list_filter = ('status', 'carrier_name')
    search_fields = ('tracking_number', 'order__order_id')