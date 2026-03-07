import os
import secrets
from app import create_app, db
from app.models import User, UserRole, UserStatus
import uuid
from werkzeug.security import generate_password_hash

app = create_app(os.getenv('FLASK_ENV', 'development'))

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
    }

@app.cli.command()
def init_db():
    """Initialize database with sample data"""
    db.create_all()
    
    # Check if admin already exists
    if User.query.filter_by(email='admin@hostel.com').first():
        print('Database already initialized')
        return

    admin_seed_password = os.getenv('SEED_ADMIN_PASSWORD')
    student_seed_password = os.getenv('SEED_STUDENT_PASSWORD')

    if not admin_seed_password:
        admin_seed_password = secrets.token_urlsafe(12)
        print('SEED_ADMIN_PASSWORD not set. Generated one-time admin seed password.')
        print(f'Admin seed password: {admin_seed_password}')

    if not student_seed_password:
        student_seed_password = secrets.token_urlsafe(10)
        print('SEED_STUDENT_PASSWORD not set. Generated one-time student seed password.')
        print(f'Student seed password: {student_seed_password}')
    
    # Create admin users
    admin1 = User(
        id=str(uuid.uuid4()),
        name='Admin User',
        email='admin@hostel.com',
        password_hash=generate_password_hash(admin_seed_password),
        role=UserRole.ADMIN,
        hostel='A',
        status=UserStatus.VERIFIED
    )
    
    admin2 = User(
        id=str(uuid.uuid4()),
        name='Admin User 2',
        email='admin2@hostel.com',
        password_hash=generate_password_hash(admin_seed_password),
        role=UserRole.ADMIN,
        hostel='B',
        status=UserStatus.VERIFIED
    )
    
    # Create student users
    students = [
        User(
            id=str(uuid.uuid4()),
            name='Student 1',
            email='student1@hostel.com',
            password_hash=generate_password_hash(student_seed_password),
            role=UserRole.STUDENT,
            hostel='A',
            status=UserStatus.VERIFIED
        ),
        User(
            id=str(uuid.uuid4()),
            name='Student 2',
            email='student2@hostel.com',
            password_hash=generate_password_hash(student_seed_password),
            role=UserRole.STUDENT,
            hostel='A',
            status=UserStatus.VERIFIED
        ),
        User(
            id=str(uuid.uuid4()),
            name='Student 3',
            email='student3@hostel.com',
            password_hash=generate_password_hash(student_seed_password),
            role=UserRole.STUDENT,
            hostel='B',
            status=UserStatus.VERIFIED
        ),
        User(
            id=str(uuid.uuid4()),
            name='Student 4',
            email='student4@hostel.com',
            password_hash=generate_password_hash(student_seed_password),
            role=UserRole.STUDENT,
            hostel='B',
            status=UserStatus.PENDING_VERIFICATION
        ),
    ]
    
    db.session.add(admin1)
    db.session.add(admin2)
    for student in students:
        db.session.add(student)
    
    db.session.commit()
    print('Database initialized with sample data')

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_ENV', 'development') == 'development')
