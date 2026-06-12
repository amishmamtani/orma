# Architecture Decision Records

This directory contains records of significant technical decisions made during ORMA's development.

## How to use

- **Load a specific ADR** only when you are touching the technology it covers.
- **Never edit past ADRs.** If a decision changes, create a new ADR that supersedes the old one and links to it.
- **Create a new ADR** when you make a decision that: (a) is not obvious from the code, (b) has meaningful alternatives, or (c) will affect future contributors.

## ADR template

```markdown
# ADR-NNN: Title

**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded by ADR-NNN

## Problem
One paragraph: what needed to be decided and why it mattered.

## Options considered
- **Option A:** ...
- **Option B:** ...

## Decision
What was chosen and the primary reason.

## Consequences
- What becomes easier
- What becomes harder or constrained
```

---

## Index

| ADR | Title | Status |
|---|---|---|
| [001](001-python-ast.md) | Python `ast` for code parsing | Accepted |
| [002](002-react-flow.md) | React Flow for diagram rendering | Accepted |
| [003](003-llm-provider-strategy.md) | Gemini during dev, Claude at launch | Accepted |
| [004](004-langgraph-orchestration.md) | LangGraph as orchestration base (extensible from Step 3) | Accepted |
