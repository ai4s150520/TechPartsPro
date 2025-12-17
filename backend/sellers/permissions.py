from rest_framework import permissions

class IsSeller(permissions.BasePermission):
    """
    Allows access only to authenticated users with role='SELLER'.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'SELLER')

class IsOwner(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to see it.
    """
    def has_object_permission(self, request, view, obj):
        return obj.seller == request.user