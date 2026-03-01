from flask import jsonify

class APIError(Exception):
    """Base API error"""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload
    
    def to_dict(self):
        rv = {'error': self.message}
        if self.payload:
            rv.update(self.payload)
        return rv

class ValidationError(APIError):
    """Validation error"""
    def __init__(self, message):
        super().__init__(message, 400)

class AuthenticationError(APIError):
    """Authentication error"""
    def __init__(self, message='Invalid credentials'):
        super().__init__(message, 401)

class AuthorizationError(APIError):
    """Authorization error"""
    def __init__(self, message='Access denied'):
        super().__init__(message, 403)

class NotFoundError(APIError):
    """Resource not found"""
    def __init__(self, message='Resource not found'):
        super().__init__(message, 404)

class ConflictError(APIError):
    """Conflict (e.g., status transition not allowed)"""
    def __init__(self, message='Resource conflict'):
        super().__init__(message, 409)

def handle_api_error(error):
    """Flask error handler for APIError"""
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response
