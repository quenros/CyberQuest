Status: completed

## Parent

.scratch/csrf-module/PRD.md

## What to build

Add the second bridge lecture and Challenge 3 (CSRF token bypass). A student completes
Challenge 2, reads the bridge lecture on CSRF tokens and the ways they fail, then
exploits a token that is present in the form but never actually validated server-side.

1. **Bridge Lecture 2 content** — added to `learnContent.js` under `csrf`
   `bridgeLectures`. Covers: what a CSRF token is (a secret per-session value embedded
   in forms), how correct validation works (server checks token matches session), and the
   common failure modes: token present but never checked, token not tied to the session,
   token accepted when blank or arbitrary.

2. **Challenge 3 data in `challenges.js`** — the fictional endpoint now includes a CSRF
   token field in the form, but the victim app accepts any value (or a blank string).
   Student must figure out that the token is not being validated and submit the form with
   a forged or empty token. Difficulty 2. Includes all standard challenge fields.

3. **Token-bypass variant in `csrfSandbox.js`** — `buildVictimPage` extended for the
   token challenge type. The victim app renders a form with a visible CSRF token field.
   `processRequest` extended: accepts any value for the token field (deliberate
   vulnerability) and returns `triggered: true` when all other fields match.

4. **Tests** — unit tests for the token-bypass variant.

## Acceptance criteria

- [ ] Bridge Lecture 2 appears in the curriculum sidebar between Challenge 2 and
      Challenge 3 and is fully navigable
- [ ] Bridge lecture content covers: what a CSRF token is, how it should be validated,
      and the three common failure modes
- [ ] The victim pane in Challenge 3 visibly shows a CSRF token field in the form,
      making the vulnerability discoverable
- [ ] Submitting the form with any token value (including blank) triggers the victim pane
      and shows the success modal
- [ ] `processRequest` unit test: returns `triggered: true` with an arbitrary token value
- [ ] `processRequest` unit test: returns `triggered: true` with a blank token value
- [ ] `processRequest` unit test: returns `triggered: false` when required non-token
      fields are missing or wrong
- [ ] Challenges 1 and 2 behaviour is unchanged

## Blocked by

- issues/04-bridge-1-and-challenge-2-post-csrf.md
