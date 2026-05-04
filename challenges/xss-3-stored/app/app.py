from flask import Flask, request, render_template_string, jsonify, redirect, make_response

app = Flask(__name__)

# This container is required for challenge 3 because:
#   - Posts must persist in server-side state (so every visitor sees the stored payload)
#   - The session cookie must arrive via Set-Cookie (requires a real HTTP response header)
#   - The /logCookie endpoint demonstrates real HTTP exfiltration to an attacker-controlled server
#
# Detection is handled via window.parent.postMessage in the page template (see TEMPLATE below),
# so no /status polling or /xss-triggered endpoint is needed.

SECRET_TOKEN = "ADMIN_TOKEN_7f3kq9"

posts = [
    {"author": "alice", "title": "Welcome to NoteNest!", "body": "Feel free to share your thoughts. This is a safe space for ideas."},
    {"author": "bob", "title": "Tips for productivity", "body": "Try the Pomodoro technique — 25 minutes of focus, 5 minute break."},
]

TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
  <title>CyberQuest :: NoteNest</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: monospace; background: #0f172a; color: #e2e8f0; padding: 0; margin: 0; }
    .session-bar { background: #1e293b; border-bottom: 1px solid #334155; padding: 8px 24px; font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 6px; }
    .session-bar .token { font-weight: bold; color: #a78bfa; font-family: monospace; letter-spacing: 0.04em; }
    .content { padding: 24px; }
    h2 { color: #a78bfa; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 20px; }
    .form-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 18px; margin-bottom: 24px; }
    .form-card h3 { color: #c4b5fd; margin: 0 0 12px; font-size: 14px; }
    label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px; margin-top: 10px; }
    input[type=text], textarea { width: 100%%; padding: 8px 10px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px; font-family: monospace; font-size: 13px; }
    input[type=text]:focus, textarea:focus { outline: none; border-color: #a78bfa; }
    textarea { resize: vertical; min-height: 72px; }
    button { margin-top: 12px; padding: 8px 16px; background: #7c3aed; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-family: monospace; }
    button:hover { background: #6d28d9; }
    .post-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; }
    .post-card .meta { font-size: 11px; color: #64748b; margin-bottom: 6px; }
    .post-card h3 { color: #c4b5fd; margin: 0 0 6px; font-size: 14px; }
    .post-card .body { font-size: 13px; color: #cbd5e1; line-height: 1.5; }
    .section-label { font-size: 12px; font-weight: bold; color: #64748b; letter-spacing: 0.1em; margin-bottom: 10px; }
  </style>
  <script>
    var _origFetch = window.fetch;
    window.fetch = function(url, opts) {
      if (typeof url === 'string' && url.indexOf('logCookie') !== -1) {
        window.parent.postMessage({ type: 'xss-triggered' }, '*');
        var stolen = (document.cookie.match(/session=([^;]+)/) || [])[1] || document.cookie;
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:monospace;padding:24px;box-sizing:border-box';
        var box = document.createElement('div');
        box.style.cssText = 'background:#0f172a;border:1px solid #ef4444;border-radius:12px;padding:28px 32px;max-width:480px;width:100%;box-sizing:border-box';
        var label = document.createElement('p');
        label.style.cssText = 'color:#ef4444;font-weight:bold;font-size:13px;letter-spacing:0.1em;margin:0 0 16px';
        label.textContent = 'ATTACKER SERVER RECEIVED';
        var cookieLabel = document.createElement('p');
        cookieLabel.style.cssText = 'color:#94a3b8;font-size:12px;margin:0 0 6px';
        cookieLabel.textContent = 'Stolen cookie:';
        var cookieVal = document.createElement('p');
        cookieVal.style.cssText = 'color:#a78bfa;font-size:14px;font-weight:bold;background:#1e293b;padding:10px 14px;border-radius:6px;margin:0 0 20px;word-break:break-all';
        cookieVal.textContent = 'session=' + stolen;
        var impactLabel = document.createElement('p');
        impactLabel.style.cssText = 'color:#94a3b8;font-size:12px;margin:0 0 8px';
        impactLabel.textContent = 'What an attacker can do with this:';
        var ul = document.createElement('ul');
        ul.style.cssText = 'color:#cbd5e1;font-size:12px;line-height:1.8;margin:0;padding-left:16px';
        [
          'Add  Cookie: session=' + stolen + '  to any HTTP request',
          'The server sees a valid session - no password needed',
          'Full access to the admin account until the cookie expires',
        ].forEach(function(text) {
          var li = document.createElement('li');
          li.textContent = text;
          ul.appendChild(li);
        });
        box.appendChild(label);
        box.appendChild(cookieLabel);
        box.appendChild(cookieVal);
        box.appendChild(impactLabel);
        box.appendChild(ul);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
      }
      return _origFetch.apply(this, arguments);
    };
  </script>
</head>
<body>
  <div class="content">
    <h2>NoteNest — Public Notes</h2>
    <p class="subtitle">Share notes with the community. Everyone can see what you post.</p>

    <div class="form-card">
      <h3>✏️ Post a note</h3>
      <form method="POST" action="post">
        <label>Your name</label>
        <input type="text" name="author" placeholder="anonymous" value="{{ form_author | e }}">
        <label>Title</label>
        <input type="text" name="title" placeholder="Note title..." value="{{ form_title | e }}">
        <label>Body</label>
        <textarea name="body" placeholder="Write your note here...">{{ form_body | e }}</textarea>
        <button type="submit">Publish Note</button>
      </form>
    </div>

    <p class="section-label">RECENT NOTES</p>
    {% for post in posts %}
    <div class="post-card">
      <div class="meta">{{ post.author | e }} · just now</div>
      <h3>{{ post.title | safe }}</h3>
      <div class="body">{{ post.body | safe }}</div>
    </div>
    {% endfor %}
  </div>

  <!-- TODO: remove before prod — debug endpoint: /logCookie?c=<data> logs cookie data for QA -->
  <script>
    var c = document.cookie;
    var m = c.match(/session=([^;]+)/);
    document.getElementById('session-token').textContent = m ? 'session=' + m[1] : '(none)';
  </script>
</body>
</html>
"""


def _make_index_response(**kwargs):
    resp = make_response(render_template_string(
        TEMPLATE,
        posts=list(reversed(posts)),
        form_author="",
        form_title="",
        form_body="",
        **kwargs,
    ))
    resp.set_cookie("session", SECRET_TOKEN, httponly=False, samesite="Lax")
    return resp


@app.get("/")
def index():
    return _make_index_response()


@app.post("/post")
def add_post():
    author = request.form.get("author", "anonymous") or "anonymous"
    title = request.form.get("title", "").strip()
    body = request.form.get("body", "").strip()
    if title or body:
        posts.append({"author": author, "title": title, "body": body})
    return redirect("/")


@app.get("/inject")
def inject_get():
    """Used by ChallengePage injectPath to submit a payload via GET."""
    author = request.args.get("author", "anonymous")
    title = request.args.get("title", "").strip()
    body = request.args.get("body", "").strip()
    if title or body:
        posts.append({"author": author, "title": title or "Note", "body": body})
    return redirect("/")


@app.get("/logCookie")
def log_cookie():
    """Receives the exfiltrated cookie. Presence of the secret token confirms the attack worked."""
    data = request.args.get("c", "")
    if SECRET_TOKEN in data:
        app.logger.info("Cookie exfiltrated: %s", data)
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=False)
