Status: completed

## Parent

.scratch/csrf-module/PRD.md

## What to build

Build the complete end-to-end flow for CSRF Challenge 1 (GET-based CSRF), establishing
all the patterns that Challenges 2 and 3 will reuse. A student navigates to the
challenge, writes an HTML snippet in the Monaco editor, clicks inject, and watches the
victim's account state change in the right pane — then sees the success modal.

Four deliverables shipped as one vertical slice:

1. **`csrfSandbox.js`** — new utility (mirrors `sqlSandbox.js`). Exports:
   - `buildAttackerShim()` — srcdoc HTML for the attacker iframe, pre-injected with a
     JS shim that intercepts outgoing requests (`fetch`, `XMLHttpRequest`, `<img>`,
     `<form>` via MutationObserver) and routes them via
     `parent.postMessage({ type: "csrf-request", method, url, params })` instead of
     firing real HTTP.
   - `buildVictimPage(challenge)` — srcdoc HTML for the victim iframe. Renders a
     fictional logged-in account page whose state changes when a matching forged request
     arrives via postMessage. Fires `parent.postMessage({ type: "csrf-triggered" })` on
     win.
   - `processRequest(state, request)` — **pure function, no DOM**. Accepts the victim's
     current state and the incoming request object; returns `{ newState, triggered }`.
     Extracted from the srcdoc so it can be unit-tested directly.

2. **Challenge 1 data in `challenges.js`** — scenario: a fictional account settings page
   ("UserHub") that changes the victim's email via a GET request with no CSRF token.
   Includes `sandboxType: "csrf"`, context-aware editor fields (`editorLabel`,
   `editorAction`, `editorHint`, `editorPlaceholder`), tiered `hints`, `solution`
   (payload + explanation), and `animation` (step-by-step breakdown). Difficulty 1.

3. **Two-pane layout in `ChallengePage.jsx`** — when `challenge.sandboxType === "csrf"`,
   render two iframes side by side (attacker left, victim right) instead of the standard
   single-pane layout. Inject the attacker shim srcdoc into the left iframe. Wire the
   postMessage bridge: parent receives `csrf-request` from attacker iframe, forwards to
   victim iframe; parent receives `csrf-triggered` from victim iframe, triggers success
   modal. Existing `xss-triggered` and `srcdoc` paths are unchanged.

4. **Tests** — unit and component, using the infrastructure from issues/01.

## Acceptance criteria

- [ ] Navigating to CSRF Challenge 1 renders two iframes (attacker pane left, victim
      pane right) with no console errors
- [ ] Typing `<img src="/change-email?email=attacker@evil.com">` in the editor and
      clicking inject causes the victim pane to show the updated email
- [ ] The success modal appears after the victim pane fires `csrf-triggered`
- [ ] The editor label, action button, and placeholder reflect the challenge scenario
      (not generic "Payload Editor" defaults)
- [ ] Tiered hints are accessible and reveal progressively
- [ ] The solution animation plays correctly after "Reveal solution" is confirmed
- [ ] Existing srcdoc challenges (XSS) and container challenges (stored XSS) are
      unaffected — their layout and win detection are unchanged
- [ ] `processRequest` unit test: returns `triggered: true` when correct GET request
      received
- [ ] `processRequest` unit test: returns `triggered: false` for wrong method, wrong
      params, or missing fields
- [ ] `buildVictimPage` unit test: returns a non-empty string (smoke)
- [ ] Component test: `ChallengePage` renders two `<iframe>` elements when
      `sandboxType: "csrf"`
- [ ] Component test: `ChallengePage` renders one `<iframe>` when `sandboxType: "srcdoc"`
      (regression guard)
- [ ] Component test: success modal becomes visible when
      `{ type: "csrf-triggered" }` is posted to `window`

## Blocked by

- issues/01-test-infrastructure.md
