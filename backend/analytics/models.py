from django.db import models
from django.conf import settings

class ProductView(models.Model):
    """
    Tracks how many times a product page is opened.
    Used to calculate 'Click-Through Rate' and 'Conversion Rate'.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='views')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} viewed at {self.timestamp}"

class SearchTerm(models.Model):
    """
    Tracks what users are typing in the search bar.
    Critical for finding 'Demand' vs 'Supply' gaps.
    """
    term = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    result_count = models.IntegerField(default=0) # How many products were found?
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"'{self.term}' ({self.result_count} results)"

class DailyMetric(models.Model):
    """
    Aggregated table. Instead of querying 1 million Order rows every time 
    dashboard loads, a background task (Celery) fills this daily.
    """
    date = models.DateField(unique=True)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_orders = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Metrics for {self.date}"