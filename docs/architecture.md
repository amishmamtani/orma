# Architecture

## Stack

| Layer | Choice | Version |
|---|---|---|
| Frontend framework | React + TypeScript | 19.2.6 / 6.0.2 |
| Build tool | Vite | 8.0.12 |
| Diagram | React Flow | 11.11.4 |
| Styling | Tailwind CSS | 4.3.0 |
| Code display | `react-syntax-highlighter` (planned, not yet added) | — |
| Backend framework | FastAPI + Uvicorn | 0.136.3 / 0.48.0 |
| Parsing | Python `ast` (stdlib) | — |
| LLM orchestration | LangGraph + LangChain (planned, Step 3) | — |
| LLM model | Claude via `ChatAnthropic` | anthropic 0.104.1 |
| Validation | Pydantic | 2.13.4 |
| Frontend hosting | Vercel (planned, Step 9) | — |
| Backend hosting | Railway or Fly.io (planned, Step 9) | — |

## Data flow

```
Browser ──HTTPS──> FastAPI ──> LangChain ──> Anthropic API
   ▲                                              │
   └──────────────── nodes / prompt ──────────────┘
```

Code crosses the network to the backend and on to Anthropic. **Nothing is persisted in the MVP** — all requests are stateless.

## API contracts (current)

### `GET /`
Health check.
Response: `{ "status": "ok", "service": "orma" }`

### `POST /parse`
Input: `{ "code": "<python source>" }`
Steps: `ast.parse` → walk each `FunctionDef` body → label all nodes per function in one LLM call (Pydantic structured output) → return
Output: `{ "functions": [ { "id", "name", "nodes": [ { "id", "type", "label", "raw_code", "line_start", "line_end" } ], "edges": [ { "id", "source", "target", "label" } ] } ] }`
Node types: `start` · `end` · `action` · `loop` · `condition`
Errors: `400` (empty code) · `422` (syntax error, with readable message)

### `POST /generate-prompt` *(planned, Step 6)*
Input: `{ "function_name", "original_nodes", "original_edges", "edited_nodes", "edited_edges" }`
Steps: diff original vs edited graph → prompt-generation chain (raw_code from affected nodes) → return paste-ready prompt
Output: `{ "prompt": "<text the user pastes into their agent>" }`

## Key constraints

- **CORS:** Backend allows `http://localhost:5173` (dev). Must add Vercel URL before Step 9.
- **No auth in MVP.** Stateless API — no sessions, no user accounts.
- **Two LangChain chains, single-purpose each.** Labeling chain and prompt-generation chain are separate. Do not merge them — it makes prompts harder to debug.
- **`ast` parses top-level nodes only.** Current implementation returns a flat list: functions, classes, top-level statements. Nesting (inner functions, class methods) is reserved for post-MVP. The `children` field exists but is always empty for now.

## Directory structure

```
backend/
  main.py           All backend logic (FastAPI app + /parse endpoint)
  requirements.txt  Python dependencies
  .env              ANTHROPIC_API_KEY (never commit)
  .env.example      Template for new contributors

frontend/
  src/
    main.tsx        React entry point
    App.tsx         All UI logic: textarea, parse button, React Flow canvas
    index.css       Tailwind import only
  vite.config.ts    Vite + Tailwind plugin config
  package.json      Node dependencies
```

## Known upgrade paths

- **Code display:** `react-syntax-highlighter` with `lineProps` for per-line highlighting (Step 4). Upgrade to CodeMirror 6 for bidirectional hover and inline editing (post-MVP).
- **File input:** Native HTML5 drag-and-drop or `react-dropzone` (post-MVP stretch).
- **LangChain:** If overhead becomes a problem for two simple LLM calls, replace with direct `anthropic` SDK calls using the same prompt templates.
