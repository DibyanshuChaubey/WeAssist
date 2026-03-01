# WeAssist Backend

Flask API for issue reporting, issue lifecycle management, and event management.

## Run Locally

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
flask init-db
python run.py
```

Base URL: `http://127.0.0.1:5000/api`

## Main Capabilities

- JWT authentication with role checks
- Issue lifecycle with reporter confirmation
- AI-suggested priority + admin final override
- Event creation and registration workflows

## Issue Lifecycle

`reported → in_progress → resolved_by_admin → closed`

Enforced rules:
- Admins cannot close directly
- Only reporter can close through confirm-resolution

## Important Endpoints

- Auth
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`

- Issues
  - `POST /issues`
  - `GET /issues`
  - `GET /issues/<issue_id>`
  - `PATCH /issues/<issue_id>/status`
  - `PATCH /issues/<issue_id>/priority`
  - `POST /issues/<issue_id>/confirm-resolution`

- Events
  - `GET /events`
  - `POST /events` (admin)
  - `POST /events/<event_id>/register`

See `API_DOCUMENTATION.md` for full endpoint details.