from flask import Blueprint, request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import (
    db, HostelIssue, IssueStatus, IssueStatusLog, AdminNote,
    User, UserRole, IssuePriority, UserStatus
)
from app.utils.decorators import verify_hostel_student, verify_admin, verify_verified_authenticated
from app.utils.errors import ValidationError, AuthorizationError, NotFoundError, ConflictError, APIError, handle_api_error
from app.issues.ai_priority import PriorityAI
import uuid
from datetime import datetime

issues_bp = Blueprint('issues', __name__)

@issues_bp.errorhandler(APIError)
def handle_error(error):
    return handle_api_error(error)

@issues_bp.route('', methods=['POST'])
def create_issue(current_user=None):
    """Create a new issue - verified students only"""
    # Manual verification since decorator is too strict
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    
    if not current_user:
        raise ValidationError('User not found')
    if current_user.status != UserStatus.VERIFIED:
        raise ValidationError('Only verified users can report issues')
    if current_user.role != UserRole.STUDENT:
        raise AuthorizationError('Only students can report issues')
    
    data = request.get_json()
    if not data:
        raise ValidationError('Request body required')
    
    # Validate required fields
    required_fields = ['title', 'description', 'category', 'location']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'{field} is required')
    
    location = data.get('location', {})
    required_location_fields = ['hostel', 'floor', 'room']
    for field in required_location_fields:
        if not location.get(field):
            raise ValidationError(f'location.{field} is required')
    
    # Get AI priority suggestion
    ai_priority, ai_reason = PriorityAI.suggest_priority(
        data['title'],
        data['description'],
        data['category'],
        location['hostel'],
        location['floor']
    )
    
    # Create issue
    issue = HostelIssue(
        id=f"issue-{uuid.uuid4()}",
        title=data['title'],
        description=data['description'],
        category=data['category'],
        status=IssueStatus.REPORTED,
        priority_ai_suggested=ai_priority,
        ai_reason=ai_reason,
        priority_final=None,  # Admin sets this
        reporter_id=current_user.id,
        hostel=location['hostel'],
        floor=location['floor'],
        room=location['room'],
    )
    
    # Log status
    status_log = IssueStatusLog(
        id=f"log-{uuid.uuid4()}",
        issue_id=issue.id,
        old_status=None,
        new_status=IssueStatus.REPORTED,
        changed_by_id=current_user.id,
        reason='Issue reported'
    )
    
    db.session.add(issue)
    db.session.add(status_log)
    db.session.commit()
    
    return jsonify({
        'message': 'Issue created successfully',
        'issue': issue.to_dict(include_details=True)
    }), 201

@issues_bp.route('', methods=['GET'])
def get_issues():
    """
    Get issues
    - Verified students: Only their hostel's issues
    - Admins: All issues
    - Others: Limited public info (if any)
    """
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        raise ValidationError('User not found')
    
    query = HostelIssue.query
    
    # Filter by user role and verification
    if user.role == UserRole.STUDENT:
        if user.status != UserStatus.VERIFIED:
            raise AuthorizationError('Only verified users can view issues')
        # Students see only their hostel's issues
        query = query.filter_by(hostel=user.hostel)
    elif user.role != UserRole.ADMIN:
        raise AuthorizationError('Access denied')
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Filter parameters
    status = request.args.get('status')
    category = request.args.get('category')
    priority = request.args.get('priority')
    
    if status:
        try:
            query = query.filter_by(status=IssueStatus[status.upper()])
        except KeyError:
            raise ValidationError('Invalid status filter')
    
    if category:
        query = query.filter_by(category=category)
    
    if priority:
        try:
            query = query.filter_by(priority_final=IssuePriority[priority.upper()])
        except KeyError:
            raise ValidationError('Invalid priority filter')
    
    pagination = query.order_by(HostelIssue.reported_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'issues': [issue.to_dict() for issue in pagination.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages
        }
    }), 200

@issues_bp.route('/stats', methods=['GET'])
def get_issue_stats():
    """Admin: Get issue statistics"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)

    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')

    total = HostelIssue.query.count()
    by_status = {
        status.value: HostelIssue.query.filter_by(status=status).count()
        for status in IssueStatus
    }
    by_priority = {
        priority.value: HostelIssue.query.filter_by(priority_final=priority).count()
        for priority in IssuePriority
    }

    return jsonify({
        'total': total,
        'by_status': by_status,
        'by_priority': by_priority
    }), 200

@issues_bp.route('/<issue_id>', methods=['GET'])
def get_issue(issue_id):
    """Get single issue with details"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        raise ValidationError('User not found')
    
    issue = HostelIssue.query.get(issue_id)
    if not issue:
        raise NotFoundError('Issue not found')
    
    # Access control
    if user.role == UserRole.STUDENT:
        if user.status != UserStatus.VERIFIED:
            raise AuthorizationError('Not verified')
        if issue.hostel != user.hostel:
            raise AuthorizationError('Issue access denied')
    elif user.role != UserRole.ADMIN:
        raise AuthorizationError('Access denied')
    
    return jsonify(issue.to_dict(include_details=True)), 200

@issues_bp.route('/<issue_id>/status', methods=['PATCH', 'OPTIONS'])
def update_issue_status(issue_id):
    """Admin: Update issue status"""
    if request.method == 'OPTIONS':
        return ('', 204)

    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)

    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')

    issue = HostelIssue.query.get(issue_id)
    if not issue:
        raise NotFoundError('Issue not found')

    data = request.get_json()
    if not data or 'status' not in data:
        raise ValidationError('status field required')

    try:
        new_status = IssueStatus[data['status'].upper()]
    except KeyError:
        raise ValidationError('Invalid status')

    # Admins cannot close issues directly - only reporters can confirm resolution
    if new_status == IssueStatus.CLOSED:
        raise AuthorizationError(
            'Admins cannot close issues directly. Only the reporter can close by confirming resolution.'
        )

    old_status = issue.status
    if new_status == IssueStatus.IN_PROGRESS and issue.status != IssueStatus.REPORTED:
        raise ConflictError(f'Cannot move to in_progress from {issue.status.value} status')
    if new_status == IssueStatus.RESOLVED_BY_ADMIN and issue.status != IssueStatus.IN_PROGRESS:
        raise ConflictError(
            f'Cannot resolve from {issue.status.value} status'
        )
    if new_status == IssueStatus.REPORTED and issue.status != IssueStatus.REPORTED:
        raise ConflictError('Cannot revert to reported status')

    issue.status = new_status
    if new_status == IssueStatus.RESOLVED_BY_ADMIN:
        issue.resolved_by_admin_date = datetime.utcnow()

    log = IssueStatusLog(
        id=f"log-{uuid.uuid4()}",
        issue_id=issue.id,
        old_status=old_status,
        new_status=new_status,
        changed_by_id=admin.id,
        reason=data.get('reason', 'Admin updated status')
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({
        'message': 'Status updated',
        'issue': issue.to_dict()
    }), 200

@issues_bp.route('/<issue_id>/move-to-progress', methods=['POST'])
def move_to_progress(issue_id):
    """Admin: Move issue to in_progress"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')
    
    issue = HostelIssue.query.get(issue_id)
    if not issue:
        raise NotFoundError('Issue not found')
    
    if issue.status != IssueStatus.REPORTED:
        raise ConflictError(f'Cannot move to progress from {issue.status.value} status')
    
    # Update status
    old_status = issue.status
    issue.status = IssueStatus.IN_PROGRESS
    
    # Log change
    log = IssueStatusLog(
        id=f"log-{uuid.uuid4()}",
        issue_id=issue.id,
        old_status=old_status,
        new_status=IssueStatus.IN_PROGRESS,
        changed_by_id=admin.id,
        reason=request.get_json().get('reason', 'Admin moved to progress')
    )
    
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Issue moved to in progress',
        'issue': issue.to_dict()
    }), 200

@issues_bp.route('/<issue_id>/mark-resolved', methods=['POST'])
def mark_resolved(issue_id):
    """Admin: Mark issue as resolved_by_admin"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')
    
    issue = HostelIssue.query.get(issue_id)
    if not issue:
        raise NotFoundError('Issue not found')
    
    if issue.status != IssueStatus.IN_PROGRESS:
        raise ConflictError(
            f'Can only mark as resolved from in_progress status. Current: {issue.status.value}'
        )
    
    # Update status
    old_status = issue.status
    issue.status = IssueStatus.RESOLVED_BY_ADMIN
    issue.resolved_by_admin_date = datetime.utcnow()
    
    # Log change
    log = IssueStatusLog(
        id=f"log-{uuid.uuid4()}",
        issue_id=issue.id,
        old_status=old_status,
        new_status=IssueStatus.RESOLVED_BY_ADMIN,
        changed_by_id=admin.id,
        reason=request.get_json().get('reason', 'Admin marked as resolved')
    )
    
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Issue marked as resolved by admin',
        'issue': issue.to_dict()
    }), 200

@issues_bp.route('/<issue_id>/confirm-resolution', methods=['POST'])
def confirm_resolution(issue_id):
    """Student: Confirm resolution (only reporter)"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    student = User.query.get(user_id)
    
    if not student or student.role != UserRole.STUDENT:
        raise AuthorizationError('Students only')
    
    issue = HostelIssue.query.get(issue_id)
    if not issue:
        raise NotFoundError('Issue not found')
    
    if issue.reporter_id != student.id:
        raise AuthorizationError('Only issue reporter can confirm resolution')
    
    if issue.status != IssueStatus.RESOLVED_BY_ADMIN:
        raise ConflictError(
            f'Can only confirm when status is resolved_by_admin. Current: {issue.status.value}'
        )
    
    # Update status to closed
    old_status = issue.status
    issue.status = IssueStatus.CLOSED
    issue.confirmed_by_reporter_date = datetime.utcnow()
    
    # Log change
    log = IssueStatusLog(
        id=f"log-{uuid.uuid4()}",
        issue_id=issue.id,
        old_status=old_status,
        new_status=IssueStatus.CLOSED,
        changed_by_id=student.id,
        reason='Reporter confirmed resolution'
    )
    
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Resolution confirmed. Issue closed',
        'issue': issue.to_dict()
    }), 200

@issues_bp.route('/<issue_id>/set-priority', methods=['POST'])
@issues_bp.route('/<issue_id>/priority', methods=['PATCH', 'OPTIONS'])
def set_priority(issue_id):
    """Admin: Set final priority (can override AI suggestion)"""
    if request.method == 'OPTIONS':
        return ('', 204)

    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')
    
    issue = HostelIssue.query.get(issue_id)
    if not issue:
        raise NotFoundError('Issue not found')
    
    data = request.get_json()
    if not data or 'priority' not in data:
        raise ValidationError('priority field required')
    
    try:
        priority = IssuePriority[data['priority'].upper()]
    except KeyError:
        raise ValidationError('Invalid priority. Must be low, medium, or high')
    
    issue.priority_final = priority
    db.session.commit()
    
    return jsonify({
        'message': 'Priority set',
        'issue': issue.to_dict()
    }), 200

@issues_bp.route('/<issue_id>/add-note', methods=['POST'])
def add_admin_note(issue_id):
    """Admin: Add note to issue"""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    admin = User.query.get(user_id)
    
    if not admin or admin.role != UserRole.ADMIN:
        raise AuthorizationError('Admin access required')
    
    issue = HostelIssue.query.get(issue_id)
    if not issue:
        raise NotFoundError('Issue not found')
    
    data = request.get_json()
    if not data or not data.get('content'):
        raise ValidationError('content field required')
    
    note = AdminNote(
        id=f"note-{uuid.uuid4()}",
        issue_id=issue.id,
        admin_id=admin.id,
        content=data['content']
    )
    
    db.session.add(note)
    db.session.commit()
    
    return jsonify({
        'message': 'Note added',
        'note': note.to_dict()
    }), 201

@issues_bp.route('/ai/rules', methods=['GET'])
def get_ai_rules():
    """Get AI priority rules (informational)"""
    return jsonify({
        'message': 'AI priority rules (Phase 1)',
        'rules': PriorityAI.get_ai_suggestions()
    }), 200
