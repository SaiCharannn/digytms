from rest_framework import serializers
from .models import CourseMaster, Enrollment, LearningUnit, Institution, PaymentVerificationLog


# ── Institution ───────────────────────────────────────────────────────────────
class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ["institution_id", "institution_name"]


# ── Course List ───────────────────────────────────────────────────────────────
class CourseListSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(
        source="institution.institution_name", read_only=True
    )
    has_preview = serializers.SerializerMethodField()
    is_free = serializers.BooleanField(read_only=True)

    class Meta:
        model = CourseMaster
        fields = [
            "course_id", "institution_id", "institution_name",
            "course_name", "course_short_name", "course_category",
            "course_fee", "currency_code", "course_duration",
            "duration_unit", "has_preview", "is_free", "course_status",
        ]

    def get_has_preview(self, obj):
        return LearningUnit.objects.filter(
            course=obj, lu_preview_flag="YES", lu_status="Active"
        ).exists()


# ── Course Detail ─────────────────────────────────────────────────────────────
class CourseDetailSerializer(CourseListSerializer):
    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + [
            "course_time_limit", "created_at", "created_by",
        ]


# ── Learning Unit (preview) ───────────────────────────────────────────────────
class LearningUnitPreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningUnit
        fields = [
            "learning_unit_id", "lu_caption", "lu_type",
            "lu_mediatype", "lu_file_location", "lu_duration",
        ]


# ── Enrollment (student view) ─────────────────────────────────────────────────
class EnrollmentSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.course_name", read_only=True)
    course_fee = serializers.DecimalField(
        source="course.course_fee", max_digits=12, decimal_places=2, read_only=True
    )
    currency_code = serializers.CharField(source="course.currency_code", read_only=True)
    institution_name = serializers.CharField(
        source="institution.institution_name", read_only=True
    )

    class Meta:
        model = Enrollment
        fields = [
            "enrollment_id", "course_id", "course_name", "course_fee",
            "currency_code", "institution_id", "institution_name",
            "status", "enrolled_at",
            "payment_reference_number", "payment_date", "payment_uploaded_at",
            "approved_at", "rejection_remarks",
        ]


# ── Enrollment (operator view — includes student info) ────────────────────────
class OperatorEnrollmentSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.course_name", read_only=True)
    course_fee = serializers.DecimalField(
        source="course.course_fee", max_digits=12, decimal_places=2, read_only=True
    )
    currency_code = serializers.CharField(source="course.currency_code", read_only=True)
    student_name = serializers.CharField(source="user.user_name", read_only=True)
    student_id = serializers.CharField(source="user.user_id", read_only=True)
    student_email = serializers.CharField(source="user.email_id", read_only=True)
    has_payment_proof = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            "enrollment_id", "course_id", "course_name", "course_fee", "currency_code",
            "student_id", "student_name", "student_email",
            "status", "enrolled_at",
            "payment_reference_number", "bank_reference_number",
            "payment_date", "payment_uploaded_at", "has_payment_proof",
            "approved_at", "rejection_remarks",
        ]

    def get_has_payment_proof(self, obj):
        return bool(obj.payment_image)


# ── Payment Proof Upload ──────────────────────────────────────────────────────
class PaymentProofSerializer(serializers.Serializer):
    payment_reference_number = serializers.CharField(max_length=50)
    payment_date = serializers.DateField()
    transaction_image = serializers.ImageField()


# ── Operator Approve / Reject ─────────────────────────────────────────────────
class ApprovalSerializer(serializers.Serializer):
    ACTION_CHOICES = ["approve", "reject"]
    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    bank_reference_number = serializers.CharField(
        max_length=50, required=False, allow_blank=True
    )
    remarks = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data["action"] == "approve" and not data.get("bank_reference_number"):
            raise serializers.ValidationError(
                {"bank_reference_number": "Bank reference number is required for approval."}
            )
        return data


# ── Audit Log ─────────────────────────────────────────────────────────────────
class PaymentLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(
        source="changed_by.user_name", read_only=True
    )

    class Meta:
        model = PaymentVerificationLog
        fields = [
            "log_id", "old_status", "new_status",
            "changed_by_name", "changed_at", "remarks",
        ]
