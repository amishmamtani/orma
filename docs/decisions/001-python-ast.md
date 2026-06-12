# ADR-001: Python `ast` for code parsing

**Date:** 2026-05-01
**Status:** Accepted

## Problem

ORMA needs to parse Python source code into a structured node tree with accurate line numbers. The solution must be reliable, zero-dependency, and able to return `line_start` / `line_end` per node for the hover-highlight feature.

## Options considered

- **Python `ast` (stdlib):** Built into Python. Parses to an AST with accurate line/column data. Well-documented. No extra dependencies.
- **tree-sitter (with `py-tree-sitter`):** Faster, more granular, supports partial/broken code better. Requires a compiled parser binary — adds installation complexity.
- **Regex / string parsing:** Fast but brittle. Cannot handle nested functions, decorators, or multiline constructs reliably.

## Decision

Use Python's stdlib `ast` module. It is accurate, dependency-free, and sufficient for the MVP's scope (top-level functions and statements in a single well-formed file).

## Consequences

- `ast` raises a `SyntaxError` on malformed Python — callers must catch and convert to a user-readable 422 response. (Already implemented in `backend/main.py`.)
- `ast` does not parse partially-broken code. Users pasting work-in-progress scripts will get errors rather than a best-effort diagram. This is acceptable for MVP.
- Upgrade path to `tree-sitter` exists if we need error-tolerant parsing for broken code or non-Python languages later.
- `children` field in the node schema is reserved for nested functions/methods but is always empty in the current implementation. Filling it requires a recursive AST walk, which `ast` supports.
