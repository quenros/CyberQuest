Status: needs-triage

# XSS Module — Add filter bypass challenge

The current XSS module (5 challenges) does not cover filter bypass. Almost every Tier A CTF
XSS challenge has at least one naïve filter (e.g. stripping `<script>` but not blocking
alternative tags). Without this, a student who completes the full module will encounter this
pattern in competition and have no mental model for it.

## Proposed challenge

- **Scenario**: A comment board that strips `<script>` tags server-side but leaves other HTML
  intact.
- **Win condition**: Execute `alert('xss')` using an alternative vector, e.g.
  `<img onerror=alert('xss') src=x>` or `<svg onload=alert('xss')>`.
- **Difficulty**: 2 (same tier as existing challenges 2–4)
- **Sandbox**: `srcdoc` — stateless, no Docker needed.
- **Fits after**: Challenge 1 (ByteBoard — basic `<script>` injection), as a natural "what if
  script tags are blocked?" follow-up.

## Concepts to cover in bridge lecture

- Why naïve tag-name filters fail (HTML has many event-bearing elements)
- `onerror`, `onload`, `onfocus`, `onmouseover` as alternative event handlers
- Attribute-quoted vs unquoted event handlers
- Why blocklists lose to allowlists (defensive framing)

## Notes

Identified during `/grill-with-docs` session (2026-06-19). Agreed gap — to be addressed
as a future challenge addition, not blocking current CSRF module work.
