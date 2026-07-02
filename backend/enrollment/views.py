from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from api.auth import SamcommJWTAuthentication
from users.models import User
from .models import CourseMaster, Enrollment, LearningUnit, PaymentVerificationLog, SubjectMaster, ChapterMaster
from .serializers import (
    CourseListSerializer,
    CourseDetailSerializer,
    LearningUnitPreviewSerializer,
    EnrollmentSerializer,
    OperatorEnrollmentSerializer,
    PaymentProofSerializer,
    ApprovalSerializer,
    PaymentLogSerializer,
)
from .permissions import IsOperator


def _get_auth_user(request):
    return getattr(request, "_samcomm_user", None)


class CourseListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = CourseMaster.objects.filter(course_status="ACTIVE").select_related("institution")
        institution_id = request.query_params.get("institution_id")
        if institution_id:
            qs = qs.filter(institution_id=institution_id)
        category = request.query_params.get("category")
        if category:
            qs = qs.filter(course_category__iexact=category)
        search = request.query_params.get("search")
        if search:
            qs = qs.filter(course_name__icontains=search)
        serializer = CourseListSerializer(qs, many=True)
        return Response({"success": True, "count": qs.count(), "courses": serializer.data})


class CourseDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        try:
            course = CourseMaster.objects.select_related("institution").get(
                course_id=course_id, course_status="ACTIVE"
            )
        except CourseMaster.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)
        return Response({"success": True, "course": CourseDetailSerializer(course).data})


class CoursePreviewView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        preview_units = LearningUnit.objects.filter(
            course__course_id=course_id,
            lu_preview_flag="YES",
            lu_status="Active",
        )
        return Response({
            "success": True,
            "course_id": course_id,
            "preview_units": LearningUnitPreviewSerializer(preview_units, many=True).data,
        })


class CourseCurriculumView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, course_id):
        try:
            course = CourseMaster.objects.get(course_id=course_id)
        except CourseMaster.DoesNotExist:
            return Response({"success": False, "message": "Course not found."}, status=404)

        # ── Bulk fetch — 3 queries total ──────────────────────────────────────
        subjects = list(
            SubjectMaster.objects
            .filter(course=course, subject_status="Active")
            .order_by("sm_id")
        )
        chapters = list(
            ChapterMaster.objects
            .filter(course=course, chapter_status="Active")
            .order_by("paper_key")
        )
        units = list(
            LearningUnit.objects
            .filter(course=course, lu_status="Active")
            .order_by("lu_id")
        )

        # ── Index by FK ───────────────────────────────────────────────────────
        chapters_by_subject: dict[str, list] = {}
        for ch in chapters:
            chapters_by_subject.setdefault(ch.subject_id, []).append(ch)

        units_by_chapter: dict[str, list] = {}
        for u in units:
            if u.chapter_id:
                units_by_chapter.setdefault(u.chapter_id, []).append(u)

        # ── Build tree ────────────────────────────────────────────────────────
        total_chapters = 0
        total_units    = 0
        total_previews = 0
        sections       = []

        for subject in subjects:
            subj_chapters    = chapters_by_subject.get(subject.subject_id, [])
            section_unit_count = 0
            chapter_list     = []

            for chapter in subj_chapters:
                ch_units  = units_by_chapter.get(chapter.chapter_id, [])
                unit_list = []

                for u in ch_units:
                    if u.lu_preview_flag == "YES":
                        total_previews += 1
                    total_units        += 1
                    section_unit_count += 1

                    unit_list.append({
                        "learning_unit_id": u.learning_unit_id,
                        "lu_caption":       u.lu_caption,
                        "lu_type":          u.lu_type,
                        "lu_mediatype":     u.lu_mediatype,
                        "lu_duration":      str(u.lu_duration) if u.lu_duration else None,
                        "lu_preview_flag":  u.lu_preview_flag,
                        "lu_file_location": u.lu_file_location or "",  # ← was missing
                    })

                total_chapters += 1
                chapter_list.append({
                    "chapter_id":   chapter.chapter_id,
                    "chapter_name": chapter.chapter_name,
                    "units":        unit_list,
                })

            sections.append({
                "subject_id":   subject.subject_id,
                "subject_name": subject.subject_name,
                "total_units":  section_unit_count,
                "chapters":     chapter_list,
            })

        return Response({
            "success": True,
            "stats": {
                "sections": len(sections),
                "chapters": total_chapters,
                "units":    total_units,
                "previews": total_previews,
            },
            "sections": sections,
        })


class EnrollView(APIView):
    authentication_classes = [SamcommJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = _get_auth_user(request)
        course_id = request.data.get("course_id", "").strip()
        if not course_id:
            return Response({"success": False, "message": "course_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            course = CourseMaster.objects.select_related("institution").get(course_id=course_id, course_status="ACTIVE")
        except CourseMaster.DoesNotExist:
            return Response({"success": False, "message": "Course not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

        existing = Enrollment.objects.filter(user=user, course=course).first()
        if existing:
            return Response({"success": False, "message": "You are already enrolled in this course.", "enrollment_id": existing.enrollment_id, "current_status": existing.status}, status=status.HTTP_409_CONFLICT)

        if course.is_free:
            enrollment = Enrollment.objects.create(user=user, course=course, institution=course.institution, status="active")
            return Response({"success": True, "message": "You have been successfully enrolled!", "status": "active", "enrollment_id": enrollment.enrollment_id}, status=status.HTTP_201_CREATED)

        enrollment = Enrollment.objects.create(user=user, course=course, institution=course.institution, status="for_approval")
        return Response({"success": True, "message": "Enrollment submitted. Please upload your payment proof.", "status": "for_approval", "enrollment_id": enrollment.enrollment_id, "course_fee": str(course.course_fee), "currency": course.currency_code}, status=status.HTTP_201_CREATED)


class UploadPaymentProofView(APIView):
    authentication_classes = [SamcommJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, enrollment_id):
        user = _get_auth_user(request)
        try:
            enrollment = Enrollment.objects.get(enrollment_id=enrollment_id, user=user, status="for_approval")
        except Enrollment.DoesNotExist:
            return Response({"success": False, "message": "Enrollment not found or already processed."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PaymentProofSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        enrollment.payment_reference_number = serializer.validated_data["payment_reference_number"]
        enrollment.payment_date             = serializer.validated_data["payment_date"]
        enrollment.payment_image            = serializer.validated_data["transaction_image"]
        enrollment.payment_uploaded_at      = timezone.now()
        enrollment.save()
        return Response({"success": True, "message": "Payment proof submitted. Awaiting operator approval."})


class MyEnrollmentsView(APIView):
    authentication_classes = [SamcommJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = _get_auth_user(request)
        enrollments = Enrollment.objects.filter(user=user).select_related("course", "institution").order_by("-enrolled_at")
        return Response({"success": True, "enrollments": EnrollmentSerializer(enrollments, many=True).data})


class OperatorPendingView(APIView):
    authentication_classes = [SamcommJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOperator]

    def get(self, request):
        operator = _get_auth_user(request)
        qs = Enrollment.objects.filter(institution_id=operator.institution_id, status="for_approval").select_related("user", "course", "institution").order_by("enrolled_at")
        search = request.query_params.get("search")
        if search:
            qs = qs.filter(user__user_name__icontains=search)
        return Response({"success": True, "count": qs.count(), "pending": OperatorEnrollmentSerializer(qs, many=True).data})


class OperatorApproveView(APIView):
    authentication_classes = [SamcommJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOperator]

    @transaction.atomic
    def post(self, request, enrollment_id):
        operator = _get_auth_user(request)
        try:
            enrollment = Enrollment.objects.select_for_update().get(enrollment_id=enrollment_id, institution_id=operator.institution_id, status="for_approval")
        except Enrollment.DoesNotExist:
            return Response({"success": False, "message": "Enrollment not found, not pending, or not in your institution."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ApprovalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        old_status = enrollment.status
        action     = serializer.validated_data["action"]
        remarks    = serializer.validated_data.get("remarks", "")

        if action == "approve":
            enrollment.status               = "active"
            enrollment.bank_reference_number = serializer.validated_data["bank_reference_number"]
            enrollment.approved_by          = operator
            enrollment.approved_at          = timezone.now()
            message = "Enrollment approved successfully."
        else:
            enrollment.status             = "rejected"
            enrollment.rejection_remarks  = remarks
            message = "Enrollment rejected."

        enrollment.save()
        PaymentVerificationLog.objects.create(enrollment=enrollment, institution_id=operator.institution_id, old_status=old_status, new_status=enrollment.status, changed_by=operator, remarks=remarks)
        return Response({"success": True, "message": message})


class OperatorAllEnrollmentsView(APIView):
    authentication_classes = [SamcommJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOperator]

    def get(self, request):
        operator      = _get_auth_user(request)
        status_filter = request.query_params.get("status")
        qs = Enrollment.objects.filter(institution_id=operator.institution_id).select_related("user", "course", "institution").order_by("-enrolled_at")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response({"success": True, "count": qs.count(), "enrollments": OperatorEnrollmentSerializer(qs, many=True).data})


class EnrollmentLogsView(APIView):
    authentication_classes = [SamcommJWTAuthentication]
    permission_classes = [IsAuthenticated, IsOperator]

    def get(self, request, enrollment_id):
        operator = _get_auth_user(request)
        try:
            enrollment = Enrollment.objects.get(enrollment_id=enrollment_id, institution_id=operator.institution_id)
        except Enrollment.DoesNotExist:
            return Response({"success": False, "message": "Not found."}, status=404)
        logs = PaymentVerificationLog.objects.filter(enrollment=enrollment).select_related("changed_by")
        return Response({"success": True, "logs": PaymentLogSerializer(logs, many=True).data})