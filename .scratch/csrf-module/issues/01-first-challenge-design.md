Status: needs-triage

# CSRF Module — Challenge 1: GET-based CSRF (introductory)

The first and easiest CSRF challenge. Students understand the core mechanic before
moving to POST-based and token-related variants.

## Scenario (proposed)

A fictional account settings page (e.g. "UserHub") that changes the user's email via a
plain GET request with no CSRF token:

  GET /change-email?email=attacker@evil.com

The victim is logged in. The student crafts an attacker page that fires this request
automatically when loaded. The victim pane shows the email change.

## What the student does

Writes an HTML snippet in the Monaco editor (Option A — full HTML, not just a URL).
The attacker page body becomes whatever the student writes. The natural solution:

  <img src="/change-email?email=attacker@evil.com">

The browser fires the GET request on page load, no click required.

## Two-pane layout

- Left pane: attacker page preview (student's HTML snippet rendered live)
- Right pane: victim's session — shows the logged-in user's current email; updates
  when the forged request lands

## Win condition

Victim's email changes to the attacker-controlled value. Victim pane fires
postMessage({type: 'csrf-triggered'}) to parent. ChallengePage shows success modal.

## Difficulty

1 (easiest) — GET request, no token, single img tag solution.

## Notes

- sandboxType: "csrf" — triggers two-pane layout variant in ChallengePage.jsx
- Confirmed during /grill-with-docs session (2026-06-19)
