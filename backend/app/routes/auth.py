from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app import db
import bcrypt
from datetime import datetime, timezone
import uuid

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "student")

    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    user = {
        "_id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hashed.decode(),
        "role": role,
        "created_at": datetime.now(timezone.utc),
    }
    db.users.insert_one(user)
    token = create_access_token(identity=user["_id"])
    return jsonify({"token": token, "role": role}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json()
    user = db.users.find_one({"email": data.get("email")})

    if not user or not bcrypt.checkpw(data.get("password", "").encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=user["_id"])
    return jsonify({"token": token, "role": user["role"]}), 200
