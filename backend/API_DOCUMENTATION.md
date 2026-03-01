# WeAssist Backend API

Base URL: `http://127.0.0.1:5000/api`

All protected endpoints require:

`Authorization: Bearer <access_token>`

## Auth

- `POST /auth/register`
  - Create account (usually student)

- `POST /auth/login`
  - Returns `access_token` and `user`

- `GET /auth/me`
  - Returns current user profile

- `POST /auth/verify-user/<user_id>` (admin)
  - Marks user as verified

## Issues

- `POST /issues` (verified student)
  - Create issue with:
    - `title`, `description`, `category`
    - `location.hostel`, `location.floor`, `location.room`
  - Response includes:
    - `priority_ai_suggested`
    - `priority_final`
    - `ai_reason`

- `GET /issues`
  - Supports query params:
    - `page`, `per_page`, `status`, `category`, `priority`

- `GET /issues/<issue_id>`
  - Issue details with logs/notes (based on access)

- `PATCH /issues/<issue_id>/status` (admin)
  - Allowed transitions:
    - `reported -> in_progress`
    - `in_progress -> resolved_by_admin`
  - Not allowed:
    - direct admin close to `closed`

- `PATCH /issues/<issue_id>/priority` (admin)
  - Set `priority_final` to `low|medium|high`

- `POST /issues/<issue_id>/confirm-resolution` (reporter only)
  - Allowed only when current status is `resolved_by_admin`
  - Sets status to `closed`

- `GET /issues/stats`
  - Summary stats for dashboards

## Events

- `GET /events`
  - List events

- `GET /events/<event_id>`
  - Event details

- `POST /events` (admin)
  - Create event

- `PUT /events/<event_id>` (admin)
  - Update event

- `DELETE /events/<event_id>` (admin)
  - Delete event

- `POST /events/<event_id>/register` (verified student)
  - Register for an event

- `POST /events/<event_id>/unregister` (verified student)
  - Cancel registration

## Common Status Codes

- `200` Success
- `201` Created
- `400` Validation failure
- `401` Unauthorized / missing token
- `403` Forbidden (role/ownership mismatch)
- `404` Not found
- `409` Conflict (invalid state transition)