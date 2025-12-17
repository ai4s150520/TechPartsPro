from .models import ShippingZone, ShippingMethod

class ShippingCalculator:
    @staticmethod
    def identify_zone(pincode, country='IN'):
        """
        Logic to match a user's address to a Shipping Zone.
        In a real app, this matches Pincode Prefixes.
        """
        # 1. Try to find a zone that specifically mentions this pincode prefix
        prefix = str(pincode)[:3]
        
        # Simple lookup logic (can be made complex with Regex)
        zones = ShippingZone.objects.filter(countries__contains=country)
        
        for zone in zones:
            if prefix in zone.regions:
                return zone
        
        # Fallback to a "Default" or "National" zone
        return ShippingZone.objects.filter(name="National").first()

    @staticmethod
    def get_rates(pincode, weight_kg):
        zone = ShippingCalculator.identify_zone(pincode)
        if not zone:
            return []
            
        methods = ShippingMethod.objects.filter(zone=zone, is_active=True)
        return methods