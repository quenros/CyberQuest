# CyberQuest — Challenge Answers

> **Spoilers ahead.** This document contains the solution payload and full explanation for every challenge.

---

## Cross-Site Scripting (XSS)

### Challenge 1: The Comment Board *(ByteBoard · Difficulty 1 · 100 pts)*

**Goal:** Make the page execute `alert('xss')`

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

**Payload:**
```
"; alert('xss')//
```

**How it works:**
- The page contains a hidden analytics script that embeds your search query into a JS variable: `var _lastQuery = "YOUR_INPUT";`
- The leading `"` closes the string early — you are now outside it and writing live JavaScript.
- `alert('xss')` runs as a free-standing statement.
- The trailing `//` comments out the remaining `";` that would have caused a syntax error.
- HTML tag filters are useless here because the attack is at the **JavaScript string** level, not the HTML level.

---

### Challenge 3: The Return Link *(ReturnPortal · Difficulty 2 · 150 pts)*

**Goal:** Make the page execute `alert('xss')` by injecting a `javascript:` URI as the return URL

**Payload:**
```
javascript:alert('xss')
```

**How it works:**
- Your input becomes the `href` of an anchor tag with no scheme validation.
- `javascript:` is a valid URI scheme. When the link is clicked, the browser executes the code after the colon instead of navigating to a page.
- No `<script>` tag is involved — the attack lives entirely inside an `href` attribute.
- Click the **"Return to previous page"** link after injecting to trigger it.

---

### Challenge 4: The Profile Page *(ProfileHub · Difficulty 2 · 150 pts)*

**Goal:** Make the page execute `alert('xss')` by breaking out of the `value` attribute and injecting an event handler

**Payload:**
```
" onclick="alert('xss')
```

**How it works:**
- Your input is placed inside `value="..."` without escaping the quote character.
- The leading `"` closes the `value` attribute early — you are now writing raw HTML attributes on the `<input>` element.
- `onclick="alert('xss')"` is parsed as a legitimate event handler attribute.
- After injecting, **click the username field** in the preview to fire the event.
- The server's `<script>` tag filter is irrelevant — the attack never used a script tag.

---

### Challenge 5: The Note Board *(NoteNest · Difficulty 3 · 200 pts)*

**Goal:** Post a note that exfiltrates the session cookie without the victim noticing

**Payload:**
```html
<script>fetch('/logCookie?c='+document.cookie)</script>
```

**How it works:**
- Your `<script>` tag is saved to the server and runs automatically in every visitor's browser — no click required.
- `document.cookie` is readable because the session cookie is not marked `HttpOnly`.
- `fetch()` silently sends the cookie value to `/logCookie` as a URL parameter.
- This is **stored XSS** — unlike Challenge 1, the attacker only posts once and every future visitor is compromised automatically.

---

## SQL Injection (SQLi)

### Challenge 1: The Login Bypass *(AdminPortal · Difficulty 1 · 100 pts)*

**Goal:** Log in as admin without knowing the password

**Payload:**
```
admin' --
```

**How it works:**
- The login query is built by pasting the username directly into a SQL string: `WHERE username = '{input}' AND password = '...'`
- The `'` closes the username string early — everything after it is raw SQL, not a value.
- `--` is a SQL line comment. Everything after it on the same line is ignored, including `AND password = '...'`
- The resulting query is: `WHERE username = 'admin' --' AND password = '...'` — the password check never runs.
- The database returns the admin row with no password required.

**Alternative payloads that also work:**
```
' OR 1=1 --
' OR role='admin' --
```

---

### Challenge 2: The Product Search *(ShopDB · Difficulty 2 · 200 pts)*

**Goal:** Dump the users table — make admin's credentials appear in the search results

**Payload:**
```
' UNION SELECT 1, username, password FROM users --
```

**How it works:**
- The search query returns 3 columns: `id`, `name`, `price` via a `LIKE` match.
- A single `'` breaks out of the `LIKE` string — everything after is raw SQL.
- `UNION SELECT` appends a second query's rows to the result set. Both SELECTs must return the same number of columns (3).
- `1` is a filler for the `id` slot; `username` and `password` fill the `name` and `price` columns.
- `FROM users` points at a table the app never intended to expose.
- `--` comments out the trailing `%'` from the original template.
- The admin's credentials appear highlighted in the search results.

**Scouting payloads (to discover column count first):**
```
' ORDER BY 3 --        ← works (3 columns confirmed)
' ORDER BY 4 --        ← error (too many)
' UNION SELECT 1,2,3 --  ← confirms column positions
```

---

### Challenge 3: The Employee Directory *(StaffDB · Difficulty 3 · 300 pts)*

**Goal:** Use a stacked query to delete every row from the employees table

**Payload:**
```
'; DELETE FROM employees WHERE 1=1 --
```

**How it works:**
- The dept filter is built by pasting input into: `WHERE dept = '{input}'`
- The `'` closes the dept string. The `;` terminates the SELECT statement entirely and begins a brand-new, independent second statement.
- `DELETE FROM employees WHERE 1=1` runs as statement 2. `WHERE 1=1` is always true — it matches and deletes every row.
- `--` comments out the trailing `'` left over from the original template.
- The database row counter drops to 0 and the win banner fires.
- Click **↺ Reset DB** in the portal to restore the data and experiment further.

**Variants that also work:**
```
'; DELETE FROM employees WHERE dept='Engineering' --   ← deletes only Engineering
'; DELETE FROM employees WHERE 1=1; --                 ← trailing semicolon also valid
```
