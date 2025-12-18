from rest_framework import permissions

class IsSellerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object (Seller) to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the product.
        return obj.seller == request.user

class IsSeller(permissions.BasePermission):
    """
    Allows access only to authenticated users with role='SELLER'.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'SELLER')


class IsSellerProfileComplete(permissions.BasePermission):
    """
    Allows access only to sellers whose seller profile is marked as approved/complete.
    This is used to block product uploads when seller hasn't provided bank/KYC details.
    """
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.role == 'SELLER'):
            return False

        profile = getattr(user, 'seller_profile', None)
        # If profile doesn't exist or not approved, deny
        return bool(profile and getattr(profile, 'is_approved', False))