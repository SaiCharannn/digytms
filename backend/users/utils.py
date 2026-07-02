from datetime import datetime
from django.db import transaction
from .models import StudentNumberControl


def generate_student_id() -> str:
    """Generate a student ID in the format STYYYYMMnnnnnn."""
    now = datetime.now()
    year = now.year
    month = now.month

    with transaction.atomic():
        record, _ = StudentNumberControl.objects.select_for_update().get_or_create(
            year=year,
            month=month,
            defaults={"last_number": 0},
        )
        record.last_number += 1
        record.save()
        return f"ST{year}{month:02d}{record.last_number:06d}"
