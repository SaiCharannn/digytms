# Samcomm Backend — Django REST Framework

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy and fill in your credentials
cp .env.example .env

# Run migrations
python manage.py makemigrations users
python manage.py migrate

# Start server
python manage.py runserver
```

## API Endpoints

| Method | URL | Auth |
|--------|-----|------|
| GET | /api/v1/setup/status/ | Public |
| POST | /api/v1/setup/create-super-admin/ | X-Setup-Token header |
| GET | /api/v1/setup/validate-institution/:id/ | Public |
| POST | /api/v1/auth/login/ | Public |
| POST | /api/v1/auth/change-password/ | JWT |
| GET | /api/v1/auth/me/ | JWT |
| GET/POST | /api/v1/admin/users/ | JWT (SuperAdmin) |
| GET | /api/v1/admin/roles/ | Public |
| POST | /api/v1/students/register/ | Public |
