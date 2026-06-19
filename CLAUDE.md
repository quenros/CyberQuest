# CyberQuest — Claude Code Instructions

## Workflow rules

### After any development work

**Always** update these two files at the end of every development session:

1. **`cyberquest_project_roadmap.md`** — Add a dated changelog checkpoint describing what was built, and update any checklist items, Current Status, Feature Prioritization, Content Development Plan, and Week-by-Week sections to reflect current reality.

2. **`ANSWERS.md`** — Add challenge walkthroughs whenever new challenges are shipped. Each entry needs: goal, step-by-step walkthrough, the exact payload, and a "how it works" explanation in plain language for students.

Both files are read by educators and students — keep them accurate and up to date.

## Domain docs

Read `CONTEXT.md` (domain glossary) and `docs/adr/` (architecture decisions) before working in any area that touches challenge sandboxes, module structure, or the learn page system.

## Issue tracker

Issues live as markdown files under `.scratch/`. Use `.scratch/<feature-slug>/PRD.md` for specs and `.scratch/<feature-slug>/issues/NN-slug.md` for implementation issues.

## Agent skills

### Issue tracker

Local markdown — issues live as files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label strings (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo — `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
