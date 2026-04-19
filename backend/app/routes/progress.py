from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db

progress_bp = Blueprint("progress", __name__)


@progress_bp.get("/")
@jwt_required()
def get_progress():
    user_id = get_jwt_identity()
    records = list(db.progress.find({"user_id": user_id}, {"_id": 0}))
    return jsonify(records), 200
