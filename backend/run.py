import os
from app import create_app, db
from app.models import (
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
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
from uuid import uuid4

app = create_app(os.getenv('FLASK_ENV', 'development'))


def env_flag(name: str, default: str = 'false') -> bool:
    return os.getenv(name, default).lower() in ('1', 'true', 'yes')

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
    }

def upsert_bootstrap_admin(force_update=False):
    email = os.getenv('BOOTSTRAP_ADMIN_EMAIL', 'admin@hostel.com').strip().lower()
    password = os.getenv('BOOTSTRAP_ADMIN_PASSWORD')
    name = os.getenv('BOOTSTRAP_ADMIN_NAME', 'System Admin')
    hostel = os.getenv('BOOTSTRAP_ADMIN_HOSTEL', 'A')

    if not password:
        print('BOOTSTRAP_ADMIN_PASSWORD is required for admin bootstrap.')
        return False

    admin = User.query.filter_by(email=email).first()
    if admin and not force_update:
        print(f'Bootstrap admin already exists: {email}')
        return True

    if admin:
        admin.name = name
        admin.password_hash = generate_password_hash(password)
        admin.role = UserRole.ADMIN
        admin.hostel = hostel
        admin.status = UserStatus.VERIFIED
        db.session.commit()
        print(f'Bootstrap admin updated: {email}')
        return True

    admin = User(
        id=str(uuid4()),
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role=UserRole.ADMIN,
        hostel=hostel,
        status=UserStatus.VERIFIED,
    )
    db.session.add(admin)
    db.session.commit()
    print(f'Bootstrap admin created: {email}')
    return True


@app.cli.command('bootstrap-admin')
def bootstrap_admin():
    """Create or update bootstrap admin from environment variables."""
    force_update = env_flag('BOOTSTRAP_ADMIN_FORCE_UPDATE', 'false')
    upsert_bootstrap_admin(force_update=force_update)


@app.cli.command('bootstrap-admin-if-enabled')
def bootstrap_admin_if_enabled():
    """Conditionally bootstrap admin if BOOTSTRAP_ADMIN_ON_START=true."""
    if not env_flag('BOOTSTRAP_ADMIN_ON_START', 'false'):
        print('BOOTSTRAP_ADMIN_ON_START is false; skipping admin bootstrap.')
        return

    force_update = env_flag('BOOTSTRAP_ADMIN_FORCE_UPDATE', 'false')
    upsert_bootstrap_admin(force_update=force_update)


def upsert_demo_student(force_update=False):
    """Create or update demo student account for showcase purposes."""
    email = os.getenv('DEMO_STUDENT_EMAIL', 'student.demo@hostel.com').strip().lower()
    password = os.getenv('DEMO_STUDENT_PASSWORD', 'demo123')
    name = os.getenv('DEMO_STUDENT_NAME', 'Demo Student')
    hostel = os.getenv('DEMO_STUDENT_HOSTEL', 'A')

    student = User.query.filter_by(email=email).first()
    if student and not force_update:
        print(f'Demo student already exists: {email}')
        return True

    if student:
        student.name = name
        student.password_hash = generate_password_hash(password)
        student.role = UserRole.STUDENT
        student.hostel = hostel
        student.status = UserStatus.VERIFIED
        db.session.commit()
        print(f'Demo student updated: {email}')
        return True

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
    print(f'Demo student created: {email}')
    return True


@app.cli.command('seed-demo-student')
def seed_demo_student():
    """Create or update demo student account from environment variables."""
    force_update = env_flag('DEMO_STUDENT_FORCE_UPDATE', 'false')
    upsert_demo_student(force_update=force_update)


@app.cli.command('seed-demo-student-if-enabled')
def seed_demo_student_if_enabled():
    """Conditionally seed demo student if SEED_DEMO_STUDENT=true."""
    if not env_flag('SEED_DEMO_STUDENT', 'false'):
        print('SEED_DEMO_STUDENT is false; skipping demo student seeding.')
        return

    force_update = env_flag('DEMO_STUDENT_FORCE_UPDATE', 'false')
    upsert_demo_student(force_update=force_update)


def upsert_demo_events():
    """Create showcase demo events if missing (idempotent by title)."""
    base_date = datetime.utcnow()
    demo_events = [
        {
            'title': 'Hostel Cultural Night 2026',
            'description': 'An evening of music, dance, and performances by students from all hostels.',
            'event_type': EventType.CULTURAL,
            'date': base_date + timedelta(days=5),
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
            'date': base_date + timedelta(days=9),
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
            'date': base_date + timedelta(days=14),
            'start_time': '16:00',
            'end_time': '19:00',
            'venue': 'Football Turf Arena',
            'registration_status': RegistrationStatus.UPCOMING,
            'total_slots': 80,
            'organizer': 'Sports Committee',
            'image_url': 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
        },
    ]

    created_count = 0
    for event_data in demo_events:
        existing = HostelEvent.query.filter_by(title=event_data['title']).first()
        if existing:
            continue

        event = HostelEvent(
            id=f"event-{uuid4()}",
            title=event_data['title'],
            description=event_data['description'],
            event_type=event_data['event_type'],
            sports_type=event_data.get('sports_type'),
            date=event_data['date'],
            start_time=event_data.get('start_time'),
            end_time=event_data.get('end_time'),
            venue=event_data['venue'],
            registration_status=event_data['registration_status'],
            total_slots=event_data['total_slots'],
            organizer=event_data['organizer'],
            image_url=event_data['image_url'],
        )
        db.session.add(event)
        created_count += 1

    if created_count:
        db.session.commit()
    print(f'Demo events seeded: {created_count} created')


def upsert_demo_issues():
    """Create showcase demo issues if missing (idempotent by title)."""
    demo_email = os.getenv('DEMO_STUDENT_EMAIL', 'student.demo@hostel.com').strip().lower()
    reporter = User.query.filter_by(email=demo_email).first()

    if not reporter:
        upsert_demo_student(force_update=False)
        reporter = User.query.filter_by(email=demo_email).first()

    if not reporter:
        print('Skipping demo issue seed: demo student not available.')
        return

    if reporter.role != UserRole.STUDENT:
        reporter.role = UserRole.STUDENT
    if reporter.status != UserStatus.VERIFIED:
        reporter.status = UserStatus.VERIFIED

    demo_issues = [
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

    created_count = 0
    for issue_data in demo_issues:
        existing = HostelIssue.query.filter_by(title=issue_data['title']).first()
        if existing:
            continue

        issue = HostelIssue(
            id=f"issue-{uuid4()}",
            title=issue_data['title'],
            description=issue_data['description'],
            category=issue_data['category'],
            status=issue_data['status'],
            priority_final=issue_data['priority_final'],
            priority_ai_suggested=issue_data['priority_final'],
            ai_reason='Demo seeded issue for showcase environment.',
            reporter_id=reporter.id,
            hostel=issue_data['hostel'],
            floor=issue_data['floor'],
            room=issue_data['room'],
            reported_date=datetime.utcnow() - timedelta(days=1),
        )
        db.session.add(issue)
        created_count += 1

    if created_count:
        db.session.commit()
    print(f'Demo issues seeded: {created_count} created')


@app.cli.command('seed-demo-data')
def seed_demo_data():
    """Seed showcase demo student, events and issues (idempotent)."""
    force_update_student = env_flag('DEMO_STUDENT_FORCE_UPDATE', 'false')
    upsert_demo_student(force_update=force_update_student)
    upsert_demo_events()
    upsert_demo_issues()


@app.cli.command('seed-demo-data-if-enabled')
def seed_demo_data_if_enabled():
    """Conditionally seed showcase demo data if SEED_DEMO_DATA=true."""
    if not env_flag('SEED_DEMO_DATA', 'false'):
        print('SEED_DEMO_DATA is false; skipping demo data seeding.')
        return

    seed_demo_data()

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_ENV', 'development') == 'development')
