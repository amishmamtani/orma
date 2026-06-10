# Orma — Product Requirements Document

*A legibility tool for vibe coders.*

**Status:** Draft v0.1
**Last updated:** May 2026
**Scope of this doc:** Web app MVP

---

## 1. Overview

### Problem

Non-developers are increasingly building software with AI coding agents (Claude Code, Cursor, and similar). But they hit a wall: they can't read the code the agent produces, so they don't know what exists to change, and they don't know how to phrase a change in a way the agent will execute reliably. They're flying blind in both directions.

### Solution

Orma reads a user's code and renders it as a visual diagram labelled in **plain product language** — not developer terms. The user clicks any node and describes what they want changed in plain English. Orma returns a **structured prompt** they paste into their coding agent.

The user manipulates a representation in their own vocabulary. Orma handles the translation in both directions. The output is a *prompt*, not code — Orma is a thinking layer on top of the agents people already use, not a competitor to them.

### Why this combination is new

Forward translation (code → diagram) is saturated. Backward translation (diagram → code) exists in legacy non-AI tools. The novel assembly is: non-developer vocabulary as an explicit design constraint, a bidirectional loop, and *prompt as output* rather than code.

---

## 2. Target users

**Tech-adjacent non-developers.** They have a rough mental model of how software works from being around engineers, but cannot read code. They speak in product and UX language: user stories, interactions, business outcomes.

| Persona | Context | What they need from Orma |
|---|---|---|
| **Designer** | Prototyping a product with AI | See their build as screens/flows, request visual + behavioral changes |
| **PM** | Building an MVP before hiring engineers | Understand what the app does, make targeted edits without bugging an engineer |
| **Solo founder** | Pre-first-engineering-hire | Stay in control of a codebase they can't read |

---

## 3. Goals and non-goals

### Goals (MVP)

- Turn a single Python file into a legible, clickable diagram in plain language.
- Let a user request a change on any node in plain English.
- Produce a paste-ready prompt that reliably lands the change when used in a coding agent.
- Be usable with zero install — paste code, get diagram, get prompt.

### Non-goals (MVP)

- **Not** executing the code or applying edits directly (the user's agent does that).
- **Not** handling multi-file projects, non-sequential control flow, async, or classes — *yet*.
- **Not** supporting languages other than Python — *yet*.
- **No** user accounts, persistence, or collaboration in the MVP.
- **Not** hiding code permanently — a "peek at the code" affordance is a stretch goal, not a prohibition.

---

## 4. The core loop

```
  [1] User pastes, uploads, or drag-drops a Python file
        │
        ▼
  [2] Backend parses it into a node tree with line numbers (Python `ast`)
        │
        ▼
  [3] Backend labels each node in plain language (LangChain → Claude)
        │
        ▼
  [4] Frontend shows a SIDE-BY-SIDE view:
        code panel (left, muted)  │  clickable diagram (right, primary)
        │
        ▼
  [5] User hovers a node → matching code lines highlight
      User clicks a node → panel opens, types a change in plain English
        │
        ▼
  [6] Backend generates a paste-ready prompt (LangChain → Claude)
        │
        ▼
  [7] User copies the prompt → pastes into Claude Code / Cursor
```

### Layout principle

The diagram is the hero; the code panel is a quieter reference, muted by default. Its job is to prove the diagram is honest and to show *where* a concept lives — not to be read top to bottom. Hovering a diagram node lights up the corresponding lines. This keeps the "your language first" promise intact while giving users a trustworthy link back to the real code, and a gentle on-ramp for the curious who want to start learning what the code actually says.

---

## 5. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR1 | Accept Python code via paste, file upload, **or** drag-and-drop of a `.py` file | Must |
| FR2 | Parse code into a structured node tree using Python's `ast`, capturing accurate `line_start` / `line_end` per node | Must |
| FR3 | Label each node with a plain-English summary via an LLM | Must |
| FR4 | Render the workspace as a **side-by-side view**: code on the left, clickable diagram on the right | Must |
| FR5 | **Hover-link:** hovering a diagram node highlights the corresponding lines in the code panel | Must |
| FR6 | On node click, open a panel showing the node's summary + an edit input | Must |
| FR7 | On edit submit, generate a paste-ready prompt for a coding agent | Must |
| FR8 | One-click copy of the generated prompt to clipboard | Must |
| FR9 | Show clear loading and error states for both LLM calls | Should |
| FR10 | Code panel is visually de-emphasized by default; relevant lines light up on node hover (diagram stays the primary surface) | Should |
| FR11 | Bidirectional hover: hovering a code region highlights the matching diagram node | Could |
| FR12 | Inline editing of code in the panel (requires upgrading to CodeMirror/Monaco) | Could |

---

## 6. Non-functional requirements

- **Latency:** Parse + label should feel responsive; target under ~10 seconds for a typical short file. Show progressive loading so the UI never appears frozen.
- **Privacy:** The user's code is sent to the backend and on to the LLM. This must be stated plainly in the UI. No code is stored server-side in the MVP (stateless requests).
- **Robustness:** Malformed or partial Python should fail gracefully with a readable message, not a stack trace. (Users will paste broken code constantly.)

---

## 7. Technical architecture

### Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript |
| Diagram | React Flow |
| Code display | `react-syntax-highlighter` (display + per-line highlight via `lineProps`); upgrade path: CodeMirror 6 for editing / bidirectional hover |
| File input | Native HTML5 drag-and-drop or `react-dropzone`; file read as text client-side |
| Styling | Tailwind CSS |
| Backend | FastAPI (Python) |
| LLM orchestration | LangChain (`langchain`, `langchain-anthropic`, `langchain-core`) |
| Model | Claude (via `ChatAnthropic`) |
| Parsing | Python `ast` (standard library) |
| Hosting | Frontend on Vercel · Backend on Railway (or Fly.io) |

### Backend shape

Two endpoints carry the whole MVP:

**`POST /parse`**
- Input: `{ "code": "<python source>" }`
- Steps: parse with `ast` → build node tree → label each node via the **labeling chain** → return nodes with friendly labels.
- Output: `{ "nodes": [ { "id", "label", "raw_code", "line_start", "line_end", "children" } ] }`

**`POST /generate-prompt`**
- Input: `{ "node": { ...node context... }, "edit": "<plain-English change>" }`
- Steps: run the **prompt-generation chain** → return a paste-ready prompt string.
- Output: `{ "prompt": "<text the user pastes into their agent>" }`

### LangChain usage

Two small, single-purpose chains (LangChain Expression Language):

- **Labeling chain:** `ChatPromptTemplate` → `ChatAnthropic` → output parser. Input is a node's source; output is a one-line plain-English description. Keep it narrow — label, nothing else.
- **Prompt-generation chain:** `ChatPromptTemplate` → `ChatAnthropic` → `StrOutputParser`. Input is the node's code + location + the user's edit; output is a structured prompt naming the function and location, including the current code, and describing the change.

> **Design note:** Keep each chain doing exactly one thing. Don't build a single mega-chain that labels *and* generates. The single-purpose split keeps prompts debuggable and is the one durable lesson worth carrying from any agent framework.

### Data flow / privacy boundary

```
Browser ──HTTPS──> FastAPI ──> LangChain ──> Anthropic API
   ▲                                              │
   └──────────────── prompt / nodes ──────────────┘
```

Code crosses the network to the backend and to Anthropic. Stateless: nothing persisted in the MVP.

---

## 8. Development plan — clear steps

Each step ends in something runnable and testable. Don't start a step until the previous one's "Done when" is true.

### Step 0 — Scaffold *(complete)*
Backend (FastAPI + CORS) and frontend (Vite + React + Tailwind) both run; a button on the frontend successfully pings the backend.
**Done when:** clicking the button shows the backend's response.

### Step 1 — Parsing endpoint, no LLM
Build `POST /parse`. Take Python code as a string, use the `ast` module to walk it, and return a JSON tree of nodes — one per top-level function and statement block. Each node carries: `id`, `raw_code`, `line_start`, `line_end`, and (for now) the raw function/statement name as a placeholder `label`.
**Test:** Use the auto-generated docs at `/docs` to POST a sample script and inspect the returned tree.
**Done when:** a real `.py` file produces a sensible node tree with correct line numbers.

### Step 2 — Render the tree (raw labels)
On the frontend, call `/parse` and render the returned nodes in React Flow. Use the placeholder labels for now. Lay them out top-to-bottom, connected in order.
**Test:** Paste a script, see a diagram whose nodes match the functions in the file.
**Done when:** the diagram visibly reflects the structure of the pasted code.

### Step 3 — Plain-language labelling (LangChain)
Add `langchain`, `langchain-anthropic`, `langchain-core` to `requirements.txt`. Build the **labeling chain**. Wire it into `/parse` so each node's `label` becomes a plain-English summary instead of the raw name.
**Test:** Paste a script with a function called `send_welcome_email` and confirm the node reads something like "Send a welcome email to the user."
**Done when:** every node in the diagram has an intelligible, non-developer label.

### Step 4 — Node selection + edit panel
Make nodes clickable. On click, open a side panel showing the node's label and a text input for the user to describe a change. Pure frontend/state work — no backend call yet.
**Test:** Click a node, panel opens with the right label; typing in the input works.
**Done when:** any node can be selected and an edit can be typed.

### Step 5 — Prompt-generation endpoint (LangChain)
Build `POST /generate-prompt` and the **prompt-generation chain**. It takes the selected node's context plus the user's edit text and returns a structured, paste-ready prompt.
**Test:** Via `/docs`, POST a node + an edit like "send it 24h after signup" and confirm the returned prompt names the function, includes the current code, and describes the change clearly.
**Done when:** the endpoint returns a prompt good enough that pasting it into Claude Code actually lands the edit.

### Step 6 — Wire the loop + copy to clipboard
Connect the edit panel's submit button to `/generate-prompt`. Display the returned prompt in the panel with a "Copy" button.
**Test:** Full loop — paste code → diagram → click node → describe change → get prompt → copy.
**Done when:** the entire core loop works end to end in the browser.

### Step 7 — Loading, errors, empty states
Add spinners/skeletons for both LLM calls. Handle malformed Python with a readable message. Handle empty input. Add the privacy note ("your code is sent to our server and to Anthropic to generate the diagram").
**Done when:** pasting broken code, empty input, or a slow response never breaks the UI or shows a raw stack trace.

### Step 8 — Styling pass
Apply the Notion-style aesthetic (clean, sans-serif, subtle, the look from the concept brief). Make the diagram and panel feel calm and legible.
**Done when:** the app looks intentional, not like a default scaffold.

### Step 9 — Deploy
Deploy the backend to Railway (set `ANTHROPIC_API_KEY` as an environment variable there). Deploy the frontend to Vercel. Update the backend CORS `allow_origins` to include the Vercel URL, and point the frontend's API base URL at the Railway URL via an environment variable.
**Done when:** the app works end to end at a public URL, not just on localhost.

### Step 10 — Post-MVP backlog
- "Peek at the code" toggle (FR9)
- File upload (FR10)
- Larger files and pagination of the diagram
- Non-sequential constructs: branches, loops, classes, async
- Multi-file projects
- Re-parse after an edit to verify the change visually (closing the round-trip)

---

## 9. Success criteria

The MVP succeeds if, with three real users (one PM, one designer-adjacent person, one solo founder):

- Each can paste a script and **correctly explain what it does** by reading only the diagram — never the code.
- Each can describe a change they want and **get a prompt that lands the edit** in their coding agent on the first try, most of the time.
- The two things most likely to break — the **label vocabulary** (do non-devs understand the labels?) and the **prompt quality** (does the edit actually land?) — are the explicit things to watch in testing.

---

## 10. Risks and open questions

- **Label quality is the product.** If the plain-English labels are wrong or confusing, the user clicks the wrong node and everything downstream fails. This is the highest-risk component.
- **Prompt fidelity.** A generated prompt that's no better than what the user would type unaided adds no value. The prompt must localize the change (name the function, include the code) to be worth using.
- **The verification gap.** After the agent applies an edit, how does the user confirm it worked without reading code? For the MVP, they re-paste the new code and compare diagrams. This is slow; Step 10's "re-parse to verify" addresses it later.
- **LangChain overhead.** For two calls, LangChain is heavier than needed. Acceptable for learning and future growth; revisit if it slows iteration.
- **Scope creep toward non-sequential code.** Tempting, but the hard visualization questions (what is a "node" in a branching/async/multi-file app?) are deliberately deferred. Resist until the sequential case is validated.

---

*Build the engine first, validate the loop with real users, expand scope only after. The medium can change; the core logic ports.*