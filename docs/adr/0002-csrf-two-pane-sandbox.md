# CSRF challenges use a two-pane sandbox layout instead of the standard single-pane

CSRF fundamentally requires two actors — an attacker page and a victim session — which
the single-pane sandbox used for XSS and SQLi cannot represent. A two-pane layout was
chosen over alternatives (simulated victim button, background bot endpoint) because it
makes the two-actor nature of CSRF visually obvious to the student without needing a real
bot or a polling loop.

GET-based CSRF challenges are fully srcdoc (left pane: attacker page the student crafts;
right pane: victim session that reacts when the attacker page loads). POST-based challenges
use a simulated victim button where needed.

ChallengePage.jsx will need a layout variant that detects `sandboxType: "csrf"` and
renders the two-pane view instead of the standard single-pane editor + preview.

Considered alternatives:
- **Simulated victim button**: simpler to implement but hides the two-actor mechanic —
  students may complete the challenge without understanding what the victim actually does.
- **Background bot endpoint**: most realistic, but adds Docker complexity, a polling loop,
  and infrastructure cost for a concept that can be taught without it at Tier A.
