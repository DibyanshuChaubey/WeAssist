from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import config
from app.models import db
import os
import logging


def bootstrap_database(app):
    """Create tables if possible; keep app running if DB is temporarily unavailable."""
    auto_init_enabled = os.getenv('AUTO_INIT_DB', 'true').lower() in ('1', 'true', 'yes')
    if not auto_init_enabled:
        app.logger.info('AUTO_INIT_DB disabled; skipping database bootstrap')
        return

    try:
        with app.app_context():
            db.create_all()
        app.logger.info('Database bootstrap completed (db.create_all)')
    except Exception as e:
        app.logger.warning(f'Database bootstrap warning: {e}')
        app.logger.warning('App will keep running; initialize DB manually with flask init-db if needed')

def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    try:
        db.init_app(app)
    except Exception as e:
        logging.warning(f"Database initialization warning: {e}")
        logging.warning("App will start but database operations may fail until database is available")
    
    JWTManager(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # Setup logging
    setup_logging(app)

    # Best-effort DB bootstrap for fresh deployments
    bootstrap_database(app)
    
    # Register blueprints
    from app.auth import auth_bp
    from app.issues import issues_bp
    from app.events import events_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(issues_bp, url_prefix='/api/issues')
    app.register_blueprint(events_bp, url_prefix='/api/events')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok'}), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

    return app

def setup_logging(app):
    """Configure logging"""
    if not app.debug:
        file_handler = logging.FileHandler('hostel_system.log')
        file_handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        )
        file_handler.setFormatter(formatter)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Hostel system startup')
