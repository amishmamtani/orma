# Roadmap

## Current phase: Phase 0 — Concept Refinement

**Status:** Active. Step 2 of 10 complete.

Before proceeding to Step 3 (LLM labeling), the open product questions below should be answered. They change the design of what gets built.

### Questions to answer before Step 3

**Answered:**
- ✓ **Who is the user?** Tech-adjacent builders — people who understand what they're building and can direct an AI agent, but can't read code.
- ✓ **What does "understand" mean?** Post-agent review: after the AI makes changes, the user wants a wireframe-level read on the implementation without running the server. ORMA is a code review substitute, not a planning tool.
- ✓ **LLM provider:** Gemini during development (free tier), swap to Claude before launch. See ADR-003.

**Still open:**
1. **Is the diagram the right representation?** Structural (AST node list) vs. semantic (what the code *does*) — strong labels may be enough, or the layout itself may need to communicate flow.
2. **Validate label quality before Step 4.** Generate labels for 3-5 real Python files, show them to a non-developer, and confirm they can explain the code from the diagram alone. Fix the label prompt before building the edit panel.
3. **Is copy-paste the right output?** If users are in Claude Code, is a paste-ready prompt still the right format or should it be a structured brief?

---

## Phase 1 — MVP Loop (Steps 3–6)

*Unlock after Phase 0 questions are answered.*

Step-by-step specs live in `docs/steps/`. Current status board: [`docs/steps/README.md`](steps/README.md)

**Gate before Step 4:** Show Step 3 labels to a non-developer on 3–5 real Python files. If they can't explain what the code does from the diagram alone, fix the labeling prompt before building the edit panel.

---

## Phase 2 — Polish & Deploy (Steps 7–9)

*Unlock after the MVP loop works end-to-end with at least one real user.*

Step specs in `docs/steps/step-07.md` through `step-09.md`.

---

## Post-MVP backlog

- "Peek at the code" toggle (show/hide code panel)
- File upload / drag-and-drop
- Larger files: pagination or collapsible nodes
- Non-sequential constructs: branches, loops, classes, async
- Multi-file projects (requires solving what "node" means across a call graph)
- Re-parse after an edit to visually verify the change (closes the round-trip)
- Bidirectional hover: hovering code highlights diagram node
- Inline code editing (CodeMirror 6)

---

## Risks

| Risk | Notes |
|---|---|
| Label quality | If LLM labels are wrong or generic, users click the wrong node and everything downstream fails. Highest-risk component. Validate before Step 4. |
| Prompt fidelity | A generated prompt no better than what the user would type unaided adds no value. Must localize the change (function name, current code, edit description). |
| Verification gap | After the agent applies an edit, how does the user confirm it worked without reading code? MVP answer: re-paste and compare diagrams. Slow. Addressed in post-MVP. |
| Scope creep | Non-sequential code (branching, async, multi-file) raises hard visualization questions. Resist until sequential case is validated. |
