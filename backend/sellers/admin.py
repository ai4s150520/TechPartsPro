from django.contrib import admin
from django.utils.html import format_html
from .models import Payout
from .payout_service import RazorpayPayoutService

@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ['id', 'seller_email', 'amount', 'status', 'created_at', 'payout_actions']
    list_filter = ['status', 'created_at']
    search_fields = ['seller__email', 'transaction_reference', 'razorpay_payout_id']
    readonly_fields = ['seller', 'amount', 'bank_details_snapshot', 'created_at', 'razorpay_payout_id', 'utr_number']
    
    fieldsets = (
        ('Payout Information', {
            'fields': ('seller', 'amount', 'bank_details_snapshot', 'status')
        }),
        ('Razorpay Details', {
            'fields': ('razorpay_payout_id', 'utr_number')
        }),
        ('Admin Actions', {
            'fields': ('transaction_reference', 'admin_note')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def seller_email(self, obj):
        return obj.seller.email
    seller_email.short_description = 'Seller'
    
    def payout_actions(self, obj):
        if obj.status == 'REQUESTED':
            return format_html(
                '<a class="button" href="/admin/sellers/payout/{}/approve/">Approve & Pay</a>',
                obj.pk
            )
        elif obj.status == 'PROCESSING':
            return format_html('<span style="color: orange;">Processing...</span>')
        elif obj.status == 'PAID':
            return format_html('<span style="color: green;">✓ Paid</span>')
        return '-'
    payout_actions.short_description = 'Actions'
    
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('<int:payout_id>/approve/', self.admin_site.admin_view(self.approve_payout), name='approve-payout'),
        ]
        return custom_urls + urls
    
    def approve_payout(self, request, payout_id):
        from django.shortcuts import redirect
        from django.contrib import messages
        
        payout = Payout.objects.get(pk=payout_id)
        seller_profile = payout.seller.seller_profile
        
        # Check if bank details exist
        if not seller_profile.bank_account_number or not seller_profile.bank_ifsc_code:
            messages.error(request, 'Seller bank details are missing. Cannot process payout.')
            return redirect('..')
        
        try:
            payout_service = RazorpayPayoutService()
            
            # Step 1: Create contact if not exists
            if not seller_profile.razorpay_contact_id:
                contact_id = payout_service.create_contact(seller_profile)
                seller_profile.razorpay_contact_id = contact_id
                seller_profile.save()
            
            # Step 2: Create fund account if not exists
            if not seller_profile.razorpay_fund_account_id:
                bank_details = {
                    'account_number': seller_profile.bank_account_number,
                    'ifsc': seller_profile.bank_ifsc_code,
                    'name': seller_profile.bank_account_holder_name or seller_profile.business_name
                }
                fund_account_id = payout_service.create_fund_account(
                    seller_profile.razorpay_contact_id,
                    bank_details
                )
                seller_profile.razorpay_fund_account_id = fund_account_id
                seller_profile.save()
            
            # Step 3: Create payout
            result = payout_service.create_payout(
                seller_profile.razorpay_fund_account_id,
                payout.amount,
                payout.id
            )
            
            if result['success']:
                payout.status = 'PROCESSING'
                payout.razorpay_payout_id = result['payout_id']
                payout.utr_number = result.get('utr', '')
                payout.save()
                messages.success(request, f'Payout initiated successfully! Razorpay Payout ID: {result["payout_id"]}')
            else:
                messages.error(request, f'Payout failed: {result["error"]}')
        
        except Exception as e:
            messages.error(request, f'Error processing payout: {str(e)}')
        
        return redirect('..')
