# Step 5 — Multiple editable flowcharts (frontend)

**Status:** ⏳ Pending
**Depends on:** Step 4 ✅

---

## Goal

Render one React Flow instance per function, side by side. Each flowchart is editable — the user can add nodes, delete nodes, and connect/disconnect edges. No backend call yet; changes live in local state only.

---

## What to build

**Frontend (`frontend/src/`):**

### Layout
- Parse result renders a horizontal row of function flowcharts
- Each flowchart is independently scrollable/zoomable
- Function name shown above each chart as a header

### Node colours (no shape changes — colour signals type)
| Node type | Colour |
|---|---|
| `start` / `end` | Dark (stone-800) |
| `action` | White with stone border |
| `loop` | Blue (blue-100 background) |
| `condition` | Amber (amber-100 background) |

Condition outgoing edges show `"Yes"` / `"No"` labels.

### Editable graph
Use React Flow's built-in `onNodesChange`, `onEdgesChange`, `onConnect` handlers to make each flowchart editable:
- **Delete node:** select + backspace/delete key
- **Delete edge:** select + backspace/delete key
- **Add edge:** drag from one node's handle to another
- **Add node:** "Add step" button above each flowchart — inserts a new blank `action` node at the bottom with a default label the user can click to rename

Store the edited graph state per function in React state. The original parsed graph and the current edited graph are both kept — the diff is needed for prompt generation in Step 6.

---

## Load these docs before starting

- `docs/architecture.md` — new `functions` response shape from Step 4
- `docs/product.md` — UX principles

---

## How to test

1. `make dev`, open `http://localhost:5173`
2. Paste `ecommerce.py` → parse
3. Confirm one flowchart per function, side by side
4. Confirm node colours match type
5. Confirm condition nodes have Yes/No edge labels
6. Delete a node — confirm it disappears
7. Add an edge between two nodes — confirm it appears
8. Add a step — confirm a new node appears
9. Confirm original graph state is preserved separately (needed for Step 6)

---

## Done when

- [ ] One flowchart rendered per function
- [ ] Node colours reflect type
- [ ] Condition edges labelled Yes/No
- [ ] Nodes deletable
- [ ] Edges deletable and addable
- [ ] "Add step" inserts a new node
- [ ] Original and current graph states both held in React state

---

## Notes

*(Fill in during implementation)*
