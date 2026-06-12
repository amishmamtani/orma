# ADR-004: LangGraph as orchestration base

**Date:** 2026-06-10
**Status:** Accepted

## Problem

The MVP needs two LLM calls: node labeling and prompt generation. Plain LangChain LCEL chains are sufficient for these today, but future features (clarifying questions before generating a prompt, multi-step reasoning, conditional routing) will need stateful graph-based orchestration. Starting with LangGraph now avoids a painful migration later.

## Decision

Use **LangGraph** as the base for all LLM orchestration, even for simple single-step chains. Each chain (labeling, prompt generation) is implemented as a minimal LangGraph graph — a single node wrapping the LLM call — so the scaffold is in place for adding edges, conditionals, and state when needed.

LangChain LCEL is used *inside* nodes as needed, but the outer structure is always a LangGraph `StateGraph`.

## Consequences

- Add `langgraph`, `langchain`, `langchain-google-genai` (and later `langchain-anthropic`) to `requirements.txt`.
- For Steps 3 and 5, the graphs will be trivially simple (one node each). That's fine — the point is the pattern, not the complexity.
- Future features that benefit from LangGraph: routing between "label only" and "label + summarize" modes; a clarification step that asks the user a follow-up question before generating a prompt; agentic loops for multi-file analysis.
- LangGraph adds some boilerplate (state schema, graph definition) vs. plain LCEL. Worth it for the extensibility.
