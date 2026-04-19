from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app import db

challenges_bp = Blueprint("challenges", __name__)


@challenges_bp.get("/")
@jwt_required()
def list_challenges():
    challenges = list(db.challenges.find({}, {"_id": 1, "title": 1, "difficulty": 1, "points": 1, "module_id": 1}))
    return jsonify(challenges), 200


@challenges_bp.get("/<challenge_id>")
@jwt_required()
def get_challenge(challenge_id):
    challenge = db.challenges.find_one({"_id": challenge_id})
    if not challenge:
        return jsonify({"error": "Not found"}), 404
    return jsonify(challenge), 200
