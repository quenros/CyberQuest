Status: ready-for-agent

# CSRF Module + Automated Testing Foundation

## Problem Statement

Students completing the XSS and SQL Injection modules have no path to the third major
web attack class — Cross-Site Request Forgery. CSRF is a required stepping stone for
Tier A CTF web challenges and introduces the two-actor attack model that students haven't
encountered yet: the victim's own browser is weaponised against them, without their
knowledge, purely because it automatically attaches session cookies to every request.

Additionally, the codebase has no automated tests. Challenge sandbox logic, win
conditions, and component behaviour are entirely unverified, making it easy to ship
broken challenges without noticing.

## Solution

Add a CSRF module with three challenges of increasing difficulty, a dedicated Learn Page
with a ModuleIntro primer and animated attack flow, and a two-pane sandbox layout that
makes the two-actor mechanic visible. At the same time, establish the automated testing
foundation so that all sandbox logic and rendering behaviour are verifiable going forward.

## User Stories

1. As a student, I want to read a short primer on HTTP and cookies before starting CSRF,
   so that I understand why the attack is possible before I attempt it.
2. As a student, I want to see an animated attack flow on the CSRF learn page, so that I
   can visualise the sequence of events (attacker page → browser sends cookie → server
   processes request) before I interact with the sandbox.
3. As a student, I want to understand what a session cookie is and why the browser
   attaches it automatically, so that CSRF feels like a logical consequence rather than magic.
4. As a student, I want to see the SameSite and HttpOnly flags explained, so that I
   understand how cookies can be defended before I learn to exploit the absence of that defence.
5. As a student, I want to understand what CSRF is in plain language before the first
   challenge, so that I can form a hypothesis about what to try.
6. As a student, I want to see both the attacker page I am crafting and the victim's
   session side by side, so that I can watch the attack take effect in real time.
7. As a student, I want to write raw HTML in the editor for CSRF challenges, so that I
   directly see the connection between the tag I write and the request the browser fires.
8. As a student, I want Challenge 1 to be a GET-based CSRF with no token, so that I
   understand the simplest possible form of the attack before moving to harder variants.
9. As a student, I want a bridge lecture before Challenge 2 that explains POST requests
   and auto-submitting forms, so that I know what new technique I need without being
   given the answer.
10. As a student, I want Challenge 2 to be a POST-based CSRF, so that I learn why
    state-changing actions should never use GET and why POST alone isn't enough protection.
11. As a student, I want a bridge lecture before Challenge 3 that explains CSRF tokens
    and how they can fail, so that I can reason about the token bypass without being
    handed the solution.
12. As a student, I want Challenge 3 to involve a CSRF token that the server does not
    validate, so that I understand that tokens only help when correctly enforced.
13. As a student, I want tiered hints on each CSRF challenge, so that I can get unstuck
    without having the full solution revealed.
14. As a student, I want an animated step-by-step solution breakdown after solving a
    CSRF challenge, so that I can review exactly what happened and why it worked.
15. As a student, I want the CSRF module to appear on the dashboard after the SQL
    Injection module, so that I follow the intended learning progression.
16. As a student, I want the editor label, action button, and placeholder to reflect the
    CSRF scenario (not generic "Payload Editor"), so that the UI feels grounded in the
    story of each challenge.
17. As a developer, I want the victim app state logic extracted as a pure function, so
    that I can write unit tests against it without needing a browser or iframe.
18. As a developer, I want a test that confirms the win modal appears when
    `{type: "csrf-triggered"}` is posted from the sandbox, so that I can catch regressions
    in the success detection path.
19. As a developer, I want Vitest and React Testing Library configured for the frontend,
    so that I have a fast, Vite-native test runner for all future component and logic tests.
20. As a developer, I want the ModuleIntro component tested in isolation, so that I
    confirm it renders the expected sections without coupling tests to learn page internals.
21. As a developer, I want an end-to-end Playwright test that walks a student through
    CSRF Challenge 1 and confirms the success modal appears, so that the full sandbox
    flow is verified in a real browser.

## Implementation Decisions

### Data layer (no rendering logic changes)
- Three new Challenge objects added to `challenges.js` under the `"csrf"` key, each with
  `sandboxType: "csrf"`, context-aware editor fields (`editorLabel`, `editorAction`,
  `editorHint`, `editorPlaceholder`), `hints`, `solution`, and `animation`.
- CSRF topic in `topics.js` flipped to `unlocked: true`.
- CSRF learn content added to `learnContent.js` with two new section types:
  `"module-intro"` and `"csrf-flow"`.

### New components (no existing files modified)
- `components/learn/ModuleIntro.jsx` — renders the HTTP/cookie primer. Accepts a `sections`
  prop (array of `{ heading, body }` objects). Reusable: future modules with prerequisites
  pass their own sections. Scroll-triggered fade-in via Framer Motion, consistent with
  existing learn components.
- `components/learn/CsrfFlowSection.jsx` — CSRF attack sequence animation. Uses Framer
  Motion `useAnimate` to run a sequenced animation: draw request arrow → cookie badge
  slides onto arrow → server box highlights. Driven by a play/replay button so students
  can re-watch. No new animation libraries.
- `utils/csrfSandbox.js` — mirrors `sqlSandbox.js`. Exports builder functions
  (`buildVictimPage`, `buildAttackerShim`) that return srcdoc HTML strings for each
  challenge type. The victim app state logic is extracted into a pure JS function
  (`processRequest(state, request) → { newState, triggered }`) so it can be unit-tested
  independently of the browser.

### Minimal changes to existing renderers
- `LearnPage.jsx` — two new cases added to the `renderSection` switch:
  `"module-intro"` → `<ModuleIntro>`, `"csrf-flow"` → `<CsrfFlowSection>`.
- `ChallengePage.jsx` — one new branch: when `challenge.sandboxType === "csrf"`, render
  a two-pane layout (attacker iframe left, victim iframe right) instead of the standard
  single-pane layout. Inject the request-interception shim into the attacker iframe
  srcdoc. Listen for `{ type: "csrf-triggered" }` postMessage alongside the existing
  `{ type: "xss-triggered" }` listener.

### Two-pane sandbox mechanics (postMessage bridge — ADR-0003)
- Attacker iframe srcdoc is injected with a JS shim that intercepts outgoing requests
  (overrides `fetch`, `XMLHttpRequest`, monitors `<img>` and `<form>` via
  `MutationObserver`). Instead of firing real requests, the shim routes them via
  `parent.postMessage({ type: "csrf-request", method, url, params })`.
- Parent (`ChallengePage`) forwards to victim iframe via
  `victimFrame.contentWindow.postMessage(...)`.
- Victim iframe runs the in-browser victim app (built by `csrfSandbox.js`). When a
  matching request is received and the win condition is met, it fires
  `parent.postMessage({ type: "csrf-triggered" })`.

### No backend changes
All three CSRF challenges are fully `srcdoc` + postMessage bridge. No Docker containers,
no Flask endpoints, no new routes required.

### Testing infrastructure
- `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` added as
  frontend devDependencies.
- `vitest.config.js` added at `frontend/` root with `environment: "jsdom"` and
  `setupFiles` pointing at a jest-dom setup file.
- Tests live alongside source files at `frontend/src/**/*.test.jsx?`.

## Testing Decisions

### What makes a good test here
Tests verify observable behaviour through public interfaces — what the component renders,
what postMessages it emits, what state the victim app reaches. Tests must not assert on
internal implementation: CSS class names, internal state variables, component structure,
or srcdoc string content directly. A test that breaks when you rename a CSS class or
refactor a helper function is testing the wrong thing.

### Modules to test

**`csrfSandbox.js` — unit tests (pure logic, no DOM needed)**
- `processRequest(state, request)` returns `triggered: true` when the correct forged
  request is received for each challenge type.
- `processRequest` returns `triggered: false` for incorrect method, wrong params, or
  missing fields.
- `buildVictimPage(challenge)` returns a non-empty string (smoke test — not asserting
  HTML structure).

**`ModuleIntro.jsx` — component tests (React Testing Library)**
- Renders each section heading passed via props.
- Does not render when `sections` is empty.

**`ChallengePage.jsx` — component tests (React Testing Library)**
- When `sandboxType: "csrf"`, renders two iframe elements (attacker + victim).
- When `sandboxType: "srcdoc"`, renders one iframe element (existing behaviour
  unchanged).
- When a `{ type: "csrf-triggered" }` message is posted to `window`, the success modal
  becomes visible.

**End-to-end — Playwright**
- Navigate to CSRF Challenge 1, type the correct `<img>` payload, click inject, assert
  the success modal text appears.
- Prior art: Playwright is already available via `npx playwright` with Chromium installed.
  No additional install required.

### Prior art
No existing tests in the project source. These are the first. The Vitest + RTL setup
becomes the template for all future test files.

## Out of Scope

- CSRF Challenge 4 or beyond (blind CSRF, JSON CSRF, subdomain CSRF) — Tier B, deferred.
- POST-based CSRF using a real Flask endpoint with real `SameSite` cookie behaviour —
  the postMessage bridge is sufficient for Tier A and avoids Docker complexity.
- Teacher dashboard or progress tracking for CSRF challenges.
- Mobile layout changes for the two-pane sandbox.
- XSS filter bypass challenge — tracked separately in
  `.scratch/xss-filter-bypass/issues/01`.

## Further Notes

- The ModuleIntro component should be designed for reuse: the content it renders is
  passed as props from `learnContent.js`, not hardcoded. Future modules (e.g. a network
  basics primer before a packet-analysis module) add their own sections array without
  touching the component.
- The `CsrfFlowSection` animation should include a replay button — the attack sequence
  is the key insight for this module and students benefit from watching it more than once.
- Bridge lecture content for Challenges 2 and 3 follows the same `learnContent.js` +
  `bridgeLectures` key pattern already used by the SQLi module.
- See `CONTEXT.md` for canonical definitions of Module, Challenge, Bridge Lecture,
  Module Intro, Sandbox, Tier A, and Tier B.
- See `docs/adr/0002`, `0003`, `0004` for the architectural decisions behind the
  two-pane sandbox, postMessage bridge, and ModuleIntro component respectively.
