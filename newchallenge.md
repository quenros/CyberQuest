# CyberQuest — Adding New Challenges

Before writing any code, read the project memory at
`C:\Users\weiya\.claude\projects\c--Users-weiya-CyberQuest\memory\project_cyberquest.md`
for the full architecture reference.

---

## When to use srcdoc vs container

**`sandboxType: "srcdoc"`** — No Docker needed. The vulnerable page is a static HTML string stored as `pageTemplate` in `challenges.js`. The iframe uses `srcDoc` + `sandbox="allow-scripts"`.

Use when:
- The challenge has no server-side state (reflected XSS, JS string injection, DOM-based)
- No real `Set-Cookie` header is needed
- No real HTTP endpoint needs to receive data

**`sandboxType: "container"`** — A real Docker container is started by the backend on challenge entry and stopped on exit.

Use only when:
- Posts/data must persist server-side across requests (stored XSS)
- A session cookie must arrive via a real `Set-Cookie` response header
- A real HTTP endpoint must receive exfiltrated data (e.g. `/logCookie`)

Container images must be built once before use:
```
docker build -t <image-name> challenges/<challenge-id>
```
Add the image to `IMAGE_MAP` in `backend/app/routes/sandbox.py` and to the `build` target in `Makefile`.

---

## Detection — always postMessage, never polling

Every challenge detects XSS by firing:
```js
window.parent.postMessage({ type: 'xss-triggered' }, '*')
```
from inside the iframe. `ChallengePage` listens with `window.addEventListener('message', ...)`.

- **alert()-based** (ch1, ch2): override `window.alert` → postMessage + show banner
- **fetch()-based** (ch3): override `window.fetch`, intercept target URL → postMessage, then forward original fetch
- No `/xss-triggered` endpoint, no `/status` endpoint, no polling

---

## Challenge format in challenges.js

Every challenge requires these fields:

```js
{
  id: "topic-N-slug",           // matches Docker image name and IMAGE_MAP key
  title: "Challenge N: Name",
  difficulty: 1-5,              // shown as stars
  points: 100,
  targetName: "AppName",        // shown in the sandbox panel header
  editorLanguage: "html",
  sandboxType: "srcdoc" | "container",
  summary: "One line shown in the curriculum panel.",

  description: "...",           // shown in the left panel — see writing guide below
  goal: "...",                  // one sentence, shown prominently — can include the payload shape

  hints: [ "...", "...", "..." ],  // progressive, last hint gives the full answer

  solution: {
    payload: "...",
    explanation: [              // array of short bullet strings, plain language
      "...",
      "...",
    ],
  },

  defense: {
    summary: "...",             // one sentence explaining the root cause
    measures: [
      { title: "...", body: "..." },
    ],
  },

  animation: [ /* step objects */ ],  // see SolutionAnimation.jsx for step types
}
```

**srcdoc challenges also need:**
```js
pageTemplate: `<!DOCTYPE html>...`,  // use {payload}, {payload_escaped}, {show_if_payload}
```

**container challenges also need:**
```js
injectPath: "/inject?body={payload}",  // GET endpoint ChallengePage uses to submit the payload
```

---

## Writing guide — description, goal, hints, explanation

### Description
- Introduce the app and what makes it vulnerable (without naming the exact attack)
- Explain any key concepts the user needs (e.g. what a cookie is, what a JS string context is)
- Give a **generic 3-step mission outline** — what they need to find out, not how to do it
- Do NOT put the exact payload or endpoint in the description

### Goal
- One sentence stating the objective
- For alert()-based challenges: fine to mention `alert('xss')`
- For exfiltration challenges: fine to mention `fetch('/endpoint?c=' + document.cookie)` — users need to know what to write

### Hints
- Hint 1: First concrete step (e.g. inject `alert(document.cookie)` to verify scripts run)
- Hint 2: Discovery step (e.g. View Frame Source to find hidden endpoints)
- Hint 3: Bridging step (how to combine what they've found)
- Hint 4: Full working payload — the complete answer

### Explanation (solution.explanation)
- Write as an array of short bullet strings
- Plain language — no framework jargon (no "Jinja2", no "| safe filter")
- Each bullet is one idea: what happened, why it worked, what makes this type dangerous
- End with the broader lesson (reflected vs stored, impact on other users, etc.)

---

## Making endpoints discoverable

Container challenges should embed the target endpoint as a **developer comment in the page HTML**, so users can find it via View Frame Source — the same discovery mechanic used in challenge 2.

Example:
```html
<!-- TODO: remove before prod — debug endpoint: /logCookie?c=<data> logs cookie data for QA -->
```

This makes hints like "right-click → View Frame Source" genuinely useful rather than arbitrary.

---

## Files to create or modify for a new challenge

| File | Change |
|---|---|
| `frontend/src/data/challenges.js` | Add challenge object to the right topic array |
| `Makefile` | Add `docker build` line (container challenges only) |
| `backend/app/routes/sandbox.py` → `IMAGE_MAP` | Add `"challenge-id": "image-name"` (container challenges only) |
| `challenges/<id>/app/app.py` | Flask app with routes (container challenges only) |
| `challenges/<id>/Dockerfile` | Docker build file (container challenges only) |
| `challenges/<id>/app/requirements.txt` | Python deps (container challenges only) |

`frontend/src/data/curriculum.js`, `Dashboard.jsx`, and `SolutionAnimation.jsx` require **no changes** — they derive everything from `challenges.js` automatically.
