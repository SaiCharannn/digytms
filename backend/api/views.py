from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.hashers import make_password

from users.models import User, UserDesignation
from .serializers import (
    SuperAdminCreateSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    CreateUserSerializer,
    RegisterStudentSerializer,
)
from .permissions import IsSetupTokenValid, IsSuperAdmin
from .auth import SamcommJWTAuthentication


def _make_tokens(user: User) -> dict:
    refresh = RefreshToken()
    refresh["user_id"] = user.user_id
    refresh["institution_id"] = user.institution_id
    refresh["is_super_admin"] = user.is_super_admin
    refresh["designation"] = user.user_designation
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


# ── Setup: Check if super admin exists ────────────────────────────────────────
class SuperAdminStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        exists = User.objects.filter(is_super_admin=True, user_status="Active").exists()
        return Response({"superAdminExists": exists})


# ── Setup: Create super admin ─────────────────────────────────────────────────
class SuperAdminCreateView(APIView):
    permission_classes = [IsSetupTokenValid]

    def post(self, request):
        # Block if active super admin already exists
        if User.objects.filter(is_super_admin=True, user_status="Active").exists():
            return Response(
                {"success": False, "message": "A Super Admin already exists. Setup is locked."},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = SuperAdminCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "message": "Validation failed.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = serializer.save()
        return Response(
            {
                "success": True,
                "message": "Super Admin created successfully.",
                "data": {
                    "institutionId": user.institution_id,
                    "userId": user.user_id,
                    "userName": user.user_name,
                    "emailId": user.email_id,
                },
            },
            status=status.HTTP_201_CREATED,
        )


# ── Validate institution ID uniqueness ────────────────────────────────────────
class ValidateInstitutionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, institution_id):
        exists = User.objects.filter(institution_id=institution_id).exists()
        if exists:
            return Response({"available": False, "message": "ID already exists."})
        return Response({"available": True})


# ── Login ─────────────────────────────────────────────────────────────────────
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "message": "Invalid credentials.", "errors": serializer.errors},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user: User = serializer.validated_data["user"]
        tokens = _make_tokens(user)

        if user.password_reset_flag:
            return Response({
                "success": True,
                "forcePasswordChange": True,
                "message": "Password change required.",
                "tempToken": tokens["access"],
                "refreshToken": tokens["refresh"],
                "user": {
                    "userId": user.user_id,
                    "userName": user.user_name,
                    "designation": user.user_designation,
                    "isSuperAdmin": user.is_super_admin,
                    "institutionId": user.institution_id,
                },
            })

        return Response({
            "success": True,
            "forcePasswordChange": False,
            "accessToken": tokens["access"],
            "refreshToken": tokens["refresh"],
            "user": {
                "userId": user.user_id,
                "userName": user.user_name,
                "designation": user.user_designation,
                "isSuperAdmin": user.is_super_admin,
                "institutionId": user.institution_id,
            },
        })


# ── Change Password ───────────────────────────────────────────────────────────
class ChangePasswordView(APIView):
    authentication_classes = [SamcommJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user: User = request._samcomm_user
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        now = timezone.now()
        user.password = make_password(serializer.validated_data["newPassword"])
        user.password_reset_flag = False
        user.password_cr_date = now
        user.password_expiry_date = now + timedelta(days=90)
        user.mod_by = user.user_id
        user.mod_date_time = now
        user.save()

        tokens = _make_tokens(user)
        return Response({
            "success": True,
            "message": "Password changed successfully.",
            "accessToken": tokens["access"],
            "refreshToken": tokens["refresh"],
        })


# ── Create User (by SuperAdmin) ───────────────────────────────────────────────
class CreateUserView(APIView):
    authentication_classes = [SamcommJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request_user: User = request._samcomm_user
        if not request_user.is_super_admin:
            return Response({"success": False, "message": "Forbidden."}, status=403)

        # Check duplicate user_id within institution
        user_id = request.data.get("userId", "")
        if User.objects.filter(institution_id=request_user.institution_id, user_id=user_id).exists():
            return Response(
                {"success": False, "message": "User ID already exists in this institution."},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = CreateUserSerializer(data=request.data, context={"request_user": request_user})
        if not serializer.is_valid():
            return Response(
                {"success": False, "message": "Validation failed.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = serializer.save()
        return Response({
            "success": True,
            "message": f"User '{user.user_name}' created successfully.",
            "data": {
                "userId": user.user_id,
                "userName": user.user_name,
                "designation": user.user_designation,
                "emailId": user.email_id,
            },
        }, status=status.HTTP_201_CREATED)

    def get(self, request):
        """List all users in the institution."""
        request_user: User = request._samcomm_user
        if not request_user.is_super_admin:
            return Response({"success": False, "message": "Forbidden."}, status=403)

        users = User.objects.filter(
            institution_id=request_user.institution_id
        ).exclude(user_id="superadmin").values(
            "user_id", "user_name", "user_designation", "email_id",
            "mobile_number", "user_status", "cr_date_time"
        )
        return Response({"success": True, "data": list(users)})


# ── Roles List ─────────────────────────────────────────────────────────────────
class RolesListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        roles = [
            {"value": choice[0], "label": choice[1]}
            for choice in UserDesignation.choices
            if choice[0] != "SUPERADMIN"
        ]
        return Response({"success": True, "roles": roles})


# ── Register Student (public) ─────────────────────────────────────────────────
class RegisterStudentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterStudentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "message": "Validation failed.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user, student_id = serializer.save()
        return Response({
            "success": True,
            "message": "Student registered successfully.",
            "studentId": student_id,
        }, status=status.HTTP_201_CREATED)


# ── Me (current user profile) ─────────────────────────────────────────────────
class MeView(APIView):
    authentication_classes = [SamcommJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user: User = request._samcomm_user
        return Response({
            "userId": user.user_id,
            "userName": user.user_name,
            "designation": user.user_designation,
            "isSuperAdmin": user.is_super_admin,
            "institutionId": user.institution_id,
            "institutionName": user.institution_name,
            "emailId": user.email_id,
            "mobileNumber": user.mobile_number,
            "userStatus": user.user_status,
        })
