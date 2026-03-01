from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from app.models import db, User, UserRole, UserStatus
from app.utils.errors import ValidationError, AuthenticationError, APIError, handle_api_error
import uuid

auth_bp = Blueprint('auth', __name__)

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
    
    # Check email already exists
    if User.query.filter_by(email=data['email']).first():
        raise ValidationError('Email already registered')
    
    # Create user
    user = User(
        id=str(uuid.uuid4()),
        name=data['name'],
        email=data['email'],
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
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        raise ValidationError('Email and password required')
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password_hash, password):
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
