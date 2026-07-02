from django.urls import path
from . import views
from .views import CourseCurriculumView

urlpatterns = [
    # ── Public: Courses ───────────────────────────────────────────────────────
    path("courses/",                          views.CourseListView.as_view()),
    path("courses/<str:course_id>/",          views.CourseDetailView.as_view()),
    path("courses/<str:course_id>/preview/",  views.CoursePreviewView.as_view()),

    # ── Student (JWT required) ────────────────────────────────────────────────
    path("enrollments/enroll/",                               views.EnrollView.as_view()),
    path("enrollments/my/",                                   views.MyEnrollmentsView.as_view()),
    path("enrollments/<int:enrollment_id>/upload-payment/",   views.UploadPaymentProofView.as_view()),

    # ── Operator (JWT + operator role) ────────────────────────────────────────
    path("operator/enrollments/pending/",                           views.OperatorPendingView.as_view()),
    path("operator/enrollments/all/",                               views.OperatorAllEnrollmentsView.as_view()),
    path("operator/enrollments/<int:enrollment_id>/approve/",       views.OperatorApproveView.as_view()),
    path("operator/enrollments/<int:enrollment_id>/logs/",          views.EnrollmentLogsView.as_view()),
    path(
    'courses/<str:course_id>/curriculum/',
    CourseCurriculumView.as_view()
),
]

