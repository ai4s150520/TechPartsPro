from rest_framework import generics, views, permissions, status
from rest_framework.response import Response
from .models import WishlistItem
from .serializers import WishlistItemSerializer, WishlistToggleSerializer
from catalog.models import Product

class WishlistListView(generics.ListAPIView):
    """
    GET: List all items in the logged-in user's wishlist.
    """
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        # Select related optimizations for performance
        return WishlistItem.objects.filter(user=self.request.user).select_related('product')

class WishlistToggleView(views.APIView):
    """
    POST: Add or Remove item.
    Input: { "product_id": 123 }
    Output: { "status": "added" | "removed", "wishlist_count": 5 }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WishlistToggleSerializer(data=request.data)
        if serializer.is_valid():
            product_id = serializer.validated_data['product_id']
            user = request.user
            
            # Check if exists
            item = WishlistItem.objects.filter(user=user, product_id=product_id).first()
            
            if item:
                # Logic: If it exists, remove it (Toggle Off)
                item.delete()
                action = "removed"
            else:
                # Logic: If not, create it (Toggle On)
                WishlistItem.objects.create(user=user, product_id=product_id)
                action = "added"
            
            # Return current count for updating UI badges
            current_count = WishlistItem.objects.filter(user=user).count()
            
            return Response({
                "status": "success",
                "action": action,
                "wishlist_count": current_count
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CheckItemStatusView(views.APIView):
    """
    GET: Check if specific product is in wishlist (for coloring the Heart icon).
    URL: /api/wishlist/check/123/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, product_id):
        exists = WishlistItem.objects.filter(user=request.user, product_id=product_id).exists()
        return Response({"is_wishlisted": exists})