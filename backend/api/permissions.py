from django.conf import settings
from rest_framework.permissions import BasePermission
from users.models import User


class IsSetupTokenValid(BasePermission):
    """Allows access only if the correct setup token is provided in the header."""
    def has_permission(self, request, view):
        token = request.headers.get("X-Setup-Token", "")
        return token == settings.SETUP_TOKEN


class IsSuperAdmin(BasePermission):
    """Allows access only to authenticated super admins."""
    def has_permission(self, request, view):
        if not hasattr(request, "_samcomm_user"):
            return False
        return request._samcomm_user.is_super_admin and request._samcomm_user.user_status == "Active"
