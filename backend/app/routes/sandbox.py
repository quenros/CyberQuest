from flask import Blueprint, jsonify, request
from app.services.docker_service import start_challenge_container, stop_container
import requests as http

sandbox_bp = Blueprint("sandbox", __name__)

# In-memory session store for testing phase (replaced by MongoDB later)
# { session_key: { container_id, port, challenge_id } }
_sessions = {}


@sandbox_bp.post("/start")
def start():
    data = request.get_json()
    alias = data.get("alias", "anonymous")
    challenge_id = data.get("challenge_id")

    image_map = {
        "xss-1-reflected": "cyberquest-xss-1",
    }
    image = image_map.get(challenge_id)
    if not image:
        return jsonify({"error": "Unknown challenge"}), 404

    session_key = f"{alias}:{challenge_id}"

    # Always clean up any existing session so re-entry gets a fresh container
    old = _sessions.pop(session_key, None)
    if old:
        stop_container(old["container_id"])

    result = start_challenge_container(image, challenge_id, alias)
    _sessions[session_key] = {**result, "challenge_id": challenge_id}
    return jsonify({"port": result["port"]}), 200


@sandbox_bp.get("/status")
def status():
    alias = request.args.get("alias", "anonymous")
    challenge_id = request.args.get("challenge_id")
    session_key = f"{alias}:{challenge_id}"

    session = _sessions.get(session_key)
    if not session:
        return jsonify({"error": "No active session"}), 404

    try:
        resp = http.get(f"http://localhost:{session['port']}/status", timeout=2)
        return jsonify(resp.json()), 200
    except Exception:
        return jsonify({"xss_triggered": False, "error": "container unreachable"}), 200


@sandbox_bp.post("/stop")
def stop():
    data = request.get_json()
    alias = data.get("alias", "anonymous")
    challenge_id = data.get("challenge_id")
    session_key = f"{alias}:{challenge_id}"

    session = _sessions.pop(session_key, None)
    if session:
        stop_container(session["container_id"])
    return jsonify({"status": "stopped"}), 200
