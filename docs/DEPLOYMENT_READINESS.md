# Deployment readiness — Kadamba

Audit date: 4 November 2026  
Audit report: `audit-artifacts/AUDIT_REPORT.html`  
Machine summary: `audit-artifacts/AUDIT_SUMMARY.json`

## Status

The application is **functionally ready for deployment**, but the current live deployment is stale. The code, database content and photography pass the local full-stack audit. The remaining work is deployment configuration and publishing the new assets.

| Surface | Result |
|---|---|
| Public routes | **162/162** on five profiles |
| Public API reads + auth gates | **80/80** |
| Admin pages | **27/27**, 0 console/API errors |
| Customer portal pages | **8/8**, 0 console/API errors |
| Content/image writes | **6/6** verified end to end |
| SEO | **160/160** |
| Web standards | **160/160**, 0 axe nodes |
| Photography | **48/48** files, 1,090 images, 0 placeholders/broken |
| Real forms | contact **200**, consultation **201**, order **#22** |

## What was verified live

- Admin sign-in and every console desk, including detail pages.
- Customer portal sign-in, dashboard, orders, measurements, chat, payments and requests.
- 80 API calls across health, public content, products, gallery, services, portfolio, blogs, portal catalog, dashboards, CRM, catalog, finance, reports, media, measurements and settings.
- Auth gates: anonymous admin → 401; customer token on admin → 403; admin token on portal → 403.
- Content image updates on **service, gallery, portfolio, blog and product**, each read back from the public endpoint and restored.
- Binary JPEG upload → **201**, media detail → **200**, alt-text update → **200**, delete → **200**.
- No destructive live workflows were run: no real product deletion, live order-status change, invoice creation or customer creation.

## Deployment blockers

### 1. The photography is not in git

`frontend/public/media/photos/` is untracked:

```text
?? frontend/public/media/photos/
```

A Git-connected Render/Vercel deploy will not contain it. The deployed Render host currently returns **404** for every `/media/photos/*` file. Commit and push the 48 photographs, the transparent logo, favicon and app icons before deploying.

### 2. The current deployed API is offline

`https://kadamba-api.onrender.com/api/health` times out. The old deployed frontend therefore cannot load products, gallery, services, portfolio, blogs or portal data. Deploy the backend and confirm:

- `GET /api/health/ready` returns 200
- MongoDB Atlas is reachable
- `FRONTEND_URL` contains the exact production frontend origin
- `TRUST_PROXY=1`, `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`
- `JWT_SECRET`, `MONGODB_URI` and SMTP values are set in the Render dashboard, not committed
- `PUBLIC_API_URL` is the public API origin (for uploaded image URLs)
- `UPLOAD_DIR=/var/data/uploads` with the persistent disk mounted

### 3. The deployed frontend is an older build

`https://kadamba-3lc7.onrender.com` still serves the old site: old titles, old routes and Unsplash hotlinks that now return 404. The new build is not deployed. The domain `kadambastudio.com` currently serves a different “Kadamba studio, Interiors and styling” site, not this application.

### 4. Production environment values

`frontend/.env` is local:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SITE_URL=http://localhost:5173
```

Set these in the production dashboard:

```env
VITE_API_URL=https://<api-host>/api
VITE_SITE_URL=https://<frontend-host>
PRERENDER_API_URL=https://<api-host>
SITEMAP_API_URL=https://<api-host>/api
VITE_APP_NAME=Kadamba's Designer Studio
```

### 5. Prerender/Chromium on the static host

`npm run build:prerender` needs Chromium. The current Render static build command is:

```text
npm install && npm run build:prerender
```

It does not install Chromium. If prerender fails, the script catches the error and the build still succeeds with an SPA shell; SEO and per-route social cards are lost. Either install Chromium in the build environment:

```text
npx playwright install chromium --with-deps
```

or run the prerender on Vercel/CI where the browser is available, and make a missing prerender **fail the production build**.

### 6. Render rewrite and clean URLs

`render.yaml` rewrites `/*` to `/index.html`. The audit server serves the prerendered directory indexes first. Confirm Render serves:

- `/about` → `dist/about/index.html` or `dist/about.html`
- `/products/<slug>` → its own prerendered head, not the home-page head

If the rewrite takes precedence, remove the blanket rewrite and rely on the generated directory indexes / flat `.html` siblings, or add explicit per-route rewrites.

## Recommended deployment order

1. Commit the new code and `frontend/public/media/photos/`.
2. Deploy the backend; verify `/api/health/ready`, CORS and uploads.
3. Set production frontend env values.
4. Build with `npm run build:prerender`; confirm `160/160 routes` in the build log.
5. Deploy the static frontend.
6. Verify:
   - `https://<frontend>/products/bridal-lehenga` has its own title/h1/OG image
   - `/media/photos/bridal-red-lehenga.jpg` returns 200
   - `/admin/login` and `/portal/login` load
   - a real image upload appears in the media library and on a service
7. Re-run:

```powershell
cd backend; $env:NODE_ENV='test'; npm run dev
cd frontend; npx playwright test --config playwright.audit.config.ts
```

## Local commands

```powershell
# backend
cd backend
npm run dev

# frontend (prerendered build)
cd frontend
$env:PRERENDER_API_URL='http://localhost:4000'
$env:SITEMAP_API_URL='http://localhost:4000/api'
$env:VITE_SITE_URL='http://localhost:3002'
npm run build:prerender
npm run preview:prerendered

# full audit (test backend avoids rate-limit failures)
cd backend; $env:NODE_ENV='test'; npm run dev
cd frontend; npx playwright test --config playwright.audit.config.ts
```

## Temporary audit data

The audit created temporary admin/portal accounts and content changes. They were removed or reverted:

- temp admin and portal users deleted
- portal customer link reset
- audit leads/orders/outbox removed with `data:cleanup-audit`
- uploaded test image deleted
- service/gallery/portfolio/blog/product images restored

No credentials are stored in the report.
