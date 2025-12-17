from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from .models import Review, ReviewVote
from .serializers import ReviewSerializer
from orders.models import Order
from catalog.models import Product

class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        # Filter reviews by product if 'product_id' is in URL
        queryset = Review.objects.select_related('user').prefetch_related('images')
        product_slug = self.request.query_params.get('product_slug')
        if product_slug:
            queryset = queryset.filter(product__slug=product_slug)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        product = serializer.validated_data['product']

        # 1. Spam Check: User can only review once per product
        if Review.objects.filter(user=user, product=product).exists():
            raise ValidationError("You have already reviewed this product.")

        # 2. Verified Purchase Logic
        # Check if user has a DELIVERED order containing this product
        is_verified = Order.objects.filter(
            user=user, 
            items__product=product, 
            status='DELIVERED'
        ).exists()

        serializer.save(user=user, is_verified_purchase=is_verified)


class MarkHelpfulView(views.APIView):
    """
    POST: Toggle 'Helpful' vote on a review.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        review = get_object_or_404(Review, id=pk)
        user = request.user

        vote, created = ReviewVote.objects.get_or_create(user=user, review=review)

        if not created:
            # If already voted, remove vote (Toggle)
            vote.delete()
            review.helpful_count = max(0, review.helpful_count - 1)
            action = "removed"
        else:
            # Add vote
            review.helpful_count += 1
            action = "added"
        
        review.save()
        return Response({"status": "success", "action": action, "count": review.helpful_count})