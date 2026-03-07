from flask import Blueprint, request, jsonify
from flask import current_app
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import db, User, UserRole, UserStatus
from app.utils.errors import ValidationError, AuthenticationError, APIError, handle_api_error
import uuid
import os

auth_bp = Blueprint('auth', __name__)


def normalize_email(email):
    if not email:
        return None
    return email.strip().lower()


def try_seed_password_recovery(user, provided_password):
    """Recover bootstrap/seeded user password from env vars if hash is out of sync."""
    if not user or not provided_password:
        return False

    admin_seed_password = os.getenv('BOOTSTRAP_ADMIN_PASSWORD') or os.getenv('SEED_ADMIN_PASSWORD')
    student_seed_password = os.getenv('SEED_STUDENT_PASSWORD')

    seed_admin_emails = {'admin@hostel.com', 'admin2@hostel.com'}
    seed_student_emails = {
        'student1@hostel.com',
        'student2@hostel.com',
        'student3@hostel.com',
        'student4@hostel.com',
    }

    if user.email in seed_admin_emails and admin_seed_password and provided_password == admin_seed_password:
        user.password_hash = generate_password_hash(admin_seed_password)
        db.session.commit()
        current_app.logger.warning(f"Recovered password hash for seeded admin account: {user.email}")
        return True

    if user.email in seed_student_emails and student_seed_password and provided_password == student_seed_password:
        user.password_hash = generate_password_hash(student_seed_password)
        db.session.commit()
        current_app.logger.warning(f"Recovered password hash for seeded student account: {user.email}")
        return True

    return False


def try_bootstrap_admin_creation(email, provided_password):
    """Create bootstrap admin on-demand when login is attempted and admin record is missing."""
    allow_on_login = os.getenv('BOOTSTRAP_ADMIN_ON_LOGIN', 'true').lower() in ('1', 'true', 'yes')
    bootstrap_email = normalize_email(os.getenv('BOOTSTRAP_ADMIN_EMAIL', 'admin@hostel.com'))
    bootstrap_password = os.getenv('BOOTSTRAP_ADMIN_PASSWORD')
    bootstrap_name = os.getenv('BOOTSTRAP_ADMIN_NAME', 'System Admin')
    bootstrap_hostel = os.getenv('BOOTSTRAP_ADMIN_HOSTEL', 'A')

    if not allow_on_login:
        return None

    if not bootstrap_password:
        return None

    if email != bootstrap_email:
        return None

    if provided_password != bootstrap_password:
        return None

    existing_admin = User.query.filter_by(email=bootstrap_email).first()
    if existing_admin:
        return existing_admin

    user = User(
        id=str(uuid.uuid4()),
        name=bootstrap_name,
        email=bootstrap_email,
        password_hash=generate_password_hash(bootstrap_password),
        role=UserRole.ADMIN,
        hostel=bootstrap_hostel,
        status=UserStatus.VERIFIED,
    )
    db.session.add(user)
    db.session.commit()
    current_app.logger.warning(f"Bootstrap admin created on login fallback: {bootstrap_email}")
    return user

@auth_bp.errorhandler(APIError)
def handle_error(error):
    return handle_api_error(error)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    if not data:
        raise ValidationError('Request body required')
    
    # Validate required fields (students only)
    required_fields = ['name', 'email', 'password', 'hostel']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'{field} is required')

    # Enforce student registrations only (admin accounts must be pre-created)
    role = UserRole.STUDENT
    
    normalized_email = normalize_email(data['email'])
    if not normalized_email:
        raise ValidationError('email is required')

    # Check email already exists
    if User.query.filter_by(email=normalized_email).first():
        raise ValidationError('Email already registered')
    
    # Create user
    user = User(
        id=str(uuid.uuid4()),
        name=data['name'],
        email=normalized_email,
        password_hash=generate_password_hash(data['password']),
        role=role,
        hostel=data['hostel'],
        status=UserStatus.PENDING_VERIFICATION
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    data = request.get_json()
    
    if not data:
        raise ValidationError('Request body required')
    
    email = normalize_email(data.get('email'))
    password = data.get('password')
    
    if not email or not password:
        raise ValidationError('Email and password required')
    
    user = User.query.filter_by(email=email).first()

    if not user:
        user = try_bootstrap_admin_creation(email, password)

    if not user:
        current_app.logger.warning(f"Login failed: user not found ({email})")
        raise AuthenticationError('Invalid email or password')

    password_ok = check_password_hash(user.password_hash, password)
    if not password_ok:
        password_ok = try_seed_password_recovery(user, password)

    if not password_ok:
        current_app.logger.warning(f"Login failed: invalid password ({email})")
        raise AuthenticationError('Invalid email or password')
    
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current user details - requires JWT"""
    from app.utils.decorators import verify_authenticated
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        raise ValidationError('User not found')
    
    return jsonify(user.to_dict()), 200

@auth_bp.route('/verify-user/<user_id>', methods=['POST'])
def verify_user(user_id):
    """Admin endpoint: Verify a user"""
    from app.utils.decorators import verify_admin
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    
    verify_jwt_in_request()
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise ValidationError('Admin access required')
    
    user = User.query.get(user_id)
    if not user:
        raise ValidationError('User not found')

    user.status = UserStatus.VERIFIED
    db.session.commit()
    
    return jsonify({
        'message': 'User verified successfully',
        'user': user.to_dict()
    }), 200

@auth_bp.route('/pending-students', methods=['GET'])
def get_pending_students():
    """Admin endpoint: Get list of students pending verification"""
    from app.utils.decorators import verify_admin
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    
    verify_jwt_in_request()
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise ValidationError('Admin access required')
    
    pending_users = User.query.filter_by(
        status=UserStatus.PENDING_VERIFICATION,
        role=UserRole.STUDENT
    ).all()
    
    return jsonify({
        'pending_students': [user.to_dict() for user in pending_users],
        'count': len(pending_users)
    }), 200

@auth_bp.route('/decline-user/<user_id>', methods=['POST'])
def decline_user(user_id):
    """Admin endpoint: Decline/reject a user"""
    from app.utils.decorators import verify_admin
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    
    verify_jwt_in_request()
    admin_id = get_jwt_identity()
    admin = User.query.get(admin_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise ValidationError('Admin access required')
    
    user = User.query.get(user_id)
    if not user:
        raise ValidationError('User not found')

    user.status = UserStatus.DECLINED
    db.session.commit()
    
    return jsonify({
        'message': 'User access declined successfully',
        'user': user.to_dict()
    }), 200
