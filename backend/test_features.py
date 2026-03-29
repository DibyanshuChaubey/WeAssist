"""
Comprehensive feature testing for WeAssist webapp - All functionality audit
"""
import sys
sys.path.insert(0, 'c:\\Users\\dibya\\WeAssist\\backend')

from dotenv import load_dotenv
load_dotenv('.env')

from app import create_app
from app.models import User, UserRole, UserStatus, HostelIssue, IssueStatus, HostelEvent, db
from flask_jwt_extended import create_access_token
from uuid import uuid4

app = create_app()
client = app.test_client()

results = {'total': 0, 'passed': 0, 'failed': 0, 'errors': []}

def test(name, fn):
    results['total'] += 1
    try:
        fn()
        results['passed'] += 1
        print(f"✓ {name}")
    except Exception as e:
        results['failed'] += 1
        results['errors'].append(f"{name}: {e}")
        print(f"✗ {name}: {e}")

def token(user_id):
    return create_access_token(identity=user_id)

print("\n" + "="*70 + "\nFEATURE AUDIT - AUTHENTICATION\n" + "="*70)

def auth_register():
    r = client.post('/api/auth/register', json={'name': 'Test', 'email': f'test_{uuid4()}@test.com', 'password': 'Pass123!', 'hostel': 'Hostel A'})
    assert r.status_code == 201
test("Register new student", auth_register)

def auth_missing_fields():
    r = client.post('/api/auth/register', json={'name': 'Test'})
    assert r.status_code == 400
test("Reject registration with missing fields", auth_missing_fields)

def auth_invalid_token():
    r = client.get('/api/auth/me', headers={'Authorization': 'Bearer invalid'})
    assert r.status_code in [401, 422]
test("Reject invalid JWT token", auth_invalid_token)

print("\n" + "="*70 + "\nFEATURE AUDIT - ISSUES\n" + "="*70)

def issues_create():
    with app.app_context():
        u = User.query.filter_by(role=UserRole.STUDENT, status=UserStatus.VERIFIED).first()
        if not u:
            u = User(id=str(uuid4()), name='Student', email=f'std_{uuid4()}@test.com', password_hash='h', role=UserRole.STUDENT, status=UserStatus.VERIFIED, hostel='Hostel A')
            db.session.add(u)
            db.session.commit()
        t = token(u.id)
    r = client.post('/api/issues', json={'title': 'Bug', 'description': 'Test', 'category': 'Maintenance', 'location': {'hostel': 'Hostel A', 'floor': 1, 'room': '101'}}, headers={'Authorization': f'Bearer {t}'})
    assert r.status_code == 201
test("Create new issue", issues_create)

def issues_list():
    with app.app_context():
        u = User.query.filter_by(role=UserRole.STUDENT).first()
        if u:
            t = token(u.id)
    r = client.get('/api/issues', headers={'Authorization': f'Bearer {t}'})
    assert r.status_code == 200
test("List user issues", issues_list)

def issues_get():
    with app.app_context():
        i = HostelIssue.query.first()
        if i:
            issue_id = i.id
    r = client.get(f'/api/issues/{issue_id}')
    assert r.status_code == 200
test("Get single issue", issues_get)

def issues_empty_title():
    with app.app_context():
        u = User.query.filter_by(role=UserRole.STUDENT, status=UserStatus.VERIFIED).first()
        if u:
            t = token(u.id)
    r = client.post('/api/issues', json={'title': '', 'description': 'Test', 'category': 'Maintenance', 'location': {'hostel': 'Hostel A', 'floor': 1, 'room': '101'}}, headers={'Authorization': f'Bearer {t}'})
    assert r.status_code == 400
test("Reject empty title", issues_empty_title)

print("\n" + "="*70 + "\nFEATURE AUDIT - EVENTS\n" + "="*70)

def events_list():
    r = client.get('/api/events')
    assert r.status_code == 200 and isinstance(r.json.get('events', []), list)
test("List public events", events_list)

def events_get():
    with app.app_context():
        e = HostelEvent.query.first()
        if e:
            event_id = e.id
    r = client.get(f'/api/events/{event_id}')
    assert r.status_code == 200
test("Get single event", events_get)

def events_register():
    with app.app_context():
        u = User.query.filter_by(role=UserRole.STUDENT, status=UserStatus.VERIFIED).first()
        if not u:
            u = User(id=str(uuid4()), name='Event User', email=f'evt_{uuid4()}@test.com', password_hash='h', role=UserRole.STUDENT, status=UserStatus.VERIFIED)
            db.session.add(u)
        e = HostelEvent.query.first()
        if not e:
            e = HostelEvent(id=str(uuid4()), title='Event', description='Test', event_type='cultural', location='Ground', date='2026-04-01', available_seats=10)
            db.session.add(e)
        db.session.commit()
        t = token(u.id)
        eid = e.id
    r = client.post(f'/api/events/{eid}/register', headers={'Authorization': f'Bearer {t}'})
    assert r.status_code in [200, 201, 409]
test("Register for event", events_register)

print("\n" + "="*70 + "\nFEATURE AUDIT - ERROR HANDLING\n" + "="*70)

def err_404():
    r = client.get('/api/nonexistent')
    assert r.status_code == 404
test("404 for invalid endpoint", err_404)

def err_invalid_json():
    r = client.post('/api/issues', data='bad json', content_type='application/json', headers={'Authorization': 'Bearer t'})
    assert r.status_code in [400, 422]
test("Invalid JSON handling", err_invalid_json)

def err_duplicate_email():
    e = f'dup_{uuid4()}@test.com'
    r1 = client.post('/api/auth/register', json={'name': 'U1', 'email': e, 'password': 'P1', 'hostel': 'H'})
    r2 = client.post('/api/auth/register', json={'name': 'U2', 'email': e, 'password': 'P2', 'hostel': 'H'})
    assert r1.status_code == 201 and r2.status_code in [400, 409]
test("Prevent duplicate email registration", err_duplicate_email)

print("\n" + "="*70 + "\nFEATURE AUDIT - CHATBOT\n" + "="*70)

def chat_faq():
    r = client.post('/api/chatbot/ask', json={'message': 'How does verification work?'})
    assert r.status_code == 200 and 'reply' in r.json
test("Chatbot FAQ response", chat_faq)

def chat_status():
    r = client.post('/api/chatbot/ask', json={'message': 'What is my status?'})
    assert r.status_code == 200 and r.json.get('type') == 'status'
test("Chatbot status query", chat_status)

print("\n" + "="*70 + "\nFEATURE AUDIT - ADMIN\n" + "="*70)

def admin_student_blocked():
    with app.app_context():
        u = User.query.filter_by(role=UserRole.STUDENT).first()
        if u:
            t = token(u.id)
    r = client.get('/api/admin/stats', headers={'Authorization': f'Bearer {t}'})
    assert r.status_code in [403, 401, 404]
test("Student cannot access admin endpoints", admin_student_blocked)

print("\n" + "="*70)
print(f"RESULTS: {results['passed']}/{results['total']} passed")
print("="*70)
if results['errors']:
    print("\nFailed tests:")
    for e in results['errors']:
        print(f"  - {e}")
