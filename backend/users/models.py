from django.db import models


class UserDesignation(models.TextChoices):
    SUPER_ADMIN = "SUPERADMIN", "Super Admin"
    SYSTEM_ADMINISTRATOR = "SYSTEM_ADMINISTRATOR", "System Administrator"
    ADMIN = "ADMIN", "Admin"
    TEACHER = "TEACHER", "Teacher / Faculty"
    STAFF = "STAFF", "Staff"
    STUDENT = "STUDENT", "Student"
    ACCOUNTANT = "ACCOUNTANT", "Accountant"
    LIBRARIAN = "LIBRARIAN", "Librarian"
    COUNSELOR = "COUNSELOR", "Counselor"
    IT_SUPPORT = "IT_SUPPORT", "IT Support"


class UserStatus(models.TextChoices):
    ACTIVE = "Active", "Active"
    INACTIVE = "Inactive", "Inactive"
    LOCKED = "Locked", "Locked"


class User(models.Model):
    institution_id = models.CharField(max_length=50)
    institution_name = models.CharField(max_length=255)
    user_id = models.CharField(max_length=50)
    user_name = models.CharField(max_length=255)
    user_designation = models.CharField(
        max_length=100,
        choices=UserDesignation.choices,
        null=True,
        blank=True,
    )
    branch_id = models.CharField(max_length=50, null=True, blank=True)
    branch_name = models.CharField(max_length=255, null=True, blank=True)
    department_id = models.CharField(max_length=50, null=True, blank=True)
    department_name = models.CharField(max_length=255, null=True, blank=True)
    is_super_admin = models.BooleanField(default=False)
    mobile_number = models.CharField(max_length=15, null=True, blank=True)
    email_id = models.EmailField(max_length=255, unique=True)
    password = models.TextField()
    password_reset_flag = models.BooleanField(default=True)
    password_cr_date = models.DateTimeField()
    password_expiry_date = models.DateTimeField(null=True, blank=True)
    cr_by = models.CharField(max_length=50)
    cr_date_time = models.DateTimeField(auto_now_add=True)
    mod_by = models.CharField(max_length=50, null=True, blank=True)
    mod_date_time = models.DateTimeField(null=True, blank=True)
    user_status = models.CharField(
        max_length=20,
        choices=UserStatus.choices,
        default=UserStatus.ACTIVE,
    )

    class Meta:
        db_table = "users"
        unique_together = [("institution_id", "user_id")]

    def __str__(self):
        return f"{self.institution_id} / {self.user_id} ({self.user_designation})"


class StudentNumberControl(models.Model):
    year = models.IntegerField()
    month = models.IntegerField()
    last_number = models.IntegerField(default=0)

    class Meta:
        db_table = "student_number_control"
        unique_together = [("year", "month")]

    def __str__(self):
        return f"{self.year}-{self.month:02d}: {self.last_number}"
