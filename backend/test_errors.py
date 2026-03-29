"""
Deep audit and error detection for WeAssist webapp
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

print("\n" + "="*80)
print("DEEP AUDIT & ERROR DETECTION")
print("="*80)

issues_found = []

def check(category, test_name, condition, details=""):
    """Record test results"""
    if condition:
        print(f"  ✓ PASS: {test_name}")
        return True
    else:
        msg = f"  ✗ FAIL: {test_name}"
        if details:
            msg += f" - {details}"
        print(msg)
        issues_found.append(f"[{category}] {test_name}: {details}")
        return False

# ===== SECTION 1: AUTHENTICATION ERRORS =====
print("\n" + "-"*80)
print("SECTION 1: AUTHENTICATION & ERROR HANDLING")
print("-"*80)

r = client.get('/api/issues')
check("AUTH", "Missing auth header returns 401", r.status_code == 401, f"Got {r.status_code}")

r = client.get('/api/issues', headers={'Authorization': 'Bearer bad_token'})
check("AUTH", "Invalid JWT returns 401", r.status_code == 401, f"Got {r.status_code}")

r = client.post('/api/auth/register', json={})
check("AUTH", "Empty register request returns 400", r.status_code == 400, f"Got {r.status_code}")

r = client.post('/api/auth/register', json={'name': 'Test', 'email': 'test@test.com'})
check("AUTH", "Missing password returns 400", r.status_code == 400, f"Got {r.status_code}")

# ===== SECTION 2: ISSUE VALIDATION =====
print("\n" + "-"*80)
print("SECTION 2: ISSUE DATA VALIDATION")
print("-"*80)

with app.app_context():
    user = User.query.filter_by(role=UserRole.STUDENT, status=UserStatus.VERIFIED).first()
    if not user:
        user = User(id=str(uuid4()), name='Test', email=f'test_{uuid4()}@test.com', password_hash='h', 
                   role=UserRole.STUDENT, status=UserStatus.VERIFIED, hostel='Hostel A')
        db.session.add(user)
        db.session.commit()
    token = create_access_token(identity=user.id)

# Test empty title
r = client.post('/api/issues', json={
    'title': '', 'description': 'Desc', 'category': 'Cat',
    'location': {'hostel': 'H', 'floor': 1, 'room': '1'}
}, headers={'Authorization': f'Bearer {token}'})
check("ISSUE", "Empty title rejected", r.status_code == 400, f"Got {r.status_code}")

# Test missing location
r = client.post('/api/issues', json={
    'title': 'Title', 'description': 'Desc', 'category': 'Cat'
}, headers={'Authorization': f'Bearer {token}'})
check("ISSUE", "Missing location rejected", r.status_code == 400, f"Got {r.status_code}")

# Test missing hostel in location
r = client.post('/api/issues', json={
    'title': 'Title', 'description': 'Desc', 'category': 'Cat',
    'location': {'floor': 1, 'room': '1'}
}, headers={'Authorization': f'Bearer {token}'})
check("ISSUE", "Missing hostel in location rejected", r.status_code == 400, f"Got {r.status_code}")

# Test missing floor
r = client.post('/api/issues', json={
    'title': 'Title', 'description': 'Desc', 'category': 'Cat',
    'location': {'hostel': 'H', 'room': '1'}
}, headers={'Authorization': f'Bearer {token}'})
check("ISSUE", "Missing floor rejected", r.status_code == 400, f"Got {r.status_code}")

# Test missing room
r = client.post('/api/issues', json={
    'title': 'Title', 'description': 'Desc', 'category': 'Cat',
    'location': {'hostel': 'H', 'floor': 1}
}, headers={'Authorization': f'Bearer {token}'})
check("ISSUE", "Missing room rejected", r.status_code == 400, f"Got {r.status_code}")

# Test invalid floor type
r = client.post('/api/issues', json={
    'title': 'Title', 'description': 'Desc', 'category': 'Cat',
    'location': {'hostel': 'H', 'floor': 'abc', 'room': '1'}
}, headers={'Authorization': f'Bearer {token}'})
check("ISSUE", "Non-numeric floor rejected", r.status_code in [400, 422], f"Got {r.status_code}")

# Test very long title
r = client.post('/api/issues', json={
    'title': 'A' * 1000, 'description': 'Desc', 'category': 'Cat',
    'location': {'hostel': 'H', 'floor': 1, 'room': '1'}
}, headers={'Authorization': f'Bearer {token}'})
# Should either accept or reject with appropriate error
check("ISSUE", "Long title handled", r.status_code in [201, 400, 422], f"Got {r.status_code}")

# ===== SECTION 3: ISSUE RETRIEVAL & ACCESS CONTROL =====
print("\n" + "-"*80)
print("SECTION 3: ISSUE ACCESS CONTROL")
print("-"*80)

# Test get single issue with proper auth
with app.app_context():
    issue = HostelIssue.query.first()
    if issue:
        issue_id = issue.id

r = client.get(f'/api/issues/{issue_id}', headers={'Authorization': f'Bearer {token}'})
check("ISSUE", "Can get single issue with auth", r.status_code == 200, f"Got {r.status_code}")

# Test get single issue without auth
r = client.get(f'/api/issues/{issue_id}')
check("ISSUE", "Cannot get single issue without auth", r.status_code == 401, f"Got {r.status_code}")

# Test get non-existent issue
r = client.get('/api/issues/nonexistent-id-12345', headers={'Authorization': f'Bearer {token}'})
check("ISSUE", "Non-existent issue returns 404", r.status_code == 404, f"Got {r.status_code}")

# ===== SECTION 4: PAGINATION & QUERY PARAMS =====
print("\n" + "-"*80)
print("SECTION 4: PAGINATION & QUERY PARAMETERS")
print("-"*80)

r = client.get('/api/issues?page=1&per_page=10', headers={'Authorization': f'Bearer {token}'})
check("PAGINATION", "Valid pagination works", r.status_code == 200, f"Got {r.status_code}")

r = client.get('/api/issues?page=999999&per_page=10', headers={'Authorization': f'Bearer {token}'})
check("PAGINATION", "Large page number handled", r.status_code in [200, 400], f"Got {r.status_code}")

r = client.get('/api/issues?per_page=999999', headers={'Authorization': f'Bearer {token}'})
check("PAGINATION", "Large per_page handled", r.status_code in [200, 400], f"Got {r.status_code}")

# ===== SECTION 5: EVENT ERRORS =====
print("\n" + "-"*80)
print("SECTION 5: EVENT MANAGEMENT ERRORS")
print("-"*80)

r = client.get('/api/events/nonexistent')
check("EVENTS", "Non-existent event returns 404", r.status_code == 404, f"Got {r.status_code}")

r = client.post('/api/events', json={}, headers={'Authorization': f'Bearer {token}'})
check("EVENTS", "Invalid event creation rejected", r.status_code in [400, 401, 403], f"Got {r.status_code}")

# ===== SECTION 6: CHATBOT EDGE CASES =====
print("\n" + "-"*80)
print("SECTION 6: CHATBOT EDGE CASES")
print("-"*80)

r = client.post('/api/chatbot/ask', json={'message': ''})
check("CHATBOT", "Empty message handled", r.status_code in [200, 400], f"Got {r.status_code}")

r = client.post('/api/chatbot/ask', json={})
check("CHATBOT", "Missing message handled", r.status_code in [200, 400], f"Got {r.status_code}")

# Very long message
r = client.post('/api/chatbot/ask', json={'message': 'A' * 10000})
check("CHATBOT", "Very long message handled", r.status_code in [200, 400], f"Got {r.status_code}")

# ===== SECTION 7: HTTP ERROR CODES =====
print("\n" + "-"*80)
print("SECTION 7: HTTP ERROR HANDLING")
print("-"*80)

r = client.get('/api/nonexistent/route')
check("HTTP", "404 for invalid route", r.status_code == 404, f"Got {r.status_code}")

r = client.post('/api/auth/register', data='{"invalid', content_type='application/json')
check("HTTP", "Invalid JSON returns error", r.status_code in [400, 422], f"Got {r.status_code}")

# ===== SECTION 8: DATABASE CONSTRAINTS =====
print("\n" + "-"*80)
print("SECTION 8: DATABASE CONSTRAINTS")
print("-"*80)

email = f"test_{uuid4()}@test.com"
r1 = client.post('/api/auth/register', json={'name': 'U1', 'email': email, 'password': 'P', 'hostel': 'H'})
r2 = client.post('/api/auth/register', json={'name': 'U2', 'email': email, 'password': 'P', 'hostel': 'H'})
check("DB", "Duplicate email prevented", r1.status_code == 201 and r2.status_code in [400, 409], 
      f"First: {r1.status_code}, Second: {r2.status_code}")

# ===== SUMMARY =====
print("\n" + "="*80)
print("AUDIT SUMMARY")
print("="*80)

if not issues_found:
    print("\n✓ ALL CHECKS PASSED - No critical issues found!")
else:
    print(f"\n✗ {len(issues_found)} ISSUE(S) FOUND:\n")
    for i, issue in enumerate(issues_found, 1):
        print(f"{i}. {issue}")

print("\n" + "="*80)
