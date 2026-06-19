# Matt Pocock Skills — Usage Guide

34 skills installed from `mattpocock/skills`. This guide explains what each one does,
when to reach for it, and how the skills fit together as a workflow.

---

## The main flow: idea → ship

Most work follows this path. Start here when you have a feature idea or bug to fix.

```
/grill-with-docs  →  /to-prd  →  /to-issues  →  /implement  →  /review
                          ↑
                    (detour via /prototype if a question needs
                     runnable code to answer, bridged by /handoff)
```

### 1. `/grill-with-docs` — sharpen the idea

Interviews you about the plan, reads `CONTEXT.md` and `docs/adr/` for domain vocabulary,
and surfaces blind spots before you commit to anything. Retains what it learns in
`CONTEXT.md` and ADRs across sessions.

**Start here** when you have a codebase to work against. (No codebase yet? Use `/grill-me`.)

```
/grill-with-docs add a teacher dashboard to CyberQuest
```

---

### 2. `/to-prd` — synthesise into a PRD

Takes the conversation so far and writes a Product Requirements Document, then publishes
it to `.scratch/<feature-slug>/PRD.md`. No interview — it synthesises what you've
already discussed.

```
/to-prd
```

The PRD includes test seams, acceptance criteria, and the `ready-for-agent` triage label.

---

### 3. `/to-issues` — break the PRD into issues

Reads the PRD and slices it into independently-grabbable implementation issues, each
saved to `.scratch/<feature-slug>/issues/NN-slug.md`.

```
/to-issues .scratch/teacher-dashboard/PRD.md
```

Each issue is a vertical slice (tracer bullet) — end-to-end, not horizontal layers.

---

### 4. `/implement` — build it

Implements the work described in a PRD or set of issues using `/tdd` at pre-agreed seams.
Runs typechecking throughout and `/review` at the end.

```
/implement .scratch/teacher-dashboard/issues/01-progress-api.md
```

---

### 5. `/review` — review the diff

Reviews the current diff for correctness bugs and simplification opportunities at a
configurable effort level (low / medium / high / max / ultra).

```
/review
/review high
```

---

## Stress-testing & design

### `/grilling` — stress-test a plan before building

Interviews you relentlessly, one question at a time, with a recommended answer for each.
Use this to find holes in a design before writing a line of code.

```
/grilling I want to add blind SQLi challenges to CyberQuest
```

### `/grill-me` — same, but without a codebase

Identical to `/grilling` but doesn't read the codebase. Use at the very start of a
project or when exploring a purely conceptual question.

### `/grill-with-docs` — grilling + codebase + domain docs

The stateful version: reads `CONTEXT.md`, explores the codebase, and updates the domain
model as it learns. Prefer this over `/grilling` once a codebase exists.

### `/design-an-interface` — design it twice

Spawns parallel sub-agents to generate multiple radically different interface designs for
a module. Use when you want to explore the API space before committing.

```
/design-an-interface the hint service API (Flask endpoint + client hook)
```

### `/prototype` — answer a question with throwaway code

Two branches:

- **Logic prototype** — a tiny terminal app to push a state machine through hard cases
- **UI prototype** — several radically different UI variations on one route, switchable
  via URL param

```
/prototype does the srcdoc sandbox model work for blind SQLi?
```

---

## Architecture & codebase health

### `/improve-codebase-architecture` — architectural scan

Scans the codebase for shallow modules and surfaces deepening opportunities as a visual
HTML report. Grills you through whichever one you pick.

```
/improve-codebase-architecture
```

### `/codebase-design` — design vocabulary

Provides the shared vocabulary (module, interface, depth, seam, adapter, leverage,
locality) used by `/improve-codebase-architecture` and `/design-an-interface`. Invoke
when you want to discuss architecture in precise terms.

### `/domain-modeling` — build the domain model

Creates and sharpens `CONTEXT.md` (glossary) and `docs/adr/` (decisions). Call it when
a term needs pinning down or a decision needs recording.

```
/domain-modeling what's the difference between a "challenge" and a "module"?
```

### `/ubiquitous-language` — pin down terminology

Focuses specifically on terminology and naming. Use when multiple terms are in use for
the same concept and you want to pick one.

### `/request-refactor-plan` — plan a refactor safely

Interviews you about the refactor, then produces a step-by-step plan as tiny safe
commits and files it as an issue in `.scratch/`.

```
/request-refactor-plan extract sqlSandbox.js into a separate module
```

### `/diagnosing-bugs` — hard bug diagnosis loop

Structured diagnosis process: build a tight feedback loop first (failing test or
reproducible script), then hypothesis-test. Use when something is broken/throwing/slow
and you don't know why.

```
/diagnosing-bugs the postMessage win condition fires twice on Challenge 5
```

---

## Issue & project management

### `/triage` — process incoming issues

Moves issues in `.scratch/` through the state machine:
`needs-triage` → `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`.

```
/triage .scratch/blind-sqli/issues/01-sandbox-design.md
```

### `/qa` — conversational bug reporting

You describe bugs in plain language; the skill files them as structured issues in
`.scratch/`. It explores the codebase in the background for context.

```
/qa
```

### `/decision-mapping` — map a decision tree

Visualises the decision space for a complex choice before picking a path.

---

## TDD & testing

### `/tdd` — test-driven development

Red → green → refactor, at public interface seams. Tests verify behaviour, not
implementation — they should survive a refactor.

```
/tdd the hint endpoint returns a different nudge on each attempt number
```

---

## Developer experience

### `/setup-pre-commit` — pre-commit hooks

Sets up Husky + lint-staged (Prettier), typechecking, and test runs on commit.

```
/setup-pre-commit
```

### `/git-guardrails-claude-code` — block dangerous git commands

Adds Claude Code hooks that intercept `git push --force`, `git reset --hard`,
`git clean`, `git branch -D`, etc. before they execute.

```
/git-guardrails-claude-code
```

### `/resolving-merge-conflicts` — resolve in-progress conflicts

Reads conflicted files and resolves them. Use mid-merge or mid-rebase.

---

## Sessions & handoffs

### `/handoff` — compact the conversation for another agent

Writes a handoff document to the OS temp directory summarising context, decisions,
open questions, and suggested next skills. Use when switching sessions or handing off
to a specialised agent.

```
/handoff focus on the teacher dashboard API
```

### `/ask-matt` — skill router

Not sure which skill fits? Ask. It maps your situation to the right skill or flow.

```
/ask-matt I want to add a new vulnerability module
```

---

## Writing & content

These skills are particularly useful for CyberQuest's challenge write-ups, learn pages,
bridge lectures, and documentation.

### `/writing-fragments` — ideate into raw material

A grilling session that mines you for fragments — claims, vignettes, half-thoughts —
and appends them to a markdown file. Use before imposing any structure.

```
/writing-fragments I want to write the Blind SQLi learn page
```

### `/writing-shape` — shape raw material into an article

Takes a markdown file of raw material and grows an article from it, paragraph by
paragraph, arguing about format (lists, tables, callouts, quotes) at each step.

```
/writing-shape docs/drafts/blind-sqli-learn.md
```

### `/writing-beats` — narrative beat-by-beat

Assembles an article as a journey: you pick a starting beat, the skill writes it, then
offers where to pivot next. Use when you want a narrative arc, not an argument structure.

### `/edit-article` — edit an existing article

Edits a finished article for clarity, flow, or a specific goal.

### `/scaffold-exercises` — create exercise stubs

Creates an exercise directory structure (sections, problems, solutions, explainers) that
passes linting. Relevant for future CyberQuest tutorial content.

---

## Teaching & learning

### `/teach` — learn a topic inside this workspace

Treats the current directory as a teaching workspace. Produces lessons (HTML),
reference sheets, learning records, and a mission doc. Stateful across sessions.

```
/teach network packet analysis for the forensics module
```

---

## Reference

| Skill | One-liner |
|---|---|
| `/ask-matt` | Route to the right skill |
| `/codebase-design` | Architecture vocabulary |
| `/decision-mapping` | Map a decision tree |
| `/design-an-interface` | Design it twice, in parallel |
| `/diagnosing-bugs` | Hard bug diagnosis loop |
| `/domain-modeling` | Build the domain glossary + ADRs |
| `/edit-article` | Edit an existing article |
| `/git-guardrails-claude-code` | Block dangerous git commands |
| `/grill-me` | Stress-test a plan (no codebase) |
| `/grill-with-docs` | Stress-test a plan + codebase |
| `/grilling` | Relentless interview |
| `/handoff` | Compact conversation for next agent |
| `/implement` | Build from PRD/issues |
| `/improve-codebase-architecture` | Scan for deepening opportunities |
| `/obsidian-vault` | Search/create Obsidian notes |
| `/prototype` | Throwaway code to answer a question |
| `/qa` | Conversational bug → structured issue |
| `/request-refactor-plan` | Plan a refactor as tiny commits |
| `/resolving-merge-conflicts` | Resolve merge/rebase conflicts |
| `/review` | Review the current diff |
| `/scaffold-exercises` | Create exercise stubs |
| `/setup-matt-pocock-skills` | Re-run this setup |
| `/setup-pre-commit` | Add Husky + lint-staged |
| `/tdd` | Test-driven development |
| `/teach` | Learn a topic in this workspace |
| `/to-issues` | PRD → implementation issues |
| `/to-prd` | Conversation → PRD |
| `/triage` | Move issues through state machine |
| `/ubiquitous-language` | Pin down terminology |
| `/writing-beats` | Beat-by-beat narrative |
| `/writing-fragments` | Ideate into raw material |
| `/writing-great-skills` | Write new skills |
| `/writing-shape` | Shape raw material into article |
