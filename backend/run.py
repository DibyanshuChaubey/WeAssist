import os
from app import create_app, db
from app.models import User, UserRole, UserStatus
from werkzeug.security import generate_password_hash

app = create_app(os.getenv('FLASK_ENV', 'development'))


def env_flag(name: str, default: str = 'false') -> bool:
    return os.getenv(name, default).lower() in ('1', 'true', 'yes')

@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
    }

def upsert_bootstrap_admin(force_update=False):
    email = os.getenv('BOOTSTRAP_ADMIN_EMAIL', 'admin@hostel.com').strip().lower()
    password = os.getenv('BOOTSTRAP_ADMIN_PASSWORD')
    name = os.getenv('BOOTSTRAP_ADMIN_NAME', 'System Admin')
    hostel = os.getenv('BOOTSTRAP_ADMIN_HOSTEL', 'A')

    if not password:
        print('BOOTSTRAP_ADMIN_PASSWORD is required for admin bootstrap.')
        return False

    admin = User.query.filter_by(email=email).first()
    if admin and not force_update:
        print(f'Bootstrap admin already exists: {email}')
        return True

    if admin:
        admin.name = name
        admin.password_hash = generate_password_hash(password)
        admin.role = UserRole.ADMIN
        admin.hostel = hostel
        admin.status = UserStatus.VERIFIED
        db.session.commit()
        print(f'Bootstrap admin updated: {email}')
        return True

    from uuid import uuid4
    admin = User(
        id=str(uuid4()),
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role=UserRole.ADMIN,
        hostel=hostel,
        status=UserStatus.VERIFIED,
    )
    db.session.add(admin)
    db.session.commit()
    print(f'Bootstrap admin created: {email}')
    return True


@app.cli.command('bootstrap-admin')
def bootstrap_admin():
    """Create or update bootstrap admin from environment variables."""
    force_update = env_flag('BOOTSTRAP_ADMIN_FORCE_UPDATE', 'false')
    upsert_bootstrap_admin(force_update=force_update)


@app.cli.command('bootstrap-admin-if-enabled')
def bootstrap_admin_if_enabled():
    """Conditionally bootstrap admin if BOOTSTRAP_ADMIN_ON_START=true."""
    if not env_flag('BOOTSTRAP_ADMIN_ON_START', 'false'):
        print('BOOTSTRAP_ADMIN_ON_START is false; skipping admin bootstrap.')
        return

    force_update = env_flag('BOOTSTRAP_ADMIN_FORCE_UPDATE', 'false')
    upsert_bootstrap_admin(force_update=force_update)

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_ENV', 'development') == 'development')
