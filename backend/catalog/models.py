from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from django.core.exceptions import ValidationError
from decimal import Decimal

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class DeviceModel(models.Model):
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='devices')
    name = models.CharField(max_length=100)
    model_number = models.CharField(max_length=100, help_text="e.g., A2638, SM-S908B")
    release_year = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('brand', 'name')
        ordering = ['brand', 'name']

    def __str__(self):
        return f"{self.brand.name} {self.name}"

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    image = models.ImageField(upload_to='categories/', blank=True, null=True)

    class Meta:
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        full_path = [self.name]
        k = self.parent
        while k is not None:
            full_path.append(k.name)
            k = k.parent
        return ' -> '.join(full_path[::-1])

class Product(models.Model):
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    brand = models.ForeignKey('Brand', on_delete=models.SET_NULL, null=True, blank=True, related_name='product_listings')
    
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    sku = models.CharField(max_length=50, unique=True, help_text="Stock Keeping Unit")
    description = models.TextField()
    
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], help_text="Maximum Retail Price (MRP)")
    
    discount_percentage = models.PositiveIntegerField(default=0, validators=[MaxValueValidator(99)])
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)

    stock_quantity = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    review_count = models.PositiveIntegerField(default=0)
    
    compatible_devices = models.ManyToManyField(DeviceModel, related_name='compatible_parts', blank=True)
    specifications = models.JSONField(default=dict, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['brand', 'is_active']),
            models.Index(fields=['seller', 'is_active']),
            models.Index(fields=['-created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            self.slug = f"{base_slug}-{slugify(self.sku)}"

        if self.discount_percentage > 0:
            discount_amount = (self.price * Decimal(self.discount_percentage)) / Decimal(100)
            self.discount_price = self.price - discount_amount
        else:
            self.discount_price = None

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Soft delete implementation"""
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save()

    @property
    def selling_price(self):
        return self.discount_price if self.discount_price else self.price

    @property
    def tax_amount(self):
        """Calculate GST amount on selling price"""
        price = self.selling_price
        return (price * self.tax_rate) / 100

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(
        upload_to='products/',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp'])]
    )
    is_feature = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.image and self.image.size > 5 * 1024 * 1024:  # 5MB
            raise ValidationError("Image size cannot exceed 5MB")

    def __str__(self):
        return f"Image for {self.product.name}"