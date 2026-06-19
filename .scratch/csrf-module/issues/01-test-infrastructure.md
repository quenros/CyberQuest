Status: completed

## Parent

.scratch/csrf-module/PRD.md

## What to build

Set up the automated testing foundation for the frontend so every subsequent slice can
ship with verified behaviour. Install Vitest (Vite-native test runner), React Testing
Library, jest-dom matchers, and jsdom as the browser environment. Add a minimal
`vitest.config.js` at `frontend/`. Write one passing smoke test to prove the setup works
end-to-end. This becomes the template all future test files follow.

No application behaviour changes — this slice is purely infrastructure.

## Acceptance criteria

- [ ] `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` are
      installed as frontend devDependencies
- [ ] `vitest.config.js` exists at `frontend/` with `environment: "jsdom"` and a
      `setupFiles` entry that imports `@testing-library/jest-dom`
- [ ] `npm test` (or `npx vitest run`) in `frontend/` exits 0 with at least one passing
      smoke test
- [ ] The smoke test asserts something trivial (e.g. that `1 + 1 === 2`, or that a
      minimal React component renders without throwing) — enough to confirm RTL + jsdom
      are wired correctly
- [ ] No existing application files are modified

## Blocked by

None — can start immediately.
