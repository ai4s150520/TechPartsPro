from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, SellerProfile

@receiver(post_save, sender=User)
def create_seller_profile(sender, instance, created, **kwargs):
    if created and instance.role == User.Roles.SELLER:
        SellerProfile.objects.create(user=instance)