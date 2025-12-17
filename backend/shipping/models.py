from django.db import models
from django.conf import settings
from orders.models import Order

class ShippingZone(models.Model):
    """
    Defines regions for shipping logic.
    e.g., "Zone A (Metro)", "Zone B (Rest of India)", "International"
    """
    name = models.CharField(max_length=100)
    countries = models.CharField(max_length=255, default='India', help_text="Comma-separated country codes (IN, US)")
    regions = models.TextField(help_text="Comma-separated states or pincode prefixes (e.g., 110, 400)", blank=True)
    
    def __str__(self):
        return self.name

class ShippingMethod(models.Model):
    """
    Available services: Standard, Express, Same Day.
    Linked to Zones to allow different pricing per region.
    """
    zone = models.ForeignKey(ShippingZone, on_delete=models.CASCADE, related_name='methods')
    name = models.CharField(max_length=100) # e.g. "FedEx Express"
    
    # Cost Logic
    base_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cost_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    estimated_delivery_days_min = models.IntegerField(default=3)
    estimated_delivery_days_max = models.IntegerField(default=5)
    
    is_active = models.BooleanField(default=True)

    def calculate_price(self, weight_in_kg):
        """
        Industry Logic: Base Cost + (Weight * Cost Per KG)
        """
        total = float(self.base_cost) + (float(weight_in_kg) * float(self.cost_per_kg))
        return round(total, 2)

    def __str__(self):
        return f"{self.name} ({self.zone.name})"

class Shipment(models.Model):
    """
    Represents a physical package sent for an Order.
    """
    STATUS_CHOICES = (
        ('PRE_TRANSIT', 'Label Created'),
        ('IN_TRANSIT', 'In Transit'),
        ('OUT_FOR_DELIVERY', 'Out for Delivery'),
        ('DELIVERED', 'Delivered'),
        ('FAILURE', 'Delivery Failed'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='shipments')
    shipping_method = models.ForeignKey(ShippingMethod, on_delete=models.SET_NULL, null=True)
    
    tracking_number = models.CharField(max_length=100, unique=True)
    carrier_name = models.CharField(max_length=100) # e.g. Bluedart, DHL
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PRE_TRANSIT')
    shipped_at = models.DateTimeField(auto_now_add=True)
    estimated_arrival = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.carrier_name} - {self.tracking_number}"