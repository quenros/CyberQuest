Status: completed

## Parent

.scratch/csrf-module/PRD.md

## What to build

Add the first bridge lecture and Challenge 2 (POST-based CSRF). A student completes
Challenge 1, reads the bridge lecture explaining why POST requests are used for
state-changing actions and how a hidden auto-submitting form exploits them, then attempts
Challenge 2 using that knowledge.

1. **Bridge Lecture 1 content** — added to `learnContent.js` under the `csrf`
   `bridgeLectures` key (same pattern as the SQLi bridge lectures). Covers: why GET
   requests should never change state, how POST requests work, the hidden form +
   `document.forms[0].submit()` pattern, and why POST alone is not enough protection
   (the browser still attaches the session cookie).

2. **Challenge 2 data in `challenges.js`** — same fictional scenario but the endpoint
   now requires POST. Student must write a hidden auto-submitting form rather than an
   `<img>` tag. Difficulty 2. Includes `editorLabel`, `editorAction`, `editorHint`,
   `editorPlaceholder`, `hints`, `solution`, and `animation`.

3. **POST variant in `csrfSandbox.js`** — `buildVictimPage` extended to handle a POST
   challenge type. `processRequest` extended to validate method is POST and params match
   before returning `triggered: true`.

4. **Tests** — unit tests for the POST variant of `processRequest`.

## Acceptance criteria

- [ ] Bridge Lecture 1 appears in the curriculum sidebar between Challenge 1 and
      Challenge 2 and is fully navigable
- [ ] Bridge lecture content covers: GET vs POST, the hidden form pattern, and why POST
      alone does not prevent CSRF
- [ ] Navigating to Challenge 2 renders the two-pane layout (reusing the pattern from
      issues/03 — no layout changes needed)
- [ ] Submitting an `<img>` tag does not trigger a win (method mismatch — GET rejected)
- [ ] Writing a hidden auto-submitting POST form triggers the victim pane and shows the
      success modal
- [ ] `processRequest` unit test: returns `triggered: true` for correct POST request
- [ ] `processRequest` unit test: returns `triggered: false` when method is GET (wrong
      for this challenge)
- [ ] Challenge 1 behaviour is unchanged

## Blocked by

- issues/03-challenge-1-get-csrf.md
