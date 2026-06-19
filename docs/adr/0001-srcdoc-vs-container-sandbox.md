# Sandbox strategy: srcdoc for stateless challenges, Docker container for stateful ones

Each challenge runs its vulnerable app in one of two sandbox types. Stateless challenges
(reflected XSS, attribute injection, SQL injection) use a self-contained `srcdoc` iframe —
no server, no Docker, zero cost per session. Challenges that require real server-side state
or a genuine `Set-Cookie` header (stored XSS with cookie exfiltration) spin up a
resource-capped Docker container (128MB RAM, 0.5 CPU) behind a reverse proxy.

This was chosen over running everything in Docker because containers are a limited resource
and stateless challenges genuinely don't need one. Keeping Docker for only the cases where
it's irreplaceable (server state, real cookies) keeps the platform cheap to run at small
scale and fast to load for students.
