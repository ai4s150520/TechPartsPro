from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('payment_id', 'order', 'user', 'amount', 'status', 'created_at')
    list_filter = ('status', 'provider', 'created_at')
    search_fields = ('payment_id', 'order__order_id', 'user__email')
    readonly_fields = ('gateway_response', 'created_at')
    
    def has_add_permission(self, request):
        return False # Transactions should only be created by code