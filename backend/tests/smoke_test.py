import json
import urllib.request
import urllib.error

BASE = 'http://127.0.0.1:5000'

def req(path, method='GET', data=None, token=None):
    url = BASE + path
    body = None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    if data is not None:
        body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {'error': str(e)}
    except Exception as e:
        return None, {'error': str(e)}


def pretty(status, body):
    print('STATUS:', status)
    print(json.dumps(body, indent=2))
    print('\n'+'-'*60+'\n')

if __name__ == '__main__':
    # 1. Register
    print('1) Registering test student...')
    status, body = req('/api/auth/register', 'POST', {
        'name': 'Test User',
        'email': 'testuser1@hostel.com',
        'password': 'testpass123',
        'hostel': 'A'
    })
    pretty(status, body)

    user_id = None
    if status == 201 and 'user' in body:
        user_id = body['user']['id']

    # 2. Login as student
    print('2) Logging in as student...')
    status, body = req('/api/auth/login', 'POST', {
        'email': 'testuser1@hostel.com',
        'password': 'testpass123'
    })
    pretty(status, body)
    student_token = None
    if status == 200 and 'access_token' in body:
        student_token = body['access_token']
        # ensure we capture user id from login if registration step skipped
        if not user_id and 'user' in body:
            user_id = body['user'].get('id')

    # 3) Attempt create issue (should be blocked)
    print('3) Attempting to create issue (expected to be blocked for pending user)...')
    status, body = req('/api/issues', 'POST', {
        'title': 'Test Leak',
        'description': 'Test leak description',
        'category': 'plumbing',
        'location': {'hostel': 'A', 'floor': 2, 'room': '201'}
    }, token=student_token)
    pretty(status, body)

    # 4) Admin login & verify user
    print('4) Admin login & verify the new user...')
    status, body = req('/api/auth/login', 'POST', {'email': 'admin@hostel.com', 'password': 'admin123'})
    pretty(status, body)
    admin_token = None
    if status == 200 and 'access_token' in body:
        admin_token = body['access_token']

    if admin_token and user_id:
        status, body = req(f'/api/auth/verify-user/{user_id}', 'POST', None, token=admin_token)
        pretty(status, body)

    # 5) Student creates issue again
    print('5) Student attempts to create issue after verification...')
    status, body = req('/api/auth/login', 'POST', {'email': 'testuser1@hostel.com', 'password': 'testpass123'})
    student_token = body.get('access_token') if status==200 else None
    status, body = req('/api/issues', 'POST', {
        'title': 'Test Leak After Verify',
        'description': 'Now should work',
        'category': 'plumbing',
        'location': {'hostel': 'A', 'floor': 2, 'room': '201'}
    }, token=student_token)
    pretty(status, body)

    print('Smoke tests completed.')
