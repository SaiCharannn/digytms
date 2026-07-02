"""
Custom JWT authentication that resolves our custom User model.

Problem: DRF's IsAuthenticated checks request.user.is_authenticated
but our User extends models.Model, not AbstractUser, so it has
no is_authenticated attribute → AttributeError → 500.

Solution: Wrap our User in an AuthenticatedUserProxy that satisfies
DRF's interface, while still exposing all our User fields.
request._samcomm_user always holds the real User ORM object.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from users.models import User


class AuthenticatedUserProxy:
    """
    Thin wrapper around our custom User model.
    Satisfies DRF's permission system (is_authenticated, is_active)
    while proxying all attribute access to the real User instance.
    """
    # DRF checks these two attributes on request.user
    is_authenticated = True
    is_active = True

    def __init__(self, user: User):
        self._user = user

    def __getattr__(self, name):
        # Proxy every attribute lookup to the real User model instance
        return getattr(self._user, name)

    def __repr__(self):
        return f"<AuthenticatedUserProxy: {self._user}>"


class SamcommJWTAuthentication(JWTAuthentication):

    def get_user(self, validated_token):
        try:
            user_id = validated_token["user_id"]
            institution_id = validated_token["institution_id"]
            user = User.objects.get(user_id=user_id, institution_id=institution_id)
        except (KeyError, User.DoesNotExist):
            raise InvalidToken("Token contains invalid user reference.")
        return user

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, token = result  # user is our real User ORM object

        # Attach real User to request for our own permission classes & views
        request._samcomm_user = user

        # Return proxy so DRF's IsAuthenticated passes without crashing
        return AuthenticatedUserProxy(user), token
