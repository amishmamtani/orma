# ORMA

ORMA is a legibility tool for non-developers working with AI coding agents. It reads a Python file, renders it as a plain-language visual diagram, and returns a structured prompt the user pastes into their coding agent to request a change. The output is a *prompt*, not code — ORMA is a thinking layer on top of the agents people already use.

**Stack:** FastAPI (Python) backend · React + TypeScript + Vite frontend · React Flow for diagrams · Tailwind CSS · Anthropic SDK (Claude)

**Phase:** Steps 1–8.5 complete. Core loop works end-to-end. Next: Step 9 (deploy) or Step 7 (loading/error states).

**Repo layout:**
```
backend/        FastAPI app + AST parsing (main.py)
frontend/       React app + React Flow diagram (src/App.tsx)
docs/           All project documentation (see below)
```

## Documentation protocol

**Always read next:** `docs/STARTUP.md` — it tells you which documents to load for the current task.

**Never load all docs at once.** Each file is scoped to a specific concern; load only what the task requires. See `docs/STARTUP.md` for the decision tree.

## Running locally

```bash
make dev
# Backend: http://localhost:8000 (Swagger UI at /docs)
# Frontend: http://localhost:5173
```
