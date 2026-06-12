# Step 4 — Per-function flowcharts (backend)

**Status:** ✅ Complete
**Depends on:** Step 3 ✅

---

## Goal

Rework `POST /parse` so it returns one flowchart per function — with internal logic (loops, conditions, assignments, returns) as individual nodes and edges. Labels are generated with a single LLM call per function using Pydantic structured output.

---

## What to build

**Backend (`backend/main.py` + `backend/chains/labeling_graph.py`):**

### New API response shape
```json
{
  "functions": [
    {
      "id": "func_0",
      "name": "process_orders",
      "nodes": [
        { "id": "f0_n0", "type": "start",     "label": "Start",                     "raw_code": "", "line_start": 1, "line_end": 1 },
        { "id": "f0_n1", "type": "action",    "label": "Create empty results list", "raw_code": "results = []", "line_start": 2, "line_end": 2 },
        { "id": "f0_n2", "type": "loop",      "label": "For each order in orders",  "raw_code": "for order in orders:", "line_start": 3, "line_end": 3 },
        { "id": "f0_n3", "type": "end",       "label": "Return results",            "raw_code": "return results", "line_start": 7, "line_end": 7 }
      ],
      "edges": [
        { "id": "f0_e0", "source": "f0_n0", "target": "f0_n1", "label": "" },
        { "id": "f0_e1", "source": "f0_n1", "target": "f0_n2", "label": "" },
        { "id": "f0_e2", "source": "f0_n2", "target": "f0_n3", "label": "" }
      ]
    }
  ]
}
```

### AST walker
Walk each `FunctionDef` body and map statements to node types:

| Python AST node | Node type | Notes |
|---|---|---|
| Function entry | `start` | Always first node, no raw_code |
| `Assign`, `AugAssign`, `Expr` | `action` | One node per statement |
| `For`, `While` | `loop` | Header only; body statements flattened as sequential `action` nodes after |
| `If` | `condition` | Two outgoing edges: `label: "Yes"` and `label: "No"`; both branches reconnect to next statement after the if block |
| `Return` | `end` | Terminal node |

**Nesting cap:** flatten at 2 levels. Anything nested deeper than a loop or condition body becomes a single `action` node.

### Structured Pydantic labeling
Replace per-node LLM calls with one call per function. Update `labeling_graph.py`:

```python
class NodeLabel(BaseModel):
    node_id: str
    label: str

class FunctionLabels(BaseModel):
    labels: list[NodeLabel]
```

Send all nodes for a function in one prompt. The model sees the full function context, which produces better labels. Use `.with_structured_output(FunctionLabels)` on the model.

**Backend:** No new endpoints — same `POST /parse`, different response shape.

---

## Load these docs before starting

- `docs/architecture.md` — current API contract to replace
- `docs/decisions/003-llm-provider-strategy.md` — `config.py` / `get_model()` pattern
- `docs/decisions/004-langgraph-orchestration.md` — LangGraph structure

---

## How to test

1. `make dev`, open `http://localhost:8000/docs`
2. POST to `/parse` with `ecommerce.py` content
3. Confirm response has a `functions` array, one entry per function
4. Confirm each function has `nodes` and `edges`
5. Confirm a function with an `if` statement has a `condition` node with two outgoing edges labeled `"Yes"` and `"No"`
6. Confirm labels read as product language (not code)

---

## Done when

- [ ] Response is `{ functions: [...] }` not `{ nodes: [...] }`
- [ ] Each function has correct `nodes` and `edges`
- [ ] `condition` nodes produce Yes/No edges
- [ ] `loop` body is flattened as sequential nodes
- [ ] Labels generated with one LLM call per function (Pydantic structured output)
- [ ] Broken Python still returns 422

---

## Notes

*(Fill in during implementation)*
