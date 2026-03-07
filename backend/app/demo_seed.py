import os
from datetime import datetime, timedelta
from uuid import uuid4

from werkzeug.security import generate_password_hash

from app.models import (
    db,
    User,
    UserRole,
    UserStatus,
    HostelEvent,
    HostelIssue,
    EventType,
    RegistrationStatus,
    IssueStatus,
    IssuePriority,
)


DEMO_EVENT_PAYLOADS = [
    {
        'title': 'Hostel Cultural Night 2026',
        'description': 'An evening of music, dance, and performances by students from all hostels.',
        'event_type': EventType.CULTURAL,
        'sports_type': None,
        'days_from_now': 5,
        'start_time': '18:00',
        'end_time': '21:30',
        'venue': 'Central Auditorium',
        'registration_status': RegistrationStatus.OPEN,
        'total_slots': 300,
        'organizer': 'Student Affairs Council',
        'image_url': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    },
    {
        'title': 'Inter-Hostel Cricket Tournament',
        'description': 'Competitive T20 cricket tournament between hostel teams.',
        'event_type': EventType.SPORTS,
        'sports_type': 'cricket',
        'days_from_now': 9,
        'start_time': '07:30',
        'end_time': '13:00',
        'venue': 'Main Sports Ground',
        'registration_status': RegistrationStatus.OPEN,
        'total_slots': 120,
        'organizer': 'Sports Committee',
        'image_url': 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    },
    {
        'title': 'Hostel Football Knockout',
        'description': 'Fast-paced football knockout event with prizes for top teams.',
        'event_type': EventType.SPORTS,
        'sports_type': 'football',
        'days_from_now': 14,
        'start_time': '16:00',
        'end_time': '19:00',
        'venue': 'Football Turf Arena',
        'registration_status': RegistrationStatus.UPCOMING,
        'total_slots': 80,
        'organizer': 'Sports Committee',
        'image_url': 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
    },
]

DEMO_ISSUE_PAYLOADS = [
    {
        'title': 'Water leakage in Hostel A, Room 201',
        'description': 'Continuous water leakage from washroom pipeline causing floor flooding.',
        'category': 'plumbing',
        'status': IssueStatus.IN_PROGRESS,
        'priority_final': IssuePriority.HIGH,
        'hostel': 'A',
        'floor': 2,
        'room': '201',
    },
    {
        'title': 'WiFi down in 3rd floor study hall',
        'description': 'No internet connectivity since last evening in the study area.',
        'category': 'internet',
        'status': IssueStatus.REPORTED,
        'priority_final': IssuePriority.MEDIUM,
        'hostel': 'A',
        'floor': 3,
        'room': 'Study-Hall',
    },
    {
        'title': 'Mess food quality concern (Block B)',
        'description': 'Multiple students reported stale food smell over last 2 days.',
        'category': 'food',
        'status': IssueStatus.RESOLVED_BY_ADMIN,
        'priority_final': IssuePriority.HIGH,
        'hostel': 'B',
        'floor': 0,
        'room': 'Mess',
    },
]


def env_flag(name: str, default: str = 'false') -> bool:
    return os.getenv(name, default).lower() in ('1', 'true', 'yes')


def get_demo_student_email() -> str:
    return os.getenv('DEMO_STUDENT_EMAIL', 'student.demo@hostel.com').strip().lower()


def upsert_demo_student(force_update: bool = False) -> dict:
    email = get_demo_student_email()
    password = os.getenv('DEMO_STUDENT_PASSWORD', 'demo123')
    name = os.getenv('DEMO_STUDENT_NAME', 'Demo Student')
    hostel = os.getenv('DEMO_STUDENT_HOSTEL', 'A')

    student = User.query.filter_by(email=email).first()
    if student and not force_update:
        if student.role != UserRole.STUDENT:
            student.role = UserRole.STUDENT
        if student.status != UserStatus.VERIFIED:
            student.status = UserStatus.VERIFIED
        if student.hostel != hostel:
            student.hostel = hostel
        db.session.commit()
        return {'email': email, 'action': 'exists', 'id': student.id}

    if student:
        student.name = name
        student.password_hash = generate_password_hash(password)
        student.role = UserRole.STUDENT
        student.hostel = hostel
        student.status = UserStatus.VERIFIED
        db.session.commit()
        return {'email': email, 'action': 'updated', 'id': student.id}

    student = User(
        id=str(uuid4()),
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role=UserRole.STUDENT,
        hostel=hostel,
        status=UserStatus.VERIFIED,
    )
    db.session.add(student)
    db.session.commit()
    return {'email': email, 'action': 'created', 'id': student.id}


def seed_demo_events() -> int:
    base_date = datetime.utcnow()
    created_count = 0

    for payload in DEMO_EVENT_PAYLOADS:
        existing = HostelEvent.query.filter_by(title=payload['title']).first()
        if existing:
            continue

        event = HostelEvent(
            id=f"event-{uuid4()}",
            title=payload['title'],
            description=payload['description'],
            event_type=payload['event_type'],
            sports_type=payload['sports_type'],
            date=base_date + timedelta(days=payload['days_from_now']),
            start_time=payload['start_time'],
            end_time=payload['end_time'],
            venue=payload['venue'],
            registration_status=payload['registration_status'],
            total_slots=payload['total_slots'],
            organizer=payload['organizer'],
            image_url=payload['image_url'],
        )
        db.session.add(event)
        created_count += 1

    if created_count:
        db.session.commit()

    return created_count


def seed_demo_issues() -> int:
    demo_email = get_demo_student_email()
    reporter = User.query.filter_by(email=demo_email).first()

    if not reporter:
        student_result = upsert_demo_student(force_update=False)
        reporter = User.query.get(student_result['id'])

    if not reporter:
        return 0

    if reporter.role != UserRole.STUDENT:
        reporter.role = UserRole.STUDENT
    if reporter.status != UserStatus.VERIFIED:
        reporter.status = UserStatus.VERIFIED

    created_count = 0
    for payload in DEMO_ISSUE_PAYLOADS:
        existing = HostelIssue.query.filter_by(title=payload['title']).first()
        if existing:
            continue

        issue = HostelIssue(
            id=f"issue-{uuid4()}",
            title=payload['title'],
            description=payload['description'],
            category=payload['category'],
            status=payload['status'],
            priority_final=payload['priority_final'],
            priority_ai_suggested=payload['priority_final'],
            ai_reason='Demo seeded issue for showcase environment.',
            reporter_id=reporter.id,
            hostel=payload['hostel'],
            floor=payload['floor'],
            room=payload['room'],
            reported_date=datetime.utcnow() - timedelta(days=1),
        )
        db.session.add(issue)
        created_count += 1

    db.session.commit()
    return created_count


def reset_demo_data() -> dict:
    event_titles = [item['title'] for item in DEMO_EVENT_PAYLOADS]
    issue_titles = [item['title'] for item in DEMO_ISSUE_PAYLOADS]

    events = HostelEvent.query.filter(HostelEvent.title.in_(event_titles)).all()
    issues = HostelIssue.query.filter(HostelIssue.title.in_(issue_titles)).all()

    deleted_events = len(events)
    deleted_issues = len(issues)

    for event in events:
        db.session.delete(event)

    for issue in issues:
        db.session.delete(issue)

    db.session.commit()

    return {
        'deletedEvents': deleted_events,
        'deletedIssues': deleted_issues,
    }


def seed_demo_data(force_update_student: bool = False, reset: bool = False) -> dict:
    result = {
        'reset': {'deletedEvents': 0, 'deletedIssues': 0},
        'student': {},
        'createdEvents': 0,
        'createdIssues': 0,
    }

    if reset:
        result['reset'] = reset_demo_data()

    result['student'] = upsert_demo_student(force_update=force_update_student)
    result['createdEvents'] = seed_demo_events()
    result['createdIssues'] = seed_demo_issues()

    return result
