# Step 9 — Deploy

**Status:** ⏳ Pending
**Depends on:** Step 8.5 ✅ (Claude is the active provider)

---

## Goal

Get the app running at a public URL. Backend on Railway (or Fly.io). Frontend on Vercel. The full loop must work end-to-end at the public URL before this step is done.

---

## What to build

**Backend (Railway):**
- Create a Railway project, connect the repo
- Set environment variables: `ANTHROPIC_API_KEY`
- Confirm `requirements.txt` is complete and `uvicorn main:app` starts correctly
- Note the Railway URL (e.g. `https://orma-backend.up.railway.app`)

**Backend CORS (`backend/main.py`):**
- Add the Vercel frontend URL to `allow_origins` (keep `localhost:5173` for local dev)

**Frontend (Vercel):**
- Create a Vercel project, connect the repo, set root to `frontend/`
- Set environment variable: `VITE_API_BASE_URL=<railway-url>`
- Update all `http://localhost:8000` references in the frontend to use `import.meta.env.VITE_API_BASE_URL`
- Confirm the Vercel build succeeds

---

## Load these docs before starting

- `docs/architecture.md` — CORS constraint, hosting targets

---

## How to test

1. Open the Vercel URL in a browser (not localhost)
2. Run the full core loop: paste code → parse → click node → request change → copy prompt
3. Confirm no CORS errors in the browser console
4. Confirm the privacy notice is visible

---

## Done when

- [ ] Backend running and healthy at Railway URL (`GET /` returns `{"status":"ok"}`)
- [ ] Frontend deployed and loading at Vercel URL
- [ ] CORS configured for the Vercel URL
- [ ] Full loop works end-to-end at the public URL
- [ ] `ANTHROPIC_API_KEY` set in Railway environment (not committed to repo)
- [ ] No `localhost` hardcoded in frontend production build

---

## Notes

*(Fill in: Railway URL, Vercel URL, any deploy gotchas)*
