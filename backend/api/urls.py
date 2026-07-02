from django.urls import path
from . import views

urlpatterns = [
    # Setup
    path("setup/status/", views.SuperAdminStatusView.as_view()),
    path("setup/create-super-admin/", views.SuperAdminCreateView.as_view()),
    path("setup/validate-institution/<str:institution_id>/", views.ValidateInstitutionView.as_view()),
    # Auth
    path("auth/login/", views.LoginView.as_view()),
    path("auth/change-password/", views.ChangePasswordView.as_view()),
    path("auth/me/", views.MeView.as_view()),
    # Admin
    path("admin/users/", views.CreateUserView.as_view()),
    path("admin/roles/", views.RolesListView.as_view()),
    # Student
    path("students/register/", views.RegisterStudentView.as_view()),
]
