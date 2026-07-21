
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
   - Build: `npm ci && npm run build` (or `npm install && npm run build`)
   - Publish: `dist`
   - Env (must redeploy after changing — Vite bakes these in):
     - `VITE_API_URL=https://kadamba-api.onrender.com/api`
     - `VITE_SITE_URL=https://kadamba-3lc7.onrender.com`
     - `VITE_APP_NAME=Kadamba's Designer Studio`
   - Add SPA rewrite: `/*` → `/index.html`
7. **CORS check**
   - Backend `FRONTEND_URL` must exactly match the browser origin (scheme + host, no path/slash).
   - Open the site, DevTools → Network: API calls should succeed with no CORS errors.

---

## 5. Health checks

| Endpoint | Meaning |
| --- | --- |
| `GET /api/health/live` | Process is up (always 200 when responsive) |
| `GET /api/health/ready` | 200 only when MongoDB is connected (used by Render) |
| `GET /api/health` | Human-readable summary |

---

## 6. Post-deploy QA checklist

- [ ] `/api/health/ready` returns 200 on Render
- [ ] Public pages load: `/`, `/about`, `/services`, `/gallery`, `/portfolio`, `/blogs`, `/contact`
- [ ] Unknown URL shows the branded 404
- [ ] Admin login works with the seeded account; `/admin` redirects to login when logged out
- [ ] Contact form submits and a notification email arrives
- [ ] An image upload in the admin lands in Cloudinary
- [ ] `robots.txt` and `sitemap.xml` resolve and reference the production domain
- [ ] No CORS errors in the browser console (Render `FRONTEND_URL` matches the site origin)

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
