# Day 6 — Deployment Guide

This app deploys as two separate services from this one repo:

- **Backend** (NestJS) → Railway, root directory `backend`
- **Frontend** (Next.js) → Vercel, root directory `frontend`
- **Database** → Railway PostgreSQL (already set up from Day 1)

Everything below that needs clicking through Railway's/Vercel's dashboard, linking your GitHub account, or creating projects is on you — I can't do that part. This doc is the checklist + exact values to paste in as you go.

## 0. Push the code to GitHub

```bash
git add -A
git commit -m "Initial commit: AI Career Coach"
git push -u origin main
```

(Remote is already set: `git@github.com:TemsamaniHamza/My-Ai-Carrer-Coach.git`)

## 1. Backend on Railway

You already have a Railway Postgres instance from Day 1 — reuse that project.

1. In the Railway project, **New → GitHub Repo** → select this repo.
2. Set **Root Directory** to `backend`.
3. Railway auto-detects Node via Nixpacks. The `backend/railway.json` in this repo already tells it to run `npx prisma migrate deploy` before starting the server, and fixes the correct start command — no manual build/start config needed.
4. Add these environment variables (Railway → your backend service → Variables):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Reference your Postgres service's `DATABASE_URL` (Railway lets you reference another service's variable directly — use that, don't hardcode it) |
| `PORT` | Railway sets this automatically — you don't need to set it, the app already reads `process.env.PORT` |
| `JWT_ACCESS_SECRET` | **Generate a new one** — run `openssl rand -base64 32` locally, don't reuse your dev secret |
| `JWT_ACCESS_EXPIRY` | `1h` |
| `JWT_REFRESH_SECRET` | **Generate a new one**, different from the access secret — `openssl rand -base64 32` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `FRONTEND_URL` | Your Vercel URL once you have it, e.g. `https://your-app.vercel.app` (no trailing slash) |
| `GEMINI_API_KEY` | Your existing Gemini key |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` |
| `NODE_ENV` | `production` — **this one matters**: the refresh-token cookie only sets `Secure; SameSite=None` when `NODE_ENV=production` (see `backend/src/auth/auth.controller.ts`), which is required for the cross-site cookie to survive on Vercel↔Railway |

5. Deploy. Watch the build logs for `Applying migration...` (confirms `prisma migrate deploy` ran) then `Nest application successfully started`.
6. Note the Railway-generated public URL (Settings → Networking → Generate Domain if you haven't already) — you'll need it for the frontend's `NEXT_PUBLIC_API_URL`.

## 2. Frontend on Vercel

1. **New Project** → import this same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Next.js (auto-detected).
4. Add environment variable:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL from step 1.6, e.g. `https://your-backend.up.railway.app` (no trailing slash) |

5. Deploy. Note the Vercel URL.

## 3. Close the loop

Go back to Railway → backend service → Variables → update `FRONTEND_URL` to the real Vercel URL from step 2.5, then redeploy the backend (Railway redeploys automatically on variable changes, or trigger manually).

This order matters: the backend's CORS `origin` is locked to exactly `FRONTEND_URL` (see `backend/src/main.ts`), so it has to point at the real Vercel domain, not `localhost`, or every request from the deployed frontend will be blocked by CORS.

## 4. Smoke test against the live URLs

In order, on the actual deployed site (not localhost):

1. Register a new account
2. Refresh the page — should stay logged in (this is the riskiest step: it proves the refresh-token cookie survived cross-site)
3. Fill in the Profile tab, save — should redirect to Home
4. Generate a Resume, download as PDF
5. Generate a Cover Letter
6. Start an Interview Prep session (any type), answer through to completion, confirm "See your Strengths & Weaknesses" takes you to Home and it's populated
7. Log out, log back in — confirm session and saved data are still there
8. Delete a past interview, confirm it's gone from the list

If step 2 fails (session doesn't survive a refresh), it's almost always one of: `NODE_ENV` not set to `production` on Railway, or `FRONTEND_URL` not matching the Vercel URL exactly (protocol + no trailing slash).

## Notes

- `backend/railway.json` was added this session to fix two real bugs found while preparing this: `start:prod` pointed at the wrong compiled file path (`dist/main` instead of the actual `dist/src/main`), and there was no migration step wired into deploy at all — both would have broken the first deploy attempt.
- `frontend/src/app/error.tsx` had an unused-variable lint error that fails Vercel's build (`next build` runs ESLint as part of the build step) — fixed.
- Local production builds (`npm run build` in both `backend/` and `frontend/`) were run and passed clean before writing this guide.
