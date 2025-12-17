from rest_framework import status, permissions, views, generics
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from catalog.models import Product
from coupons.models import Coupon

class CartAPIView(views.APIView):
    """
    GET: Retrieve the authenticated user's cart.
    DELETE: Clear the cart.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartSerializer

    def get_cart(self, request):
        # Get or Create a cart for the logged-in user
        cart, created = Cart.objects.prefetch_related('items__product').get_or_create(user=request.user)
        return cart

    def get(self, request):
        cart = self.get_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def delete(self, request):
        cart = self.get_cart(request)
        cart.items.all().delete()
        cart.coupon = None # Also clear coupon on empty
        cart.save()
        return Response({"message": "Cart cleared successfully"}, status=status.HTTP_204_NO_CONTENT)


class AddToCartView(views.APIView):
    """
    POST: Add an item to the cart or increment quantity if it exists.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartSerializer

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        
        # Validation 1: Check inputs
        if not product_id:
            return Response({"error": "product_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            quantity = int(quantity)
            if quantity < 1:
                return Response({"error": "Quantity must be at least 1"}, status=status.HTTP_400_BAD_REQUEST)
            if quantity > 100:
                return Response({"error": "Maximum quantity is 100"}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({"error": "Invalid quantity"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                product = Product.objects.select_for_update().get(id=product_id)
                
                # Validation 2: Check product is active and not deleted
                if not product.is_active or product.is_deleted:
                    return Response(
                        {"error": "This product is no longer available"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Validation 3: Check seller is approved
                if hasattr(product.seller, 'seller_profile'):
                    if not product.seller.seller_profile.is_approved:
                        return Response(
                            {"error": "This seller is not approved"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )

                # Logic: Check if item already in cart
                cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)

                if not created:
                    # If exists, increment quantity
                    cart_item.quantity += quantity
                else:
                    cart_item.quantity = quantity

                # Validation 4: Stock Check
                if product.stock_quantity == 0:
                    return Response(
                        {"error": "This product is out of stock"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if cart_item.quantity > product.stock_quantity:
                    return Response(
                        {"error": f"Only {product.stock_quantity} units available in stock"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

                cart_item.save()
        
            # Return updated cart with prefetched items
            cart = Cart.objects.prefetch_related('items__product').get(id=cart.id)
            serializer = CartSerializer(cart)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)


class UpdateCartItemView(views.APIView):
    """
    PATCH: Update quantity of a specific cart item.
    DELETE: Remove a specific item.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartItemSerializer

    def patch(self, request, item_id):
        # Ensure user owns this cart item
        cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
        
        quantity = int(request.data.get('quantity', 1))
        
        if quantity < 1:
            # If quantity 0, delete it
            cart_item.delete()
        else:
            with transaction.atomic():
                product = Product.objects.select_for_update().get(id=cart_item.product.id)
                # Stock Check
                if quantity > product.stock_quantity:
                    return Response(
                         {"error": f"Max limit reached. Only {product.stock_quantity} in stock."},
                         status=status.HTTP_400_BAD_REQUEST
                    )
                cart_item.quantity = quantity
                cart_item.save()

        # Return full updated cart for UI sync with prefetched items
        cart = Cart.objects.prefetch_related('items__product').get(id=cart_item.cart.id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def delete(self, request, item_id):
        cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
        cart = cart_item.cart
        cart_item.delete()
        
        # Return cart with prefetched items
        cart = Cart.objects.prefetch_related('items__product').get(id=cart.id)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class ApplyCouponView(views.APIView):
    """
    POST: Apply a coupon code to the cart.
    Payload: { "code": "SUMMER20" }
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartSerializer

    def post(self, request):
        code = request.data.get('code')
        cart, _ = Cart.objects.get_or_create(user=request.user)
        
        # If no code provided, remove coupon
        if not code:
            cart.coupon = None
            cart.save()
            return Response(CartSerializer(cart).data)

        try:
            coupon = Coupon.objects.get(code=code)
            
            # 1. Check Active Status
            if not coupon.active:
                return Response({"error": "This coupon is inactive"}, status=status.HTTP_400_BAD_REQUEST)
            
            # 2. Check Expiry
            now = timezone.now()
            if now < coupon.valid_from:
                return Response({"error": "Coupon is not valid yet"}, status=status.HTTP_400_BAD_REQUEST)
            if now > coupon.valid_to:
                return Response({"error": "Coupon has expired"}, status=status.HTTP_400_BAD_REQUEST)
            
            # 3. Check Minimum Purchase
            # Note: total_price property on Cart should calculate raw total before discount
            if cart.total_price < coupon.min_purchase_amount:
                return Response(
                    {"error": f"Minimum purchase of ₹{coupon.min_purchase_amount} required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Apply Logic
            cart.coupon = coupon
            cart.save()
            
            # Calculate discount amount for immediate feedback
            discount_amount = coupon.get_discount_amount(cart.total_price)
            
            # Return cart with prefetched items
            cart = Cart.objects.prefetch_related('items__product').get(id=cart.id)
            
            return Response({
                "message": "Coupon Applied Successfully",
                "discount_amount": discount_amount,
                "code": coupon.code,
                "cart": CartSerializer(cart).data
            }, status=status.HTTP_200_OK)

        except Coupon.DoesNotExist:
            return Response({"error": "Invalid Coupon Code"}, status=status.HTTP_404_NOT_FOUND)