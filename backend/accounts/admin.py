from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SellerProfile, Address

class SellerProfileInline(admin.StackedInline):
    model = SellerProfile
    can_delete = False
    verbose_name_plural = 'Seller Profile'

class CustomUserAdmin(UserAdmin):
    # Fieldsets for the Admin Edit Page
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone_number')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'is_verified')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    list_display = ('email', 'first_name', 'role', 'is_staff', 'is_verified')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'first_name', 'phone_number')
    ordering = ('email',)
    
    # Inlines allow editing Seller Profile directly inside User page
    inlines = [SellerProfileInline]

admin.site.register(User, CustomUserAdmin)
admin.site.register(Address)
admin.site.register(SellerProfile)