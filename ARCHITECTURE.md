# WeAssist Architecture

## Overview

WeAssist has three main layers:

1. Frontend (React)
- Student and admin dashboards
- Auth-aware routes and role-based UI
- API integration through a centralized service

2. Backend (Flask)
- Auth, issues, and events blueprints
- JWT authentication + role checks
- Business rules for issue lifecycle and event registration

3. Data + AI
- SQLAlchemy models for users/issues/events
- AI priority suggestion (`priority_ai_suggested`) with reason (`ai_reason`)
- Admin-controlled final priority (`priority_final`)

## Request Flow

1. User action in frontend
2. API call to Flask endpoint
3. JWT + role/ownership validation
4. Business logic execution
5. Database update/read
6. JSON response to frontend

## Issue Lifecycle (Enforced)

`reported → in_progress → resolved_by_admin → confirmed by reporter → closed`

Rules:
- Students create issues
- Admins move issues to `in_progress` and `resolved_by_admin`
- Only the original reporter can confirm and close

## Access Control Summary

- Student:
  - Create issue
  - View allowed issues
  - Confirm own issue resolution
  - Register/unregister events (when allowed)

- Admin:
  - Manage issue status and final priority
  - Add notes
  - Manage events
  - Verify users

## Key Modules

- Frontend
  - `src/pages`
  - `src/components`
  - `src/services/api.ts`
  - `src/context/AuthContext.tsx`

- Backend
  - `backend/app/auth/routes.py`
  - `backend/app/issues/routes.py`
  - `backend/app/events/routes.py`
  - `backend/app/models.py`
  - `backend/app/issues/ai_priority.py`