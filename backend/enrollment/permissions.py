from rest_framework.permissions import BasePermission
from users.models import UserDesignation

OPERATOR_ROLES = {
    UserDesignation.SUPER_ADMIN,
    UserDesignation.SYSTEM_ADMINISTRATOR,
    UserDesignation.ADMIN,
}


class IsOperator(BasePermission):
    """
    Grants access to users whose designation is SuperAdmin, SystemAdministrator, or Admin.
    The view must use SamcommJWTAuthentication so request._samcomm_user is populated.
    """
    message = "You must be an institution operator to perform this action."

    def has_permission(self, request, view):
        user = getattr(request, "_samcomm_user", None)
        if user is None:
            return False
        return (
            user.user_status == "Active"
            and user.user_designation in OPERATOR_ROLES
        )
