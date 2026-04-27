from flask import Blueprint, jsonify, request
from app.services.docker_service import start_challenge_container, stop_container

sandbox_bp = Blueprint("sandbox", __name__)

# In-memory session store (replaced by MongoDB later)
# { session_key: { container_id, port, challenge_id } }
_sessions = {}

# Challenges that require a Docker container.
# Stateless challenges (sandboxType "srcdoc") are rendered entirely in the
# browser and do not appear here — they never call /start or /stop.
IMAGE_MAP = {
    "xss-3-stored": "cyberquest-xss-3",  # /logCookie endpoint for cookie exfiltration demo
    # add new container-based challenges here
}


@sandbox_bp.post("/start")
def start():
    data = request.get_json()
    alias = data.get("alias", "anonymous")
    challenge_id = data.get("challenge_id")

    image = IMAGE_MAP.get(challenge_id)
    if not image:
        return jsonify({"error": "Unknown challenge or challenge does not use a container"}), 404

    session_key = f"{alias}:{challenge_id}"

    # Clean up any existing session so re-entry always gets a fresh container
    old = _sessions.pop(session_key, None)
    if old:
        stop_container(old["container_id"])

    result = start_challenge_container(image, challenge_id, alias)
    _sessions[session_key] = {**result, "challenge_id": challenge_id}
    return jsonify({"port": result["port"]}), 200


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
