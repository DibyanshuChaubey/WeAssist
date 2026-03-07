import hashlib
import os
import re
import time

import requests
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.models import User, UserRole, UserStatus
from app.utils.errors import APIError, AuthorizationError, ValidationError, handle_api_error

uploads_bp = Blueprint('uploads', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}


@uploads_bp.errorhandler(APIError)
def handle_error(error):
    return handle_api_error(error)


def _is_allowed_extension(filename: str) -> bool:
    if not filename or '.' not in filename:
        return False
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS


def _sanitize_folder(folder: str) -> str:
    if not folder:
        return 'weassist/general'
    return re.sub(r'[^a-zA-Z0-9_\-/]', '', folder).strip('/') or 'weassist/general'


@uploads_bp.route('/image', methods=['POST'])
def upload_image():
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        raise AuthorizationError('User not found')

    if user.role == UserRole.STUDENT and user.status != UserStatus.VERIFIED:
        raise AuthorizationError('Only verified users can upload images')

    if user.role not in (UserRole.ADMIN, UserRole.STUDENT):
        raise AuthorizationError('Upload access denied')

    if 'image' not in request.files:
        raise ValidationError('Image file is required')

    image = request.files['image']
    if not image or not image.filename:
        raise ValidationError('Image file is required')

    if not _is_allowed_extension(image.filename):
        raise ValidationError('Unsupported file format. Use png, jpg, jpeg, or webp')

    max_mb = int(os.getenv('UPLOAD_MAX_MB', '8'))
    max_size_bytes = max_mb * 1024 * 1024
    if request.content_length and request.content_length > max_size_bytes:
        raise ValidationError(f'File too large. Max allowed size is {max_mb}MB')

    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')

    if not cloud_name or not api_key or not api_secret:
        raise APIError('Image upload is not configured on server', 500)

    requested_folder = request.form.get('folder', '')
    default_folder = 'weassist/events' if user.role == UserRole.ADMIN else 'weassist/issues'
    folder = _sanitize_folder(requested_folder or default_folder)

    timestamp = int(time.time())
    signature_raw = f'folder={folder}&timestamp={timestamp}{api_secret}'
    signature = hashlib.sha1(signature_raw.encode('utf-8')).hexdigest()

    upload_url = f'https://api.cloudinary.com/v1_1/{cloud_name}/image/upload'

    try:
        response = requests.post(
            upload_url,
            data={
                'api_key': api_key,
                'timestamp': timestamp,
                'folder': folder,
                'signature': signature,
            },
            files={
                'file': (image.filename, image.stream, image.mimetype),
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        current_app.logger.warning(f'Cloudinary upload request failed: {exc}')
        raise APIError('Image upload failed, please try again', 502)

    if response.status_code >= 400:
        current_app.logger.warning(f'Cloudinary upload error: {response.text}')
        raise APIError('Image upload failed, please try another file', 400)

    data = response.json()
    secure_url = data.get('secure_url')
    public_id = data.get('public_id')

    if not secure_url:
        raise APIError('Upload succeeded but image URL missing', 500)

    return jsonify({
        'message': 'Image uploaded successfully',
        'url': secure_url,
        'publicId': public_id,
    }), 201
