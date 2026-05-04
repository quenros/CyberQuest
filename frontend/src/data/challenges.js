// ─── Challenge sandbox types ────────────────────────────────────────────────
//
// "srcdoc"    — The vulnerable page is rendered entirely in the browser using
//               the iframe srcdoc attribute. No Docker container is needed.
//               Detection is instant via window.parent.postMessage.
//               Use this for stateless challenges (no server-side persistence).
//
// "container" — A real Docker container is started for this challenge.
//               Needed when the challenge requires server-side state (stored
//               posts, real HTTP endpoints, session cookies set by Set-Cookie).
//               Detection still uses postMessage (the container template
//               intercepts the triggering action and posts to the parent).

// ─── Template placeholder reference ─────────────────────────────────────────
//
// Placeholders used in pageTemplate strings (srcdoc challenges only):
//   {payload}          — raw user payload, injected unescaped (the vulnerability)
//   {payload_escaped}  — HTML-escaped payload, safe for attribute values / text
//   {show_if_payload}  — "display:none" when payload is empty, "" otherwise

export const CHALLENGES = {
  xss: [
    {
      id: "xss-1-reflected",
      title: "Challenge 1: The Comment Board",
      difficulty: 1,
      points: 100,
      targetName: "ByteBoard",
      editorLanguage: "html",
      sandboxType: "srcdoc", // stateless — no Docker container needed
      summary: "Inject a script into an unsanitized comment field.",
      description:
        "ByteBoard is a community comment board. Users can post comments and see them rendered on the page.\n\nThe developer built it in a hurry and didn't sanitize user input before displaying it. Can you inject a script that calls alert()?",
      goal: "Make the page execute alert('xss')",
      hints: [
        "HTML allows you to embed scripts using a specific tag. What tag is used to run JavaScript?",
        "Try wrapping your payload in <script> tags. What happens?",
        "The input is reflected directly into the HTML. Try: <script>alert('xss')</script>",
      ],
      solution: {
        payload: "<script>alert('xss')</script>",
        explanation: [
          "The website copied your input directly onto the page without checking it first.",
          "Your <script> tag looked like real code to the browser, so it ran immediately when the page loaded.",
          "This is called reflected XSS — the attack travels in the URL, so anyone who clicks the same link gets hit too.",
        ],
      },
      defense: {
        summary: "The site had its own protection but turned it off. The fix is to turn it back on and add a backup rule.",
        measures: [
          {
            title: "Always clean user input before displaying it",
            body: "Before showing anything a user typed, convert dangerous characters like < and > into safe versions that the browser won't treat as code. Most frameworks do this automatically — never disable it.",
          },
          {
            title: "Add a Content Security Policy (CSP)",
            body: "A CSP is a rule you set on the server that tells the browser: only run scripts from approved places. Even if an attacker sneaks a script tag into the page, the browser will refuse to run it.",
          },
        ],
      },
      pageTemplate: `<!DOCTYPE html>
<html>
<head>
  <title>CyberQuest :: ByteBoard</title>
  <style>
    body { font-family: monospace; background: #0f172a; color: #e2e8f0; padding: 24px; }
    h2 { color: #38bdf8; }
    .comment-box { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    input[type=text] { width: 100%; padding: 8px; background: #1e293b; border: 1px solid #334155; color: #e2e8f0; border-radius: 4px; box-sizing: border-box; }
    button { margin-top: 8px; padding: 8px 16px; background: #0ea5e9; color: #0f172a; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .author { color: #94a3b8; font-size: 12px; margin-bottom: 4px; }
  </style>
  <script>
    // Intercept alert() and notify the parent React frame via postMessage.
    // This replaces the old fetch('/xss-triggered') + polling approach.
    window.alert = function(msg) {
      window.parent.postMessage({ type: 'xss-triggered' }, '*');
      var banner = document.createElement('div');
      banner.style = 'position:fixed;top:0;left:0;width:100%;background:#22c55e;color:#000;text-align:center;padding:12px;font-weight:bold;font-size:16px;font-family:monospace;z-index:9999';
      banner.innerText = '🎉 XSS Triggered! alert("' + msg + '") fired successfully.';
      if (document.body) { document.body.prepend(banner); }
      else { document.addEventListener('DOMContentLoaded', function() { document.body.prepend(banner); }); }
    };
  </script>
</head>
<body>
  <h2>ByteBoard — Community Comments</h2>
  <p style="color:#94a3b8">Share your thoughts with the community!</p>
  <form onsubmit="return false;" style="margin-bottom:24px">
    <input type="text" placeholder="Leave a comment..." value="{payload_escaped}">
    <button type="button">Post</button>
  </form>
  <div>
    <div class="comment-box" style="{show_if_payload}">
      <div class="author">anonymous · just now</div>
      <div>{payload}</div>
    </div>
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
</html>`,
      animation: [
        {
          type: "block",
          label: "server template",
          accent: "gray",
          delay: 0,
          segments: [
            { text: "<div>", cls: "text-gray-500" },
            { text: "{{ comment | safe }}", cls: "text-yellow-400 bg-yellow-400/10 rounded px-1 mx-0.5" },
            { text: "</div>", cls: "text-gray-500" },
            { text: "↑ safe filter — HTML escaping disabled", cls: "block text-xs text-yellow-600 mt-1 pl-1", delay: 0.4 },
          ],
        },
        { type: "arrow", delay: 0.7, label: "after injection" },
        {
          type: "block",
          label: "rendered in browser",
          accent: "red",
          delay: 0.9,
          segments: [
            { text: "<div>", cls: "text-gray-500" },
            { text: "<script>", cls: "text-red-400 font-bold", delay: 1.1 },
            { text: "alert('xss')", cls: "text-orange-300 font-bold", delay: 1.3 },
            { text: "</script>", cls: "text-red-400 font-bold", delay: 1.5 },
            { text: "</div>", cls: "text-gray-500" },
            { text: "↑ script tag inserted verbatim → browser executes it", cls: "block text-xs text-red-500 mt-1 pl-1", delay: 1.7 },
          ],
        },
        {
          type: "legend",
          delay: 2.0,
          items: [
            { code: "{{ comment | safe }}", codeCls: "text-yellow-400", desc: "renders raw user input — no sanitization, no escaping", delay: 2.0 },
            { code: "<script>…</script>", codeCls: "text-red-400", desc: "injected tag runs immediately when the page loads", delay: 2.2 },
          ],
        },
      ],
    },
    {
      id: "xss-2-search",
      title: "Challenge 2: The Analytics Script",
      difficulty: 2,
      points: 150,
      targetName: "DevDocs",
      editorLanguage: "html",
      sandboxType: "srcdoc", // stateless — no Docker container needed
      summary: "Break out of a JavaScript string context to execute code.",
      description:
        "DevDocs is a documentation search site. The developer properly escaped the search results display — but they left a hidden analytics script that embeds your search query directly into JavaScript source code.\n\nTo find it:\n1. Type anything into the search box and press Search.\n2. Right-click inside the DevDocs panel and choose **View Frame Source** (Chrome) or **This Frame → View Frame Source** (Firefox).\n3. Scroll to the very bottom — you'll see a <script> block with a variable that contains your search query.\n4. Now figure out how to break out of that variable and run your own code.\n\nHTML tags won't work here. The vulnerability is at the JavaScript level.",
      goal: "Break out of the JavaScript string and call alert('xss')",
      hints: [
        "Right-click inside the DevDocs panel on the right and choose 'View Frame Source'. Look for a <script> block near the bottom — what does it do with your search query?",
        "Your input is placed inside a JavaScript string: var _lastQuery = \"YOUR_INPUT\". Injecting <script> tags won't help here.",
        "To escape a JavaScript string, you need to close the quote first. What character ends a double-quoted string?",
        "Try: \"; alert('xss')//  — the double-quote closes the string, the semicolon ends the statement, the double-slash comments out the trailing quote.",
      ],
      solution: {
        payload: `"; alert('xss')//`,
        explanation: [
          "The page hid your search inside a JavaScript box: var _lastQuery = \"your search here\".",
          "By typing \" at the start, you closed that box early — you were now outside it and writing live JavaScript.",
          "The // at the end commented out the leftover quote so the browser saw no errors.",
          "This works even when the site blocks HTML tags, because the attack is hiding inside JavaScript code, not HTML.",
        ],
      },
      defense: {
        summary: "The developer pasted user input straight into JavaScript code. Cleaning up HTML characters doesn't help here — the attack happened at the code level, not the HTML level.",
        measures: [
          {
            title: "Never paste user input into JavaScript code",
            body: "Pass data using HTML data attributes (like data-value=\"...\") and read it with JavaScript separately. This keeps code and data in different lanes so there's no box to break out of.",
          },
          {
            title: "Use JSON.stringify() if you must inline a value",
            body: "JSON.stringify() wraps the value in safe quotes and handles any special characters automatically — including the double quote that caused this attack.",
          },
          {
            title: "Add a Content Security Policy with a nonce",
            body: "A nonce is a one-time code the server puts on every approved script. The browser blocks any script without one — so injected code can't run even if it gets onto the page.",
          },
        ],
      },
      pageTemplate: `<!DOCTYPE html>
<html>
<head>
  <title>CyberQuest :: DevDocs</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: monospace; background: #0f172a; color: #e2e8f0; padding: 24px; margin: 0; }
    h2 { color: #38bdf8; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 20px; }
    .search-bar { display: flex; gap: 8px; margin-bottom: 24px; }
    input[type=text] { flex: 1; padding: 10px 12px; background: #1e293b; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px; font-family: monospace; font-size: 14px; }
    input[type=text]:focus { outline: none; border-color: #38bdf8; }
    button { padding: 10px 18px; background: #0ea5e9; color: #0f172a; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-family: monospace; }
    .results-label { font-size: 13px; color: #94a3b8; margin-bottom: 12px; }
    .results-label .query { color: #e2e8f0; }
    .doc-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; }
    .doc-card h3 { color: #7dd3fc; margin: 0 0 4px; font-size: 14px; }
    .doc-card p { color: #94a3b8; margin: 0; font-size: 13px; line-height: 1.5; }
    .no-results { color: #64748b; font-size: 14px; padding: 24px 0; }
    .analytics-bar { font-size: 11px; color: #334155; border-top: 1px solid #1e293b; padding-top: 8px; margin-top: 24px; }
  </style>
  <script>
    // Intercept alert() and notify the parent React frame via postMessage.
    window.alert = function(msg) {
      window.parent.postMessage({ type: 'xss-triggered' }, '*');
      var banner = document.createElement('div');
      banner.style = 'position:fixed;top:0;left:0;width:100%;background:#22c55e;color:#000;text-align:center;padding:12px;font-weight:bold;font-size:16px;font-family:monospace;z-index:9999';
      banner.innerText = '🎉 XSS Triggered! alert("' + msg + '") fired successfully.';
      if (document.body) { document.body.prepend(banner); }
      else { document.addEventListener('DOMContentLoaded', function() { document.body.prepend(banner); }); }
    };
  </script>
</head>
<body>
  <h2>DevDocs — API Reference</h2>
  <p class="subtitle">Search the developer documentation library.</p>
  <div class="search-bar">
    <input type="text" id="search-input" placeholder="Search docs..." value="{payload_escaped}">
    <button type="button" onclick="doSearch()">Search</button>
  </div>
  <div style="{show_if_payload}">
    <p class="results-label">Showing results for: <span class="query">{payload_escaped}</span></p>
  </div>
  <div id="results-container"></div>
  <div class="analytics-bar">page analytics active · last query tracked in source</div>
  <script>
    var DOCS = [
      { title: 'fetch(url, options)', body: 'Starts the process of fetching a resource from the network, returning a promise which is fulfilled once the response is available.' },
      { title: 'document.querySelector(selector)', body: 'Returns the first Element within the document that matches the specified selector, or null if no element matches.' },
      { title: 'addEventListener(type, listener)', body: 'Sets up a function that will be called whenever the specified event is delivered to the target.' },
      { title: 'localStorage.setItem(key, value)', body: 'Stores a key/value pair in localStorage. Data persists across browser sessions.' },
      { title: 'JSON.stringify(value)', body: 'Converts a JavaScript value to a JSON string.' },
      { title: 'Promise.all(iterable)', body: 'Takes an iterable of promises and returns a single Promise that resolves to an array of results.' }
    ];
    function renderDocs(docs) {
      var c = document.getElementById('results-container');
      if (!docs.length) { c.innerHTML = '<p class="no-results">No results found. Try a different search term.</p>'; return; }
      c.innerHTML = docs.map(function(d) { return '<div class="doc-card"><h3>' + d.title + '</h3><p>' + d.body + '</p></div>'; }).join('');
    }
    function doSearch() {
      var q = document.getElementById('search-input').value.toLowerCase();
      renderDocs(q ? DOCS.filter(function(d) { return d.title.toLowerCase().includes(q) || d.body.toLowerCase().includes(q); }) : DOCS);
    }
    // Initial render reads from the DOM so HTML-decoded input value is used correctly
    document.addEventListener('DOMContentLoaded', doSearch);
  </script>
  <script>
    /* analytics.js — do not modify */
    var _lastQuery = "{payload}";
    if (_lastQuery) { console.log('[analytics] user searched: ' + _lastQuery); }
  </script>
</body>
</html>`,
      animation: [
        {
          type: "block",
          label: "server template",
          accent: "gray",
          delay: 0,
          segments: [
            { text: "var ", cls: "text-blue-300" },
            { text: "_lastQuery", cls: "text-cyan-300" },
            { text: " = ", cls: "text-gray-400" },
            { text: '"', cls: "text-green-400" },
            { text: "   your input here   ", cls: "text-gray-600 italic", delay: 0.3 },
            { text: '"', cls: "text-green-400" },
            { text: ";", cls: "text-gray-400" },
          ],
        },
        { type: "arrow", delay: 0.7, label: "after injection" },
        {
          type: "block",
          label: `after payload: "; alert('xss')//`,
          accent: "orange",
          delay: 0.9,
          segments: [
            { text: "var ", cls: "text-blue-300" },
            { text: "_lastQuery", cls: "text-cyan-300" },
            { text: " = ", cls: "text-gray-400" },
            { text: '"', cls: "text-green-400" },
            { text: '"', cls: "text-orange-400 font-bold", delay: 1.1 },
            { text: ";", cls: "text-gray-400", delay: 1.3 },
            { text: " ", cls: "text-gray-400", delay: 1.3 },
            { text: "alert", cls: "text-red-400 font-bold", delay: 1.5 },
            { text: "('xss')", cls: "text-yellow-300 font-bold", delay: 1.5 },
            { text: "//", cls: "text-gray-600", delay: 1.7 },
            { text: '";', cls: "text-gray-700 line-through", delay: 1.9 },
          ],
        },
        {
          type: "legend",
          delay: 2.1,
          items: [
            { code: '"', codeCls: "text-orange-400", desc: "closes the open string — you are now outside the string context", delay: 2.1 },
            { code: ";", codeCls: "text-gray-400", desc: "ends the var statement", delay: 2.3 },
            { code: "alert('xss')", codeCls: "text-red-400", desc: "free-standing statement — browser executes it", delay: 2.5 },
            { code: "//", codeCls: "text-gray-500", desc: 'comments out the trailing "; that would cause a syntax error', delay: 2.7 },
          ],
        },
      ],
    },
    {
      id: "xss-3-url",
      title: "Challenge 3: The Return Link",
      difficulty: 2,
      points: 150,
      targetName: "ReturnPortal",
      editorLanguage: "plaintext",
      sandboxType: "srcdoc", // stateless — no Docker container needed
      summary: "Inject a javascript: URI into a link's href to execute code.",
      description:
        "ReturnPortal is a login service used by internal company tools. When your session expires on a company app, you get redirected through ReturnPortal to log back in — and it sends you right back using a return URL.\n\nStart on CorpDash on the right. Your session has expired — click Login to go through ReturnPortal. Notice the 'Returning to:' field and how it reflects your payload.\n\nTo find the vulnerability:\n· After logging in, right-click the panel → View Frame Source. Find the comment near the return link.\n· Think about what kinds of values a browser accepts as a valid href.",
      goal: "Make the page execute alert('xss') by injecting a javascript: URI as the return URL",
      hints: [
        "Click Login on CorpDash. On the ReturnPortal page, notice the 'Returning to:' field — it shows your current payload. Right-click the panel → View Frame Source and find the comment near the return link.",
        "Your input lands directly in the href of an <a> tag. Injecting <script> tags won't help — there is no HTML body context here. Think about what a browser accepts as a valid href value.",
        "Browsers support URI schemes beyond http:// and https://. One scheme tells the browser to run JavaScript instead of navigating to a page. What is it?",
      ],
      solution: {
        payload: "javascript:alert('xss')",
        explanation: [
          "Your input landed directly in the href attribute of a link — the 'Returning to:' line showed you exactly what it was set to.",
          "javascript: is a valid URI scheme. When you click a link with href='javascript:...', the browser runs the code after the colon instead of navigating to a page.",
          "The developer's <script> tag filter was useless here — the attack never used a script tag. The payload lived entirely inside an href attribute.",
          "This pattern is common in real apps: login redirects, email unsubscribe links, 'open in app' prompts. Any URL embedded in a page without scheme validation is vulnerable.",
        ],
      },
      defense: {
        summary: "The href accepted any URI scheme without validation. Checking that the URL starts with http:// or https:// would have stopped this entirely.",
        measures: [
          {
            title: "Validate the URL scheme before using it",
            body: "Check that the URL starts with http:// or https:// before embedding it in an href. Reject anything else — javascript:, data:, and vbscript: are all dangerous schemes.",
          },
          {
            title: "Use encodeURIComponent() for URL parameters",
            body: "When putting user input inside a URL, encode it first. encodeURIComponent() converts special characters to percent-encoding, preventing scheme injection.",
          },
          {
            title: "Add a Content Security Policy",
            body: "A CSP with script-src 'self' prevents javascript: URIs from executing when clicked, acting as a second line of defence even if the URL slips through.",
          },
        ],
      },
      pageTemplate: `<!DOCTYPE html>
<html>
<head>
  <title>CyberQuest :: ReturnPortal</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: monospace; background: #0f172a; color: #e2e8f0; margin: 0; }
    /* --- ReturnPortal (login success) --- */
    #page-login { display: none; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 36px 32px; max-width: 400px; width: 100%; text-align: center; }
    .logo { font-size: 32px; margin-bottom: 6px; }
    .app-name { font-size: 18px; font-weight: bold; color: #38bdf8; margin-bottom: 20px; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: #052e16; border: 1px solid #16a34a; color: #4ade80; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
    .message { color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 8px; }
    .return-url { font-size: 11px; color: #475569; margin-bottom: 24px; word-break: break-all; min-height: 16px; }
    .return-url span { color: #64748b; }
    .return-btn { color: #38bdf8; text-decoration: none; font-size: 14px; font-weight: bold; padding: 10px 24px; border: 1px solid #38bdf8; border-radius: 6px; display: inline-block; }
    .return-btn:hover { background: #0ea5e9; color: #0f172a; }
    /* --- CorpDash (destination page) --- */
    #page-dashboard { display: block; min-height: 100vh; }
    .dash-header { background: #1e293b; border-bottom: 1px solid #334155; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; }
    .dash-logo { color: #a78bfa; font-weight: bold; font-size: 15px; }
    .dash-user { color: #64748b; font-size: 12px; }
    .dash-body { padding: 24px; }
    .dash-title { font-size: 16px; font-weight: bold; color: #e2e8f0; margin: 0 0 4px; }
    .dash-sub { color: #64748b; font-size: 13px; margin: 0 0 24px; }
    .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .dash-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; }
    .dash-card-label { color: #64748b; font-size: 11px; letter-spacing: 0.08em; margin: 0 0 4px; }
    .dash-card-value { color: #e2e8f0; font-size: 22px; font-weight: bold; margin: 0; }
    .dash-activity { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .dash-activity-title { color: #94a3b8; font-size: 12px; font-weight: bold; letter-spacing: 0.08em; margin: 0 0 12px; }
    .dash-item { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; padding: 6px 0; border-bottom: 1px solid #1e293b; }
    .dash-item:last-child { border-bottom: none; }
    .dash-item span { color: #94a3b8; }
    .login-btn { background: none; border: 1px solid #334155; color: #94a3b8; font-family: monospace; font-size: 13px; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    .login-btn:hover { border-color: #38bdf8; color: #38bdf8; }
  </style>
  <script>
    window.alert = function(msg) {
      window.parent.postMessage({ type: 'xss-triggered' }, '*');
      var banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#22c55e;color:#000;text-align:center;padding:12px;font-weight:bold;font-size:16px;font-family:monospace;z-index:9999';
      banner.textContent = 'XSS Triggered! javascript: URI executed successfully.';
      document.body.prepend(banner);
    };
    function showDashboard() {
      document.getElementById('page-login').style.display = 'none';
      document.getElementById('page-dashboard').style.display = 'block';
    }
    function showLogin() {
      document.getElementById('page-dashboard').style.display = 'none';
      document.getElementById('page-login').style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px';
    }
    // If a payload was already submitted, skip the dashboard and go straight to ReturnPortal
    window.addEventListener('DOMContentLoaded', function() {
      if (document.getElementById('return-link').getAttribute('href')) {
        showLogin();
      }
    });
  </script>
</head>
<body>
  <!-- ReturnPortal: login success page -->
  <div id="page-login">
    <div class="card">
      <div class="logo">🔐</div>
      <div class="app-name">ReturnPortal</div>
      <div class="badge">✓ Login successful</div>
      <p class="message">Welcome back. Click below to return to where you left off.</p>
      <p class="return-url">Returning to: <span>{payload_escaped}</span></p>
      <!-- returnUrl from query param embedded directly — no scheme validation — TODO before v2 -->
      <a class="return-btn" href="{payload}" id="return-link">← Return to previous page</a>
    </div>
  </div>
  <!-- CorpDash: destination page shown when a normal URL is followed -->
  <div id="page-dashboard">
    <div class="dash-header">
      <span class="dash-logo">⚡ CorpDash</span>
      <span class="dash-user">alice@corp.internal</span>
    </div>
    <div class="dash-body">
      <p class="dash-title">Dashboard</p>
      <p class="dash-sub">Internal company portal</p>
      <div class="dash-grid">
        <div class="dash-card">
          <p class="dash-card-label">OPEN TICKETS</p>
          <p class="dash-card-value">12</p>
        </div>
        <div class="dash-card">
          <p class="dash-card-label">TEAM ONLINE</p>
          <p class="dash-card-value">4</p>
        </div>
      </div>
      <div class="dash-activity">
        <p class="dash-activity-title">RECENT ACTIVITY</p>
        <div class="dash-item"><span>Ticket #204 updated</span> 2 min ago</div>
        <div class="dash-item"><span>Deploy to staging — passed</span> 18 min ago</div>
        <div class="dash-item"><span>alice left a comment on PR #88</span> 1 hr ago</div>
      </div>
      <div style="background:#1c1917;border:1px solid #78350f;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:12px;color:#fbbf24">
        ⚠ Your session has expired. Please log in again to continue.
      </div>
      <button class="login-btn" onclick="showLogin()">Login via ReturnPortal →</button>
    </div>
  </div>
  <script>
    document.getElementById('return-link').addEventListener('click', function(e) {
      e.preventDefault();
      var href = this.getAttribute('href') || '';
      if (href.toLowerCase().indexOf('javascript:') === 0) {
        var code = href.slice(href.indexOf(':') + 1);
        try { (new Function(code))(); } catch(err) {}
      } else {
        showDashboard();
      }
    });
  </script>
</body>
</html>`,
      animation: [
        {
          type: "block",
          label: "link template",
          accent: "gray",
          delay: 0,
          segments: [
            { text: "<a ", cls: "text-gray-500" },
            { text: "href=", cls: "text-gray-400" },
            { text: '"{returnUrl}"', cls: "text-yellow-400 bg-yellow-400/10 rounded px-1 mx-0.5" },
            { text: ">", cls: "text-gray-500" },
            { text: "↑ href set directly from user input — no scheme check", cls: "block text-xs text-yellow-600 mt-1 pl-1", delay: 0.4 },
          ],
        },
        { type: "arrow", delay: 0.7, label: "payload: javascript:alert('xss')" },
        {
          type: "block",
          label: "rendered in browser",
          accent: "red",
          delay: 0.9,
          segments: [
            { text: "<a ", cls: "text-gray-500" },
            { text: "href=", cls: "text-gray-400" },
            { text: '"', cls: "text-gray-400" },
            { text: "javascript:", cls: "text-red-400 font-bold", delay: 1.1 },
            { text: "alert('xss')", cls: "text-orange-300 font-bold", delay: 1.3 },
            { text: '"', cls: "text-gray-400" },
            { text: ">", cls: "text-gray-500" },
            { text: "↑ user clicks link → browser executes the javascript: URI", cls: "block text-xs text-red-500 mt-1 pl-1", delay: 1.5 },
          ],
        },
        {
          type: "legend",
          delay: 1.8,
          items: [
            { code: "javascript:", codeCls: "text-red-400", desc: "valid URI scheme — tells the browser to run code, not navigate", delay: 1.8 },
            { code: "alert('xss')", codeCls: "text-orange-300", desc: "executes in the page context when the link is clicked", delay: 2.0 },
          ],
        },
      ],
    },
    {
      id: "xss-4-attr",
      title: "Challenge 4: The Profile Page",
      difficulty: 2,
      points: 150,
      targetName: "ProfileHub",
      editorLanguage: "plaintext",
      sandboxType: "srcdoc", // stateless — no Docker container needed
      summary: "Break out of an HTML attribute and inject an event handler.",
      description:
        "ProfileHub is an internal employee directory tool. Staff can update their display name, and the updated name is reflected back in the username field so you can see what was saved.\n\nThe developer added a filter that strips <script> tags — but the username goes directly into an HTML attribute without escaping quotes.\n\nTo find the vulnerability:\n· Enter any text and View Frame Source. Find the comment near the username input.\n· Think about where exactly your input lands. Does injecting <script> work inside an attribute value?",
      goal: "Make the page execute alert('xss') by breaking out of the value attribute and injecting an event handler",
      hints: [
        "View Frame Source and find where your input appears in the HTML. Is it inside a tag or inside an attribute value? A <script> tag injected inside value=\"...\" is treated as text, not code.",
        "Your input lands inside value=\"...\". The \" character closes the attribute. Once outside it, you can add new attributes to the same element.",
        "Event handler attributes run JavaScript when a user event fires. onfocus runs when an element receives focus. onmouseover runs when the mouse hovers. Both are just HTML attributes.",
        "The payload is: \" autofocus onfocus=\"alert(1) — the \" closes the value attribute, autofocus tells the browser to focus the field immediately, and onfocus fires the code.",
      ],
      solution: {
        payload: "\" autofocus onfocus=\"alert(1)",
        explanation: [
          "Your input was placed inside value=\"...\" without escaping the quote character. Injecting \" closed the attribute early.",
          "After the closing quote, you were now writing raw HTML attributes on the <input> element. autofocus and onfocus are valid HTML attributes — the browser parsed them as such.",
          "autofocus makes the browser focus the field as soon as the page loads, which triggers the onfocus event handler — no user interaction needed.",
          "The developer's <script> filter was useless here. The attack never used a script tag — it used an event handler attribute, which is a completely different injection context.",
        ],
      },
      defense: {
        summary: "The username was reflected into an HTML attribute without escaping quotes. Encoding \" as &quot; would have made the injection harmless.",
        measures: [
          {
            title: "Escape HTML attribute characters",
            body: "Before inserting user input into an attribute value, encode special characters: \" → &quot;, ' → &#39;, & → &amp;. This prevents the quote from closing the attribute.",
          },
          {
            title: "Never use blocklists to filter HTML",
            body: "Stripping <script> tags is not a security measure — it only blocks one injection vector. Attackers use event handlers, javascript: URIs, and other sinks that never involve a script tag.",
          },
          {
            title: "Use a trusted HTML sanitizer library",
            body: "DOMPurify, bleach, or your framework's built-in escaping will handle all attribute contexts correctly. Hand-rolled filters always miss edge cases.",
          },
        ],
      },
      pageTemplate: `<!DOCTYPE html>
<html>
<head>
  <title>CyberQuest :: ProfileHub</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: monospace; background: #0f172a; color: #e2e8f0; margin: 0; }
    .header { background: #1e293b; border-bottom: 1px solid #334155; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; }
    .header-logo { color: #34d399; font-weight: bold; font-size: 15px; }
    .header-user { color: #64748b; font-size: 12px; }
    .content { padding: 24px; max-width: 480px; }
    h2 { color: #34d399; margin: 0 0 4px; font-size: 16px; }
    .sub { color: #64748b; font-size: 13px; margin: 0 0 24px; }
    .form-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px; }
    label { display: block; font-size: 12px; color: #94a3b8; margin: 14px 0 4px; }
    label:first-of-type { margin-top: 0; }
    input, textarea { width: 100%; padding: 8px 10px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px; font-family: monospace; font-size: 13px; }
    input:focus, textarea:focus { outline: none; border-color: #34d399; }
    textarea { resize: vertical; min-height: 64px; }
    .save-btn { margin-top: 16px; padding: 8px 18px; background: #059669; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-family: monospace; }
    .save-btn:hover { background: #047857; }
    .saved-note { font-size: 12px; color: #4ade80; margin-top: 10px; {show_if_payload} }
  </style>
  <script>
    window.alert = function(msg) {
      window.parent.postMessage({ type: 'xss-triggered' }, '*');
      var banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#22c55e;color:#000;text-align:center;padding:12px;font-weight:bold;font-size:16px;font-family:monospace;z-index:9999';
      banner.textContent = 'XSS Triggered! Attribute injection executed successfully.';
      document.body.prepend(banner);
    };
  </script>
</head>
<body>
  <div class="header">
    <span class="header-logo">👤 ProfileHub</span>
    <span class="header-user">employee #4821</span>
  </div>
  <div class="content">
    <h2>Edit Profile</h2>
    <p class="sub">Update your display name. Changes are saved immediately.</p>
    <div class="form-card">
      <label>Username</label>
      <!-- username reflected directly into value="" attribute — <script> tags stripped, but quotes not escaped -->
      <input type="text" name="username" value="{payload}">
      <label>Email</label>
      <input type="text" name="email" value="alice@corp.internal" readonly>
      <label>Department</label>
      <input type="text" name="dept" value="Engineering" readonly>
      <label>Bio</label>
      <textarea name="bio" readonly>Senior engineer. Working on platform security.</textarea>
      <button class="save-btn">Save Changes</button>
      <p class="saved-note">✓ Profile updated.</p>
    </div>
  </div>
</body>
</html>`,
      animation: [
        {
          type: "block",
          label: "input template",
          accent: "gray",
          delay: 0,
          segments: [
            { text: "<input ", cls: "text-gray-500" },
            { text: "value=", cls: "text-gray-400" },
            { text: '"', cls: "text-green-400" },
            { text: "{username}", cls: "text-yellow-400 bg-yellow-400/10 rounded px-1 mx-0.5" },
            { text: '"', cls: "text-green-400" },
            { text: ">", cls: "text-gray-500" },
            { text: "↑ username inserted into attribute — quotes not escaped", cls: "block text-xs text-yellow-600 mt-1 pl-1", delay: 0.4 },
          ],
        },
        { type: "arrow", delay: 0.7, label: 'payload: " autofocus onfocus="alert(1)' },
        {
          type: "block",
          label: "rendered in browser",
          accent: "red",
          delay: 0.9,
          segments: [
            { text: "<input ", cls: "text-gray-500" },
            { text: "value=", cls: "text-gray-400" },
            { text: '"', cls: "text-gray-400" },
            { text: '"', cls: "text-orange-400 font-bold", delay: 1.1 },
            { text: " autofocus", cls: "text-red-400 font-bold", delay: 1.3 },
            { text: " onfocus=", cls: "text-gray-400", delay: 1.3 },
            { text: '"', cls: "text-gray-400", delay: 1.3 },
            { text: "alert(1)", cls: "text-red-400 font-bold", delay: 1.5 },
            { text: '"', cls: "text-gray-400", delay: 1.5 },
            { text: ">", cls: "text-gray-500", delay: 1.5 },
            { text: "↑ quote closed the attribute — event handler injected as a new attribute", cls: "block text-xs text-red-500 mt-1 pl-1", delay: 1.7 },
          ],
        },
        {
          type: "legend",
          delay: 2.0,
          items: [
            { code: '"', codeCls: "text-orange-400", desc: "closes the value attribute — you are now writing raw HTML attributes", delay: 2.0 },
            { code: "autofocus", codeCls: "text-red-400", desc: "makes the browser focus this field on page load", delay: 2.2 },
            { code: "onfocus", codeCls: "text-red-400", desc: "event handler — fires when the field receives focus", delay: 2.4 },
            { code: "alert(1)", codeCls: "text-red-400", desc: "the JavaScript that runs — executes in the page context", delay: 2.6 },
          ],
        },
      ],
    },
    {
      id: "xss-3-stored",
      title: "Challenge 5: The Note Board",
      difficulty: 3,
      points: 200,
      targetName: "NoteNest",
      editorLanguage: "html",
      sandboxType: "container", // requires Docker — needs server-side state (stored posts,
                                // real Set-Cookie header, HTTP /logCookie endpoint for exfiltration)
      summary: "Store a payload that silently exfiltrates the session cookie from every visitor.",
      description:
        "NoteNest is a public note-sharing app. Every note you post is saved and shown to every visitor — permanently.\n\nA cookie is a small piece of data the server stores in your browser to remember who you are. As long as you have it, the server treats you as the admin. If an attacker copies it, they can impersonate you without ever knowing your password.\n\nTo steal it, you'll need to:\n· Read the cookie value using JavaScript\n· Find an endpoint on the page that can receive data\n· Send the cookie to that endpoint silently",
      goal: "Post a note that calls fetch('/<API-endpoint>?<cookie variable name>=' + document.cookie) — exfiltrating the session cookie without the victim noticing",
      injectPath: "/inject?body={payload}",
      hints: [
        "First, confirm that scripts actually run on this page. Try injecting <script>alert(document.cookie)</script> as a note body — does an alert pop up? What value does it show?",
        "Right-click inside the NoteNest panel and choose View Frame Source. Scroll to the very bottom and look for any endpoints mentioned in the source that could receive data.",
        "Now combine what you have: use fetch() to silently send the cookie value to the endpoint you found. How would you append a value to a URL as a parameter?",
      ],
      solution: {
        payload: "<script>fetch('/logCookie?c='+document.cookie)</script>",
        explanation: [
          "Your <script> tag was saved to the server and ran automatically in every visitor's browser — no click, no warning, nothing visible to the victim.",
          "document.cookie contained the session token: the server's proof that this browser is the admin. fetch() silently sent it to /logCookie as a URL parameter.",
          "This is stored XSS — the most dangerous type. Unlike challenge 1 where the victim has to click a crafted link, here the attacker only needs to post the note once. Every future visitor is compromised automatically.",
          "In a real attack, the stolen token lets an attacker log in as the victim — without ever knowing their password.",
        ],
      },
      defense: {
        summary:
          "Two things went wrong at once: notes were saved and rendered without any cleaning (letting the script run), and the session cookie was readable by JavaScript (letting it be stolen). Fix either one and the attack fails. Fix both and you're properly protected.",
        measures: [
          {
            title: "Clean user input before saving or displaying it",
            body: "Strip dangerous tags like <script> before storing any user content. Libraries like DOMPurify (browser) or bleach (Python) do this automatically — just run content through them before touching the database or the page.",
          },
          {
            title: "Mark session cookies as HttpOnly",
            body: "Adding HttpOnly to a cookie makes it completely invisible to JavaScript — document.cookie won't show it at all. Even if XSS fires, the script has nothing to steal.",
          },
          {
            title: "Add a Content Security Policy (CSP)",
            body: "A CSP tells the browser which scripts are allowed to run. With a strict CSP, even if an attacker injects a script tag it gets blocked before it can execute.",
          },
        ],
      },
      animation: [
        {
          type: "block",
          label: "payload stored as a note",
          accent: "gray",
          delay: 0,
          segments: [
            { text: "<script>", cls: "text-red-400 font-bold", delay: 0.1 },
            { text: "fetch", cls: "text-cyan-300", delay: 0.3 },
            { text: "(", cls: "text-gray-400", delay: 0.3 },
            { text: "'/logCookie?c='", cls: "text-green-400", delay: 0.3 },
            { text: " + ", cls: "text-gray-400", delay: 0.3 },
            { text: "document.cookie", cls: "text-yellow-300 font-bold", delay: 0.5 },
            { text: ")", cls: "text-gray-400", delay: 0.5 },
            { text: "</script>", cls: "text-red-400 font-bold", delay: 0.7 },
          ],
        },
        { type: "arrow", delay: 1.0, label: "every visitor loads the page" },
        {
          type: "block",
          label: "script runs in visitor's browser",
          accent: "yellow",
          delay: 1.2,
          segments: [
            { text: "document.cookie", cls: "text-yellow-300 font-bold", delay: 1.3 },
            { text: " → ", cls: "text-gray-500", delay: 1.5 },
            { text: "session=ADMIN_TOKEN_7f3kq9", cls: "text-purple-300 font-mono", delay: 1.7 },
          ],
        },
        { type: "arrow", delay: 2.0, label: "exfiltrated via fetch" },
        {
          type: "block",
          label: "server receives stolen cookie",
          accent: "green",
          delay: 2.2,
          segments: [
            { text: "GET ", cls: "text-gray-400", delay: 2.3 },
            { text: "/steal", cls: "text-cyan-300", delay: 2.3 },
            { text: "?c=", cls: "text-gray-400", delay: 2.3 },
            { text: "session=ADMIN_TOKEN_7f3kq9", cls: "text-purple-300", delay: 2.5 },
            { text: "✓ token confirmed — attacker can now log in as the victim", cls: "block text-xs text-green-400 mt-1.5", delay: 2.8 },
          ],
        },
        {
          type: "legend",
          delay: 3.0,
          items: [
            { code: "document.cookie", codeCls: "text-yellow-300", desc: "readable by JS because the cookie is not HttpOnly", delay: 3.0 },
            { code: "stored XSS", codeCls: "text-red-400", desc: "unlike reflected XSS, every visitor is compromised — not just the attacker", delay: 3.2 },
          ],
        },
      ],
    },
  ],

  sqli: [
    {
      id: "sqli-1-login",
      title: "Challenge 1: The Login Bypass",
      difficulty: 1,
      points: 100,
      targetName: "AdminPortal",
      editorLanguage: "plaintext",
      sandboxType: "srcdoc",
      summary: "Inject SQL into a login form to bypass authentication without a password.",
      description:
        "AdminPortal is a corporate login page. Only employees with valid credentials can access the admin dashboard.\n\nThe developer built the login query by pasting the username directly into a SQL string — no parameterization. This is the most common cause of SQL injection.\n\nTo find the vulnerability:\n· Submit any username and look at the Generated Query box below the login form.\n· Notice exactly where your input lands in the SQL. Think about what happens if your input contains a quote character.",
      goal: "Log in as admin without knowing the password.",
      hints: [
        "Look at the Generated Query box as you type. Your input lands directly inside single quotes: WHERE username = '<your input>' AND password = '...'",
        "A single quote ' in your input closes the string early. Everything after that is treated as SQL code, not as a value.",
        "The -- sequence is a SQL line comment. Anything after -- on the same line is ignored by the database — including the password check.",
        "The payload is: admin' -- — the quote closes the username string, and -- comments out the AND password = ... check entirely.",
      ],
      solution: {
        payload: "admin' --",
        explanation: [
          "The server built the SQL query by pasting your username directly into a string: WHERE username = 'admin' --' AND password = '...'.",
          "The single quote you injected closed the username string early. After it, you were writing raw SQL — not a value.",
          "-- is a SQL line comment. Everything after it was ignored, including AND password = '...'. The password check was never evaluated.",
          "The query now asked: give me the row where username = 'admin' — no password required. The database complied.",
        ],
      },
      defense: {
        summary: "The query was built by concatenating user input into a string. Parameterized queries make this injection impossible — the database never interprets input as SQL code.",
        measures: [
          {
            title: "Use parameterized queries (prepared statements)",
            body: "Instead of db.query(\"WHERE username = '\" + input + \"'\"), write db.query(\"WHERE username = ?\", [input]). The value is sent separately — the database treats it as data, never as SQL.",
          },
          {
            title: "Never concatenate user input into SQL strings",
            body: "Any time input is joined into a SQL string with + or template literals, the code is vulnerable. Use an ORM (SQLAlchemy, Hibernate, ActiveRecord) or query builder — they parameterize automatically.",
          },
          {
            title: "Apply least privilege to the database user",
            body: "The app's database user should only have SELECT / INSERT / UPDATE on the tables it needs. Even if injection occurs, the attacker cannot DROP TABLE or read other databases.",
          },
        ],
      },
      pageTemplate: `<!DOCTYPE html>
<html>
<head>
  <title>CyberQuest :: AdminPortal</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: monospace; background: #0f172a; color: #e2e8f0; margin: 0; min-height: 100vh; display: flex; flex-direction: column; }
    .topbar { background: #1e293b; border-bottom: 1px solid #334155; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .topbar-logo { color: #f59e0b; font-weight: bold; font-size: 14px; }
    .topbar-sub { color: #64748b; font-size: 11px; }
    .page { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 28px 28px 20px; width: 100%; max-width: 380px; }
    .card-title { font-size: 15px; font-weight: bold; color: #f59e0b; margin: 0 0 4px; }
    .card-sub { color: #64748b; font-size: 12px; margin: 0 0 18px; }
    label { display: block; font-size: 11px; color: #94a3b8; margin: 12px 0 4px; }
    label:first-of-type { margin-top: 0; }
    input { width: 100%; padding: 8px 10px; background: #0f172a; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px; font-family: monospace; font-size: 13px; }
    input:focus { outline: none; border-color: #f59e0b; }
    .login-btn { width: 100%; margin-top: 14px; padding: 9px; background: #d97706; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-family: monospace; font-size: 13px; }
    .login-btn:hover { background: #b45309; }
    .err { margin-top: 10px; font-size: 12px; color: #f87171; text-align: center; display: none; }
    .qs { margin-top: 16px; border-top: 1px solid #334155; padding-top: 14px; }
    .qs-label { font-size: 10px; color: #475569; letter-spacing: 0.08em; margin-bottom: 6px; }
    .qs-pre { background: #0f172a; border: 1px solid #1e3a5f; border-radius: 6px; padding: 10px 12px; font-size: 11px; line-height: 1.7; white-space: pre-wrap; overflow-x: auto; margin: 0; }
    .qt-normal { color: #7dd3fc; }
    .qt-inject { color: #f97316; font-weight: bold; }
    .back-btn { background: none; border: 1px solid #334155; color: #94a3b8; font-family: monospace; font-size: 12px; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin-top: 14px; }
    .back-btn:hover { border-color: #f59e0b; color: #f59e0b; }
    /* user panel */
    .up { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; width: 100%; max-width: 380px; }
    .up-title { font-size: 14px; font-weight: bold; color: #e2e8f0; margin: 0 0 6px; }
    .up-note { font-size: 12px; color: #94a3b8; margin: 0; }
  </style>
  <script>
    var USERS = [
      { username: 'admin', password: 'c0rp$3cret!9', role: 'admin' },
      { username: 'alice', password: 'al1ce99pass',  role: 'user'  },
    ];

    function simulateLogin(username, password) {
      // Vulnerable query — string concatenation, exactly like the server does
      var raw = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
      // Strip SQL line comments (-- to end of line)
      var stripped = raw.replace(/--[^\\r\\n]*/g, '');
      // Extract WHERE clause
      var m = stripped.match(/WHERE\\s+([\\s\\S]+)$/i);
      if (!m || !m[1].trim()) return null;
      var where = m[1].trim();
      // Try each user row
      for (var i = 0; i < USERS.length; i++) {
        try {
          var row = USERS[i];
          // Transform SQL WHERE tokens into a JS boolean expression
          var expr = where
            .replace(/\\bOR\\b/gi, '||')
            .replace(/\\bAND\\b/gi, '&&')
            // 'literal' = 'literal'  (both sides quoted)
            .replace(/'([^']*)'\\s*=\\s*'([^']*)'/g, function(_, a, b) {
              return JSON.stringify(a) + '===' + JSON.stringify(b);
            })
            // column = 'value'
            .replace(/\\b(\\w+)\\s*=\\s*'([^']*)'/g, function(_, col, val) {
              return JSON.stringify(String(row[col] != null ? row[col] : '')) + '===' + JSON.stringify(val);
            })
            // number = number
            .replace(/\\b(\\d+)\\s*=\\s*(\\d+)\\b/g, function(_, a, b) { return a + '===' + b; });
          if ((new Function('return (' + expr + ')'))()) return row;
        } catch(e) {}
      }
      return null;
    }

    function updateQuery() {
      var u = document.getElementById('uname').value;
      var p = document.getElementById('pwd').value || '...';
      var pre = document.getElementById('qpre');
      pre.textContent = '';
      var parts = [
        { text: "SELECT * FROM users\\nWHERE username = '", cls: 'qt-normal' },
        { text: u,                                          cls: 'qt-inject' },
        { text: "'\\n  AND password = '",                  cls: 'qt-normal' },
        { text: p,                                          cls: 'qt-normal' },
        { text: "'",                                        cls: 'qt-normal' },
      ];
      parts.forEach(function(p) {
        var s = document.createElement('span');
        s.className = p.cls;
        s.textContent = p.text;
        pre.appendChild(s);
      });
    }

    function login() {
      var u = document.getElementById('uname').value;
      var p = document.getElementById('pwd').value;
      var matched = simulateLogin(u, p);
      document.getElementById('err').style.display = 'none';
      if (matched && matched.role === 'admin') {
        window.parent.postMessage({ type: 'xss-triggered' }, '*');
        document.getElementById('sec-login').style.display = 'none';
        buildAdminPanel();
        document.getElementById('sec-admin').style.display = 'flex';
      } else if (matched) {
        document.getElementById('sec-login').style.display = 'none';
        document.getElementById('sec-user').style.display = 'flex';
      } else {
        document.getElementById('err').style.display = 'block';
      }
    }

    function backToLogin() {
      document.getElementById('sec-admin').style.display = 'none';
      document.getElementById('sec-user').style.display = 'none';
      document.getElementById('sec-login').style.display = 'flex';
    }

    function buildAdminPanel() {
      var wrap = document.getElementById('sec-admin');
      if (wrap.childElementCount) return; // already built
      var banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#22c55e;color:#000;text-align:center;padding:12px;font-weight:bold;font-size:15px;font-family:monospace;z-index:9999';
      banner.textContent = 'SQLi Triggered! Logged in as admin — no password needed.';
      document.body.prepend(banner);

      var panel = document.createElement('div');
      panel.style.cssText = 'background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;width:100%;max-width:460px';

      var badge = document.createElement('div');
      badge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:#052e16;border:1px solid #16a34a;color:#4ade80;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:bold;margin-bottom:14px';
      badge.textContent = '✓ Authenticated as admin';

      var title = document.createElement('p');
      title.style.cssText = 'font-size:15px;font-weight:bold;color:#f59e0b;margin:0 0 4px';
      title.textContent = 'Admin Dashboard';

      var sub = document.createElement('p');
      sub.style.cssText = 'font-size:12px;color:#64748b;margin:0 0 16px';
      sub.textContent = 'Full access. This is what the attacker now sees.';

      var box = document.createElement('div');
      box.style.cssText = 'background:#0f172a;border:1px solid #7c3aed;border-radius:8px;padding:12px 14px';

      var boxLabel = document.createElement('p');
      boxLabel.style.cssText = 'font-size:10px;color:#7c3aed;letter-spacing:0.1em;margin:0 0 10px';
      boxLabel.textContent = 'SENSITIVE CONFIGURATION';

      var rows = [
        ['DB_HOST',       'db.internal.corp'       ],
        ['DB_PASSWORD',   'Sup3r$3cret_2024!'      ],
        ['STRIPE_SECRET', 'sk_live_4Kq9...redacted'],
        ['ADMIN_COUNT',   '14 accounts found'      ],
      ];
      box.appendChild(boxLabel);
      rows.forEach(function(r) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-bottom:1px solid #1e293b';
        var k = document.createElement('span'); k.style.color = '#64748b'; k.textContent = r[0];
        var v = document.createElement('span'); v.style.color = '#a78bfa'; v.textContent = r[1];
        row.appendChild(k); row.appendChild(v); box.appendChild(row);
      });

      var btn = document.createElement('button');
      btn.className = 'back-btn';
      btn.onclick = backToLogin;
      btn.textContent = '← Try another payload';

      panel.appendChild(badge); panel.appendChild(title); panel.appendChild(sub);
      panel.appendChild(box);   panel.appendChild(btn);
      wrap.appendChild(panel);
    }

    window.addEventListener('DOMContentLoaded', function() { updateQuery(); });
  </script>
</head>
<body>
  <div class="topbar">
    <span class="topbar-logo">🏢 AdminPortal</span>
    <span class="topbar-sub">Internal access only</span>
  </div>

  <div class="page">
    <!-- Login form -->
    <div id="sec-login" style="width:100%;max-width:380px;display:flex;justify-content:center">
      <div class="card">
        <p class="card-title">Employee Login</p>
        <p class="card-sub">Enter your credentials to continue.</p>
        <label>Username</label>
        <!-- auth query: db.query("SELECT * FROM users WHERE username = '" + req.body.username + "' AND password = '" + req.body.password + "'") -->
        <input id="uname" type="text" value="{payload_escaped}" oninput="updateQuery()" autocomplete="off" spellcheck="false">
        <label>Password</label>
        <input id="pwd" type="text" placeholder="password" oninput="updateQuery()" autocomplete="off">
        <button class="login-btn" onclick="login()">Login →</button>
        <p id="err" class="err">✗ Invalid username or password.</p>
        <div class="qs">
          <p class="qs-label">GENERATED SQL QUERY</p>
          <pre id="qpre" class="qs-pre"></pre>
        </div>
      </div>
    </div>

    <!-- Admin panel (built by JS on success) -->
    <div id="sec-admin" style="width:100%;max-width:460px;justify-content:center;display:none"></div>

    <!-- Regular user panel -->
    <div id="sec-user" style="justify-content:center;display:none">
      <div class="up">
        <p class="up-title">Welcome back, alice.</p>
        <p class="up-note">Logged in as a regular user. Admin access is restricted.</p>
        <button class="back-btn" onclick="backToLogin()">← Back to login</button>
      </div>
    </div>
  </div>
</body>
</html>`,
      animation: [
        {
          type: "block",
          label: "vulnerable query template",
          accent: "gray",
          delay: 0,
          segments: [
            { text: "WHERE username = '", cls: "text-gray-400" },
            { text: "\" + username + \"", cls: "text-yellow-400 bg-yellow-400/10 rounded px-1 mx-0.5" },
            { text: "' AND password = '...'", cls: "text-gray-400" },
            { text: "↑ username pasted directly into SQL string — no parameterization", cls: "block text-xs text-yellow-600 mt-1 pl-1", delay: 0.4 },
          ],
        },
        { type: "arrow", delay: 0.7, label: "payload: admin' --" },
        {
          type: "block",
          label: "resulting SQL the database sees",
          accent: "red",
          delay: 0.9,
          segments: [
            { text: "WHERE username = '", cls: "text-gray-400" },
            { text: "admin", cls: "text-orange-300 font-bold", delay: 1.1 },
            { text: "'", cls: "text-orange-400 font-bold", delay: 1.3 },
            { text: " --", cls: "text-gray-600 font-bold", delay: 1.5 },
            { text: "' AND password = '...'", cls: "text-gray-700 line-through", delay: 1.5 },
            { text: "↑ quote closed the string — everything after -- is a comment", cls: "block text-xs text-red-500 mt-1 pl-1", delay: 1.7 },
          ],
        },
        {
          type: "legend",
          delay: 2.0,
          items: [
            { code: "'",        codeCls: "text-orange-400", desc: "closes the username string — you are now writing raw SQL", delay: 2.0 },
            { code: "--",       codeCls: "text-gray-500",   desc: "SQL line comment — everything after this is ignored", delay: 2.2 },
            { code: "AND password = '...'", codeCls: "text-gray-600", desc: "commented out — the password check never runs", delay: 2.4 },
          ],
        },
      ],
    },
  ],
};
