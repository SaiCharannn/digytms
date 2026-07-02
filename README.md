# Samcomm — Full Stack System

Three projects in one folder:

| Folder | Tech | Port | Purpose |
|--------|------|------|---------|
| `backend/` | Django + DRF + PostgreSQL | 8000 | REST API |
| `setup-app/` | React + Vite | 5173 | One-time Super Admin Setup |
| `main-app/` | React + Vite | 5174 | Login + Dashboard + Admin |

## Quick Start

### 1. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in your values
python manage.py makemigrations users
python manage.py migrate
python manage.py runserver
```

### 2. Setup App (run once)
```bash
cd setup-app
npm install
cp .env.example .env  # set VITE_SETUP_TOKEN
npm run dev
# Open http://localhost:5173 and create the Super Admin
```

### 3. Main App
```bash
cd main-app
npm install
npm run dev
# Open http://localhost:5174 to log in
```

## Security Notes
- Never commit `.env` files — they are gitignored
- Rotate SETUP_TOKEN after Super Admin is created
- JWT tokens expire in 15 minutes (configurable)
- Refresh tokens last 7 days
- Passwords require uppercase + special character
