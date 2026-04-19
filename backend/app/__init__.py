from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

db = None

def create_app():
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

    CORS(app)
    JWTManager(app)

    global db
    client = MongoClient(os.getenv("MONGO_URI"))
    db = client.get_default_database()

    from .routes.auth import auth_bp
    from .routes.challenges import challenges_bp
    from .routes.progress import progress_bp
    from .routes.sandbox import sandbox_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(challenges_bp, url_prefix="/api/challenges")
    app.register_blueprint(progress_bp, url_prefix="/api/progress")
    app.register_blueprint(sandbox_bp, url_prefix="/api/sandbox")

    return app
