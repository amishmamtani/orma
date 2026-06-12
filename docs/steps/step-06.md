# Step 6 — Prompt generation from graph state

**Status:** ⏳ Pending
**Depends on:** Step 5 ✅

---

## Goal

Build `POST /generate-prompt` and wire it to the frontend. The user edits a flowchart, clicks "Generate prompt", and gets a paste-ready prompt that is grounded in the actual code — referencing specific functions, line numbers, and raw code snippets from the nodes they touched.

---

## What to build

### Backend — `POST /generate-prompt`

**Input:**
```json
{
  "function_name": "process_orders",
  "original_nodes": [...],
  "original_edges": [...],
  "edited_nodes": [...],
  "edited_edges": [...]
}
```

**What it does:**
1. Computes the diff between original and edited graph:
   - Added nodes (present in edited, not in original)
   - Removed nodes (present in original, not in edited)
   - Added edges (new connections)
   - Removed edges (disconnected)
2. Calls the prompt-generation chain with the diff + raw_code from affected nodes
3. Returns `{ "prompt": "<paste-ready text>" }`

Create `backend/chains/prompt_graph.py` — LangGraph `StateGraph`, one node, calls `get_model()`.

**Prompt generation guidance:**
The generated prompt must include:
- Function name and line range
- The original code for any node that was removed or reconnected (verbatim)
- A plain-English description of each change derived from the diff
- Instruction to make only this change, leave other functions untouched

Example output:
```
In `process_orders` (lines 1–8):

The current code does:
  [raw_code of affected nodes]

Please make the following changes:
- Remove the step that calculates totals inline; replace it with a call to a new helper function `compute_line_total(order)`
- Add a new step after the loop that filters out any totals below 0 before returning

Make only these changes. Do not modify any other functions.
```

### Frontend
- Add "Generate prompt" button per flowchart (active when the graph has been edited)
- On click: POST original + edited graph state to `/generate-prompt`
- Show loading state
- Display returned prompt in a read-only panel below the flowchart
- "Copy to clipboard" button with brief "Copied!" confirmation

---

## Load these docs before starting

- `docs/architecture.md` — API contracts
- `docs/decisions/003-llm-provider-strategy.md`
- `docs/decisions/004-langgraph-orchestration.md`

---

## How to test

Full end-to-end loop:
1. `make dev`, open `http://localhost:5173`
2. Paste a Python file → parse
3. Delete a node from one flowchart
4. Click "Generate prompt"
5. Read the prompt — confirm it names the function, includes the original raw_code of the deleted node, and describes the removal
6. Paste the prompt into Claude Code on a real project — confirm the edit lands correctly on the first try

**Step 6 is not done until the prompt reliably lands the edit in a real agent.**

---

## Done when

- [ ] `POST /generate-prompt` returns a structured prompt string
- [ ] Prompt includes function name, line numbers, raw code of affected nodes
- [ ] Prompt accurately reflects the graph diff (added/removed nodes and edges)
- [ ] Frontend wires button → endpoint → display → copy
- [ ] Full loop tested end-to-end; prompt lands correctly in Claude Code

---

## Notes

*(Fill in during implementation)*
