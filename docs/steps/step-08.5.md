# Step 8.5 — Swap Gemini → Claude

**Status:** ⏳ Pending
**Depends on:** Step 8 ✅ (frontend design complete, app is in final form)

---

## Goal

Swap the LLM provider from Gemini (used during development) to Claude (Anthropic) for final quality testing and production. Because all model usage goes through `backend/config.py`, this should be a one-file change.

---

## What to build

**Backend (`backend/config.py`):**
- Change `get_model()` to return `ChatAnthropic(model="claude-opus-4-7")` (or latest model)
- Add `langchain-anthropic` to `requirements.txt` if not already there
- Ensure `ANTHROPIC_API_KEY` is set in `.env`
- Remove or comment out the `GOOGLE_API_KEY` dependency

**No other files should need changes.** If they do, that means the provider abstraction leaked — fix it.

---

## Load these docs before starting

- `docs/decisions/003-llm-provider-strategy.md` — provider swap instructions
- `docs/decisions/004-langgraph-orchestration.md` — confirms `config.py` is the only change point

---

## How to test

Run the full end-to-end loop (same as Step 6 test) with Claude as the provider:
1. Parse a script → confirm labels read well in plain English
2. Click a node → submit a change → confirm the generated prompt is high quality
3. Paste the prompt into Claude Code → confirm the edit lands

Compare label quality between Gemini and Claude. If Claude produces noticeably better labels, consider tweaking the labeling prompt to take advantage.

---

## Done when

- [ ] `config.py` returns `ChatAnthropic` 
- [ ] Full loop works end-to-end with Claude
- [ ] Label quality is equal to or better than Gemini
- [ ] No `GOOGLE_API_KEY` dependency remains in production path

---

## Notes

*(Fill in during implementation — note any label quality differences observed)*
