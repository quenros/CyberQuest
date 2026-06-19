Status: completed

## Parent

.scratch/csrf-module/PRD.md

## What to build

Write a Playwright end-to-end test that drives a real browser through the full Challenge 1
flow — from the name entry screen to the success modal. This verifies that the postMessage
bridge, two-pane rendering, and win detection all work together in a real browser, not
just in jsdom.

Playwright + Chromium are already installed via `npx playwright` (confirmed during
setup). No new dependencies required. The test should live in `frontend/e2e/` or
alongside the component tests, whichever is more consistent with the project convention
at the time this is implemented.

The test flow:
1. Open the app at the dev server URL (or use Playwright's `preview` mode against a
   built bundle)
2. Enter a name on the name-entry screen
3. Navigate to CSRF Challenge 1 (via the dashboard or direct URL)
4. Wait for the two-pane layout to render (attacker iframe + victim iframe visible)
5. Type `<img src="/change-email?email=attacker@evil.com">` into the Monaco editor
6. Click the inject / action button
7. Assert the success modal becomes visible (e.g. wait for text "You got it" or similar
   success heading)

## Acceptance criteria

- [ ] `npx playwright test` runs the e2e test against a locally running dev server and
      exits 0
- [ ] The test navigates through the name-entry screen successfully
- [ ] The test reaches Challenge 1 and confirms the two-pane layout is present before
      injecting the payload
- [ ] The test types the correct `<img>` payload and triggers the inject action
- [ ] The test asserts the success modal is visible within a reasonable timeout (e.g. 5s)
- [ ] The test is documented with a comment explaining what it covers and why
- [ ] A `playwright.config.js` (or `.ts`) exists at `frontend/` configuring the base URL
      and browser (Chromium)

## Blocked by

- issues/03-challenge-1-get-csrf.md
