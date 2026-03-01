# Backend Testing Checklist

## Prerequisites

1. Backend running on `http://127.0.0.1:5000`
2. Database initialized with `flask init-db`
3. You have one admin and one student account

## Smoke Test Flow

1. Login as student
- `POST /api/auth/login`
- Save `access_token`

2. Create issue
- `POST /api/issues`
- Verify response contains:
  - `status: reported`
  - `priority_ai_suggested`
  - `ai_reason`

3. Login as admin
- `POST /api/auth/login`
- Save admin token

4. Move issue to in progress
- `PATCH /api/issues/<id>/status` with `in_progress`

5. Mark issue resolved by admin
- `PATCH /api/issues/<id>/status` with `resolved_by_admin`

6. Verify admin cannot close directly
- Try `PATCH /api/issues/<id>/status` with `closed`
- Expect authorization/conflict style error

7. Confirm resolution as reporter
- `POST /api/issues/<id>/confirm-resolution`
- Expect `status: closed`

## Role/Access Checks

- Unverified student cannot create issue
- Student cannot update issue status as admin
- Non-reporter student cannot confirm resolution
- Admin endpoints reject student token

## Event Checks

- Student can register/unregister according to event status
- Admin can create/update/delete events

## Useful Existing Script

- `backend/tests/smoke_test.py`

Use this for quick regression checks after API or lifecycle changes.