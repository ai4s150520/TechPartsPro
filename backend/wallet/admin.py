from django.contrib import admin
from .models import Wallet, WalletTransaction, Withdrawal

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'is_active', 'is_locked', 'created_at']
    list_filter = ['is_active', 'is_locked', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'transaction_type', 'source', 'amount', 'balance_after', 'created_at']
    list_filter = ['transaction_type', 'source', 'created_at']
    search_fields = ['wallet__user__email', 'description']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'

@admin.register(Withdrawal)
class WithdrawalAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'amount', 'status', 'requested_at', 'processed_at']
    list_filter = ['status', 'requested_at']
    search_fields = ['wallet__user__email', 'razorpay_payout_id', 'utr_number']
    readonly_fields = ['requested_at']
    
    fieldsets = (
        ('Withdrawal Info', {
            'fields': ('wallet', 'amount', 'status')
        }),
        ('Bank Details', {
            'fields': ('bank_account_number', 'bank_ifsc_code', 'bank_account_holder', 'bank_name')
        }),
        ('Razorpay Details', {
            'fields': ('razorpay_payout_id', 'utr_number')
        }),
        ('Admin', {
            'fields': ('rejection_reason', 'admin_note')
        }),
        ('Timestamps', {
            'fields': ('requested_at', 'processed_at')
        }),
    )
