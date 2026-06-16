# Step Status Board

This is the single source of truth for build progress. Claude reads this at the start of every implementation session to know what's active and what's next.

**Current step: Step 9 (deploy) — or Step 7 (loading/error states) if doing polish first**

---

## Status key

| Symbol | Meaning |
|---|---|
| ✅ | Complete — done-when criteria met, tested |
| 🔄 | Active — currently being worked on |
| ⏳ | Pending — not started, waiting for prior step |
| 🚧 | Blocked — started but something is in the way |

---

## Steps

| Step | Title | Status | File |
|---|---|---|---|
| 0 | Scaffold | ✅ | — |
| 1 | Parsing endpoint (no LLM) | ✅ | — |
| 2 | Render node tree in React Flow | ✅ | — |
| 3 | Plain-language labeling (LangGraph + Gemini) | ✅ | [step-03.md](step-03.md) |
| 4 | Per-function flowcharts (backend) | ✅ | [step-04.md](step-04.md) |
| 5 | Multiple editable flowcharts (frontend) | ✅ | [step-05.md](step-05.md) |
| 6 | Prompt generation from graph state | ✅ | [step-06.md](step-06.md) |
| 7 | Loading, errors, empty states | ⏳ | [step-07.md](step-07.md) |
| 8 | Frontend design + implementation | ✅ | [step-08.md](step-08.md) |
| 8.5 | Swap Gemini → Claude | ✅ | [step-08.5.md](step-08.5.md) |
| 9 | Deploy | ⏳ | [step-09.md](step-09.md) |
| 10 | User-provided API key | ⏳ | [step-10.md](step-10.md) |

---

## Workflow for Claude

**At session start:**
1. Read this file to find the current active step (🔄) or the first pending step (⏳).
2. Read that step's file for full context before starting work.
3. If the step has a "load these docs" section, load those too.

**At session end:**
1. Update the step file: fill in "What was built" and change status to ✅ or 🔄.
2. Update the status column in this table.
3. Update `docs/sessions/README.md` with a session summary.
4. If the step is complete, confirm its done-when criteria are met before marking ✅.
