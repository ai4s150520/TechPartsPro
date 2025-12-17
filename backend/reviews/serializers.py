from rest_framework import serializers
from .models import Review, ReviewImage

class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['id', 'image']

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.first_name')
    images = ReviewImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )

    class Meta:
        model = Review
        fields = [
            'id', 'user_name', 'product', 'rating', 'title', 'comment', 
            'is_verified_purchase', 'helpful_count', 'created_at', 
            'images', 'uploaded_images'
        ]
        read_only_fields = ['is_verified_purchase', 'helpful_count']

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        review = Review.objects.create(**validated_data)
        
        for img in uploaded_images:
            ReviewImage.objects.create(review=review, image=img)
            
        return review