from rest_framework import serializers
from .models import Brand, DeviceModel, Category, Product, ProductImage

# --- HELPER SERIALIZERS ---
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class DeviceModelSerializer(serializers.ModelSerializer):
    brand_name = serializers.ReadOnlyField(source='brand.name')
    class Meta:
        model = DeviceModel
        fields = ['id', 'brand_name', 'name', 'model_number']

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'product_count']
    
    def get_product_count(self, obj):
        return obj.products.filter(is_active=True, is_deleted=False).count()

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_feature']

# --- PRODUCT SERIALIZERS ---

class ProductListSerializer(serializers.ModelSerializer):
    """ Lightweight serializer for cards on the grid page """
    feature_image = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source='category.name')
    brand_name = serializers.ReadOnlyField(source='brand.name')
    tax_amount = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'price', 'discount_price', 'discount_percentage',
            'category_name', 'brand_name', 'stock_quantity', 'feature_image', 
            'tax_rate', 'tax_amount'
        ]

    def get_feature_image(self, obj):
        img = obj.images.filter(is_feature=True).first()
        if not img:
            img = obj.images.first()
        return img.image.url if img else None

class ProductDetailSerializer(serializers.ModelSerializer):
    """ Heavy serializer for the single product page """
    images = ProductImageSerializer(many=True, read_only=True)
    compatible_devices = DeviceModelSerializer(many=True, read_only=True)
    
    # --- FIX #5: ADDED MISSING BRAND & CATEGORY NAMES ---
    brand_name = serializers.ReadOnlyField(source='brand.name')
    category_name = serializers.ReadOnlyField(source='category.name')
    
    # --- SELLER INFO ---
    seller_name = serializers.ReadOnlyField(source='seller.seller_profile.business_name')
    seller_location = serializers.ReadOnlyField(source='seller.seller_profile.warehouse_address')
    seller_rating = serializers.ReadOnlyField(source='seller.seller_profile.rating')
    seller_joined = serializers.ReadOnlyField(source='seller.date_joined')
    
    # --- SEO DATA ---
    seo_data = serializers.SerializerMethodField()
    structured_data = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'description', 'price', 'discount_price',
            'stock_quantity', 'images', 'compatible_devices', 'specifications',
            # Ratings
            'rating', 'review_count',
            # Seller Info
            'seller_name', 'seller_location', 'seller_rating', 'seller_joined',
            # Context Info (The Fix)
            'brand_name', 'category_name',
            # SEO Data
            'seo_data', 'structured_data'
        ]
    
    def get_seo_data(self, obj):
        from seo.services import SEOService
        metadata = SEOService.get_or_create_metadata(obj)
        return {
            'title': metadata.title,
            'description': metadata.description,
            'keywords': metadata.keywords,
            'canonical_url': metadata.canonical_url,
            'og_title': metadata.og_title,
            'og_description': metadata.og_description,
            'og_image': metadata.og_image,
        }
    
    def get_structured_data(self, obj):
        from seo.services import SEOService
        return SEOService.generate_product_structured_data(obj)

class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """ Serializer for Sellers to Add/Edit products """
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False, use_url=False),
        write_only=True,
        required=False
    )
    compatible_devices = serializers.PrimaryKeyRelatedField(
        many=True, queryset=DeviceModel.objects.all(), required=False
    )

    class Meta:
        model = Product
        exclude = ('seller', 'slug', 'created_at', 'updated_at', 'rating', 'review_count')

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        compatible_devices = validated_data.pop('compatible_devices', [])
        
        # Create Product
        product = Product.objects.create(**validated_data)
        
        # Add Many-to-Many relations
        product.compatible_devices.set(compatible_devices)
        
        # Handle Image Uploads
        for img in uploaded_images:
            ProductImage.objects.create(product=product, image=img)
            
        return product