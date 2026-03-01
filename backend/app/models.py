from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import get_jwt_identity
from datetime import datetime
from enum import Enum

db = SQLAlchemy()

class UserRole(Enum):
    STUDENT = 'student'
    ADMIN = 'admin'

class UserStatus(Enum):
    PENDING_VERIFICATION = 'pending_verification'
    VERIFIED = 'verified'
    DECLINED = 'declined'

class IssueStatus(Enum):
    REPORTED = 'reported'
    IN_PROGRESS = 'in_progress'
    RESOLVED_BY_ADMIN = 'resolved_by_admin'
    CLOSED = 'closed'

class IssuePriority(Enum):
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'

class EventType(Enum):
    CULTURAL = 'cultural'
    SPORTS = 'sports'

class RegistrationStatus(Enum):
    UPCOMING = 'upcoming'
    OPEN = 'open'
    CLOSED = 'closed'

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    hostel = db.Column(db.String(100), nullable=True, index=True)
    # status: pending_verification | verified
    status = db.Column(db.Enum(UserStatus), default=UserStatus.PENDING_VERIFICATION, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    issues = db.relationship('HostelIssue', backref='reporter', lazy=True, foreign_keys='HostelIssue.reporter_id')
    event_registrations = db.relationship('EventRegistration', backref='student', lazy=True)
    admin_notes = db.relationship('AdminNote', backref='admin', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role.value,
            'hostel': self.hostel,
            'status': self.status.value,
            'verified': True if self.status == UserStatus.VERIFIED else False,
            'createdAt': self.created_at.isoformat(),
        }

class HostelIssue(db.Model):
    __tablename__ = 'issues'
    
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    status = db.Column(db.Enum(IssueStatus), default=IssueStatus.REPORTED, nullable=False, index=True)
    priority_final = db.Column(db.Enum(IssuePriority), nullable=True)
    priority_ai_suggested = db.Column(db.Enum(IssuePriority), nullable=True)
    ai_reason = db.Column(db.Text, nullable=True)
    
    # Reporter Info
    reporter_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Location
    hostel = db.Column(db.String(100), nullable=False, index=True)
    floor = db.Column(db.Integer, nullable=False)
    room = db.Column(db.String(50), nullable=False)
    
    # Timestamps
    reported_date = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_by_admin_date = db.Column(db.DateTime, nullable=True)
    confirmed_by_reporter_date = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    admin_notes = db.relationship('AdminNote', backref='issue', lazy=True, cascade='all, delete-orphan')
    status_logs = db.relationship('IssueStatusLog', backref='issue', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_details=False):
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'status': self.status.value,
            'priorityFinal': self.priority_final.value if self.priority_final else None,
            'priorityAiSuggested': self.priority_ai_suggested.value if self.priority_ai_suggested else None,
            'aiReason': self.ai_reason,
            'reporterId': self.reporter_id,
            'reporterName': self.reporter.name if self.reporter else None,
            'location': {
                'hostel': self.hostel,
                'floor': self.floor,
                'room': self.room,
            },
            'reportedDate': self.reported_date.isoformat(),
            'updatedDate': self.updated_date.isoformat(),
            'resolvedByAdminDate': self.resolved_by_admin_date.isoformat() if self.resolved_by_admin_date else None,
            'confirmedByReporterDate': self.confirmed_by_reporter_date.isoformat() if self.confirmed_by_reporter_date else None,
        }
        
        if include_details:
            data['adminNotes'] = [note.to_dict() for note in self.admin_notes]
            data['statusLogs'] = [log.to_dict() for log in self.status_logs]
        
        return data

class AdminNote(db.Model):
    __tablename__ = 'admin_notes'
    
    id = db.Column(db.String(36), primary_key=True)
    issue_id = db.Column(db.String(36), db.ForeignKey('issues.id'), nullable=False, index=True)
    admin_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'adminId': self.admin_id,
            'adminName': self.admin.name if self.admin else None,
            'content': self.content,
            'createdAt': self.created_at.isoformat(),
        }

class IssueStatusLog(db.Model):
    __tablename__ = 'issue_status_logs'
    
    id = db.Column(db.String(36), primary_key=True)
    issue_id = db.Column(db.String(36), db.ForeignKey('issues.id'), nullable=False, index=True)
    old_status = db.Column(db.Enum(IssueStatus), nullable=True)
    new_status = db.Column(db.Enum(IssueStatus), nullable=False)
    changed_by_id = db.Column(db.String(36), nullable=True)
    reason = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'oldStatus': self.old_status.value if self.old_status else None,
            'newStatus': self.new_status.value,
            'changedById': self.changed_by_id,
            'reason': self.reason,
            'createdAt': self.created_at.isoformat(),
        }

class HostelEvent(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    event_type = db.Column(db.Enum(EventType), nullable=False)
    sports_type = db.Column(db.String(50), nullable=True)
    date = db.Column(db.DateTime, nullable=False, index=True)
    start_time = db.Column(db.String(5), nullable=True)
    end_time = db.Column(db.String(5), nullable=True)
    venue = db.Column(db.String(255), nullable=False)
    registration_status = db.Column(db.Enum(RegistrationStatus), default=RegistrationStatus.UPCOMING, nullable=False)
    total_slots = db.Column(db.Integer, default=50)
    organizer = db.Column(db.String(255), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    registrations = db.relationship('EventRegistration', backref='event', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'eventType': self.event_type.value,
            'sportsType': self.sports_type,
            'date': self.date.isoformat(),
            'startTime': self.start_time,
            'endTime': self.end_time,
            'venue': self.venue,
            'registrationStatus': self.registration_status.value,
            'registeredCount': len(self.registrations),
            'totalSlots': self.total_slots,
            'organizer': self.organizer,
            'imageUrl': self.image_url,
            'createdAt': self.created_at.isoformat(),
        }

class EventRegistration(db.Model):
    __tablename__ = 'event_registrations'
    
    id = db.Column(db.String(36), primary_key=True)
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False, index=True)
    student_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    registered_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Composite unique constraint
    __table_args__ = (db.UniqueConstraint('event_id', 'student_id', name='unique_event_student'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'eventId': self.event_id,
            'studentId': self.student_id,
            'studentName': self.student.name if self.student else None,
            'email': self.student.email if self.student else None,
            'hostel': self.student.hostel if self.student else None,
            'registeredDate': self.registered_date.isoformat(),
        }
