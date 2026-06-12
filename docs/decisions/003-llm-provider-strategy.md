# ADR-003: LLM provider strategy — Gemini now, Claude at launch

**Date:** 2026-06-10
**Status:** Accepted

## Problem

Two LLM calls are needed: node labeling (`/parse`) and prompt generation (`/generate-prompt`). The Anthropic API costs money per call, which slows down iteration during development. A free alternative that can be swapped out cleanly is preferable for the build phase.

## Options considered

- **Anthropic (Claude) only:** Best label quality, but paid API adds friction during testing.
- **Gemini (Google) now, Claude at launch:** Gemini has a free tier sufficient for development. LangChain's abstraction makes the provider swap a one-line change (`ChatGoogleGenerativeAI` → `ChatAnthropic`). Quality difference is acceptable for testing; Claude is used where it matters (production).
- **OpenAI:** Paid, no meaningful quality advantage over Claude for this use case.

## Decision

Use **Gemini** (via `langchain-google-genai` and `ChatGoogleGenerativeAI`) during development. Switch to **Claude** (via `langchain-anthropic` and `ChatAnthropic`) before final testing and launch. The two chain files (`labeling_chain.py`, `prompt_chain.py`) should import the model class from a single `config.py` so the swap is one line, not a file-by-file edit.

## Consequences

- Add `langchain-google-genai` to `requirements.txt` now; keep `anthropic` installed for later.
- Store `GOOGLE_API_KEY` in `.env` (and `.env.example`) alongside the existing `ANTHROPIC_API_KEY`.
- Label quality during development will reflect Gemini, not Claude. Don't tune prompts for Gemini-specific quirks — keep prompts model-agnostic.
- The provider swap is a milestone, not a refactor. Mark it as a step in the roadmap so it isn't forgotten before launch.
