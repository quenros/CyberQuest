import requests
from flask import Blueprint, jsonify, request, Response
from app.services.docker_service import start_challenge_container, stop_container

sandbox_bp = Blueprint("sandbox", __name__)

# Hop-by-hop headers — must NOT be forwarded by the proxy (RFC 2616 §13.5.1).
_HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade",
    "content-encoding", "content-length",
}

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


# Reverse proxy: forwards browser requests at /api/sandbox/proxy/<port>/...
# to the sandbox container running at localhost:<port>/... on the server.
# This lets remote users reach challenge containers without exposing per-container
# ports publicly (which would be impossible behind a single tunneled URL anyway).
@sandbox_bp.route(
    "/proxy/<int:port>/",
    defaults={"subpath": ""},
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
)
@sandbox_bp.route(
    "/proxy/<int:port>/<path:subpath>",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
)
def proxy(port, subpath):
    if not any(s["port"] == port for s in _sessions.values()):
        return jsonify({"error": "Unknown sandbox port"}), 403

    upstream = f"http://localhost:{port}/{subpath}"
    fwd_headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}

    try:
        upstream_resp = requests.request(
            method=request.method,
            url=upstream,
            params=request.args,
            data=request.get_data(),
            headers=fwd_headers,
            cookies=request.cookies,
            allow_redirects=False,
            timeout=10,
        )
    except requests.RequestException as exc:
        return jsonify({"error": f"Proxy upstream failed: {exc}"}), 502

    out_headers = []
    for k, v in upstream_resp.headers.items():
        if k.lower() in _HOP_BY_HOP:
            continue
        # Rewrite container-absolute Location headers so the browser stays
        # within the proxy path on redirects (e.g. POST /post → 302 to /).
        if k.lower() == "location" and v.startswith("/"):
            v = f"/api/sandbox/proxy/{port}{v}"
        out_headers.append((k, v))

    return Response(upstream_resp.content, status=upstream_resp.status_code, headers=out_headers)
