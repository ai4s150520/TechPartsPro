from django_elasticsearch_dsl import Document, fields
from django_elasticsearch_dsl.registries import registry
from .models import Product

@registry.register_document
class ProductDocument(Document):
    category_name = fields.TextField()
    seller_name = fields.TextField()
    
    class Index:
        name = 'products'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0
        }
    
    class Django:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'sku',
            'price',
            'discount_price',
            'stock_quantity',
            'is_active',
        ]
        related_models = ['category', 'seller']
    
    def get_queryset(self):
        return super().get_queryset().select_related('category', 'seller')
    
    def get_instances_from_related(self, related_instance):
        if isinstance(related_instance, Product.category.field.related_model):
            return related_instance.products.all()
