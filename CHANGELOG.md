# Orma — Changelog

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
