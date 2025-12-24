from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Avg, Sum, Q
from django.contrib.auth import get_user_model
from accounts.models import SellerProfile
from orders.models import OrderItem
from reviews.models import Review
from django.shortcuts import get_object_or_404
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def top_sellers(request):
    """Get top selling sellers with customer satisfaction metrics"""
    
    # Get sellers with completed orders and high ratings
    top_sellers = User.objects.filter(
        role='SELLER',
        is_active=True,
        seller_profile__is_approved=True,
        sold_items__status='DELIVERED'
    ).annotate(
        total_sales=Count('sold_items', filter=Q(sold_items__status='DELIVERED')),
        total_revenue=Sum('sold_items__price', filter=Q(sold_items__status='DELIVERED')),
        avg_rating=Avg('products__reviews__rating'),
        total_reviews=Count('products__reviews', distinct=True)
    ).filter(
        total_sales__gte=10,  # Minimum 10 sales
        avg_rating__gte=4.5,  # Minimum 4.5 rating
        total_reviews__gte=5  # Minimum 5 reviews
    ).order_by('-total_sales')[:6]  # Top 6 sellers
    
    sellers_data = []
    for seller in top_sellers:
        try:
            profile = seller.seller_profile
            sellers_data.append({
                'id': seller.id,
                'business_name': profile.business_name,
                'city': profile.city or 'India',
                'total_sales': seller.total_sales,
                'avg_rating': round(seller.avg_rating or 0, 1),
                'total_reviews': seller.total_reviews,
                'satisfaction_rate': min(100, round((seller.avg_rating or 0) * 20, 0)),  # Convert 5-star to percentage
                'badge': get_seller_badge(seller.total_sales, seller.avg_rating or 0)
            })
        except:
            continue
    
    return Response(sellers_data)

def get_seller_badge(sales, rating):
    """Determine seller badge based on performance"""
    if sales >= 100 and rating >= 4.8:
        return {'name': 'Top Seller', 'color': 'gold', 'icon': '👑'}
    elif sales >= 50 and rating >= 4.5:
        return {'name': 'Trusted Seller', 'color': 'blue', 'icon': '⭐'}
    elif sales >= 25 and rating >= 4.0:
        return {'name': 'Rising Star', 'color': 'green', 'icon': '🌟'}
    else:
        return {'name': 'Verified', 'color': 'gray', 'icon': '✓'}

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def seller_profile(request):
    """Get or update seller profile"""
    if request.user.role != 'SELLER':
        return Response({'error': 'Only sellers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    profile, created = SellerProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        # Mask sensitive data for display
        aadhaar_masked = ''
        if profile.aadhaar_number:
            aadhaar = profile.aadhaar_number
            aadhaar_masked = f"XXXX-XXXX-{aadhaar[-4:]}" if len(aadhaar) == 12 else ''
        
        data = {
            'business_name': profile.business_name,
            'business_email': profile.business_email,
            'business_phone': profile.business_phone,
            'warehouse_address': profile.warehouse_address,
            'gst_number': profile.gst_number,
            'pan_number': profile.pan_number,
            'bank_account_number': profile.bank_account_number,
            'bank_ifsc_code': profile.bank_ifsc_code,
            'bank_account_holder_name': profile.bank_account_holder_name,
            'bank_name': profile.bank_name,
            'pan_holder_name': profile.pan_holder_name,
            'aadhaar_verified': profile.aadhaar_verified,
            'aadhaar_masked': aadhaar_masked,
            'pan_verified': profile.pan_verified,
            'is_approved': profile.is_approved,
        }
        return Response(data)
    
    elif request.method == 'PATCH':
        # Update profile fields
        allowed_fields = [
            'business_name', 'business_email', 'business_phone', 'warehouse_address',
            'gst_number', 'pan_number', 'bank_account_number', 'bank_ifsc_code',
            'bank_account_holder_name', 'bank_name', 'pan_holder_name', 'aadhaar_number'
        ]
        
        errors = {}
        
        for field in allowed_fields:
            if field in request.data:
                value = request.data[field]
                try:
                    setattr(profile, field, value)
                except Exception as e:
                    errors[field] = str(e)
        
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            profile.save()
            return Response({'message': 'Profile updated successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_orders(request):
    """Get orders for the seller"""
    if request.user.role != 'SELLER':
        return Response({'error': 'Only sellers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Get order items where this user is the seller
        order_items = OrderItem.objects.filter(
            seller=request.user
        ).select_related(
            'order', 'product'
        ).order_by('-order__created_at')
        
        logger.info(f"Found {order_items.count()} order items for seller {request.user.id}")
        
        # Format response
        items_data = []
        for item in order_items:
            items_data.append({
                'id': str(item.id),
                'order_id': item.order.order_id,
                'order_date': item.order.created_at,
                'product_name': item.product_name,
                'quantity': item.quantity,
                'price': str(item.price),
                'status': item.status,
                'customer_name': item.order.user.get_full_name() or item.order.user.email,
            })
        
        return Response({'results': items_data})
        
    except Exception as e:
        logger.error(f"Seller orders error: {str(e)}")
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_customer_addresses(request, item_id):
    """Get customer addresses for an order item"""
    if request.user.role != 'SELLER':
        return Response({'error': 'Only sellers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Get the order item and verify seller owns it
        order_item = OrderItem.objects.select_related('order__user').get(
            id=item_id, 
            seller=request.user
        )
        
        # Get customer's addresses
        from accounts.models import Address
        addresses = Address.objects.filter(user=order_item.order.user)
        
        addresses_data = []
        for addr in addresses:
            addresses_data.append({
                'id': addr.id,
                'full_name': addr.full_name,
                'phone_number': addr.phone_number,
                'street_address': addr.street_address,
                'city': addr.city,
                'state': addr.state,
                'postal_code': addr.postal_code,
                'country': addr.country,
                'is_default': addr.is_default
            })
        
        return Response(addresses_data)
        
    except OrderItem.DoesNotExist:
        return Response({'error': 'Order item not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Get customer addresses error: {str(e)}")
        return Response({'error': 'Failed to fetch addresses'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)