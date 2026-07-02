import uuid
from django.db import models
from users.models import User


# ── Institution ───────────────────────────────────────────────────────────────
class Institution(models.Model):
    institution_id = models.CharField(primary_key=True, max_length=20)
    institution_name = models.CharField(max_length=200)

    class Meta:
        db_table = "institutions"

    def __str__(self):
        return self.institution_name


# ── Course Master ─────────────────────────────────────────────────────────────
class CourseMaster(models.Model):
    DURATION_UNIT_CHOICES = [
        ("DAY", "Day"), ("WEEK", "Week"), ("MONTH", "Month"),
    ]
    STATUS_CHOICES = [
        ("ACTIVE", "Active"), ("INACTIVE", "Inactive"), ("DRAFT", "Draft"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, db_column="institution_id"
    )
    course_id = models.CharField(max_length=30, unique=True)
    course_name = models.CharField(max_length=200)
    course_short_name = models.CharField(max_length=50, blank=True)
    course_category = models.CharField(max_length=100, blank=True)
    course_time_limit = models.CharField(max_length=10, blank=True)
    course_duration = models.IntegerField(null=True, blank=True)
    duration_unit = models.CharField(max_length=20, choices=DURATION_UNIT_CHOICES, blank=True)
    course_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency_code = models.CharField(max_length=3, default="INR")
    course_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ACTIVE")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = "course_master"

    @property
    def is_free(self):
        return self.course_fee == 0

    def __str__(self):
        return f"{self.course_id} — {self.course_name}"


# ── Subject Master ────────────────────────────────────────────────────────────
class SubjectMaster(models.Model):
    sm_id = models.BigAutoField(primary_key=True)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, db_column="institution_id"
    )
    course = models.ForeignKey(
        CourseMaster, on_delete=models.CASCADE, db_column="course_id", to_field="course_id"
    )
    subject_id = models.CharField(max_length=20, unique=True)
    subject_name = models.CharField(max_length=50)
    subject_short_name = models.CharField(max_length=50, blank=True)
    subject_remarks = models.CharField(max_length=200, blank=True)
    subject_status = models.CharField(max_length=20, default="Active")
    cr_by = models.CharField(max_length=20)
    cr_date_time = models.DateTimeField(auto_now_add=True)
    mod_by = models.CharField(max_length=20, blank=True, null=True)
    mod_date_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "subject_master"
        unique_together = [("course", "subject_name")]

# ── Papers Master 
class PapersMaster(models.Model):
    p_id = models.BigAutoField(primary_key=True)
    course = models.ForeignKey(
        CourseMaster, on_delete=models.CASCADE, db_column="course_id", to_field="course_id"
    )
    subject = models.ForeignKey(
        SubjectMaster, on_delete=models.CASCADE, db_column="subject_id", to_field="subject_id"
    )
    paper_id = models.CharField(max_length=20, unique=True)
    paper_name = models.CharField(max_length=100)
    paper_short_name = models.CharField(max_length=20, blank=True)
    paper_remarks = models.CharField(max_length=500, blank=True)
    # ← CharField — avoids requiring a User object in the seed command
    created_by = models.CharField(max_length=50, blank=True)
    created_date_time = models.DateTimeField(auto_now_add=True)
    modified_by = models.CharField(max_length=50, blank=True)
    modified_date_time = models.DateTimeField(null=True, blank=True)
    paper_status = models.CharField(max_length=20, default="Active")

    class Meta:
        db_table = "papers_master"


# ── Chapter Master 
class ChapterMaster(models.Model):
    paper_key = models.BigAutoField(primary_key=True)
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, db_column="institution_id"
    )
    course = models.ForeignKey( 
        CourseMaster, on_delete=models.CASCADE, db_column="course_id", to_field="course_id"
    )
    subject = models.ForeignKey(
        SubjectMaster, on_delete=models.CASCADE, db_column="subject_id", to_field="subject_id"
    )
    paper = models.ForeignKey(
        PapersMaster, on_delete=models.CASCADE, db_column="paper_id", to_field="paper_id"
    )
    chapter_id = models.CharField(max_length=20, unique=True)
    chapter_name = models.CharField(max_length=60)
    chapter_short_name = models.CharField(max_length=50, blank=True)
    chapter_status = models.CharField(max_length=20, default="Active")
    cr_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="chapters_created",
        db_column="cr_by"
    )
    cr_date_time = models.DateTimeField(auto_now_add=True)
    mod_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="chapters_modified",
        db_column="mod_by"
    )
    mod_date_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "chapter_mast"


# ── Learning Units 
class LearningUnit(models.Model):
    LU_TYPE_CHOICES = [
        ("pdf", "PDF"), ("mp3", "MP3"), ("mp4", "MP4"),
        ("png", "PNG"), ("jpeg", "JPEG"),
    ]
    LU_MEDIA_CHOICES = [("File", "File"), ("video", "Video"), ("audio", "Audio")]
    PREVIEW_CHOICES = [("YES", "Yes"), ("NO", "No")]

    lu_id = models.AutoField(primary_key=True)
    learning_unit_id = models.CharField(max_length=30, unique=True)
    lu_caption = models.CharField(max_length=200)
    lu_type = models.CharField(max_length=10, choices=LU_TYPE_CHOICES, null=True)
    lu_mediatype = models.CharField(max_length=10, choices=LU_MEDIA_CHOICES, null=True)
    lu_file_name = models.CharField(max_length=100, blank=True)
    lu_file_location = models.CharField(max_length=300, blank=True)
    lu_duration = models.TimeField(null=True, blank=True)
    lu_preview_flag = models.CharField(max_length=10, choices=PREVIEW_CHOICES, default="NO")

    # ── Hierarchy FKs 
    course = models.ForeignKey(
        CourseMaster, on_delete=models.CASCADE,
        db_column="course_id", to_field="course_id",
        null=True, blank=True, related_name="units"
    )
    # subject FK — groups units under a section
    subject = models.ForeignKey(
        SubjectMaster, on_delete=models.CASCADE,
        db_column="subject_id", to_field="subject_id",
        null=True, blank=True, related_name="units"
    )
    # chapter FK — the critical link for curriculum grouping
    chapter = models.ForeignKey(
        ChapterMaster, on_delete=models.CASCADE,
        db_column="chapter_id", to_field="chapter_id",
        null=True, blank=True, related_name="units"
    )

    lu_crby = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="lu_created",
        db_column="lu_crby"
    )
    lu_crdt = models.DateTimeField(auto_now_add=True)
    lu_modby = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="lu_modified",
        db_column="lu_modby"
    )
    lu_moddt = models.DateTimeField(null=True, blank=True)
    lu_status = models.CharField(max_length=20, default="Active")

    class Meta:
        db_table = "learning_units"
        ordering = ["lu_id"]

    def __str__(self):
        return self.lu_caption


# ── Enrollment 
class Enrollment(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("for_approval", "For Approval"),
        ("rejected", "Rejected"),
    ]

    enrollment_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, db_column="user_id", related_name="enrollments"
    )
    course = models.ForeignKey(
        CourseMaster, on_delete=models.CASCADE,
        db_column="course_id", to_field="course_id"
    )
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, db_column="institution_id"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="for_approval")
    enrolled_at = models.DateTimeField(auto_now_add=True)

    payment_reference_number = models.CharField(max_length=50, null=True, blank=True)
    bank_reference_number = models.CharField(max_length=50, null=True, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    payment_image = models.ImageField(upload_to="payments/", null=True, blank=True)
    payment_uploaded_at = models.DateTimeField(null=True, blank=True)

    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="approved_enrollments", db_column="approved_by"
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_remarks = models.TextField(blank=True)

    class Meta:
        db_table = "enrollments"
        unique_together = [["user", "course"]]

    def __str__(self):
        return f"Enrollment#{self.enrollment_id} {self.user_id} → {self.course_id} [{self.status}]"


# ── Payment Verification Audit Log 
class PaymentVerificationLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    enrollment = models.ForeignKey(
        Enrollment, on_delete=models.CASCADE, related_name="logs"
    )
    institution = models.ForeignKey(
        Institution, on_delete=models.CASCADE, db_column="institution_id"
    )
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, db_column="changed_by"
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField(blank=True)

    class Meta:
        db_table = "payment_verification_log"

    def __str__(self):
        return f"Log#{self.log_id} enrollment={self.enrollment_id} {self.old_status}→{self.new_status}"
 


