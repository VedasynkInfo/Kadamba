
# Kadamba — Production Deployment Guide

Frontend on **Vercel**, backend on **Render**, database on **MongoDB Atlas**,
media on **Cloudinary**, transactional email over **SMTP**.

---

## 1. Accounts & external services to provision

| Service | Purpose | What you create |
| --- | --- | --- |
| MongoDB Atlas | Primary database | Free/shared cluster + DB user + network access |
| Cloudinary | Image/video hosting & transforms | Cloud name + API key + API secret |
| SMTP provider (Gmail app password, Resend, SendGrid, etc.) | Contact/lead emails | Host, port, user, password |
| Render | Backend API hosting | Web service (from `render.yaml`) |
| Vercel | Frontend hosting | Project linked to `frontend/` |
| Domain registrar | `kadambastudio.com` | DNS records for Vercel + Render |

---

## 2. Backend environment variables (Render)

Set these in the Render dashboard → your service → **Environment**.
Values marked **REQUIRED** are enforced at boot — the server refuses to start
in production if they are missing or weak.

| Variable | Required | Example / Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` |
| `PORT` | auto | Injected by Render — do **not** set manually |
| `TRUST_PROXY` | recommended | `1` (Render runs behind a proxy) |
| `LOG_LEVEL` | no | `info` (or `debug` while diagnosing) |
| `FRONTEND_URL` | **REQUIRED** | `https://kadambastudio.com` — must be `https`. Comma-separate to allow several origins, e.g. `https://kadambastudio.com,https://www.kadambastudio.com` |
| `MONGODB_URI` | **REQUIRED** | Atlas SRV string `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/kadamba?retryWrites=true&w=majority` (must not be localhost) |
| `JWT_SECRET` | **REQUIRED** | Random string **≥ 32 chars**. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. On Render you can let the blueprint auto-generate it |
| `JWT_EXPIRES_IN` | no | `1h` |
| `CLOUDINARY_CLOUD_NAME` | **REQUIRED (prod)** | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | **REQUIRED (prod)** | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | **REQUIRED (prod)** | Keep secret |
| `EMAIL_HOST` | for email | `smtp.gmail.com` |
| `EMAIL_PORT` | for email | `587` (STARTTLS) or `465` (SSL) |
| `EMAIL_USER` | for email | SMTP username / from-address |
| `EMAIL_PASS` | for email | SMTP password / app password |
| `EMAIL_FROM` | no | `Kadamba Studio <studio@example.com>` |
| `EMAIL_TO` | no | Inbox that receives contact/lead notifications |

**Background work (Phase 10) — all optional, sensible defaults apply:**

| Variable | Required | Example / Notes |
| --- | --- | --- |
| `UPLOAD_DIR` | recommended | `/var/data/uploads` — the Render Persistent Disk mount. Originals live here and are never deleted |
| `BACKUP_DIR` | recommended | `/var/data/backups` — where the nightly database archive is written. **Must be on the Persistent Disk**, otherwise the archive dies with the container |
| `BACKUP_RETENTION_DAYS` | no | `14` — archives older than this are pruned |
| `CRON_ENABLED` | no | `true` — set `false` to switch the in-process scheduler off entirely |
| `CRON_TICK_MS` | no | `30000` — how often the scheduler wakes |
| `CRON_EMAIL_INTERVAL_MS` | no | `30000` — how often the email outbox is drained |
| `CRON_FOLLOWUP_INTERVAL_MS` | no | `900000` (15 min) — lead follow-up reminders |
| `CRON_REMINDER_INTERVAL_MS` | no | `3600000` (1 h) — trial and delivery reminders |
| `CRON_CLEANUP_HOUR` / `CRON_CLEANUP_MINUTE` | no | `3` / `0` — local server time for the orphan cleanup |
| `CRON_BACKUP_HOUR` / `CRON_BACKUP_MINUTE` | no | `2` / `0` — local server time for the nightly backup |
| `EMAIL_OUTBOX_ENABLED` | no | `true` — set `false` to stop the drainer (rows still queue) |
| `EMAIL_OUTBOX_MAX_ATTEMPTS` | no | `5` — attempts before a message is marked failed |
| `EMAIL_OUTBOX_BASE_BACKOFF_MS` | no | `60000` — first retry delay; doubles per attempt |
| `EMAIL_OUTBOX_LEASE_MS` | no | `300000` — how long a drainer owns a row before another may reclaim it |
| `EMAIL_OUTBOX_RETENTION_DAYS` | no | `30` — how long sent/failed rows are kept for audit |

> **One instance, or many?** The scheduler is safe to run on several
> instances: every job takes a Mongo lease (`CronLock`) first, and the email
> outbox claims rows atomically. A Render service that scales to more than one
> instance will still send each reminder once.

**Admin bootstrap (temporary — set, run once, then remove):**

| Variable | Notes |
| --- | --- |
| `ADMIN_NAME` | e.g. `Studio Admin` |
| `ADMIN_EMAIL` | Login email for the studio console |
| `ADMIN_PASSWORD` | Strong password, ≥ 8 chars |

---

## 3. Frontend environment variables (Vercel)

Vite bakes these in **at build time**, so you must redeploy after changing them.
Set in Vercel → Project → **Settings → Environment Variables** (Production).

| Variable | Required | Example |
| --- | --- | --- |
| `VITE_API_URL` | **REQUIRED** | `https://kadamba-api.onrender.com/api` (Render URL + `/api`) |
| `VITE_SITE_URL` | **REQUIRED** | `https://kadambastudio.com` (canonical origin; must match `robots.txt`/sitemap) |
| `VITE_APP_NAME` | no | `Kadamba's Designer Studio` |
| `VITE_ENABLE_DEMO_ADMIN` | **do not set** | Dev-only offline admin unlock. Never enable in production |

> After the first deploy, also update `frontend/public/robots.txt` and
> `frontend/public/sitemap.xml` if the production domain differs from
> `kadambastudio.com`.

---

## 4. Deploy order (first launch)

**Current live targets (Render):**
- Frontend (Static Site): `https://kadamba-3lc7.onrender.com`
- Backend (Web Service): `https://kadamba-api.onrender.com`

1. **MongoDB Atlas** — create cluster, DB user, allow network access
   (`0.0.0.0/0` or Render's IPs), copy the SRV `MONGODB_URI`.
2. **Cloudinary** — copy cloud name / key / secret.
3. **SMTP** — obtain host/port/user/pass.
4. **Render (backend Web Service)**
   - Root Directory: `backend`
   - Build: `NPM_CONFIG_PRODUCTION=false npm install && npm run build`
   - Start: `npm run start`
   - Set env (critical for CORS):
     - `FRONTEND_URL=https://kadamba-3lc7.onrender.com` (no trailing slash)
     - `MONGODB_URI`, Cloudinary keys, `JWT_SECRET` (≥32 chars), `NODE_ENV=production`, `TRUST_PROXY=1`
   - Confirm `GET https://kadamba-api.onrender.com/api/health/ready` → `200`.
5. **Seed the first admin** (locally against Atlas — free tier has no Shell):
   ```powershell
   cd backend
   $env:ADMIN_NAME="Studio Admin"
   $env:ADMIN_EMAIL="admin@kadambastudio.com"
   $env:ADMIN_PASSWORD="a-strong-password"
   npm run seed:admin
   ```
6. **Render (frontend Static Site)**
   - Root Directory: `frontend`
   - Build: `npm ci && npm run build:prerender` (or `npm install && npm run build:prerender`)
   - Publish: `dist`
   - Env (must redeploy after changing - Vite bakes these in):
     - `VITE_API_URL=https://kadamba-api.onrender.com/api`
     - `VITE_SITE_URL=https://kadamba-3lc7.onrender.com`
     - `VITE_APP_NAME=Kadamba's Designer Studio`
     - `PRERENDER_API_URL=https://kadamba-api.onrender.com` (origin only; the script proxies `/api` and `/uploads`)
   - Add SPA rewrite: `/*` → `/index.html`. The rewrite must serve an existing
     `dist/<route>/index.html` before falling back to the shell; otherwise the
     prerendered files are ignored.
   - `build:prerender` is best-effort. If Chromium is unavailable or the API is
     asleep, it warns and leaves the normal client-rendered build in place.
   - After the first deploy with a seeded catalogue, run
     `npm run data:backfill-product-slugs` in `backend/` once so existing
     ProductType records have canonical `/products/:slug` URLs.
7. **CORS check**
   - Backend `FRONTEND_URL` must exactly match the browser origin (scheme + host, no path/slash).
   - Open the site, DevTools → Network: API calls should succeed with no CORS errors.

---

## 5. Health checks

| Endpoint | Meaning |
| --- | --- |
| `GET /api/health/live` | Process is up (always 200 when responsive) |
| `GET /api/health/ready` | 200 only when MongoDB is connected (used by Render) |
| `GET /api/health` | Summary plus the Phase 10 background view: outbox depth, scheduler state, job pools and cache size |

> The outbox depth is the first thing to look at when mail seems to be stuck.
> A growing `pending` count with a non-zero `due` means the drainer is not
> running (check `CRON_ENABLED`); a growing `failed` count means SMTP is
> rejecting the messages.

---

## 6. Post-deploy QA checklist

- [ ] `/api/health/ready` returns 200 on Render
- [ ] Public pages load: `/`, `/about`, `/services`, `/products`, `/gallery`, `/portfolio`, `/blogs`, `/contact`
- [ ] A product detail opens at `/products/:slug` and its JSON-LD is present in page source
- [ ] `sitemap.xml` includes `/products` and the published product slugs
- [ ] Unknown URL shows the branded 404
- [ ] Admin login works with the seeded account; `/admin` redirects to login when logged out
- [ ] Contact form submits and a notification email arrives
- [ ] An image upload in the admin lands on the Persistent Disk (`UPLOAD_DIR`)
- [ ] `robots.txt` and `sitemap.xml` resolve and reference the production domain
- [ ] No CORS errors in the browser console (Render `FRONTEND_URL` matches the site origin)
- [ ] `GET /api/health` shows `background.outbox.pending` at 0 after a few minutes
- [ ] A backup archive appears in `BACKUP_DIR` (`kadamba-backup-*.jsonl.gz`), or run `npm run data:backup` once to confirm

---

## 7. Rollback

- **Vercel:** Deployments → select the previous good deployment → **Promote to Production**.
- **Render:** Events/Deploys → **Rollback** to the previous successful deploy.
- **Database:** Atlas provides point-in-time / snapshot restores on paid tiers;
  take a manual snapshot before risky migrations.

---

## 8. Local production-parity smoke

```bash
# Backend
cd backend && npm ci && npm run build && npm test

# Frontend + browser smoke
cd frontend && npm ci && npm run build
npm run test:e2e:install   # first time only
npm run test:e2e
```
