# Current Development Chunk: Phase 15 - Production

## Brand (locked for all phases)
**Kadamba's Designer Studio** in **Kurnool** — well-known local boutique & tailoring specializing in **women's traditional and bridal wear**.

See `documents/references.md` (Brand Identity), `frontend/src/pages/home/data.ts` → `brand`, and `.cursor/rules/brand-content.mdc`.

## Phase 15 -- Production

### Objective
Production hardening for a Vercel frontend + Render backend: secure env validation, safe admin bootstrap (no open registration), trust proxy, global rate limiting, structured logging, health/readiness + graceful shutdown, frontend ErrorBoundary/404/a11y, critical smoke tests + CI, and deployment configuration/docs.

### Current Status
**Phase:** 15 of 15 | **Status:** ✅ Complete

### Delivered
- Backend: `app.ts` factory + hardened `index.ts` (graceful shutdown), strict env validation, `/health/live` + `/health/ready`, trust proxy, global + scoped rate limits, pino structured logging with redaction
- Auth: public registration removed; idempotent `npm run seed:admin` bootstrap
- Frontend: `ErrorBoundary`, branded `NotFoundPage` (real 404), skip link + focusable `<main>`, lightbox focus trap/restore parity, DEV-only demo login behind `VITE_ENABLE_DEMO_ADMIN`, clean 401 → `/admin/login`
- Tests: 11 API tests (Vitest + Supertest + mongodb-memory-server), Playwright responsive smoke (Chromium + WebKit)
- CI: `.github/workflows/ci.yml` — backend lint/build/test, frontend lint/build, browser smoke
- Deploy: `frontend/vercel.json`, `render.yaml`, and `DEPLOYMENT.md` (env, keys, QA, rollback, health, admin bootstrap)

### Verification (all passing)
- Backend: `npm run lint` ✅ · `npm run build` ✅ · `npm test` ✅ (11)
- Frontend: `npm run lint` ✅ · `npm run build` ✅ · `npm run test:e2e` ✅ (9 + 1 skipped)

### How to Preview
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

### Next Phase: none — production launch (see DEPLOYMENT.md)
