# This container is no longer used.
#
# Challenge 2 (JS Injection via Search) was migrated to sandboxType "srcdoc" —
# the vulnerable page is rendered entirely in the browser via the iframe srcDoc
# attribute, with the HTML template stored in frontend/src/data/challenges.js.
#
# No Docker container is needed because:
#   - The challenge is stateless (reflected XSS, no server-side persistence)
#   - Detection uses window.parent.postMessage instead of HTTP polling
