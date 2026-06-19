Status: completed

## Parent

.scratch/csrf-module/PRD.md

## What to build

Build the full CSRF Learn Page so a student can navigate to it from the dashboard and
read the complete foundational content before attempting any challenge. This covers three
deliverables shipped together as one demoable slice:

1. **`ModuleIntro` component** — a reusable component that renders a short primer before
   the attack concept is introduced. For CSRF it covers: HTTP statelessness, what a cookie
   is, how the browser auto-attaches cookies, session IDs, and the Secure / HttpOnly /
   SameSite flags. Content is passed as props from `learnContent.js` — the component
   itself has no hardcoded CSRF knowledge, making it reusable for future modules.

2. **`CsrfFlowSection` component** — an animated sequence showing the CSRF attack flow:
   victim visits attacker page → browser auto-attaches session cookie to outgoing request →
   target server processes the forged request → victim's account state changes. Built with
   Framer Motion `useAnimate` (no new libraries). Includes a replay button so students can
   re-watch. Key animated moment: a cookie badge visually travels along the request arrow.

3. **CSRF learn page content and routing** — CSRF content added to `learnContent.js` with
   section types `"module-intro"` and `"csrf-flow"` alongside the standard `"intro"`,
   `"flow"`, `"cards"`, `"code"`, and `"types"` sections. Two new cases added to
   `LearnPage.jsx`'s `renderSection` switch. CSRF topic flipped to `unlocked: true` in
   `topics.js` so the module appears on the dashboard.

## Acceptance criteria

- [ ] Navigating to `/learn/csrf` renders the CSRF learn page without errors
- [ ] The CSRF module appears on the dashboard (topic card visible and clickable)
- [ ] The `ModuleIntro` section renders with headings covering HTTP statelessness, cookies,
      session IDs, and the Secure / HttpOnly / SameSite flags
- [ ] The `CsrfFlowSection` animation plays automatically on page load and a replay button
      re-triggers the full sequence
- [ ] The animated cookie badge visually attaches to the request arrow during the sequence
- [ ] Standard learn page sections (danger cards, code example, types, CTA) render below
      the animation
- [ ] `ModuleIntro` unit test: renders each heading from its `sections` prop
- [ ] `ModuleIntro` unit test: renders nothing when `sections` is empty
- [ ] No changes to XSS or SQLi learn pages

## Blocked by

- issues/01-test-infrastructure.md
