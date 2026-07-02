-- ─── Run these AFTER python manage.py migrate ──────────────────────────────
-- Performance indexes from the functional spec

CREATE INDEX IF NOT EXISTS idx_enrollments_status_institution
    ON enrollments(status, institution_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_course
    ON enrollments(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_operator_lookup
    ON enrollments(institution_id, status, enrolled_at);

CREATE INDEX IF NOT EXISTS idx_courses_institution_status
    ON course_master(institution_id, course_status);

CREATE INDEX IF NOT EXISTS idx_lu_course_preview
    ON learning_units(course_id, lu_preview_flag, lu_status);
