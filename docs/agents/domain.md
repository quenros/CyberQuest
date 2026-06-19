# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout: single-context

One `CONTEXT.md` + `docs/adr/` at the repo root.

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       └── 0001-*.md
└── frontend/
└── backend/
└── challenges/
```

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — domain glossary and ubiquitous language for the platform
- **`docs/adr/`** — read ADRs that touch the area you're about to work in

If either file doesn't exist yet, **proceed silently**. Don't flag their absence. The `/domain-modeling` skill creates them lazily when terms or decisions crystallise.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider), or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0001 (srcdoc-vs-container sandboxing) — but worth reopening because…_
