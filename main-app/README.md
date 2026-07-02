# Samcomm Main App — React + Vite

## Setup
```bash
npm install
cp .env.example .env
npm run dev   # runs on http://localhost:5174
```

## Routes
| Path | Description | Auth |
|------|-------------|------|
| /login | Login for all roles | Public |
| /register | Student self-registration | Public |
| /change-password | Force password change on first login | JWT |
| /dashboard | Home dashboard | JWT |
| /users | Create & manage staff users | JWT + SuperAdmin |
| /students | Student info page | JWT |
| /profile | Current user profile | JWT |
