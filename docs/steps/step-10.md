# Step 10 — User-provided API key

**Status:** ⏳ Pending
**Depends on:** Step 9 ✅

---

## Goal

Once ORMA is hosted and shared, the developer's API key becomes a cost and rate-limit problem. Users should be able to bring their own Anthropic API key so each user funds their own usage.

---

## What to build

**Frontend:**
- A small settings entry point (gear icon or footer link) where the user can paste their Anthropic API key
- Key stored in `localStorage` only — never sent to or stored on the server beyond the current request
- Clear label: "Your key is stored locally in your browser and sent directly to our server for this request only. We never store it."

**Backend:**
- Accept an optional `api_key` field in `/parse` and `/generate-prompt` request bodies
- If present, use it to initialize the Anthropic client for that request instead of the server's env key
- Fall back to the server key if none provided (for the developer's own testing)

---

## Done when

- [ ] User can enter and save their own Anthropic API key in the UI
- [ ] Key is used for all LLM calls when present
- [ ] Clear messaging about where the key is stored
- [ ] Server key still works as fallback (for demos)
