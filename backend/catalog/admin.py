from django.contrib import admin
from .models import Brand, DeviceModel, Category, Product, ProductImage

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'price', 'stock_quantity', 'seller', 'is_active')
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('name', 'sku', 'seller__email')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]
    
    # This caused the error. Now fixed because CategoryAdmin has search_fields.
    autocomplete_fields = ['compatible_devices', 'seller', 'category'] 
    
@admin.register(DeviceModel)
class DeviceModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'model_number')
    search_fields = ('name', 'model_number')
    list_filter = ('brand',)

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',) # Added for good measure

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name'] # <--- THIS FIXES YOUR ERROR