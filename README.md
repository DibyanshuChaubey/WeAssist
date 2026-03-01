# WeAssist

WeAssist is a full-stack hostel issue and event management system with:
- transparent issue tracking,
- role-based workflows for students and admins,
- AI-assisted issue priority suggestion with admin override.

## Tech Stack

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Flask + SQLAlchemy + JWT
- Database: SQLite (dev), PostgreSQL-ready (prod)
- AI: scikit-learn based priority suggestion

## Quick Start

### 1) Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
flask init-db
python run.py
```

Backend runs at: `http://127.0.0.1:5000`

### 2) Frontend

Open another terminal in project root:

```bash
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

## Demo Accounts

Created by `flask init-db`:

- Admin: `admin@hostel.com` / `admin123`
- Admin: `admin2@hostel.com` / `admin123`
- Student: `student1@hostel.com` / `student123`
- Student: `student2@hostel.com` / `student123`
- Student: `student3@hostel.com` / `student123`
- Student (pending verification): `student4@hostel.com` / `student123`

## Core Workflow

Issue lifecycle:

`reported → in_progress → resolved_by_admin → closed`

Rules:
- Admin can move issues up to `resolved_by_admin`
- Only the issue reporter can confirm and close
- Admin cannot force-close directly

## Documentation Map

- High-level design: `ARCHITECTURE.md`
- Backend setup and usage: `backend/README.md`
- API reference: `backend/API_DOCUMENTATION.md`
- Test checklist: `backend/TESTING.md`