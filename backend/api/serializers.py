import re
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from users.models import User, UserDesignation, StudentNumberControl
from users.utils import generate_student_id


PASSWORD_REGEX = re.compile(
    r'^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]).{8,20}$'
)
EMAIL_REGEX = re.compile(r'^\S+@\S+\.\S+$')
MOBILE_REGEX = re.compile(r'^[0-9]{10,15}$')


# ── Super Admin ────────────────────────────────────────────────────────────────

class SuperAdminCreateSerializer(serializers.Serializer):
    institutionId = serializers.CharField(max_length=50)
    institutionName = serializers.CharField(max_length=255)
    userName = serializers.CharField(max_length=255)
    userDesignation = serializers.CharField(max_length=100, required=False, allow_blank=True)
    mobileNumber = serializers.CharField(max_length=15, required=False, allow_blank=True)
    emailId = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True)
    confirmPassword = serializers.CharField(write_only=True)

    def validate_institutionId(self, value):
        if not re.match(r'^[A-Za-z0-9]+$', value):
            raise serializers.ValidationError("Institution ID must be alphanumeric.")
        if User.objects.filter(institution_id=value).exists():
            raise serializers.ValidationError("Institution ID already exists.")
        return value

    def validate_mobileNumber(self, value):
        if value and not MOBILE_REGEX.match(value):
            raise serializers.ValidationError("Mobile must be 10–15 digits.")
        return value

    def validate_password(self, value):
        if not PASSWORD_REGEX.match(value):
            raise serializers.ValidationError(
                "Password must be 8–20 chars with at least 1 uppercase and 1 special character."
            )
        return value

    def validate(self, data):
        if data["password"] != data["confirmPassword"]:
            raise serializers.ValidationError({"confirmPassword": "Passwords do not match."})
        return data

    def create(self, validated_data):
        now = timezone.now()
        institution_id = validated_data["institutionId"]
        user = User.objects.create(
            institution_id=institution_id,
            institution_name=validated_data["institutionName"],
            user_id="superadmin",
            user_name=validated_data["userName"],
            user_designation=validated_data.get("userDesignation") or UserDesignation.SUPER_ADMIN,
            mobile_number=validated_data.get("mobileNumber", ""),
            email_id=validated_data["emailId"],
            password=make_password(validated_data["password"]),
            is_super_admin=True,
            password_reset_flag=True,
            password_cr_date=now,
            password_expiry_date=now + timedelta(days=90),
            cr_by="SYSTEM",
            user_status="Active",
        )
        return user


# ── Login ──────────────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    userId = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user_id = data.get("userId", "").strip()
        password = data.get("password", "")

        try:
            user = User.objects.get(user_id=user_id, user_status="Active")
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid credentials.")

        if not check_password(password, user.password):
            raise serializers.ValidationError("Invalid credentials.")

        data["user"] = user
        return data


# ── Change Password ────────────────────────────────────────────────────────────

class ChangePasswordSerializer(serializers.Serializer):
    newPassword = serializers.CharField(write_only=True)
    confirmPassword = serializers.CharField(write_only=True)

    def validate_newPassword(self, value):
        if not PASSWORD_REGEX.match(value):
            raise serializers.ValidationError(
                "Password must be 8–20 chars with at least 1 uppercase and 1 special character."
            )
        return value

    def validate(self, data):
        if data["newPassword"] != data["confirmPassword"]:
            raise serializers.ValidationError({"confirmPassword": "Passwords do not match."})
        return data


# ── Create User (by SuperAdmin) ────────────────────────────────────────────────

class CreateUserSerializer(serializers.Serializer):
    userId = serializers.CharField(max_length=50)
    userName = serializers.CharField(max_length=255)
    userDesignation = serializers.ChoiceField(choices=UserDesignation.choices)
    emailId = serializers.EmailField(max_length=255)
    mobileNumber = serializers.CharField(max_length=15, required=False, allow_blank=True)
    branchId = serializers.CharField(max_length=50, required=False, allow_blank=True)
    branchName = serializers.CharField(max_length=255, required=False, allow_blank=True)
    departmentId = serializers.CharField(max_length=50, required=False, allow_blank=True)
    departmentName = serializers.CharField(max_length=255, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    confirmPassword = serializers.CharField(write_only=True)

    def validate_mobileNumber(self, value):
        if value and not MOBILE_REGEX.match(value):
            raise serializers.ValidationError("Mobile must be 10–15 digits.")
        return value

    def validate_password(self, value):
        if not PASSWORD_REGEX.match(value):
            raise serializers.ValidationError(
                "Password must be 8–20 chars with at least 1 uppercase and 1 special character."
            )
        return value

    def validate(self, data):
        if data["password"] != data["confirmPassword"]:
            raise serializers.ValidationError({"confirmPassword": "Passwords do not match."})
        return data

    def create(self, validated_data):
        request_user = self.context["request_user"]
        now = timezone.now()
        user = User.objects.create(
            institution_id=request_user.institution_id,
            institution_name=request_user.institution_name,
            user_id=validated_data["userId"],
            user_name=validated_data["userName"],
            user_designation=validated_data["userDesignation"],
            email_id=validated_data["emailId"],
            mobile_number=validated_data.get("mobileNumber", ""),
            branch_id=validated_data.get("branchId", ""),
            branch_name=validated_data.get("branchName", ""),
            department_id=validated_data.get("departmentId", ""),
            department_name=validated_data.get("departmentName", ""),
            password=make_password(validated_data["password"]),
            is_super_admin=False,
            password_reset_flag=True,
            password_cr_date=now,
            password_expiry_date=now + timedelta(days=90),
            cr_by=request_user.user_id,
            user_status="Active",
        )
        return user


# ── Register Student ───────────────────────────────────────────────────────────

class RegisterStudentSerializer(serializers.Serializer):
    studentName = serializers.CharField(max_length=255)
    emailId = serializers.EmailField(max_length=255)
    mobileNumber = serializers.CharField(max_length=15)
    password = serializers.CharField(write_only=True)
    confirmPassword = serializers.CharField(write_only=True)

    def validate_emailId(self, value):
        if User.objects.filter(email_id=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate_mobileNumber(self, value):
        if not MOBILE_REGEX.match(value):
            raise serializers.ValidationError("Mobile must be 10–15 digits.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters.")
        return value

    def validate(self, data):
        if data["password"] != data["confirmPassword"]:
            raise serializers.ValidationError({"confirmPassword": "Passwords do not match."})
        return data

    def create(self, validated_data):
        student_id = generate_student_id()
        now = timezone.now()
        # Use the first active institution for student association
        institution = User.objects.filter(is_super_admin=True).first()
        institution_id = institution.institution_id if institution else "SYSTEM"
        institution_name = institution.institution_name if institution else "System"

        user = User.objects.create(
            institution_id=institution_id,
            institution_name=institution_name,
            user_id=student_id,
            user_name=validated_data["studentName"],
            user_designation="STUDENT",
            email_id=validated_data["emailId"],
            mobile_number=validated_data["mobileNumber"],
            password=make_password(validated_data["password"]),
            is_super_admin=False,
            password_reset_flag=True,
            password_cr_date=now,
            password_expiry_date=now + timedelta(days=90),
            cr_by="SELF_REGISTER",
            user_status="Active",
        )
        return user, student_id
