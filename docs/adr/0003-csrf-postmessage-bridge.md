# CSRF sandbox uses a postMessage bridge to simulate requests, not real HTTP

The attacker iframe's srcdoc is injected with a JS shim that intercepts outgoing
requests (overrides fetch, XMLHttpRequest, and monitors img/form elements via
MutationObserver). Instead of firing a real HTTP request, it routes via
parent.postMessage({type: 'csrf-request', ...}). The parent forwards to the victim
iframe, which runs an in-browser app that processes the "request," updates its state,
and fires parent.postMessage({type: 'csrf-triggered'}) on success.

Chosen over a real Flask endpoint (Option B) because GET-based Tier A challenges don't
need real HTTP — the mechanic is identical and the postMessage pattern is already
established by XSS and SQLi sandboxes. Option B is the right call if a future challenge
requires real SameSite cookie behaviour or a real Set-Cookie header to work correctly,
at which point it should use a Docker container like the stored XSS challenge does.
