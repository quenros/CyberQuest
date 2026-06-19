Status: needs-triage

# HTTP Sessions & Cookies — Standalone Prerequisite Learn Page

A foundational learn page that sits between the SQLi and CSRF modules on the dashboard.
Not a full module — no challenges, no points. Pure conceptual groundwork required before
CSRF makes sense.

## Why not a full module

Cookies and sessions are a prerequisite concept, not an attack class. There are no
naturally "exploit the cookie" challenges at Tier A (session fixation is Tier B, cookie
flag misconfigurations are defensive reading). A full module would have a great learn page
but thin challenges — breaking the platform's attack-class pattern.

## Content outline

### Section 1 — HTTP basics (brief, in case students don't know)
- What happens when you click a link: request → server → response
- HTTP is stateless — each request arrives with no memory of the last
- Why statelessness is a problem: login once, forgotten immediately

### Section 2 — Cookies as the solution
- What a cookie is: a key-value pair the server asks the browser to store
- The Set-Cookie header: how the server plants one
- How the browser automatically attaches cookies to every matching request
- What a session ID is: a random token that maps to server-side state

### Section 3 — Cookie security flags
- Secure — only sent over HTTPS
- HttpOnly — not accessible from JavaScript (why this matters for XSS)
- SameSite — controls cross-site sending (direct lead-in to CSRF)

### Section 4 — Bridge to CSRF
- Because the browser sends cookies automatically on every request, a third-party
  page can trigger a request to the target site on the victim's behalf
- The server cannot tell the difference — this is exactly what CSRF exploits

## Notes

- Assume students know basic HTTP (request/response, status codes) but NOT statelessness,
  why cookies exist, or what Set-Cookie does.
- Start at "HTTP is stateless — here's why that's a problem."
- Identified during /grill-with-docs session (2026-06-19).
