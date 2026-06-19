// ─────────────────────────────────────────────────────────────────────────────
// processRequest — pure function, no DOM.
// Accepts the victim app's current state and a simulated incoming request
// (routed from the attacker iframe via the postMessage bridge).
// Returns { newState, triggered } where triggered signals a win condition.
// ─────────────────────────────────────────────────────────────────────────────

export function processRequest(state, request) {
  const { method, path, params } = request

  switch (state.challenge) {
    case 'csrf-1-get': {
      if (method !== 'GET') return { newState: state, triggered: false }
      if (path !== '/change-email') return { newState: state, triggered: false }
      if (!params?.email) return { newState: state, triggered: false }
      return { newState: { ...state, email: params.email }, triggered: true }
    }

    case 'csrf-2-post': {
      if (method !== 'POST') return { newState: state, triggered: false }
      if (path !== '/change-email') return { newState: state, triggered: false }
      if (!params?.email) return { newState: state, triggered: false }
      return { newState: { ...state, email: params.email }, triggered: true }
    }

    case 'csrf-3-token': {
      // Token field is present in the form but never validated — any value triggers win.
      if (method !== 'POST') return { newState: state, triggered: false }
      if (path !== '/change-email') return { newState: state, triggered: false }
      if (!params?.email) return { newState: state, triggered: false }
      // csrf_token field must be present (even blank) to match the form shape
      if (!('csrf_token' in (params ?? {}))) return { newState: state, triggered: false }
      return { newState: { ...state, email: params.email }, triggered: true }
    }

    default:
      return { newState: state, triggered: false }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Attacker iframe shim — injected into every CSRF challenge's attacker srcdoc.
// Intercepts outgoing requests and routes them via postMessage to the parent,
// which forwards to the victim iframe. No real HTTP is fired.
// ─────────────────────────────────────────────────────────────────────────────

const ATTACKER_SHIM = `
<script>
(function() {
  function send(method, url, params) {
    // srcdoc iframes have origin 'about:srcdoc', which is not a valid base for
    // new URL() with relative paths. Fall back to a dummy base so relative URLs parse.
    var path = url;
    try { path = new URL(url, 'http://localhost').pathname; } catch(e) {}
    window.parent.postMessage(
      { type: 'csrf-request', method: method, path: path, params: params },
      '*'
    );
  }

  // Intercept fetch
  var _fetch = window.fetch;
  window.fetch = function(input, init) {
    var method = (init && init.method) || 'GET';
    var url = typeof input === 'string' ? input : input.url;
    var params = {};
    try {
      if (method === 'GET') {
        var u = new URL(url, location.href);
        u.searchParams.forEach(function(v, k) { params[k] = v; });
      } else {
        var body = (init && init.body) || '';
        new URLSearchParams(body).forEach(function(v, k) { params[k] = v; });
      }
    } catch(e) {}
    send(method, url, params);
    return Promise.resolve(new Response('', { status: 200 }));
  };

  // Intercept XMLHttpRequest
  var _XHR = window.XMLHttpRequest;
  function FakeXHR() { this._method = 'GET'; this._url = ''; this._params = {}; }
  FakeXHR.prototype.open = function(m, u) { this._method = m; this._url = u; };
  FakeXHR.prototype.setRequestHeader = function() {};
  FakeXHR.prototype.send = function(body) {
    if (body) {
      new URLSearchParams(body).forEach(function(v, k) { this._params[k] = v; }, this);
    }
    if (this._method === 'GET') {
      try {
        var u = new URL(this._url, location.href);
        var p = {};
        u.searchParams.forEach(function(v, k) { p[k] = v; });
        this._params = p;
      } catch(e) {}
    }
    send(this._method, this._url, this._params);
  };
  window.XMLHttpRequest = FakeXHR;

  // Intercept <img> src pointing at a same-path URL (GET CSRF)
  var mo = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.nodeName === 'IMG') {
          var src = node.getAttribute('src') || '';
          if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
            var params = {};
            var qidx = src.indexOf('?');
            var qs = qidx >= 0 ? src.slice(qidx + 1) : '';
            try { new URLSearchParams(qs).forEach(function(v,k){ params[k]=v; }); } catch(e) {}
            send('GET', src, params);
          }
          node.src = ''; // prevent real network request
        }
        // Intercept <form> submissions
        if (node.nodeName === 'FORM') {
          node.addEventListener('submit', function(e) {
            e.preventDefault();
            var params = {};
            new FormData(node).forEach(function(v, k) { params[k] = v; });
            send(node.method.toUpperCase() || 'GET', node.action, params);
          });
          // Handle auto-submit via .submit() call
          var _submit = node.submit.bind(node);
          node.submit = function() {
            var params = {};
            new FormData(node).forEach(function(v, k) { params[k] = v; });
            send(node.method.toUpperCase() || 'GET', node.action, params);
          };
        }
      });
    });
  });
  mo.observe(document, { childList: true, subtree: true });
})();
<\/script>
`

// ─────────────────────────────────────────────────────────────────────────────
// buildAttackerSrcdoc — wraps the student's HTML payload in a full srcdoc page
// with the interception shim pre-injected.
// ─────────────────────────────────────────────────────────────────────────────

export function buildAttackerSrcdoc(payloadHtml) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 16px; font-family: monospace; font-size: 13px; background: #0f172a; color: #94a3b8; }
  p { margin: 0 0 8px; }
</style>
${ATTACKER_SHIM}
</head>
<body>
<p style="color:#475569;font-size:11px;margin-bottom:12px;">— attacker's page —</p>
${payloadHtml}
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
// buildVictimSrcdoc — builds the logged-in victim app for a given challenge.
// The victim app listens for 'csrf-request' postMessages, calls processRequest,
// updates its UI, and fires 'csrf-triggered' to the parent on win.
// ─────────────────────────────────────────────────────────────────────────────

export function buildVictimSrcdoc(challenge) {
  const configs = {
    'csrf-1-get': {
      title: 'UserHub — Account Settings',
      email: 'victim@corp.com',
      showToken: false,
    },
    'csrf-2-post': {
      title: 'UserHub — Account Settings',
      email: 'victim@corp.com',
      showToken: false,
    },
    'csrf-3-token': {
      title: 'UserHub — Account Settings',
      email: 'victim@corp.com',
      showToken: true,
    },
  }

  const cfg = configs[challenge] ?? configs['csrf-1-get']

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; font-family: sans-serif; font-size: 14px; background: #0f172a; color: #e2e8f0; }
  .header { background: #1e293b; border-bottom: 1px solid #334155; padding: 12px 20px; font-weight: bold; font-size: 15px; }
  .badge { background: #22c55e; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 99px; margin-left: 8px; }
  .card { margin: 20px; background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px; }
  label { font-size: 12px; color: #94a3b8; display: block; margin-bottom: 4px; }
  .val { font-size: 14px; color: #e2e8f0; font-weight: 600; }
  .changed { color: #ef4444 !important; }
  .token-row { margin-top: 16px; padding-top: 16px; border-top: 1px solid #334155; }
  .log { margin: 16px; font-size: 12px; color: #475569; min-height: 32px; }
</style>
</head>
<body>
<div class="header">
  ${cfg.title}
  <span class="badge">✓ Logged in as victim</span>
</div>
<div class="card">
  <label>Email address</label>
  <div class="val" id="email-display">${cfg.email}</div>
  ${cfg.showToken ? `
  <div class="token-row">
    <label>CSRF Token (embedded in form)</label>
    <div class="val" style="font-family:monospace;font-size:12px;color:#94a3b8">any_token_accepted</div>
  </div>` : ''}
</div>
<div class="log" id="log">Waiting for requests...</div>
<script>
(function() {
  var state = { challenge: '${challenge}', email: '${cfg.email}' };
  var processRequest = ${processRequest.toString()};

  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'csrf-request') return;
    var result = processRequest(state, {
      method: e.data.method,
      path: e.data.path,
      params: e.data.params
    });
    if (result.triggered) {
      state = result.newState;
      var el = document.getElementById('email-display');
      if (el) { el.textContent = state.email; el.classList.add('changed'); }
      document.getElementById('log').textContent = 'Request received — email changed to ' + state.email;
      window.parent.postMessage({ type: 'csrf-triggered' }, '*');
    } else {
      document.getElementById('log').textContent =
        'Request received — ' + e.data.method + ' ' + e.data.path + ' (no match)';
    }
  });
})();
<\/script>
</body>
</html>`
}
