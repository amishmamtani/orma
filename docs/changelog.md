# Changelog

*Append-only. Add a new entry when a step is completed. Load this file only for "what changed?" questions.*

---

## Steps 5–8.5 + UI polish — 2026-06-12

**Step 5 (multiple editable flowcharts):** Per-function tabs with accent colors, function header nodes, double-click inline node editing, add node from toolbar, zoom controls with live % display.

**Step 6 (prompt generation):** `backend/chains/prompt_graph.py` — LangGraph StateGraph diffs original vs edited nodes/edges and calls Claude to produce a paste-ready prompt. `POST /generate-prompt` endpoint. PromptPanel (bottom sheet, copy button).

**Step 8 (frontend redesign):** Full dark-mode UI. Floating CodePanel (left, 33vw) with syntax highlighting (`react-syntax-highlighter`, atomOneDark), ghost empty state, drag-and-drop `.py` files. React Flow canvas as base layer (right of code panel). Floating Toolbar with Heroicons. Function tabs (FunctionTabs.tsx). PromptPanel slides up from bottom. Dotted background via CSS radial-gradient.

**Step 8.5 (swap to Claude):** `backend/config.py` → `ChatAnthropic(model="claude-haiku-4-5")`.

**Layout algorithm overhaul (2026-06-12):**
- Added `stopBefore` param to `place()` — prevents branch nodes from pulling merge node to wrong x position
- Added `treeWidth()` pre-pass — branches spread proportionally to subtree width; nested conditions never overlap
- Filtered spurious edges FROM end nodes in `buildGraph()` (AST pending mechanism artifact)
- Adaptive column spacing via bounding box in `buildGraph()`

**UI polish (2026-06-12):**
- Fixed node width: `220px` fixed + `wordBreak: break-word` (was `minWidth`, caused layout inaccuracy)
- `localStorage` parse cache — reload restores last diagram
- Node selected state: accent-color border ring
- Click-to-highlight: node click highlights lines in CodePanel + auto-scroll
- CodePanel cursor fix (`caretColor: #e5e5e5`) + scroll sync (textarea → highlighter)
- Edge style: `smoothstep` borderRadius 20, larger arrowheads

**Labeling prompt updates:**
- Conditions: yes/no question preserving negation direction (`if not user` → "Is the user missing?")
- End nodes: "Stops here — reason" (early exit) vs "Done — outputs X" (normal completion)
- Terminal labels must be literal, not inferred from surrounding context

---

## Step 3 — Plain-language labeling (LangGraph + Gemini) — 2026-06-11

**What was built:**
- `backend/config.py` — `get_model()` returns `ChatGoogleGenerativeAI(model="gemini-1.5-flash")`
- `backend/chains/labeling_graph.py` — LangGraph `StateGraph` with one node; calls Gemini with a labeling prompt and returns a plain-English label
- `POST /parse` updated to call the labeling graph per node, replacing placeholder labels with LLM output
- Fixed Gemini SDK bug: `response.content` returns a list of content blocks; added `isinstance` check to extract text correctly

**Label quality:** Active voice, product language, under 10 words. Example: "Sends a welcome email to the user", "Calculates the total cost of each order"

---

## Documentation architecture — 2026-06-10

Replaced monolithic `prd.md` with a progressive-disclosure documentation system:
- `CLAUDE.md` — startup protocol
- `docs/STARTUP.md` — session loading decision tree
- `docs/vision.md`, `docs/product.md`, `docs/architecture.md`, `docs/roadmap.md`
- `docs/decisions/` — ADR system (001: Python ast, 002: React Flow)
- `docs/sessions/README.md` — session state
- Original `prd.md` archived at `docs/archive/prd-v0.1.md`

---

## Step 2 — Render the node tree in React Flow

**What was built:**
- Replaced the placeholder `App.tsx` with a working parse UI
- Textarea for pasting Python code + a "Parse" button
- On submit, calls `POST /parse` and builds a React Flow graph from the response
- Nodes are laid out top-to-bottom (y = index × 120px), connected in order with edges
- Loading state disables the button and shows "Parsing…"
- Errors (backend unreachable, invalid Python) surface as a readable message below the button

**How to test:**
1. Run `make dev`
2. Open `http://localhost:5173`
3. Paste a Python snippet, e.g.:
   ```python
   import os

   def greet(name):
       return f'Hello, {name}'

   def add(a, b):
       return a + b
   ```
4. Click "Parse"
5. Confirm a diagram appears with one node per top-level item, connected top-to-bottom

**Done when:** the diagram visibly reflects the structure of the pasted code.

---

## Step 1 — Parsing endpoint (no LLM)

**What was built:**
- `POST /parse` endpoint in `backend/main.py`
- Accepts `{ "code": "<python source string>" }`
- Parses the code using Python's `ast` module
- Returns a flat list of top-level nodes (functions, classes, and other statements), each with:
  - `id` — unique identifier (`node_0`, `node_1`, …)
  - `label` — raw function/class name, or AST node type for other statements (placeholder; will be replaced with plain-English labels in Step 3)
  - `raw_code` — the exact source lines for that node
  - `line_start` / `line_end` — accurate line numbers
  - `children` — empty for now; reserved for future nesting
- Returns a `400` if no code is provided, `422` with a readable message if the Python is syntactically invalid

**How to test:**
1. Start the backend: `make dev` (or `cd backend && source venv/bin/activate && uvicorn main:app --reload`)
2. Open `http://localhost:8000/docs`
3. Click `POST /parse` → "Try it out"
4. Paste this sample body:
   ```json
   {
     "code": "import os\n\ndef greet(name):\n    return f'Hello, {name}'\n\ndef add(a, b):\n    return a + b\n"
   }
   ```
5. Confirm the response contains three nodes — one `Import` statement, one `greet` function, one `add` function — each with correct `line_start` and `line_end`

**Done when:** a real `.py` file produces a sensible node tree with correct line numbers.
