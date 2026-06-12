# Step 7 — Loading, errors, empty states

**Status:** ⏳ Pending
**Depends on:** Step 6.5 ✅

---

## Goal

Make the app robust and trustworthy for a non-technical user. Every failure mode should produce a readable message, not a spinner that hangs forever or a raw error. The privacy notice must be visible.

---

## What to build

**Frontend:**
- Loading states:
  - Parsing: skeleton nodes or pulsing placeholder in the diagram while `/parse` is in flight
  - Prompt generation: spinner or "Generating…" in the edit panel while `/generate-prompt` is in flight
- Error states:
  - Invalid Python: clear message ("This code has a syntax error. Fix it in your editor and paste again.")
  - Network error: "Couldn't reach the server. Make sure the backend is running."
  - LLM error: "Something went wrong generating the label. Try again."
  - Prompt generation error: same pattern
- Empty states:
  - Initial load: clear call to action ("Paste your Python code above to get started")
  - No nodes returned: "No functions or statements found in this code."
- Privacy notice: small, persistent text below the code input: "Your code is sent to our server and to Anthropic to generate the diagram. Nothing is stored."

**Backend:**
- Confirm all errors return structured JSON with a readable `detail` field, not raw stack traces
- Add a timeout on LLM calls (if not already handled by LangGraph)

---

## Load these docs before starting

- `docs/product.md` — non-functional requirements (latency, privacy, robustness)

---

## How to test

Test each failure mode explicitly:
- [ ] Paste invalid Python → readable error, not a crash
- [ ] Submit empty textarea → button disabled, no request sent
- [ ] Kill the backend mid-request → frontend shows error, doesn't hang
- [ ] Slow network (throttle in DevTools) → loading states visible, not blank
- [ ] Privacy notice visible on fresh load

---

## Done when

- [ ] Both LLM calls show loading states
- [ ] All error cases show readable messages (no stack traces, no raw JSON)
- [ ] Empty/initial states have clear guidance
- [ ] Privacy notice present
- [ ] Backend errors return structured `{ "detail": "..." }` responses

---

## Notes

*(Fill in during implementation)*
