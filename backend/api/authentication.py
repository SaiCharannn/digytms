from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from users.models import User

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            user_id = validated_token['user_id']  
        except KeyError:
            raise InvalidToken('No user_id in token')

        try:
            return User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            raise InvalidToken('No user found for this token')