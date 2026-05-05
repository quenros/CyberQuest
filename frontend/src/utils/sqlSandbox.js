// Generates self-contained srcdoc HTML for SQL injection challenges.
// The iframe initialises once; payloads arrive via postMessage({type:'run', payload}).
// On success the iframe posts {type:'xss-triggered'} back to the parent.

const ALASQL_CDN = "https://cdn.jsdelivr.net/npm/alasql@4/dist/alasql.min.js";

const SHARED_CSS = `
  * { box-sizing: border-box; }
  body { font-family: monospace; background: #0f172a; color: #e2e8f0; margin: 0;
         min-height: 100vh; display: flex; flex-direction: column; }
  .topbar { background: #1e293b; border-bottom: 1px solid #334155; padding: 10px 20px;
            display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .topbar-sub { color: #64748b; font-size: 11px; }
  .page { flex: 1; display: flex; justify-content: center; padding: 24px; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px;
          padding: 28px 28px 20px; width: 100%; }
  .card-title { font-size: 15px; font-weight: bold; margin: 0 0 4px; }
  .card-sub { color: #64748b; font-size: 12px; margin: 0 0 18px; }
  label { display: block; font-size: 11px; color: #94a3b8; margin: 12px 0 4px; }
  .ti { width: 100%; padding: 8px 10px; background: #0f172a; border: 1px solid #334155;
        color: #e2e8f0; border-radius: 6px; font-family: monospace; font-size: 13px; }
  .ti:focus { outline: none; border-color: var(--brand); }
  .err { margin-top: 10px; font-size: 12px; color: #f87171; display: none; }
  .qs { margin-top: 16px; border-top: 1px solid #334155; padding-top: 14px; }
  .qs-lbl { font-size: 10px; color: #475569; letter-spacing: .08em; margin-bottom: 6px; }
  .qs-pre { background: #0f172a; border: 1px solid #1e3a5f; border-radius: 6px;
            padding: 10px 12px; font-size: 11px; line-height: 1.7;
            white-space: pre-wrap; overflow-x: auto; margin: 0; }
  .qt-n { color: #7dd3fc; }
  .qt-i { color: #f97316; font-weight: bold; }
  .qt-p { color: #334155; }
  .primary-btn { width: 100%; margin-top: 14px; padding: 9px; background: var(--btn);
                 color: #fff; border: none; border-radius: 6px; cursor: pointer;
                 font-weight: bold; font-family: monospace; font-size: 13px; }
  .back-btn { background: none; border: 1px solid #334155; color: #94a3b8;
              font-family: monospace; font-size: 12px; padding: 6px 12px;
              border-radius: 6px; cursor: pointer; margin-top: 14px; display: block; }
  .back-btn:hover { border-color: var(--brand); color: var(--brand); }
  .up { background: #1e293b; border: 1px solid #334155; border-radius: 12px;
        padding: 24px; width: 100%; max-width: 380px; }
  .up-title { font-size: 14px; font-weight: bold; color: #e2e8f0; margin: 0 0 6px; }
  .up-note  { font-size: 12px; color: #94a3b8; margin: 0; }
  /* search extras */
  .page-top { align-items: flex-start; }
  .search-row { display: flex; gap: 8px; }
  .search-row .ti { flex: 1; }
  .search-btn { padding: 8px 16px; background: var(--btn); color: #fff; border: none;
                border-radius: 6px; cursor: pointer; font-family: monospace;
                font-size: 13px; font-weight: bold; white-space: nowrap; }
  .search-btn:hover { opacity: .85; }
  .results-wrap { margin-top: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 6px 8px; background: #0f172a; color: #64748b;
       border-bottom: 1px solid #334155; font-size: 10px; letter-spacing: .08em; }
  td { padding: 7px 8px; border-bottom: 1px solid #1a2744; color: #cbd5e1; }
  tr.inj td { color: #f97316; background: rgba(249,115,22,.06); }
  .err-box { margin-top: 10px; font-size: 12px; color: #f87171;
             background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.3);
             border-radius: 6px; padding: 8px 12px; display: none; }
  /* SQL terminal (recon console) */
  .con { margin-top: 16px; border-top: 1px solid #1e293b; padding-top: 14px; }
  .con-lbl { font-size: 10px; color: #334155; letter-spacing: .1em; margin-bottom: 6px; }
  .con-out { background: #020c1b; border: 1px solid #0f2233; border-radius: 6px;
             padding: 10px 12px; min-height: 48px; max-height: 160px; overflow-y: auto; font-size: 11px; }
  .con-ph  { color: #1e3a5f; font-style: italic; }
  .con-err { color: #f87171; }
  .con-ok  { color: #64748b; font-style: italic; }
  .con-out table { width: 100%; border-collapse: collapse; }
  .con-out th { text-align: left; padding: 2px 6px; color: #334155; font-size: 10px;
                letter-spacing: .06em; border-bottom: 1px solid #0f2233; }
  .con-out td { padding: 3px 6px; color: #7dd3fc; border-bottom: 1px solid #020c1b; }
`;

// Shared runtime helpers embedded verbatim inside each page's <script>.
const SHARED_JS = `
  function initDb(tables) {
    for (var t in tables) {
      try { alasql('DROP TABLE ' + t); } catch(e) {}
      alasql('CREATE TABLE ' + t);
      alasql.tables[t].data = JSON.parse(JSON.stringify(tables[t]));
    }
  }

  function winBanner(msg) {
    if (document.getElementById('wb')) return;
    window.parent.postMessage({ type: 'xss-triggered' }, '*');
    var b = document.createElement('div'); b.id = 'wb';
    b.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#22c55e;' +
      'color:#000;text-align:center;padding:12px;font-weight:bold;' +
      'font-size:14px;font-family:monospace;z-index:9999';
    b.textContent = msg; document.body.prepend(b);
  }

  function checkWin(cond, rows) {
    try { return (new Function('rows', 'return (' + cond + ')'))(rows); }
    catch(e) { return false; }
  }

  function runConsole(sql) {
    var out = document.getElementById('con-out');
    if (!out) return;
    out.innerHTML = '';
    if (!sql || !sql.trim()) {
      out.innerHTML = '<span class="con-ph">Run a query from the editor to explore the database.</span>';
      return;
    }
    var res, err;
    try { res = alasql(sql.trim()); err = null; }
    catch(e) { res = null; err = e.message; }
    if (err) {
      var ed = document.createElement('div'); ed.className = 'con-err';
      ed.textContent = err; out.appendChild(ed); return;
    }
    // Normalise to array of row-objects
    var rows;
    if (Array.isArray(res) && res.length > 0 && Array.isArray(res[0])) {
      rows = res[0];
    } else if (Array.isArray(res)) {
      rows = res;
    } else if (typeof res === 'number') {
      var inf = document.createElement('div'); inf.className = 'con-ok';
      inf.textContent = res + ' row' + (res !== 1 ? 's' : '') + ' affected';
      out.appendChild(inf); return;
    } else { rows = []; }
    if (!rows.length) {
      var emp = document.createElement('div'); emp.className = 'con-ok';
      emp.textContent = '(no rows)'; out.appendChild(emp); return;
    }
    if (typeof rows[0] !== 'object' || rows[0] === null) {
      var prim = document.createElement('div'); prim.className = 'con-ok';
      prim.textContent = rows.join(', '); out.appendChild(prim); return;
    }
    var keys = Object.keys(rows[0]);
    var tbl = document.createElement('table');
    var htr = document.createElement('tr');
    keys.forEach(function(k) {
      var th = document.createElement('th'); th.textContent = k; htr.appendChild(th);
    });
    tbl.appendChild(htr);
    rows.forEach(function(r) {
      var tr = document.createElement('tr');
      keys.forEach(function(k) {
        var td = document.createElement('td');
        td.textContent = r[k] !== undefined ? String(r[k]) : '';
        tr.appendChild(td);
      });
      tbl.appendChild(tr);
    });
    out.appendChild(tbl);
  }

  function renderQuery(preId, tmpl, input) {
    var pre = document.getElementById(preId);
    pre.textContent = '';
    var idx = tmpl.indexOf('{input}');
    var prefix = tmpl.substring(0, idx);
    var suffix = tmpl.substring(idx + 7);
    function sp(t, c) {
      var s = document.createElement('span'); s.className = c; s.textContent = t;
      pre.appendChild(s);
    }
    sp(prefix, 'qt-n');
    if (!input) { sp('...', 'qt-p'); } else { sp(input, input.indexOf("'") !== -1 ? 'qt-i' : 'qt-n'); }
    sp(suffix, 'qt-n');
  }
`;

// ── Login page ────────────────────────────────────────────────────────────────

function buildLoginPage(s) {
  const brand      = s.brand      || "Target";
  const brandColor = s.brandColor || "#f59e0b";
  const btnColor   = s.btnColor   || "#d97706";
  const winMsg     = s.winMessage || "SQLi Triggered!";
  const successRows = s.successRows || [];

  return `<!DOCTYPE html>
<html>
<head>
<title>CyberQuest :: ${brand}</title>
<style>
  :root { --brand: ${brandColor}; --btn: ${btnColor}; }
  ${SHARED_CSS}
  .page { align-items: center; }
  .card { max-width: 380px; }
  .err { text-align: center; }
</style>
<script src="${ALASQL_CDN}"></script>
<script>
var TABLES   = ${JSON.stringify(s.tables)};
var QT       = ${JSON.stringify(s.queryTemplate)};
var WIN_COND = ${JSON.stringify(s.winCondition)};
var WIN_MSG  = ${JSON.stringify(winMsg)};
var SUC_ROWS = ${JSON.stringify(successRows)};

${SHARED_JS}

function buildQuery(input) { return QT.replace('{input}', input); }

function doLogin(username) {
  renderQuery('qpre', QT, username);
  var rows, err;
  try { rows = alasql(buildQuery(username)); err = null; }
  catch(e) { rows = []; err = e.message; }

  var errEl = document.getElementById('err');
  errEl.style.display = 'none';
  document.getElementById('sec-admin').style.display = 'none';
  document.getElementById('sec-user').style.display  = 'none';
  document.getElementById('sec-login').style.display = 'flex';

  if (err) { errEl.textContent = err; errEl.style.display = 'block'; return; }

  if (checkWin(WIN_COND, rows)) {
    winBanner(WIN_MSG);
    document.getElementById('sec-login').style.display = 'none';
    buildAdminPanel();
    document.getElementById('sec-admin').style.display = 'flex';
  } else if (rows.length > 0) {
    document.getElementById('sec-login').style.display = 'none';
    buildUserPanel(rows[0]);
    document.getElementById('sec-user').style.display = 'flex';
  } else {
    errEl.style.display = 'block';
  }
}

function buildAdminPanel() {
  var wrap = document.getElementById('sec-admin');
  wrap.innerHTML = '';
  var panel = document.createElement('div');
  panel.style.cssText = 'background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;width:100%;max-width:460px';

  var badge = document.createElement('div');
  badge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:#052e16;border:1px solid #16a34a;color:#4ade80;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:bold;margin-bottom:14px';
  badge.textContent = '✓ Authenticated as admin';

  var title = document.createElement('p');
  title.style.cssText = 'font-size:15px;font-weight:bold;color:var(--brand);margin:0 0 4px';
  title.textContent = 'Admin Dashboard';

  var sub = document.createElement('p');
  sub.style.cssText = 'font-size:12px;color:#64748b;margin:0 0 16px';
  sub.textContent = 'Full access. This is what the attacker now sees.';

  var box = document.createElement('div');
  box.style.cssText = 'background:#0f172a;border:1px solid #7c3aed;border-radius:8px;padding:12px 14px';
  var lbl = document.createElement('p');
  lbl.style.cssText = 'font-size:10px;color:#7c3aed;letter-spacing:.1em;margin:0 0 10px';
  lbl.textContent = 'SENSITIVE CONFIGURATION';
  box.appendChild(lbl);

  SUC_ROWS.forEach(function(r) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-bottom:1px solid #1e293b';
    var k = document.createElement('span'); k.style.color = '#64748b'; k.textContent = r[0];
    var v = document.createElement('span'); v.style.color = '#a78bfa'; v.textContent = r[1];
    row.appendChild(k); row.appendChild(v); box.appendChild(row);
  });

  var btn = document.createElement('button');
  btn.className = 'back-btn';
  btn.textContent = '← Try another payload';
  btn.onclick = function() {
    document.getElementById('sec-admin').style.display = 'none';
    document.getElementById('sec-login').style.display = 'flex';
    document.getElementById('uname').value = '';
    renderQuery('qpre', QT, '');
  };

  panel.appendChild(badge); panel.appendChild(title); panel.appendChild(sub);
  panel.appendChild(box);   panel.appendChild(btn);
  wrap.appendChild(panel);
}

function buildUserPanel(row) {
  var wrap = document.getElementById('sec-user');
  wrap.innerHTML = '';
  var div = document.createElement('div'); div.className = 'up';
  var t = document.createElement('p'); t.className = 'up-title';
  t.textContent = 'Welcome back, ' + (row.username || 'user') + '.';
  var n = document.createElement('p'); n.className = 'up-note';
  n.textContent = 'Logged in as a regular user. Admin access is restricted.';
  var btn = document.createElement('button'); btn.className = 'back-btn';
  btn.textContent = '← Back to login';
  btn.onclick = function() {
    wrap.style.display = 'none';
    document.getElementById('sec-login').style.display = 'flex';
  };
  div.appendChild(t); div.appendChild(n); div.appendChild(btn);
  wrap.appendChild(div);
}

window.addEventListener('message', function(e) {
  if (!e.data) return;
  if (e.data.type === 'sql') { runConsole(e.data.query || ''); return; }
});

window.addEventListener('DOMContentLoaded', function() {
  initDb(TABLES);
  renderQuery('qpre', QT, '');
});
</script>
</head>
<body>
<div class="topbar">
  <span style="color:var(--brand);font-weight:bold;font-size:14px">${brand}</span>
  <span class="topbar-sub">Internal access only</span>
</div>
<div class="page">
  <div id="sec-login" style="width:100%;max-width:380px;display:flex;justify-content:center">
    <div class="card">
      <p class="card-title" style="color:var(--brand)">Employee Login</p>
      <p class="card-sub">Enter your credentials to continue.</p>
      <label>Username</label>
      <input id="uname" class="ti" type="text" placeholder="username"
             oninput="renderQuery('qpre',QT,this.value)" autocomplete="off" spellcheck="false">
      <label>Password</label>
      <input class="ti" type="text" placeholder="password" autocomplete="off">
      <button class="primary-btn"
              onclick="doLogin(document.getElementById('uname').value)">Login →</button>
      <p id="err" class="err">✗ Invalid username or password.</p>
      <div class="qs">
        <p class="qs-lbl">GENERATED SQL QUERY</p>
        <pre id="qpre" class="qs-pre"></pre>
      </div>
      <div class="con">
        <p class="con-lbl">SQL TERMINAL &middot; RECON</p>
        <div id="con-out" class="con-out"><span class="con-ph">Run a query from the editor to explore the database.</span></div>
      </div>
    </div>
  </div>
  <div id="sec-admin" style="width:100%;max-width:460px;justify-content:center;display:none"></div>
  <div id="sec-user"  style="justify-content:center;display:none"></div>
</div>
</body>
</html>`;
}

// ── Search page ───────────────────────────────────────────────────────────────

function buildSearchPage(s) {
  const brand      = s.brand      || "Target";
  const brandColor = s.brandColor || "#38bdf8";
  const btnColor   = s.btnColor   || "#0369a1";
  const winMsg     = s.winMessage || "SQLi Triggered!";
  const cols       = s.columns       || [];
  const colHeaders = s.columnHeaders || cols.map(c => c.toUpperCase());

  return `<!DOCTYPE html>
<html>
<head>
<title>CyberQuest :: ${brand}</title>
<style>
  :root { --brand: ${brandColor}; --btn: ${btnColor}; }
  ${SHARED_CSS}
  .page { align-items: flex-start; }
  .card { max-width: 560px; }
</style>
<script src="${ALASQL_CDN}"></script>
<script>
var TABLES   = ${JSON.stringify(s.tables)};
var QT       = ${JSON.stringify(s.queryTemplate)};
var WIN_COND = ${JSON.stringify(s.winCondition)};
var WIN_MSG  = ${JSON.stringify(winMsg)};
var COLS     = ${JSON.stringify(cols)};
var COL_HDR  = ${JSON.stringify(colHeaders)};

${SHARED_JS}

function buildQuery(input) { return QT.replace('{input}', input); }

function cleanProductCount(input) {
  try {
    var cleanInput = input.split("'")[0];
    return alasql(QT.replace('{input}', cleanInput)).length;
  } catch(e) { return 0; }
}

function doSearch(input) {
  renderQuery('qpre', QT, input);
  var rows, err;
  try { rows = alasql(buildQuery(input)); err = null; }
  catch(e) { rows = []; err = e.message; }

  var tbody  = document.getElementById('tbody');
  var errBox = document.getElementById('errbox');
  tbody.innerHTML   = '';
  errBox.style.display = 'none';

  if (err) { errBox.textContent = err; errBox.style.display = 'block'; return; }

  if (!rows.length) {
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    td.colSpan = COLS.length;
    td.style.cssText = 'color:#475569;text-align:center;padding:14px 8px';
    td.textContent = 'No results.';
    tr.appendChild(td); tbody.appendChild(tr); return;
  }

  var prodCount = cleanProductCount(input);

  rows.forEach(function(row, i) {
    var tr = document.createElement('tr');
    if (i >= prodCount) tr.className = 'inj';
    COLS.forEach(function(col) {
      var td = document.createElement('td');
      var val = row[col];
      td.textContent = val !== undefined ? val : '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  if (checkWin(WIN_COND, rows)) winBanner(WIN_MSG);
}

window.addEventListener('message', function(e) {
  if (!e.data) return;
  if (e.data.type === 'sql') { runConsole(e.data.query || ''); return; }
});

window.addEventListener('DOMContentLoaded', function() {
  initDb(TABLES);
  // Build table headers
  var thead = document.getElementById('thead');
  COL_HDR.forEach(function(h) {
    var th = document.createElement('th'); th.textContent = h; thead.appendChild(th);
  });
  doSearch('');
});
</script>
</head>
<body>
<div class="topbar">
  <span style="color:var(--brand);font-weight:bold;font-size:14px">${brand}</span>
  <span class="topbar-sub">Product catalogue · internal search portal</span>
</div>
<div class="page page-top">
  <div class="card">
    <p class="card-title" style="color:var(--brand)">Product Search</p>
    <p class="card-sub">Search across 5,000+ products in the catalogue.</p>
    <div class="search-row">
      <input id="sinput" class="ti" type="text" placeholder="e.g. laptop"
             oninput="renderQuery('qpre',QT,this.value)" autocomplete="off" spellcheck="false">
      <button class="search-btn"
              onclick="doSearch(document.getElementById('sinput').value)">Search →</button>
    </div>
    <div class="results-wrap">
      <table>
        <thead><tr id="thead"></tr></thead>
        <tbody id="tbody"></tbody>
      </table>
      <div id="errbox" class="err-box"></div>
    </div>
    <div class="qs">
      <p class="qs-lbl">GENERATED SQL QUERY</p>
      <pre id="qpre" class="qs-pre"></pre>
    </div>
    <div class="con">
      <p class="con-lbl">SQL TERMINAL &middot; RECON</p>
      <div id="con-out" class="con-out"><span class="con-ph">Run a query from the editor to explore the database.</span></div>
    </div>
  </div>
</div>
${s.pageComment ? `<!-- ${s.pageComment} -->` : ''}
</body>
</html>`;
}

// ── Stacked queries page ──────────────────────────────────────────────────────

function buildStackedPage(s) {
  const brand      = s.brand      || "Target";
  const brandColor = s.brandColor || "#a78bfa";
  const btnColor   = s.btnColor   || "#7c3aed";
  const winMsg     = s.winMessage || "SQLi Triggered!";
  const cols       = s.columns       || [];
  const colHeaders = s.columnHeaders || cols.map(c => c.toUpperCase());
  const tableName  = s.targetTable || Object.keys(s.tables)[0];

  return `<!DOCTYPE html>
<html>
<head>
<title>CyberQuest :: ${brand}</title>
<style>
  :root { --brand: ${brandColor}; --btn: ${btnColor}; }
  ${SHARED_CSS}
  .page { align-items: flex-start; }
  .card { max-width: 560px; }
  .db-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
            padding: 7px 12px; background: #0f172a; border: 1px solid #1e293b;
            border-radius: 6px; font-size: 11px; }
  .db-label { color: #475569; flex: 1; }
  .db-count { font-weight: bold; min-width: 44px; text-align: right; }
  .reset-btn { background: none; border: 1px solid #334155; color: #64748b;
               font-family: monospace; font-size: 11px; padding: 3px 8px;
               border-radius: 4px; cursor: pointer; }
  .reset-btn:hover { border-color: var(--brand); color: var(--brand); }
</style>
<script src="${ALASQL_CDN}"></script>
<script>
var TABLES     = ${JSON.stringify(s.tables)};
var QT         = ${JSON.stringify(s.queryTemplate)};
var WIN_COND   = ${JSON.stringify(s.winCondition)};
var WIN_MSG    = ${JSON.stringify(winMsg)};
var COLS       = ${JSON.stringify(cols)};
var COL_HDR    = ${JSON.stringify(colHeaders)};
var TABLE_NAME = ${JSON.stringify(tableName)};

${SHARED_JS}

function buildQuery(input) { return QT.replace('{input}', input); }

function updateDbBar() {
  var t  = alasql.tables[TABLE_NAME];
  var n  = t ? t.data.length : 0;
  var el = document.getElementById('dbcount');
  if (!el) return;
  el.textContent = n + ' row' + (n !== 1 ? 's' : '');
  el.style.color = n === 0 ? '#f87171' : 'var(--brand)';
}

function doSearch(input) {
  renderQuery('qpre', QT, input);
  var rows, err;
  try {
    var result = alasql(buildQuery(input));
    if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
      rows = result[0];
    } else {
      rows = Array.isArray(result) ? result : [];
    }
    err = null;
  } catch(e) { rows = []; err = e.message; }

  updateDbBar();

  var tbody  = document.getElementById('tbody');
  var errBox = document.getElementById('errbox');
  tbody.innerHTML      = '';
  errBox.style.display = 'none';

  if (err) { errBox.textContent = err; errBox.style.display = 'block'; return; }

  if (!rows.length) {
    var tr = document.createElement('tr'); var td = document.createElement('td');
    td.colSpan = COLS.length;
    td.style.cssText = 'color:#475569;text-align:center;padding:14px 8px';
    td.textContent = 'No results.';
    tr.appendChild(td); tbody.appendChild(tr);
  } else {
    rows.forEach(function(row) {
      var tr = document.createElement('tr');
      COLS.forEach(function(col) {
        var td = document.createElement('td');
        td.textContent = row[col] !== undefined ? row[col] : '';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  if (checkWin(WIN_COND, rows)) winBanner(WIN_MSG);
}

function resetDb() {
  initDb(TABLES);
  updateDbBar();
  document.getElementById('sinput').value = '';
  renderQuery('qpre', QT, '');
  document.getElementById('tbody').innerHTML = '';
  document.getElementById('errbox').style.display = 'none';
  doSearch('');
}

window.addEventListener('message', function(e) {
  if (!e.data) return;
  if (e.data.type === 'sql') { runConsole(e.data.query || ''); return; }
});

window.addEventListener('DOMContentLoaded', function() {
  initDb(TABLES);
  var thead = document.getElementById('thead');
  COL_HDR.forEach(function(h) {
    var th = document.createElement('th'); th.textContent = h; thead.appendChild(th);
  });
  updateDbBar();
  doSearch('');
});
</script>
</head>
<body>
<div class="topbar">
  <span style="color:var(--brand);font-weight:bold;font-size:14px">${brand}</span>
  <span class="topbar-sub">Employee directory · HR portal</span>
</div>
<div class="page page-top">
  <div class="card">
    <p class="card-title" style="color:var(--brand)">Employee Directory</p>
    <p class="card-sub">Filter staff records by department name.</p>
    <div class="db-bar">
      <span class="db-label">employees table</span>
      <span id="dbcount" class="db-count" style="color:var(--brand)">5 rows</span>
      <button class="reset-btn" onclick="resetDb()">&#x21BA; Reset DB</button>
    </div>
    <div class="search-row">
      <input id="sinput" class="ti" type="text" placeholder="e.g. Engineering"
             oninput="renderQuery('qpre',QT,this.value)" autocomplete="off" spellcheck="false">
      <button class="search-btn"
              onclick="doSearch(document.getElementById('sinput').value)">Search &#x2192;</button>
    </div>
    <div class="results-wrap">
      <table>
        <thead><tr id="thead"></tr></thead>
        <tbody id="tbody"></tbody>
      </table>
      <div id="errbox" class="err-box"></div>
    </div>
    <div class="qs">
      <p class="qs-lbl">GENERATED SQL QUERY</p>
      <pre id="qpre" class="qs-pre"></pre>
    </div>
    <div class="con">
      <p class="con-lbl">SQL TERMINAL &middot; RECON</p>
      <div id="con-out" class="con-out"><span class="con-ph">Run a query from the editor to explore the database.</span></div>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function buildSqlPage(schema) {
  if (schema.uiType === "search")  return buildSearchPage(schema);
  if (schema.uiType === "stacked") return buildStackedPage(schema);
  return buildLoginPage(schema);
}
