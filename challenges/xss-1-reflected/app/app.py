from flask import Flask, request, render_template_string, jsonify

app = Flask(__name__)

# Tracks whether XSS has fired in this container session
xss_triggered = False

TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
  <title>CyberQuest :: ByteBoard</title>
  <style>
    body { font-family: monospace; background: #0f172a; color: #e2e8f0; padding: 24px; }
    h2 { color: #38bdf8; }
    .comment-box { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    input[type=text] { width: 100%%; padding: 8px; background: #1e293b; border: 1px solid #334155; color: #e2e8f0; border-radius: 4px; box-sizing: border-box; }
    button { margin-top: 8px; padding: 8px 16px; background: #0ea5e9; color: #0f172a; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .author { color: #94a3b8; font-size: 12px; margin-bottom: 4px; }
  </style>
  <script>
    // XSS success detection: if alert() is called, notify the backend
    window.alert = function(msg) {
      fetch('/xss-triggered', { method: 'POST' });
      // Show a visible success banner instead of a real alert
      var banner = document.createElement('div');
      banner.style = 'position:fixed;top:0;left:0;width:100%;background:#22c55e;color:#000;text-align:center;padding:12px;font-weight:bold;font-size:16px;z-index:9999';
      banner.innerText = '🎉 XSS Triggered! alert("' + msg + '") fired successfully.';
      document.body.prepend(banner);
    };
  </script>
</head>
<body>
  <h2>ByteBoard — Community Comments</h2>
  <p style="color:#94a3b8">Share your thoughts with the community!</p>

  <form method="GET" action="/">
    <input type="text" name="comment" placeholder="Leave a comment..." value="{{ comment_raw }}">
    <button type="submit">Post</button>
  </form>

  <div style="margin-top:24px">
    {% if comment %}
    <div class="comment-box">
      <div class="author">anonymous · just now</div>
      <div>{{ comment }}</div>
    </div>
    {% endif %}
    <div class="comment-box">
      <div class="author">alice · 2 hours ago</div>
      <div>Great platform, really enjoying it!</div>
    </div>
    <div class="comment-box">
      <div class="author">bob · 5 hours ago</div>
      <div>Anyone else having trouble with challenge 3?</div>
    </div>
  </div>
</body>
</html>
"""


@app.get("/")
def index():
    comment_raw = request.args.get("comment", "")
    # Intentionally vulnerable: rendering user input as raw HTML
    return render_template_string(
        TEMPLATE,
        comment=comment_raw,          # unescaped — the vulnerability
        comment_raw=comment_raw,
    )


@app.post("/xss-triggered")
def xss_triggered_endpoint():
    global xss_triggered
    xss_triggered = True
    return jsonify({"status": "ok"})


@app.get("/status")
def status():
    return jsonify({"xss_triggered": xss_triggered})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=False)
