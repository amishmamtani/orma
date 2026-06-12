# ORMA — Session Startup Protocol

You have already read `CLAUDE.md`. This file tells you what to load next based on your task.

---

## Step 1: If continuing work from a previous session

Read `docs/sessions/README.md` — it contains the last session's summary, active task, and any blockers.

---

## Step 2: Load task-specific documents

Use this decision tree. Load **only** the documents listed for your task type.

### Implementing a feature or fixing a bug
→ `docs/steps/README.md` — find the active step, then read that step's file
→ `docs/architecture.md`
→ `docs/product.md`
→ Load relevant ADR from `docs/decisions/` if you're touching a technology listed there

### Discussing product direction, scope, or user needs
→ `docs/vision.md`
→ `docs/product.md`
→ `docs/roadmap.md`

### Debugging or refactoring existing code (no new behavior)
→ `docs/architecture.md` only

### Recording a significant technical decision
→ `docs/decisions/README.md`
→ Create a new ADR following the template in that file

### Reviewing progress or planning the next step
→ `docs/steps/README.md` — status board for all steps
→ `docs/roadmap.md` — phases and open questions
→ `docs/sessions/README.md`

### Answering "what changed?" or "when was X built?"
→ `docs/changelog.md`

---

## Step 3: At session end — always update state

1. Overwrite `docs/sessions/README.md` with what was done, what's next, and any blockers.
2. Append to `docs/changelog.md` if a step was completed.
3. Create a new ADR in `docs/decisions/` if a significant technical decision was made.

---

## File size limits

| File | Limit |
|---|---|
| `CLAUDE.md` | 60 lines |
| Any file in `docs/` | 150 lines |
| Individual ADRs | 60 lines |

If a file grows beyond its limit, split or summarize it. Never let context bloat accumulate — that is the whole problem this system exists to prevent.

---

## Document index

| File | Load for | Stability |
|---|---|---|
| `docs/vision.md` | Product direction, "why does this exist" | Stable — changes rarely |
| `docs/product.md` | Feature scope, MVP decisions, open product ?s | Active — changes as product evolves |
| `docs/architecture.md` | Backend, frontend, API, stack decisions | Active — changes as code evolves |
| `docs/roadmap.md` | Phase planning, open questions before next phase | Active — update each phase |
| `docs/decisions/` | Specific technology or design decisions | Append-only — never edit past ADRs |
| `docs/steps/README.md` | Step status board — what's done, active, next | Update at session end |
| `docs/steps/step-NN.md` | Full spec for a single step | Update status + notes during work |
| `docs/sessions/README.md` | Current task, last session state | Ephemeral — overwrite each session |
| `docs/changelog.md` | Historical step log | Append-only |
