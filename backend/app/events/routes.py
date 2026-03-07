from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from datetime import datetime
import os
from app.models import (
    db, HostelEvent, EventRegistration, EventType, RegistrationStatus,
    User, UserRole
)
from app.demo_seed import seed_demo_data

from app.models import UserStatus
from app.utils.errors import ValidationError, AuthorizationError, NotFoundError, ConflictError, APIError, handle_api_error
import uuid
from sqlalchemy.exc import SQLAlchemyError, ProgrammingError

events_bp = Blueprint('events', __name__)

@events_bp.errorhandler(APIError)
def handle_error(error):
    return handle_api_error(error)

@events_bp.route('', methods=['POST'])
def create_event():
    """Admin: Create event"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')
    
    data = request.get_json()
    if not data:
        raise ValidationError('Request body required')
    
    # Validate required fields
    required_fields = ['title', 'description', 'event_type', 'date', 'venue']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'{field} is required')
    
    # Validate event type
    try:
        event_type = EventType[data['event_type'].upper()]
    except KeyError:
        raise ValidationError('Invalid event_type. Must be cultural or sports')
    
    # Parse date
    try:
        event_date = datetime.fromisoformat(data['date'])
    except (ValueError, TypeError):
        raise ValidationError('Invalid date format. Use ISO format (YYYY-MM-DD)')
    
    # Create event
    event = HostelEvent(
        id=str(uuid.uuid4()),
        title=data['title'],
        description=data['description'],
        event_type=event_type,
        sports_type=data.get('sports_type'),
        date=event_date,
        start_time=data.get('start_time'),
        end_time=data.get('end_time'),
        venue=data['venue'],
        registration_status=data.get('registration_status', 'upcoming'),
        total_slots=data.get('total_slots', 50),
        organizer=data.get('organizer'),
        image_url=data.get('image_url'),
    )
    
    db.session.add(event)
    db.session.commit()
    
    return jsonify({
        'message': 'Event created successfully',
        'event': event.to_dict()
    }), 201

@events_bp.route('', methods=['GET'])
def get_events():
    """
    Get events
    - Public: Everyone can see event list (no auth required)
    - Shows registration count only for registered users
    """
    # Check if user auth exists (optional)
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        _ = User.query.get(user_id) if user_id else None
    except Exception:
        pass
    
    # Safety fallback for showcase deployments where startup seeding didn't run
    auto_seed = os.getenv('SEED_DEMO_DATA_ON_DEMAND', 'true').lower() in ('1', 'true', 'yes')
    if auto_seed:
        try:
            if HostelEvent.query.count() == 0:
                result = seed_demo_data(force_update_student=False, reset=False)
                current_app.logger.warning(
                    f"Demo data auto-seeded from events endpoint | "
                    f"events={result['createdEvents']} issues={result['createdIssues']}"
                )
        except Exception as e:
            db.session.rollback()
            current_app.logger.warning(f"Demo auto-seed skipped in events endpoint: {str(e)}")

    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Filter parameters
    event_type = request.args.get('event_type')
    registration_status = request.args.get('registration_status')
    
    def build_query():
        query = HostelEvent.query

        if event_type:
            try:
                query = query.filter_by(event_type=EventType[event_type.upper()])
            except KeyError:
                raise ValidationError('Invalid event_type filter')

        if registration_status:
            try:
                query = query.filter_by(registration_status=RegistrationStatus[registration_status.upper()])
            except KeyError:
                raise ValidationError('Invalid registration_status filter')

        return query

    try:
        pagination = build_query().order_by(HostelEvent.date.asc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
    except ProgrammingError:
        db.session.rollback()
        try:
            db.create_all()
            pagination = build_query().order_by(HostelEvent.date.asc()).paginate(
                page=page, per_page=per_page, error_out=False
            )
        except SQLAlchemyError as e:
            db.session.rollback()
            raise APIError(f'Database not initialized: {str(e)}', 500)
    except SQLAlchemyError as e:
        db.session.rollback()
        raise APIError(f'Failed to fetch events: {str(e)}', 500)
    
    return jsonify({
        'events': [event.to_dict() for event in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200

@events_bp.route('/<event_id>', methods=['GET'])
def get_event(event_id):
    """Get single event"""
    event = HostelEvent.query.get(event_id)
    if not event:
        raise NotFoundError('Event not found')
    
    return jsonify(event.to_dict()), 200

@events_bp.route('/<event_id>', methods=['PUT'])
def update_event(event_id):
    """Admin: Update event"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')
    
    event = HostelEvent.query.get(event_id)
    if not event:
        raise NotFoundError('Event not found')
    
    data = request.get_json()
    if not data:
        raise ValidationError('Request body required')
    
    # Update allowed fields
    allowed_fields = [
        'title', 'description', 'event_type', 'sports_type',
        'date', 'start_time', 'end_time', 'venue',
        'registration_status', 'total_slots', 'organizer', 'image_url'
    ]
    
    for field in allowed_fields:
        if field in data:
            if field == 'event_type':
                try:
                    setattr(event, field, EventType[data[field].upper()])
                except KeyError:
                    raise ValidationError(f'Invalid {field}')
            elif field == 'registration_status':
                try:
                    setattr(event, field, RegistrationStatus[data[field].upper()])
                except KeyError:
                    raise ValidationError(f'Invalid {field}')
            elif field == 'date':
                try:
                    setattr(event, field, datetime.fromisoformat(data[field]))
                except (ValueError, TypeError):
                    raise ValidationError(f'Invalid {field} format')
            else:
                setattr(event, field, data[field])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Event updated',
        'event': event.to_dict()
    }), 200

@events_bp.route('/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Admin: Delete event"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')
    
    event = HostelEvent.query.get(event_id)
    if not event:
        raise NotFoundError('Event not found')
    
    db.session.delete(event)
    db.session.commit()
    
    return jsonify({'message': 'Event deleted'}), 200

@events_bp.route('/<event_id>/register', methods=['POST'])
def register_for_event(event_id):
    """Student: Register for event"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    student = User.query.get(user_id)
    
    if not student:
        raise ValidationError('User not found')
    if student.status != UserStatus.VERIFIED:
        raise AuthorizationError('Only verified users can register for events')
    if student.role != UserRole.STUDENT:
        raise AuthorizationError('Students only')
    
    event = HostelEvent.query.get(event_id)
    if not event:
        raise NotFoundError('Event not found')
    
    # Check if already registered
    existing = EventRegistration.query.filter_by(
        event_id=event_id,
        student_id=student.id
    ).first()
    if existing:
        raise ConflictError('Already registered for this event')
    
    # Check capacity
    if len(event.registrations) >= event.total_slots:
        raise ConflictError('Event is full')
    
    # Create registration
    registration = EventRegistration(
        id=str(uuid.uuid4()),
        event_id=event_id,
        student_id=student.id
    )
    
    db.session.add(registration)
    db.session.commit()
    
    return jsonify({
        'message': 'Registered successfully',
        'registration': registration.to_dict()
    }), 201

@events_bp.route('/<event_id>/unregister', methods=['POST'])
def unregister_from_event(event_id):
    """Student: Cancel registration"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    student = User.query.get(user_id)
    
    if not student:
        raise ValidationError('User not found')
    
    registration = EventRegistration.query.filter_by(
        event_id=event_id,
        student_id=student.id
    ).first()
    
    if not registration:
        raise NotFoundError('Registration not found')
    
    db.session.delete(registration)
    db.session.commit()
    
    return jsonify({'message': 'Unregistered successfully'}), 200

@events_bp.route('/<event_id>/registrations', methods=['GET'])
def get_event_registrations(event_id):
    """Admin: Get list of students registered for event"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')
    
    event = HostelEvent.query.get(event_id)
    if not event:
        raise NotFoundError('Event not found')
    
    registrations = EventRegistration.query.filter_by(event_id=event_id).all()
    
    return jsonify({
        'event_id': event_id,
        'event_title': event.title,
        'registrations': [reg.to_dict() for reg in registrations],
        'total_registered': len(registrations),
        'total_slots': event.total_slots,
        'available_slots': event.total_slots - len(registrations)
    }), 200

@events_bp.route('/<event_id>/registrations/<student_id>', methods=['DELETE'])
def remove_registration(event_id, student_id):
    """Admin: Remove student from event registration"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')
    
    registration = EventRegistration.query.filter_by(
        event_id=event_id,
        student_id=student_id
    ).first()
    
    if not registration:
        raise NotFoundError('Registration not found')
    
    db.session.delete(registration)
    db.session.commit()
    
    return jsonify({'message': 'Registration removed'}), 200

@events_bp.route('/<event_id>/registrations', methods=['POST'])
def add_registration_admin(event_id):
    """Admin: Manually add student to event"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')
    
    event = HostelEvent.query.get(event_id)
    if not event:
        raise NotFoundError('Event not found')
    
    data = request.get_json()
    if not data or not data.get('student_id'):
        raise ValidationError('student_id required')
    
    student = User.query.get(data['student_id'])
    if not student:
        raise NotFoundError('Student not found')
    
    # Check if already registered
    existing = EventRegistration.query.filter_by(
        event_id=event_id,
        student_id=student.id
    ).first()
    if existing:
        raise ConflictError('Student already registered')
    
    # Check capacity
    if len(event.registrations) >= event.total_slots:
        raise ConflictError('Event is full')
    
    # Create registration
    registration = EventRegistration(
        id=str(uuid.uuid4()),
        event_id=event_id,
        student_id=student.id
    )
    
    db.session.add(registration)
    db.session.commit()
    
    return jsonify({
        'message': 'Student registered',
        'registration': registration.to_dict()
    }), 201
