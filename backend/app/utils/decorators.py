from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User, UserRole, UserStatus, db

def verify_hostel_student(fn):
    """Verify user is authenticated, verified hostel student"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        if user.status != UserStatus.VERIFIED:
            return jsonify({'error': 'User not verified'}), 403
        
        if user.role != UserRole.STUDENT:
            return jsonify({'error': 'Access denied. Student role required'}), 403
        
        kwargs['current_user'] = user
        return fn(*args, **kwargs)
    
    return wrapper

def verify_admin(fn):
    """Verify user is authenticated admin"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        if user.role != UserRole.ADMIN:
            return jsonify({'error': 'Admin access required'}), 403
        
        kwargs['current_user'] = user
        return fn(*args, **kwargs)
    
    return wrapper

def verify_authenticated(fn):
    """Verify user is authenticated (student or admin)"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        kwargs['current_user'] = user
        return fn(*args, **kwargs)
    
    return wrapper

def verify_verified_authenticated(fn):
    """Verify user is authenticated and verified"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        if user.status != UserStatus.VERIFIED:
            return jsonify({'error': 'User not verified'}), 403
        
        kwargs['current_user'] = user
        return fn(*args, **kwargs)
    
    return wrapper
