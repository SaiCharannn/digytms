from django.contrib import admin
from .models import Institution, CourseMaster, Enrollment, LearningUnit, PaymentVerificationLog

@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ["institution_id", "institution_name"]

@admin.register(CourseMaster)
class CourseMasterAdmin(admin.ModelAdmin):
    list_display = ["course_id", "course_name", "institution", "course_fee", "course_status"]
    list_filter = ["course_status", "institution"]

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ["enrollment_id", "user", "course", "institution", "status", "enrolled_at"]
    list_filter = ["status", "institution"]
    readonly_fields = ["enrolled_at", "payment_uploaded_at", "approved_at"]

@admin.register(PaymentVerificationLog)
class PaymentLogAdmin(admin.ModelAdmin):
    list_display = ["log_id", "enrollment", "old_status", "new_status", "changed_by", "changed_at"]
    readonly_fields = ["changed_at"]
