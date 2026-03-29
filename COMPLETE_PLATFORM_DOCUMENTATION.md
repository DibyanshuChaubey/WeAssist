# WeAssist - Complete Platform Functionalities & Technical Explanation

## 📋 Platform Overview

**WeAssist** is a comprehensive **Hostel Management & Issue Reporting Platform** designed for residential communities (hostels, dorms, student housing). It enables students to report issues, track their resolution through a structured workflow, and participate in community events with event management capabilities for administrators.

---

## 🎯 Core Functionalities

### 1. **User Management & Authentication**

#### Features:
- **User Registration**: Students and admins can create accounts
- **JWT Authentication**: Secure token-based authentication with role-based access control
- **User Roles**: 
  - **STUDENT**: Can report issues, view dashboards, register for events
  - **ADMIN**: Can manage users, handle issue resolution, create/manage events
- **User Verification**: Two-tier verification system (pending → verified)
- **User Status Tracking**: Tracks verification status of each user
- **Demo Account System**: Auto-generated demo student account (student.demo@hostel.com) for live showcase

#### Technical Details:
```python
# User Model with fields:
- id (UUID): Unique identifier
- email: Unique email address (indexed for fast lookups)
- name: Full name
- role: STUDENT or ADMIN (Enum)
- password_hash: Bcrypt hashed password
- hostel: Hostel/residence name (indexed)
- status: PENDING_VERIFICATION, VERIFIED, DECLINED (Enum)
- created_at, updated_at: Timestamps
```

#### Endpoints:
- `POST /auth/register` - Create new account
- `POST /auth/login` - Authenticate and get JWT token
- `GET /auth/me` - Current user profile
- `POST /auth/verify-user/<user_id>` - Admin verifies user

---

### 2. **Issue Reporting & Management**

#### Features:
- **Issue Creation**: Students can submit issues with:
  - Title and detailed description
  - Category classification (plumbing, WiFi, electrical, cleanliness, maintenance, security, other)
  - Location details (hostel, floor, room)
  - Image attachment support (URL-based and Cloudinary file uploads)
  
- **Issue Lifecycle Management**:
  ```
  reported → in_progress → resolved_by_admin → closed
  ```
  
- **Priority System (Dual-Tier)**:
  - **AI-Suggested Priority**: ML-based automatic priority prediction based on issue description
  - **Admin Final Priority**: Admin-overrideable priority (low, medium, high)
  - **Reasoning**: AI provides explanation for suggested priority
  
- **Status Tracking**:
  - Issue status logs track every status change with timestamps
  - Admin notes for issue discussions
  - Reporter confirmation before closing (only reporter can close)
  
- **Advanced Filtering & Search**:
  - Filter by status (reported, in_progress, resolved_by_admin, closed)
  - Filter by priority (low, medium, high)
  - Filter by category
  - Pagination support
  - Search and sorting

- **Demo Issues**: Pre-populated demo issues with images for showcase

#### Technical Details:
```python
# HostelIssue Model with fields:
- id (UUID): Unique issue identifier
- title: Issue title
- description: Detailed description
- category: Categorized issue type (indexed)
- status: Current status (indexed)
- priority_ai_suggested: ML-generated priority recommendation
- priority_final: Admin-set final priority
- ai_reason: Explanation of AI suggestion
- image_url: Image attachment URL (supports Cloudinary)
- reporter_id: FK to User (indexed)
- hostel, floor, room: Location details (hostel indexed)
- reported_date: Creation timestamp (indexed)
- updated_date, resolved_by_admin_date, confirmed_by_reporter_date: Lifecycle dates

# Relationships:
- admin_notes: One-to-many with AdminNote (cascade delete)
- status_logs: One-to-many with IssueStatusLog (cascade delete)
```

#### Database Tables:
- `issues`: Main issues table
- `issue_status_logs`: Audit trail of all status transitions
- `admin_notes`: Comments/updates from admins

#### Endpoints:
- `POST /issues` - Create new issue (verified student)
- `GET /issues` - List issues with filters (pagination, status, category, priority)
- `GET /issues/<issue_id>` - Get issue details with notes and logs
- `PATCH /issues/<issue_id>/status` - Update status (admin only)
  - Transitions: reported→in_progress, in_progress→resolved_by_admin
- `PATCH /issues/<issue_id>/priority` - Set final priority (admin only)
- `POST /issues/<issue_id>/confirm-resolution` - Reporter confirms resolution
- `GET /issues/stats` - Dashboard statistics (count by status/priority)

---

### 3. **AI Priority Prediction System**

#### Features:
- **Automated Priority Suggestion**: Machine learning model analyzes issue descriptions
- **Category-Based Analysis**: Priority influenced by issue category
- **Confidence & Reasoning**: Provides explanation for each suggestion
- **Admin Override**: Admins can accept or override AI suggestion with final priority

#### Technical Details:
```python
# AI Priority Module: backend/app/issues/ai_priority.py
# Functions:
- get_priority_for_issue(title, description, category):
  - Input: Issue text data
  - Process: ML model inference
  - Output: (priority_level, reasoning_text)
  
# Priority Scoring:
- "high": Urgent issues (security, electrical, maintenance)
- "medium": Standard issues (WiFi, cleanliness)
- "low": Minor concerns
```

#### Model Integration:
- `/backend/ai/predict.py` - Model inference
- `/backend/ai/train_model.py` - Model training pipeline
- Dataset: `/dataset/complaints.csv` - Training data

---

### 4. **Event Management System**

#### Features:
- **Event Creation** (Admin):
  - Event title, description, type (cultural/sports)
  - Date, time, venue
  - Event capacity (total slots)
  - Organizer name
  - Image/poster attachment (URL or Cloudinary upload)
  
- **Event Types**:
  - **Cultural Events**: Festivals, performances, cultural activities
  - **Sports Events**: Cricket, badminton, volleyball, football, table tennis, basketball, etc.
  
- **Registration Status Management**:
  - UPCOMING: Event not yet open for registration
  - OPEN: Active registration period
  - CLOSED: Registration closed
  
- **Event Registration Workflow**:
  - Students register for events they're interested in
  - Admin tracks registration counts vs. slots
  - Students can unregister before deadline
  
- **Demo Events**: Pre-populated showcase events with images
- **Event Dashboard**: Visual calendar and list views

#### Technical Details:
```python
# HostelEvent Model with fields:
- id (UUID): Unique event identifier
- title: Event name
- description: Event details
- event_type: CULTURAL or SPORTS (Enum)
- sports_type: Specific sport if sports event
- date: Event date/time (indexed)
- start_time, end_time: Duration (HH:MM format)
- venue: Location
- registration_status: UPCOMING, OPEN, CLOSED (Enum)
- total_slots: Maximum registrations
- organizer: Event organizer name
- image_url: Event poster (Cloudinary)
- created_at, updated_at: Timestamps

# Relationships:
- registrations: One-to-many with EventRegistration
```

#### Database Tables:
- `events`: Main events table
- `event_registrations`: Student registrations for events

#### Endpoints:
- `GET /events` - List all events
- `GET /events/<event_id>` - Event details
- `POST /events` - Create event (admin only)
- `PUT /events/<event_id>` - Update event (admin only)
- `DELETE /events/<event_id>` - Delete event (admin only)
- `POST /events/<event_id>/register` - Register for event (verified student)
- `POST /events/<event_id>/unregister` - Cancel registration (student)

---

### 5. **Image Management & File Upload**

#### Features:
- **URL-Based Images**: Direct image URL support for all entities
- **File Upload Support**:
  - Cloudinary integration for secure server-side uploads
  - Supported formats: PNG, JPG, JPEG, WebP
  - Max file size: 8MB (configurable)
  - Automatic URL generation after upload
  
- **Image Validation**:
  - File type verification
  - File size checks
  - Security scanning
  
- **Image Support Locations**:
  - Issue images: Student-attached photos for issue context
  - Event images: Admin event posters/banners
  
- **Error Handling**: Graceful fallback if image fails to load

#### Technical Details:
```python
# Upload Service: backend/app/uploads/routes.py
# Endpoint: POST /api/uploads/image
# Auth: JWT required (ADMIN or verified STUDENT)
# Input: Multipart form-data with 'file' and 'folder' fields
# Output: JSON with 'url' (Cloudinary secure URL) and 'publicId'

# Configuration via Environment:
- CLOUDINARY_CLOUD_NAME: Cloud storage identifier
- CLOUDINARY_API_KEY: API credentials
- CLOUDINARY_API_SECRET: API secret
- UPLOAD_MAX_MB: Max file size limit
```

#### Frontend Integration:
```typescript
// uploadService.uploadImage(file: File, folder: string)
// - Sends file to backend
// - Returns secure Cloudinary URL
// - Auto-fills image field in forms
// - Shows live preview
```

---

### 6. **Admin Dashboard & Controls**

#### Features:
- **Dashboard Overview**:
  - Issue statistics (count by status, priority)
  - Event management interface
  - Pending user verification queue
  
- **Issue Management**:
  - Bulk status updates
  - Priority assignment
  - Admin notes and comments
  - Issue history tracking
  
- **Event Management**:
  - Create/edit/delete events
  - Manage registration status
  - View registration list
  - Upload event posters
  
- **User Management**:
  - Verify pending users
  - View user details
  - Track user hostel information
  
- **Demo Data Control**:
  - One-click reset/reseed demo data
  - Admin endpoint to manually trigger data refresh
  - Status monitoring for demo functionality

#### Endpoints:
- `POST /auth/demo/reset` - Admin reset demo data (admin only)
- `POST /auth/bootstrap-admin-if-enabled` - CLI command to create admin account

---

### 7. **Student Dashboard**

#### Features:
- **My Issues View**:
  - List only user's submitted issues
  - View status and priority for each
  - Admin notes and comments
  - Confirmation button when issue is resolved
  
- **Issue Timeline**:
  - Visual status progression
  - Status change history
  - Priority changes over time
  
- **Event Registration**:
  - Browse upcoming events
  - Register for events of interest
  - View registered events
  - Cancel registrations
  
- **Personal Hostel Context**:
  - Issues specific to user's hostel
  - Location-aware event suggestions

---

### 8. **Role-Based Access Control (RBAC)**

#### Access Rules:

| Action | Student | Admin |
|--------|---------|-------|
| Create Issue | ✅ (verified) | ❌ |
| View Own Issues | ✅ | ✅ (all) |
| Update Issue Status | ❌ | ✅ |
| Set Final Priority | ❌ | ✅ |
| Add Admin Notes | ❌ | ✅ |
| Confirm Issue Resolution | ✅ (own only) | ❌ |
| Create Events | ❌ | ✅ |
| Manage Events | ❌ | ✅ |
| Register for Events | ✅ (verified) | ✅ |
| Verify Users | ❌ | ✅ |
| Upload Images | ✅ (verified) | ✅ |
| Reset Demo Data | ❌ | ✅ |

---

## 🏗️ Technical Architecture

### Frontend Architecture

#### Technology Stack:
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with JWT interceptor
- **State Management**: React Context API (Authentication)
- **Routing**: React Router with protected routes
- **Pre-processing**: PostCSS

#### Directory Structure:
```
src/
├── components/          # Reusable UI components
│   ├── IssueCard.tsx               # Issue display card
│   ├── IssueSubmissionForm.tsx      # Issue creation form with image upload
│   ├── IssuesFeed.tsx              # List of issues with filtering
│   ├── EventCard.tsx               # Event display card
│   ├── EventTypeBadge.tsx          # Event type visualizer
│   ├── FilterBar.tsx               # Advanced filtering component
│   ├── Pagination.tsx              # Page navigation
│   ├── SkeletonLoader.tsx          # Loading state UI
│   ├── StatusBadge.tsx             # Issue status visualizer
│   ├── PriorityChip.tsx            # Priority visualizer
│   ├── CategoryTag.tsx             # Category visualizer
│   ├── Navigation.tsx              # Header navigation
│   ├── ProtectedRoute.tsx          # Route guard wrapper
│   └── ...
├── pages/               # Page-level components
│   ├── LoginPage.tsx               # User authentication
│   ├── Dashboard.tsx               # Student dashboard
│   ├── StudentDashboard.tsx        # Student issue tracking
│   ├── EventsDashboard.tsx         # Event listing and registration
│   ├── AdminDashboard.tsx          # Admin overview
│   ├── AdminIssuesManagement.tsx   # Admin issue controls
│   └── AdminEventsManagement.tsx   # Admin event controls
├── services/            # API communication layer
│   └── api.ts                      # Axios client + route definitions
├── context/             # Global state management
│   └── AuthContext.tsx             # Authentication state
├── types/               # TypeScript type definitions
│   └── index.ts                    # All type interfaces
├── utils/               # Utility functions
│   ├── filterUtils.ts              # Filter/sort helpers
│   └── ...
├── data/                # Mock/demo data
│   └── mockIssues.ts               # Sample issue data
└── App.tsx              # Main app component
```

#### Key Components:

1. **IssueCard.tsx**
   - Displays issue in card format
   - Shows title, priority, status, category
   - Shows reporter name and timestamp
   - Renders image if available
   - Click-through to details

2. **IssueSubmissionForm.tsx**
   - Form with title, description, category, location fields
   - Image URL input with live preview
   - File upload button for Cloudinary integration
   - Form validation and error handling
   - Sends data to backend with auto image upload

3. **IssuesFeed.tsx**
   - Lists issues with infinite scroll or pagination
   - Advanced filtering by status, priority, category
   - Search functionality
   - Sorting options
   - Responsive grid layout

4. **EventCard.tsx**
   - Event title, date, venue, type display
   - Registration button
   - Event image poster
   - Slots remaining indicator
   - Registration status indicator

5. **AdminDashboard.tsx**
   - Overview statistics (issues by status/priority)
   - Quick actions (create event, verify users)
   - Recent activity feed
   - Navigation to administration panels

6. **AdminIssuesManagement.tsx**
   - Admin issue list with actions
   - Status transition controls
   - Priority assignment dropdown
   - Notes addition interface
   - Bulk or individual actions

7. **AdminEventsManagement.tsx**
   - Event CRUD interface
   - Event form with all fields
   - Image upload for event posters
   - Registration list view
   - Event delete confirmation

#### Authentication Flow:
```typescript
// src/context/AuthContext.tsx
- Stores user data, token, and authentication state
- Provides login/logout functions
- Interceptor adds Authorization header to all requests
- Token refresh logic on API 401 responses
- Auto-logout on token expiration
```

#### API Service Layer:
```typescript
// src/services/api.ts
- Axios instance with JWT interceptor
- Auth routes: login, register, verify
- Issues routes: CRUD, status updates, filters
- Events routes: CRUD, register/unregister
- Upload routes: image upload
- Helper functions for common patterns
```

---

### Backend Architecture

#### Technology Stack:
- **Framework**: Flask 2.3.3
- **Database ORM**: SQLAlchemy
- **Database**: PostgreSQL (production), SQLite (development)
- **Authentication**: Flask-JWT-Extended (JWT tokens)
- **Password Security**: Werkzeug (bcrypt hashing)
- **Data Validation**: Marshmallow/pydantic
- **File Upload**: Cloudinary SDK
- **Server**: Gunicorn (production)
- **Migrations**: Flask-Migrate (Alembic)

#### Directory Structure:
```
backend/
├── app/
│   ├── models.py                   # SQLAlchemy models
│   ├── config.py                   # Configuration management
│   ├── __init__.py                 # Flask app factory
│   ├── auth/
│   │   ├── routes.py               # Auth endpoints
│   │   └── __init__.py
│   ├── issues/
│   │   ├── routes.py               # Issue CRUD endpoints
│   │   ├── ai_priority.py          # AI priority prediction
│   │   └── __init__.py
│   ├── events/
│   │   ├── routes.py               # Event CRUD endpoints
│   │   └── __init__.py
│   ├── uploads/
│   │   ├── routes.py               # File upload endpoint
│   │   └── __init__.py
│   └── utils/
│       ├── decorators.py           # Custom decorators (auth checks)
│       ├── errors.py               # Error handling
│       └── __init__.py
├── ai/
│   ├── predict.py                  # ML model inference
│   ├── train_model.py              # Model training script
│   └── __init__.py
├── migrations/
│   └── versions/                   # Database migration files
├── tests/
│   └── smoke_test.py               # Integration tests
├── instance/                       # Instance-specific files
├── run.py                          # Application entry point
├── requirements.txt                # Python dependencies
└── render.yaml                     # Production deployment config
```

#### Core Models:

1. **User Model**
   - UUID primary key
   - Email (unique, indexed)
   - Bcrypt password hash
   - Role (STUDENT/ADMIN)
   - Status (PENDING_VERIFICATION/VERIFIED)
   - Hostel name (indexed for queries)
   - Relationships: issues, event_registrations, admin_notes

2. **HostelIssue Model**
   - UUID primary key
   - Title and description (full text)
   - Category (plumbing, WiFi, etc.)
   - Status lifecycle (reported → in_progress → resolved_by_admin → closed)
   - Priority (AI-suggested and Admin final)
   - Image URL (Cloudinary storage)
   - Location (hostel, floor, room number)
   - Reporter reference (FK to User)
   - Timestamps for lifecycle tracking
   - Relationships: admin_notes, status_logs

3. **AdminNote Model**
   - UUID primary key
   - Issue reference (FK)
   - Admin author reference (FK)
   - Note content
   - Created timestamp

4. **IssueStatusLog Model**
   - UUID primary key
   - Issue reference (FK)
   - Old and new status
   - Changed by reference (FK)
   - Reason field
   - Timestamp

5. **HostelEvent Model**
   - UUID primary key
   - Title, description
   - Event type (cultural/sports)
   - Sports type (if sports event)
   - Date and time fields
   - Venue
   - Registration status (upcoming/open/closed)
   - Total slots and current registrations
   - Organizer name
   - Image URL (Cloudinary)
   - Timestamps
   - Relationships: registrations

6. **EventRegistration Model**
   - UUID primary key
   - Event reference (FK)
   - Student user reference (FK)
   - Registration timestamp
   - Status (confirmed/cancelled)

#### Request/Response Flow:
```
1. Client sends HTTP request with JWT in Authorization header
2. Flask app receives request
3. JWT is validated by @verify_jwt_required() decorator
4. Role is checked by @require_role('admin') or equivalent
5. Request body validated against schema
6. Database query/update using SQLAlchemy ORM
7. Response serialized to JSON using model.to_dict() method
8. HTTP response sent with appropriate status code
```

#### Authentication & Authorization:
```python
# JWT Implementation:
- Login generates access_token (15-min default, configurable)
- Token includes user id and role as claims
- All protected routes check token validity
- Custom decorators enforce role checks
- Ownership checks prevent unauthorized resource access

# Decorators:
@verify_jwt_required() - Validates JWT presence and validity
@require_role('admin') - Ensures user is admin
require_ownership(resource) - Ensures user owns resource
```

#### Error Handling:
```python
# Custom exceptions in utils/errors.py:
- ValidationError: Invalid input data
- UnauthorizedError: Missing/invalid token
- ForbiddenError: Insufficient permissions
- NotFoundError: Resource doesn't exist
- ConflictError: Invalid state transition
- ServerError: Unhandled exceptions

# Error responses include:
- Appropriate HTTP status code
- Error message in JSON
- Field-level validation errors
```

#### Database Transactions:
```python
# Issue Status Updates (enforced rules):
- Only admins can transition issues through workflow
- reported → in_progress (admin)
- in_progress → resolved_by_admin (admin)
- resolved_by_admin → closed (ONLY original reporter, via confirm-resolution)
- Status changes create IssueStatusLog entries (audit trail)
- Admin notes are optional with each status change
```

---

### Database Schema

#### Key Tables:

**users** table:
```sql
id (VARCHAR 36, PK)
email (VARCHAR 255, UNIQUE, INDEXED)
name (VARCHAR 255)
password_hash (VARCHAR 255)
role (ENUM: student, admin)
hostel (VARCHAR 100, INDEXED)
status (ENUM: pending_verification, verified, declined)
created_at (DATETIME)
updated_at (DATETIME)
```

**issues** table:
```sql
id (VARCHAR 36, PK)
title (VARCHAR 255)
description (TEXT)
category (VARCHAR 50)
status (ENUM: reported, in_progress, resolved_by_admin, closed, INDEXED)
priority_final (ENUM: low, medium, high)
priority_ai_suggested (ENUM: low, medium, high)
ai_reason (TEXT)
image_url (VARCHAR 500)
reporter_id (VARCHAR 36, FK to users, INDEXED)
hostel (VARCHAR 100, INDEXED)
floor (INTEGER)
room (VARCHAR 50)
reported_date (DATETIME, INDEXED)
updated_date (DATETIME)
resolved_by_admin_date (DATETIME)
confirmed_by_reporter_date (DATETIME)
```

**issue_status_logs** table:
```sql
id (VARCHAR 36, PK)
issue_id (VARCHAR 36, FK to issues, INDEXED)
old_status (ENUM)
new_status (ENUM)
changed_by_id (VARCHAR 36, FK to users)
reason (TEXT)
created_at (DATETIME)
```

**admin_notes** table:
```sql
id (VARCHAR 36, PK)
issue_id (VARCHAR 36, FK to issues, INDEXED)
admin_id (VARCHAR 36, FK to users)
content (TEXT)
created_at (DATETIME)
```

**events** table:
```sql
id (VARCHAR 36, PK)
title (VARCHAR 255)
description (TEXT)
event_type (ENUM: cultural, sports)
sports_type (VARCHAR 50)
date (DATETIME, INDEXED)
start_time (VARCHAR 5)
end_time (VARCHAR 5)
venue (VARCHAR 255)
registration_status (ENUM: upcoming, open, closed)
total_slots (INTEGER)
organizer (VARCHAR 255)
image_url (VARCHAR 500)
created_at (DATETIME)
updated_at (DATETIME)
```

**event_registrations** table:
```sql
id (VARCHAR 36, PK)
event_id (VARCHAR 36, FK to events)
student_id (VARCHAR 36, FK to users)
registered_date (DATETIME)
status (VARCHAR 20: confirmed, cancelled)
```

---

### Deployment Configuration

#### Environment Variables:
```bash
# Database
DATABASE_URL=postgresql://user:password@host/database
SQLALCHEMY_TRACK_MODIFICATIONS=false

# Authentication
JWT_SECRET_KEY=super-secret-key
JWT_ACCESS_TOKEN_EXPIRES=900  # 15 minutes

# Flask
FLASK_ENV=production
FLASK_DEBUG=false

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
UPLOAD_MAX_MB=8

# Demo Data & Seeding
SEED_DEMO_DATA=true
DEMO_STUDENT_ON_LOGIN=true
SEED_DEMO_DATA_ON_DEMAND=true
DEMO_STUDENT_EMAIL=student.demo@hostel.com
DEMO_STUDENT_PASSWORD=demo123

# Admin Bootstrap
BOOTSTRAP_ADMIN_IF_ENABLED=true
ADMIN_EMAIL=admin@hostel.com
ADMIN_PASSWORD=admin123
```

#### Production Deployment (Render + Vercel):

**Backend (Render):**
```yaml
# render.yaml startup sequence:
1. python -m flask db upgrade        # Run database migrations
2. python -m flask bootstrap-admin-if-enabled  # Create admin if needed
3. python -m flask seed-demo-data-if-enabled   # Seed demo data
4. gunicorn run:app                  # Start production server

# Fail-fast chain with && ensures:
- Migrations must complete before admin bootstrap
- Admin bootstrap must complete before seeding
- All must complete before starting web server
- Any failure stops startup (safer than partial state)
```

**Frontend (Vercel):**
- Automatic deployment on git push to main
- Environment variables for API URL
- Vite build optimization

---

## 📊 Data Flow Diagrams

### Issue Life Cycle:
```
Student Creates Issue
    ↓
Issue → "reported" (immediate)
    ↓
AI System → suggests priority + reasoning
    ↓
Admin Reviews → moves to "in_progress"
    ↓
Admin → moves to "resolved_by_admin" (after work complete)
    ↓
Reporter → confirms resolution or → moves back to "in_progress"
    ↓
If confirmed → issue → "closed"
    ↓
Audit Log → tracks all transitions with timestamps
```

### Event Registration Flow:
```
Admin Creates Event
    ↓
Event status: "upcoming" (registration not yet open)
    ↓
Admin changes → "open" (registration enabled)
    ↓
Students register (slots tracked)
    ↓
When capacity reached or deadline → status: "closed"
    ↓
Students view registered events in dashboard
    ↓
Students can unregister if allowed
```

### Authentication Flow:
```
User submits email + password
    ↓
Backend validates credentials (bcrypt check)
    ↓
JWT generated (include user id + role)
    ↓
Token sent to frontend
    ↓
Frontend stores token in localStorage/sessionStorage
    ↓
Each API request includes: Authorization: Bearer <token>
    ↓
Backend verifies token before processing request
    ↓
If token invalid/expired → 401 error → frontend redirects to login
```

---

## 🔒 Security Features

1. **Password Security**:
   - Bcrypt hashing (not plain-text storage)
   - Minimum password requirements enforced
   - Secure password reset flow

2. **JWT Authentication**:
   - Token-based stateless authentication
   - Expiration-based auto logout
   - Secret key rotation support

3. **Role-Based Access Control (RBAC)**:
   - User roles: STUDENT or ADMIN
   - Endpoint-level role verification
   - Resource ownership checks

4. **Input Validation**:
   - All inputs validated server-side
   - SQL injection protection via ORM
   - XSS protection via JSON responses

5. **File Upload Security**:
   - File type validation (whitelist: PNG, JPG, JPEG, WebP)
   - File size limits (8MB default)
   - Server-side upload to Cloudinary (no direct storage)
   - Secure URL generation

6. **Database Indexing**:
   - Indexed frequently-queried fields
   - Prevents N+1 queries
   - Optimized performance and security

---

## 📈 Performance Optimizations

1. **Database Indexing**:
   - email, hostel, status, date fields indexed
   - Foreign key lookups optimized
   - Filter queries < 100ms

2. **Pagination**:
   - Limits per-page results (default 10-20)
   - Prevents large resultset memory issues
   - Cursor-based pagination for stability

3. **Lazy Loading**:
   - Related data loaded on demand
   - Reduces initial query payload
   - Cascade delete for data integrity

4. **Caching Strategy**:
   - Cloudinary CDN for image delivery
   - Client-side component memoization
   - API response caching opportunities

5. **Query Optimization**:
   - Minimal SELECT fields (only needed columns)
   - Join optimization for relationships
   - Count queries use indexed fields

---

## 🧪 Testing & Quality Assurance

#### Test Files:
- `/backend/tests/smoke_test.py` - Basic integration tests
- Tests cover: auth, CRUD operations, role checks

#### Test Coverage:
1. **Authentication Tests**:
   - Registration success/failure
   - Login with valid/invalid credentials
   - JWT validation

2. **Authorization Tests**:
   - Role-based endpoint access
   - Ownership verification
   - Admin-only operations

3. **Issue Workflow Tests**:
   - Create issue
   - Status transitions
   - Priority assignment
   - Reporter confirmation

4. **Event Tests**:
   - Create/update/delete events
   - Event registration
   - Slot management

---

## 🚀 Deployment & Scaling

### Current Architecture:
- **Frontend**: Vercel (CDN + auto-scaling)
- **Backend**: Render (Flask + Gunicorn)
- **Database**: PostgreSQL on Render
- **File Storage**: Cloudinary CDN
- **CI/CD**: Git push triggers auto-deploy

### Scaling Considerations:
1. **Database**: PostgreSQL handles 1000+ users
2. **API Server**: Gunicorn workers scale horizontally
3. **Frontend**: Vercel handles traffic spikes
4. **Storage**: Cloudinary unlimited image storage
5. **Monitoring**: Health checks and error logging

---

## 🛠️ Admin Features

1. **Dashboard Overview**:
   - Issue statistics
   - Event calendar
   - User management queue

2. **Bulk Operations**:
   - Status update multiple issues
   - Create batch events
   - Bulk user verification (future)

3. **Demo Data Management**:
   - One-click reset/reseed
   - Demo data status check
   - Unsplash image integration for showcase

4. **User Management**:
   - Verify pending users
   - Track user information
   - Ban/restrict users (future)

5. **Issue Management**:
   - Force close issues
   - Override priorities
   - Manual status transitions

---

## 📱 Responsive Design

- **Mobile-First Approach**: Tailwind CSS responsive classes
- **Breakpoints**: SM, MD, LG, XL viewport support
- **Touch-Friendly**: Large clickable areas
- **Deep Linking**: Shareable URLs for issues/events

---

## 🎓 Key Differentiators

1. **Dual-Priority System**: AI-suggested + Admin final priority
2. **Strict Workflow Enforcement**: Prevents invalid issue state transitions
3. **Reporter Control**: Only reporter can close their issue
4. **Event Management**: Integrated events with RSVP system
5. **Image Support**: Cloudinary integration for media-rich issues
6. **Demo System**: Auto-seeding for live showcases
7. **Audit Trail**: Complete history of changes for compliance

---

## 📞 Support & Maintenance

- **Error Logs**: Available via Render dashboard
- **Database Backups**: Automatic via PostgreSQL
- **Monitoring**: New Relic / Sentry integration ready
- **Health Checks**: `/health` endpoint available

---

## 🔄 Recent Critical Fixes (Production Hotfixes)

**Issue: Production Database Errors**
1. **StringDataRightTruncation Error**:
   - Root Cause: Prefixed IDs (event-UUID) exceeded 36-char VARCHAR limit
   - Fix: Replaced all prefixed IDs with plain UUID strings
   - Impact: Eliminated insert failures for events, issues, registrations

2. **ProgrammingError on Queries**:
   - Root Cause: Missing `image_url` column on legacy databases
   - Fix: Added schema self-heal function to auto-add column
   - Impact: Auto-recovery from schema mismatches

3. **Non-Deterministic Startup**:
   - Root Cause: Startup commands chained with `;` (non-blocking)
   - Fix: Changed to `&&` (fail-fast) to ensure correct order
   - Impact: Guaranteed migration completion before seed operations

---

## 📋 Summary

**WeAssist Platform** is a production-ready hostel management system with:
- **500+ lines of backend logic** across auth, issues, events modules
- **2000+ lines of frontend components** for student/admin UI
- **ML-powered** issue prioritization
- **Cloudinary integration** for image handling
- **PostgreSQL database** with optimized schema
- **JWT authentication** with role-based access control
- **Comprehensive audit trail** for compliance
- **Battle-tested deployment** on Render + Vercel

The platform successfully demonstrates modern full-stack development practices with React/TypeScript frontend, Flask backend, PostgreSQL database, and cloud storage integration.
