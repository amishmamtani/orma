# Product

## MVP definition

The MVP succeeds when the full core loop works end-to-end with real users:

```
Paste Python → plain-language diagram → click node → describe change → paste-ready prompt
```

**In scope for MVP:**
- Single Python file, pasted as text
- AST-based node tree (top-level functions and statements)
- Plain-language labels via LLM (Gemini during development; swap to Claude before launch)
- Side-by-side view: code panel (left, muted) + clickable diagram (right, primary)
- Hover: diagram node highlights corresponding code lines
- Node click → edit panel → submit → paste-ready prompt
- One-click copy to clipboard
- Zero install — paste code, get diagram, get prompt

**Out of scope for MVP:**
- Multi-file projects (deferred — scope of "node" is undefined across files)
- Non-sequential code: branches, loops, classes, async (visualization is unsolved)
- Languages other than Python
- User accounts, persistence, or collaboration
- Executing code or applying edits directly (the user's agent does that)
- File upload / drag-and-drop (stretch; paste is sufficient to validate the loop)

## UX principles

1. **Diagram is the hero.** The code panel is a quieter reference, muted by default. Its job is to prove the diagram is honest, not to be read.
2. **User vocabulary first.** Labels must read like product language, not code. "Send a welcome email to the user" not "send_welcome_email".
3. **Trustworthy link back.** Hover on a diagram node → corresponding code lines highlight. This lets curious users verify the diagram without reading code top-to-bottom.
4. **Prompt quality is the product.** A generated prompt that's no better than what the user would type unaided adds no value. The prompt must localize the change (name the function, include the code, describe the edit).

## Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR1 | Accept Python code via paste | Must |
| FR2 | Parse code into node tree (Python `ast`), accurate `line_start`/`line_end` | Must |
| FR3 | Label each node in plain English via LLM | Must |
| FR4 | Side-by-side view: code left, diagram right | Must |
| FR5 | Hover diagram node → highlight code lines | Must |
| FR6 | Node click → panel with label + edit input | Must |
| FR7 | Submit edit → paste-ready prompt | Must |
| FR8 | One-click copy prompt to clipboard | Must |
| FR9 | Loading and error states for both LLM calls | Should |
| FR10 | Code panel visually de-emphasized by default | Should |
| FR11 | Bidirectional hover: code region → highlight diagram node | Could |
| FR12 | Inline code editing (requires CodeMirror/Monaco upgrade) | Could |

## Non-functional requirements

- **Latency:** Parse + label under ~10 seconds for a typical short file. Progressive loading so UI never appears frozen.
- **Privacy:** Code is sent to backend and on to Anthropic. State this plainly in UI. No code stored server-side in MVP.
- **Robustness:** Malformed Python fails gracefully with a readable message, not a stack trace.

---

## Challenged assumptions

These are baked into the current design and have not yet been validated. Revisit before Step 3.

| Assumption | Challenge |
|---|---|
| Users will paste raw Python code | Most non-devs don't have easy access to isolated Python files. They need to open the repo and find the right file. |
| The visual diagram communicates logic | Flowcharts of function names may be harder to read than plain prose if labels are wrong. |
| Plain-language labels make code understandable | LLM-generated labels are often wrong or generic. Bad labels may be worse than raw names. |
| Copy-paste prompt is the right output | Users of Claude Code/Cursor are already in a conversation. Copy-paste adds friction. |
| Single-file scope is sufficient for MVP | Real codebases have functions that call each other across files. The diagram would be incomplete. |
| Non-developers want to request specific changes | They may actually want *reassurance* (does this do what I asked?) more than control. |

## Open product questions

*(Add questions here as they arise. Answer before implementing the relevant step. Answered questions are moved to the Answered section below.)*

1. **Is the diagram the right representation?** The current AST-based node list doesn't show control flow, call graph, or data flow. What does the diagram actually communicate?
2. **What is the atomic unit of change?** A function? A "behavior"? The node-click model assumes the user knows what to click. What if they don't?
3. **Is copy-paste the right interface?** If users are already in Claude Code, is a structured brief (spec-like output) more useful than a raw prompt?

## Answered questions

**Who is the user?** *(answered 2026-06-10)*
Tech-adjacent builders — people who understand what they're building and can direct an AI agent, but can't read code. Not a specific job title; a cognitive position. Designer, PM, and solo founder are all valid instances.

**What does "understand" mean?** *(answered 2026-06-10)*
The primary use case is **post-agent review**: after an AI agent makes changes, the user wants to understand what was done without running the server. Currently, run-and-check is their only feedback loop. ORMA gives them a wireframe-level read on the implementation: "this is what the code does, in language you know." The diagram is a code review substitute, not a planning tool.
