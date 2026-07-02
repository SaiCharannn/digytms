"""
Seed command — builds full 3-level course curriculum:
  Section (Subject) → Chapter → Learning Units

Run:  python manage.py seed_enrollment
"""
from django.core.management.base import BaseCommand
from enrollment.models import (
    Institution, CourseMaster, SubjectMaster,
    PapersMaster, ChapterMaster, LearningUnit
)
from users.models import User

CURRICULUM = {
    "PYTH001": {
        "course_name": "Python Programming — Complete Bootcamp",
        "course_short_name": "Python Bootcamp",
        "course_category": "Technology",
        "course_fee": 0,
        "course_duration": 8,
        "duration_unit": "WEEK",
        "sections": [
            {
                "subject_id": "PYTH-S1", "subject_name": "Introduction to Python",
                "subject_short_name": "Intro", "order": 1,
                "chapters": [
                    {
                        "chapter_id": "PYTH-S1-C1", "chapter_name": "Prerequisites & Setup", "order": 1,
                        "units": [
                            {"id": "PYTH-S1-C1-U1", "caption": "What is Python?",                    "type": "mp4", "media": "video", "duration": "00:08:30", "preview": "YES"},
                            {"id": "PYTH-S1-C1-U2", "caption": "Installing Python & VS Code",        "type": "mp4", "media": "video", "duration": "00:12:00", "preview": "YES"},
                            {"id": "PYTH-S1-C1-U3", "caption": "Setup Guide PDF",                    "type": "pdf", "media": "File",  "duration": None,       "preview": "YES"},
                            {"id": "PYTH-S1-C1-U4", "caption": "Flash Cards — Python Basics Set 1", "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "PYTH-S1-C1-U5", "caption": "MCQ Test — Set 1",                  "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                    {
                        "chapter_id": "PYTH-S1-C2", "chapter_name": "Advantages of Python", "order": 2,
                        "units": [
                            {"id": "PYTH-S1-C2-U1", "caption": "Why Python? Industry Use Cases",    "type": "mp4", "media": "video", "duration": "00:10:15", "preview": "NO"},
                            {"id": "PYTH-S1-C2-U2", "caption": "Python vs Other Languages",         "type": "mp4", "media": "video", "duration": "00:09:00", "preview": "NO"},
                            {"id": "PYTH-S1-C2-U3", "caption": "Flash Cards — Advantages Set 1",    "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "PYTH-S1-C2-U4", "caption": "MCQ Test — Set 1",                  "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                ],
            },
            {
                "subject_id": "PYTH-S2", "subject_name": "Core Python Concepts",
                "subject_short_name": "Core", "order": 2,
                "chapters": [
                    {
                        "chapter_id": "PYTH-S2-C1", "chapter_name": "Variables & Data Types", "order": 1,
                        "units": [
                            {"id": "PYTH-S2-C1-U1", "caption": "Variables & Naming Rules",         "type": "mp4", "media": "video", "duration": "00:11:20", "preview": "NO"},
                            {"id": "PYTH-S2-C1-U2", "caption": "Numbers, Strings & Booleans",      "type": "mp4", "media": "video", "duration": "00:14:00", "preview": "NO"},
                            {"id": "PYTH-S2-C1-U3", "caption": "Type Casting & Conversion",        "type": "mp4", "media": "video", "duration": "00:08:45", "preview": "NO"},
                            {"id": "PYTH-S2-C1-U4", "caption": "Data Types Reference Sheet",       "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "PYTH-S2-C1-U5", "caption": "Flash Cards — Data Types Set 1",  "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "PYTH-S2-C1-U6", "caption": "MCQ Test — Data Types",            "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                    {
                        "chapter_id": "PYTH-S2-C2", "chapter_name": "Control Flow", "order": 2,
                        "units": [
                            {"id": "PYTH-S2-C2-U1", "caption": "If / Elif / Else Statements",      "type": "mp4", "media": "video", "duration": "00:13:10", "preview": "NO"},
                            {"id": "PYTH-S2-C2-U2", "caption": "For Loops & Range",                "type": "mp4", "media": "video", "duration": "00:16:30", "preview": "NO"},
                            {"id": "PYTH-S2-C2-U3", "caption": "While Loops & Break/Continue",     "type": "mp4", "media": "video", "duration": "00:12:00", "preview": "NO"},
                            {"id": "PYTH-S2-C2-U4", "caption": "Flash Cards — Control Flow Set 1", "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "PYTH-S2-C2-U5", "caption": "MCQ Test — Control Flow",          "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                    {
                        "chapter_id": "PYTH-S2-C3", "chapter_name": "Functions & Modules", "order": 3,
                        "units": [
                            {"id": "PYTH-S2-C3-U1", "caption": "Defining & Calling Functions",     "type": "mp4", "media": "video", "duration": "00:15:00", "preview": "NO"},
                            {"id": "PYTH-S2-C3-U2", "caption": "Args, Kwargs & Defaults",          "type": "mp4", "media": "video", "duration": "00:13:45", "preview": "NO"},
                            {"id": "PYTH-S2-C3-U3", "caption": "Lambda & Higher-Order Functions",  "type": "mp4", "media": "video", "duration": "00:11:00", "preview": "NO"},
                            {"id": "PYTH-S2-C3-U4", "caption": "Python Standard Library Tour",     "type": "mp4", "media": "video", "duration": "00:18:20", "preview": "NO"},
                            {"id": "PYTH-S2-C3-U5", "caption": "Flash Cards — Functions Set 1",    "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "PYTH-S2-C3-U6", "caption": "MCQ Test — Functions",             "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                ],
            },
            {
                "subject_id": "PYTH-S3", "subject_name": "Object-Oriented Programming",
                "subject_short_name": "OOP", "order": 3,
                "chapters": [
                    {
                        "chapter_id": "PYTH-S3-C1", "chapter_name": "Classes & Objects", "order": 1,
                        "units": [
                            {"id": "PYTH-S3-C1-U1", "caption": "Defining Classes",                 "type": "mp4", "media": "video", "duration": "00:14:00", "preview": "NO"},
                            {"id": "PYTH-S3-C1-U2", "caption": "Constructor & Instance Methods",   "type": "mp4", "media": "video", "duration": "00:16:00", "preview": "NO"},
                            {"id": "PYTH-S3-C1-U3", "caption": "Flash Cards — OOP Set 1",         "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "PYTH-S3-C1-U4", "caption": "MCQ Test — Classes",              "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                    {
                        "chapter_id": "PYTH-S3-C2", "chapter_name": "Inheritance & Polymorphism", "order": 2,
                        "units": [
                            {"id": "PYTH-S3-C2-U1", "caption": "Single & Multiple Inheritance",    "type": "mp4", "media": "video", "duration": "00:19:00", "preview": "NO"},
                            {"id": "PYTH-S3-C2-U2", "caption": "Method Overriding & super()",      "type": "mp4", "media": "video", "duration": "00:14:30", "preview": "NO"},
                            {"id": "PYTH-S3-C2-U3", "caption": "Flash Cards — Inheritance Set 1", "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "PYTH-S3-C2-U4", "caption": "MCQ Test — OOP Final",            "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                ],
            },
        ],
    },
    "DGMK001": {
        "course_name": "Digital Marketing Masterclass",
        "course_short_name": "Digital Marketing",
        "course_category": "Business",
        "course_fee": 2999.00,
        "course_duration": 6,
        "duration_unit": "WEEK",
        "sections": [
            {
                "subject_id": "DGMK-S1", "subject_name": "Foundations of Digital Marketing",
                "subject_short_name": "Foundations", "order": 1,
                "chapters": [
                    {
                        "chapter_id": "DGMK-S1-C1", "chapter_name": "What is Digital Marketing?", "order": 1,
                        "units": [
                            {"id": "DGMK-S1-C1-U1", "caption": "Digital Marketing Overview",        "type": "mp4", "media": "video", "duration": "00:09:00", "preview": "YES"},
                            {"id": "DGMK-S1-C1-U2", "caption": "Traditional vs Digital Marketing", "type": "mp4", "media": "video", "duration": "00:11:00", "preview": "YES"},
                            {"id": "DGMK-S1-C1-U3", "caption": "Flash Cards — DM Basics Set 1",   "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DGMK-S1-C1-U4", "caption": "MCQ Test — DM Fundamentals",      "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                    {
                        "chapter_id": "DGMK-S1-C2", "chapter_name": "Customer Journey & Funnels", "order": 2,
                        "units": [
                            {"id": "DGMK-S1-C2-U1", "caption": "The AIDA Model",                   "type": "mp4", "media": "video", "duration": "00:10:30", "preview": "NO"},
                            {"id": "DGMK-S1-C2-U2", "caption": "Building a Marketing Funnel",      "type": "mp4", "media": "video", "duration": "00:14:00", "preview": "NO"},
                            {"id": "DGMK-S1-C2-U3", "caption": "Funnel Template PDF",              "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DGMK-S1-C2-U4", "caption": "Flash Cards — Funnel Set 1",      "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                ],
            },
            {
                "subject_id": "DGMK-S2", "subject_name": "SEO & Content Marketing",
                "subject_short_name": "SEO", "order": 2,
                "chapters": [
                    {
                        "chapter_id": "DGMK-S2-C1", "chapter_name": "SEO Fundamentals", "order": 1,
                        "units": [
                            {"id": "DGMK-S2-C1-U1", "caption": "How Search Engines Work",          "type": "mp4", "media": "video", "duration": "00:12:00", "preview": "NO"},
                            {"id": "DGMK-S2-C1-U2", "caption": "On-Page SEO Techniques",           "type": "mp4", "media": "video", "duration": "00:16:00", "preview": "NO"},
                            {"id": "DGMK-S2-C1-U3", "caption": "Keyword Research with Tools",      "type": "mp4", "media": "video", "duration": "00:18:30", "preview": "NO"},
                            {"id": "DGMK-S2-C1-U4", "caption": "Flash Cards — SEO Set 1",          "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DGMK-S2-C1-U5", "caption": "MCQ Test — SEO",                   "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                ],
            },
            {
                "subject_id": "DGMK-S3", "subject_name": "Social Media & Paid Ads",
                "subject_short_name": "Social & Ads", "order": 3,
                "chapters": [
                    {
                        "chapter_id": "DGMK-S3-C1", "chapter_name": "Social Media Strategy", "order": 1,
                        "units": [
                            {"id": "DGMK-S3-C1-U1", "caption": "Platform Selection Strategy",      "type": "mp4", "media": "video", "duration": "00:11:00", "preview": "NO"},
                            {"id": "DGMK-S3-C1-U2", "caption": "Content Calendar Planning",        "type": "mp4", "media": "video", "duration": "00:13:00", "preview": "NO"},
                            {"id": "DGMK-S3-C1-U3", "caption": "Flash Cards — Social Set 1",       "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DGMK-S3-C1-U4", "caption": "MCQ Test — Social Media",          "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                    {
                        "chapter_id": "DGMK-S3-C2", "chapter_name": "Google & Meta Ads", "order": 2,
                        "units": [
                            {"id": "DGMK-S3-C2-U1", "caption": "Google Ads Campaign Setup",        "type": "mp4", "media": "video", "duration": "00:20:00", "preview": "NO"},
                            {"id": "DGMK-S3-C2-U2", "caption": "Meta (Facebook) Ads Manager",      "type": "mp4", "media": "video", "duration": "00:18:00", "preview": "NO"},
                            {"id": "DGMK-S3-C2-U3", "caption": "Ad Budget & Bidding Strategies",   "type": "mp4", "media": "video", "duration": "00:14:30", "preview": "NO"},
                            {"id": "DGMK-S3-C2-U4", "caption": "Flash Cards — Ads Set 1",          "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DGMK-S3-C2-U5", "caption": "MCQ Test — Paid Ads Final",        "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                ],
            },
        ],
    },
    "DTSC001": {
        "course_name": "Data Science & Machine Learning",
        "course_short_name": "Data Science",
        "course_category": "Technology",
        "course_fee": 4999.00,
        "course_duration": 12,
        "duration_unit": "WEEK",
        "sections": [
            {
                "subject_id": "DTSC-S1", "subject_name": "Python for Data Science",
                "subject_short_name": "Python DS", "order": 1,
                "chapters": [
                    {
                        "chapter_id": "DTSC-S1-C1", "chapter_name": "NumPy Fundamentals", "order": 1,
                        "units": [
                            {"id": "DTSC-S1-C1-U1", "caption": "Arrays & Vectorized Operations",   "type": "mp4", "media": "video", "duration": "00:16:00", "preview": "YES"},
                            {"id": "DTSC-S1-C1-U2", "caption": "Indexing, Slicing & Reshaping",    "type": "mp4", "media": "video", "duration": "00:13:00", "preview": "NO"},
                            {"id": "DTSC-S1-C1-U3", "caption": "NumPy Cheat Sheet PDF",             "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DTSC-S1-C1-U4", "caption": "Flash Cards — NumPy Set 1",        "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DTSC-S1-C1-U5", "caption": "MCQ Test — NumPy",                 "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                    {
                        "chapter_id": "DTSC-S1-C2", "chapter_name": "Pandas for Data Analysis", "order": 2,
                        "units": [
                            {"id": "DTSC-S1-C2-U1", "caption": "DataFrames & Series",              "type": "mp4", "media": "video", "duration": "00:18:00", "preview": "NO"},
                            {"id": "DTSC-S1-C2-U2", "caption": "Data Cleaning & Missing Values",   "type": "mp4", "media": "video", "duration": "00:20:00", "preview": "NO"},
                            {"id": "DTSC-S1-C2-U3", "caption": "GroupBy, Merge & Pivot Tables",    "type": "mp4", "media": "video", "duration": "00:17:30", "preview": "NO"},
                            {"id": "DTSC-S1-C2-U4", "caption": "Pandas Cheat Sheet PDF",           "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DTSC-S1-C2-U5", "caption": "Flash Cards — Pandas Set 1",      "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DTSC-S1-C2-U6", "caption": "MCQ Test — Pandas",               "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                ],
            },
            {
                "subject_id": "DTSC-S2", "subject_name": "Machine Learning",
                "subject_short_name": "ML", "order": 2,
                "chapters": [
                    {
                        "chapter_id": "DTSC-S2-C1", "chapter_name": "Supervised Learning", "order": 1,
                        "units": [
                            {"id": "DTSC-S2-C1-U1", "caption": "Linear Regression",                "type": "mp4", "media": "video", "duration": "00:22:00", "preview": "NO"},
                            {"id": "DTSC-S2-C1-U2", "caption": "Logistic Regression",              "type": "mp4", "media": "video", "duration": "00:20:00", "preview": "NO"},
                            {"id": "DTSC-S2-C1-U3", "caption": "Decision Trees & Random Forest",   "type": "mp4", "media": "video", "duration": "00:25:00", "preview": "NO"},
                            {"id": "DTSC-S2-C1-U4", "caption": "ML Algorithms Cheat Sheet",        "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DTSC-S2-C1-U5", "caption": "Flash Cards — ML Set 1",          "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DTSC-S2-C1-U6", "caption": "MCQ Test — Supervised Learning",  "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                    {
                        "chapter_id": "DTSC-S2-C2", "chapter_name": "Unsupervised Learning", "order": 2,
                        "units": [
                            {"id": "DTSC-S2-C2-U1", "caption": "K-Means Clustering",               "type": "mp4", "media": "video", "duration": "00:18:00", "preview": "NO"},
                            {"id": "DTSC-S2-C2-U2", "caption": "PCA & Dimensionality Reduction",   "type": "mp4", "media": "video", "duration": "00:16:00", "preview": "NO"},
                            {"id": "DTSC-S2-C2-U3", "caption": "Flash Cards — Unsupervised Set 1", "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DTSC-S2-C2-U4", "caption": "MCQ Test — ML Final",              "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                ],
            },
            {
                "subject_id": "DTSC-S3", "subject_name": "Projects & Deployment",
                "subject_short_name": "Projects", "order": 3,
                "chapters": [
                    {
                        "chapter_id": "DTSC-S3-C1", "chapter_name": "End-to-End Projects", "order": 1,
                        "units": [
                            {"id": "DTSC-S3-C1-U1", "caption": "House Price Prediction Project",   "type": "mp4", "media": "video", "duration": "00:35:00", "preview": "NO"},
                            {"id": "DTSC-S3-C1-U2", "caption": "Customer Churn Analysis Project",  "type": "mp4", "media": "video", "duration": "00:40:00", "preview": "NO"},
                            {"id": "DTSC-S3-C1-U3", "caption": "Project Starter Code",             "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                    {
                        "chapter_id": "DTSC-S3-C2", "chapter_name": "Model Deployment", "order": 2,
                        "units": [
                            {"id": "DTSC-S3-C2-U1", "caption": "Deploying with Flask API",         "type": "mp4", "media": "video", "duration": "00:28:00", "preview": "NO"},
                            {"id": "DTSC-S3-C2-U2", "caption": "Docker & Cloud Deployment",        "type": "mp4", "media": "video", "duration": "00:32:00", "preview": "NO"},
                            {"id": "DTSC-S3-C2-U3", "caption": "Deployment Checklist PDF",         "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                            {"id": "DTSC-S3-C2-U4", "caption": "MCQ Test — Deployment",            "type": "pdf", "media": "File",  "duration": None,       "preview": "NO"},
                        ],
                    },
                ],
            },
        ],
    },
}


class Command(BaseCommand):
    help = 'Seed full 3-level curriculum (Section → Chapter → Units). Idempotent.'

    def handle(self, *args, **options):
        super_admin = User.objects.filter(is_super_admin=True).first()
        if not super_admin:
            self.stderr.write('❌  No super admin found. Run the setup-app first.')
            return

        institution, _ = Institution.objects.get_or_create(
            institution_id=super_admin.institution_id,
            defaults={'institution_name': super_admin.institution_name},
        )
        self.stdout.write(f'🏛️  Institution: {institution.institution_id}')

        for course_id, cd in CURRICULUM.items():
            course, _ = CourseMaster.objects.update_or_create(
                course_id=course_id,
                defaults={
                    'institution':       institution,
                    'course_name':       cd['course_name'],
                    'course_short_name': cd['course_short_name'],
                    'course_category':   cd['course_category'],
                    'course_fee':        cd['course_fee'],
                    'currency_code':     'INR',
                    'course_duration':   cd['course_duration'],
                    'duration_unit':     cd['duration_unit'],
                    'course_status':     'ACTIVE',
                    'created_by':        super_admin.user_id,
                },
            )
            fee_str = 'FREE' if course.course_fee == 0 else f'₹{course.course_fee:,.0f}'
            self.stdout.write(f'\n  📚 {course_id} — {course.course_name} ({fee_str})')

            for sec in cd['sections']:
                subject, _ = SubjectMaster.objects.update_or_create(
                    subject_id=sec['subject_id'],
                    defaults={
                        'institution':        institution,
                        'course':             course,
                        'subject_name':       sec['subject_name'],
                        'subject_short_name': sec['subject_short_name'],
                        'subject_status':     'Active',
                        'cr_by':              super_admin.user_id,
                    },
                )
                self.stdout.write(f'    📂 Section {sec["order"]}: {sec["subject_name"]}')

                for chap in sec['chapters']:
                    paper_id = f'PAP-{chap["chapter_id"]}'[:20]
                    paper, _ = PapersMaster.objects.update_or_create(
                        paper_id=paper_id,
                        defaults={
                            'course':           course,
                            'subject':          subject,
                            'paper_name':       chap['chapter_name'],
                            'paper_short_name': chap['chapter_id'][:20],
                            'paper_status':     'Active',
                        },
                    )
                    chapter, _ = ChapterMaster.objects.update_or_create(
                        chapter_id=chap['chapter_id'],
                        defaults={
                            'institution':        institution,
                            'course':             course,
                            'subject':            subject,
                            'paper':              paper,
                            'chapter_name':       chap['chapter_name'],
                            'chapter_short_name': chap['chapter_id'][:10],
                            'chapter_status':     'Active',
                            'cr_by':              super_admin,
                        },
                    )
                    self.stdout.write(f'      📖 Chapter {chap["order"]}: {chap["chapter_name"]}')

                    for i, u in enumerate(chap['units'], 1):
                        LearningUnit.objects.update_or_create(
                            learning_unit_id=u['id'],
                            defaults={
                                'lu_caption':      u['caption'],
                                'lu_type':         u['type'],
                                'lu_mediatype':    u['media'],
                                'lu_preview_flag': u['preview'],
                                'lu_duration':     u['duration'],
                                'course':          course,
                                'subject':         subject,   # ← backfills subject FK
                                'chapter':         chapter,   # ← backfills chapter FK
                                'lu_status':       'Active',
                            },
                        )
                        icon = '👁' if u['preview'] == 'YES' else '🔒'
                        self.stdout.write(f'        {icon} Unit {i}: {u["caption"]}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅  Seed complete! Now visit /courses'))
        