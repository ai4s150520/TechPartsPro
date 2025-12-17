from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """ Allows access only to Superusers/Admins """
    def has_permission(self, request, view):
        return request.user and request.user.role == 'ADMIN'

class IsSellerUser(permissions.BasePermission):
    """ Allows access only to Sellers """
    def has_permission(self, request, view):
        return request.user and request.user.role == 'SELLER'