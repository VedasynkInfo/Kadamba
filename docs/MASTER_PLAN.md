# Kadamba — A+ Master Implementation Plan

**Goal:** bring every layer of the platform to A+ — no compromise on quality or features.

**Locked constraints**
- **Images stay on local disk.** `uploads/` is canonical; existing files are never deleted. Durability via a Render **Persistent Disk** (`UPLOAD_DIR`), not Cloudinary.
- **No Redis.** Every Redis use-case is replaced with a Mongo-backed or in-process equivalent (rate-limit store, email outbox, LRU cache, cron locks).

**Two required infra upgrades**
1. **MongoDB Atlas M10+** — multi-document transactions (free M0 does not support them). Non-negotiable for Phase 2.
2. **Render Paid + Persistent Disk** — no cold starts, durable uploads. Non-negotiable for Phase 4.

---

## Status legend

- ✅ done & verified
- 🚧 in progress
- ⬜ not started
- 🔒 blocked (needs infra/decision)

---

## Phase 0 — Foundation & guardrails

| # | Task | Status |
|---|------|--------|
| 0.1 | Remove dead code (unrouted leads pages, AdminStatWidgets, ImageUpload alias, unused assets, empty dirs) | ✅ |
| 0.1 | Trim dead `multer`/`CloudinaryStorage` from `config/cloudinary.ts` | ✅ |
| 0.1 | Drop unused `morgan` dependency | ✅ |
| 0.1 | Collapse dead `useLocalCollection` hook to `uid` only | ✅ |
| 0.2 | Shared contract (`backend/src/shared/enums.ts`) — single source of truth | ✅ |
| 0.2 | Frontend consumes shared contract via `@/shared/enums` + `types/index.ts` re-exports | ✅ |
| 0.2 | `scripts/sync-shared.mjs` — sync + `--check` drift guard | ✅ |
| 0.2 | Models import enums from shared source (Order/Lead/User/Payment/MeasurementProfile) | ✅ |
| 0.3 | CI: contract-drift job | ✅ |
| 0.3 | CI: gitleaks secret scan | ✅ |
| 0.3 | CI: token-lint ratchet (hex literals cannot increase) | ✅ |
| 0.3 | CI: frontend `typecheck` step | ✅ |
| 0.4 | Error-code taxonomy in shared contract (`ERROR_CODES`) | ✅ (defined; adoption in Phase 5) |
| 0.5 | Purge leaked password from git history (`git filter-repo`) | ⬜ manual |
| 0.6 | Move root scratch docs (`chunk_summary.md`, `active_chunk.md`, …) into `docs/` | ⬜ |

**Gate:** `npm run lint`, `npm run check:contract`, `npm run check:tokens`, `npm run typecheck`, `npm run build`, `npm test` all green. ✅

---

## Phase 1 — Security P0

| # | Task | Status |
|---|------|--------|
| 1.1 | Scrub committed admin password (`.env.example`, `seed-measurements.ts`) | ✅ |
| 1.1 | `seed-measurements.ts` delegates admin creation to secure env-driven `seed:admin` | ✅ |
| 1.2 | Fix regex injection — `orderService` (ReDoS) | ✅ |
| 1.2 | Fix regex injection — `productCatalogService` | ✅ |
| 1.2 | Fix regex injection — `portalService` (raw customer name) | ✅ |
| 1.2 | Unify `financeService` + `staffService` on `searchRegex` | ✅ |
| 1.3 | Magic-byte sniffer `utils/fileSignature.ts` (rejects SVG/HTML/polyglots) | ✅ |
| 1.3 | `middleware/verifyUploadedFile.ts` deletes spoofed files | ✅ |
| 1.3 | `upload.any()` → whitelisted single-file fields | ✅ |
| 1.3 | Stop trusting `x-forwarded-host` in upload URLs | ✅ |
| 1.3 | `/uploads` hardening: `nosniff`, sandbox CSP, immutable cache, no dotfiles | ✅ |
| 1.3 | Fix wrong "5MB" limit message (actual 25MB) | ✅ |
| 1.4 | Remove demo-admin backdoor + all `isDemoToken()` branches | ✅ |
| 1.5 | `rel="noopener noreferrer"` on all 30 `target="_blank"` anchors | ✅ |
| 1.6 | Rotate production `JWT_SECRET` + admin password | ⬜ manual |
| 1.7 | CSP tuning for inline theme vars | ⬜ |

**Gate:** builds + lint + 38/38 tests green; polyglot upload → 400; SVG → 400. ✅ (automated upload tests ⬜ Phase 11)

---

## Phase 2 — Data integrity 🔒 needs Atlas M10 for true atomicity

| # | Task | Status |
|---|------|--------|
| 2.1 | Convert string refs → `ObjectId` + `ref` (Customer.portalUserId, MeasurementProfile.customerId/orderId, ProductType.measurementTemplateId, Order.assignedStaff[].staffId, PortalMessage.senderId, Payment.recordedBy) | ⬜ |
| 2.1 | Backfill migration with orphan quarantine report | ⬜ |
| 2.2 | `withTransaction()` helper with graceful non-replica-set fallback | ✅ |
| 2.2 | `recordPayment` atomic — balance re-read inside transaction | ✅ |
| 2.2 | `transitionOrderStatus` atomic + lead sync in same transaction | ✅ |
| 2.2 | Removed swallowed lead-sync `catch` (rolls back instead) | ✅ |
| 2.3 | Order status state machine enforced server-side (409 on invalid jump) | ✅ |
| 2.3 | `bypassBalanceCheck` now emits a structured warning log | ✅ |
| 2.4 | Unique `{staffId, year, month}` on SalaryPayment | ✅ |
| 2.4 | Customer indexes split (text name + exact phone/email) | ✅ |
| 2.5 | Money as integer paise + shared `money.ts` | ⬜ |
| 2.6 | Pagination on 8 unbounded endpoints | ⬜ |
| 2.6 | Reports → aggregation pipelines (no load-all-then-loop) | ⬜ |
| 2.7 | Map Mongo duplicate-key/validation/cast errors → 400/409 (not 500) | ✅ |
| 2.8 | Integrity test suite (concurrent payments, transitions, duplicate salary) | ✅ |

**Gate:** 43/43 tests green including 5 new integrity tests. True atomicity requires Atlas M10 (helper degrades safely on standalone).

---

## Phase 3 — Auth & RBAC

| # | Task | Status |
|---|------|--------|
| 3.1 | Access (15m, in-memory) + rotating refresh (30d) httpOnly cookies | ✅ |
| 3.1 | `RefreshToken` collection w/ session id, family, reuse-detection | ✅ |
| 3.1 | `tokenVersion` for instant global logout | ✅ |
| 3.1 | Two axios instances (`adminApi`, `portalApi`) — drop URL heuristic | ✅ |
| 3.2 | `authenticate` checks `status` (60s LRU) | ✅ |
| 3.2 | `iss`/`aud` claims + `sid` session claim | ✅ |
| 3.2 | Dummy bcrypt compare (kill timing oracle) | ✅ |
| 3.3 | Forgot/reset/change-password flows | ✅ |
| 3.3 | zxcvbn strength (admin ≥12 / staff ≥10, score ≥3) | ✅ |
| 3.4 | TOTP 2FA for admin + one-time recovery codes | ✅ |
| 3.5 | Staff provisioning (`staffService` creates User w/ permissions) | ✅ |
| 3.5 | `requirePermission()` + Users & Roles desk | ✅ |
| 3.6 | `AuditLog` on every admin mutation + `/admin/audit` | ✅ |
| 3.7 | Active-session management UI | ✅ |

**Gate:** disable user → 401 immediately; stolen token dead after password change; lockout after 5 fails; MFA enforced; 403 matrix correct; every write audited. ✅ verified by `auth.test.ts` (11), `rbac.test.ts` (6), `totp.test.ts` (5), `hardening.test.ts` (7) — 68/68 backend tests green.

**Notes / follow-ups**
- MFA enforcement is behind `REQUIRE_ADMIN_MFA` (default `false`) so deploying does not lock out the sole admin before they enrol. Flip to `true` after the admin has confirmed enrolment.
- Production runs Vercel ↔ Render cross-site, so refresh cookies are `SameSite=None; Secure`. `/auth/refresh` and `/auth/logout` are additionally origin-guarded.
- An `autoAudit` fallback records a generic `admin.request` entry for any admin/staff write that has no structured event, so no mutation is invisible.
- Deferred: 2FA requirement for staff (admins only today), and WebAuthn/passkeys.

---

## Phase 4 — Image pipeline (local, non-destructive)

| # | Task | Status |
|---|------|--------|
| 4.1 | `UPLOAD_DIR` → Render Persistent Disk; `migrateUploads.ts` (checksum-verified, never deletes) | ⬜ |
| 4.2 | `sharp` pipeline: WebP/AVIF variants @ 400/800/1200/1600/2400 + blurhash + EXIF strip | ⬜ |
| 4.2 | `ImageAsset` model (hash, widths, blurhash, dims, bytes) | ⬜ |
| 4.3 | `optimizeExisting.ts` idempotent backfill (dry-run + progress) | ⬜ |
| 4.4 | `OptimizedImage` emits real `srcset` + `sizes` + `<picture>` AVIF/WebP/JPEG | ⬜ |
| 4.4 | Replace all raw `<img>` (admin tables, logos, modals) | ⬜ |
| 4.4 | Replace 62 Unsplash hotlinks with local assets | ⬜ |
| 4.5 | Immutable caching on `/uploads/optimized/*` | ⬜ |
| 4.6 | Wire `react-easy-crop` (aspect presets) into `MediaUpload` | ⬜ |
| 4.7 | Admin media library (usage count, orphan-safe delete, alt text) | ⬜ |
| 4.8 | Video: poster frame + `preload="metadata"` | ⬜ |

**Gate:** Lighthouse ≥95; LCP <1.8s; 0 CLS; originals byte-identical after migration; variants ready <2s.

---

## Phase 5 — Sync layer

| # | Task | Status |
|---|------|--------|
| 5.1 | TanStack Query v5 — replace data responsibilities of 9 contexts | ⬜ |
| 5.1 | Delete seed-data swallowing → real error states | ⬜ |
| 5.2 | Zod schemas shared via contract (server + client) | ⬜ |
| 5.3 | React Router v7 data router (loaders/actions/errorElement) | ⬜ |
| 5.4 | Typed order state machine (shared transitions) | ⬜ (transitions defined ✅) |
| 5.5 | Socket events → query cache invalidation | ⬜ |
| 5.6 | Offline mutation retry queue + offline banner | ⬜ |

**Gate:** every surface has loading/error/empty; optimistic UI rolls back on 4xx; zero raw `useEffect` fetches.

---

## Phase 6 — Design system consolidation

| # | Task | Status |
|---|------|--------|
| 6.1 | One token source (`index.css @theme`); `designTokens.ts` → motion/breakpoints only | ⬜ |
| 6.2 | Semantic token layer (`--color-surface-*`, `--color-text-*`) | ⬜ |
| 6.2 | Delete `.admin-scope` override block | ⬜ |
| 6.2 | Normalise 3 conflicting `--admin-card` fallbacks | ⬜ |
| 6.3 | `clsx` + `tailwind-merge` in `cn()`; remove `!important` overrides | ⬜ |
| 6.4 | Rename spacing scale → `--space-*` (kill Tailwind footgun) | ⬜ |
| 6.5 | Radix-backed primitives + missing components (DropdownMenu, Tooltip, Command, DataTable…) | ⬜ |
| 6.6 | Remove 658 inline `style={{}}` colour blocks | ⬜ |
| 6.7 | Motion tokens from CSS vars | ⬜ |

**Gate:** hex literals in TSX → 0 (ratchet); inline style <20; `.admin-scope` gone; all primitives keyboard-accessible.

---

## Phase 7 — Admin premium redesign

| # | Task | Status |
|---|------|--------|
| 7.1 | Lucide SVG icons replace all emoji | ⬜ |
| 7.1 | Collapsible nav groups + `layoutId` spring | ⬜ |
| 7.2 | `⌘K` command palette (cmdk) across all entities | ⬜ |
| 7.3 | Motion language (row stagger, count-up, spring modals, tab indicators) | ⬜ |
| 7.4 | **Order Kanban pipeline** (dnd-kit, optimistic + audit) | ⬜ |
| 7.5 | Data table upgrade (sticky, bulk actions, virtualised, saved filters) | ⬜ |
| 7.6 | Real dashboard (metrics, sparklines, needs-action queue) | ⬜ |
| 7.7 | react-hook-form + zod; multi-step New Order wizard | ⬜ |
| 7.8 | Sonner toasts, conflict alerts, error boundary | ⬜ |
| 7.9 | AA+ contrast + keyboard audit | ⬜ |
| 7.10 | Virtualisation + `React.memo` + per-desk chunks | ⬜ |

**Gate:** INP <200ms; `⌘K` ≤3 keystrokes to any record; Kanban writes audit row; 100% keyboard; zero emoji nav; zero inline colour styles.

---

## Phase 8 — Public site premium push

| # | Task | Status |
|---|------|--------|
| 8.1 | GSAP ScrollTrigger storytelling (timeline, collections, portfolio) | ⬜ |
| 8.2 | Lenis smooth scroll (reduced-motion aware) | ⬜ |
| 8.3 | Route transitions (`AnimatePresence` / view-transition API) | ⬜ |
| 8.4 | Layered parallax hero + char-reveal + preloader | ⬜ |
| 8.5 | Magnetic buttons, link sweeps, clip-path image reveals | ⬜ |
| 8.6 | Rich media: video hero, lightbox shared-element, before/after inertia | ⬜ |
| 8.7 | Scroll-velocity marquee + unified counters | ⬜ |
| 8.8 | Public `/products` + `/products/:slug` from ProductType | ⬜ |
| 8.9 | Prerender public routes; Product/LocalBusiness/FAQ structured data | ⬜ |

**Gate:** Lighthouse Perf/SEO/A11y ≥95; LCP <1.8s; INP <200ms; CLS <0.05; 60fps mid-range Android.

---

## Phase 9 — Product catalog & admin management

| # | Task | Status |
|---|------|--------|
| 9.1 | `measurementTemplateId` → real ref; add gallery/variants/leadTime/tags/featured/seo | ⬜ |
| 9.1 | Make Service ↔ ProductType relationship explicit | ⬜ |
| 9.2 | Master/detail editor + drag reorder + bulk ops + CSV import/export | ⬜ |
| 9.2 | Live template preview; unlink-usage warning; "orders using" count | ⬜ |
| 9.3 | Multi-image gallery + cover selection + alt text | ⬜ |
| 9.4 | Public catalog + featured collections from `featured` flag | ⬜ |
| 9.5 | Inventory seam (`sku`/`stockItem`) left open, not built | ⬜ |

**Gate:** end-to-end product publish with zero deploys; reorder persists; unlink warns with usage; CSV validates row-by-row.

---

## Phase 10 — Jobs, email, caching, cron (no Redis)

| # | Task | Status |
|---|------|--------|
| 10.1 | `EmailOutbox` + cron drain w/ exponential backoff | ⬜ |
| 10.2 | Cron: follow-ups, trial/delivery reminders, orphan cleanup, nightly backup | ⬜ |
| 10.3 | In-process job pool for images/exports/bulk | ⬜ |
| 10.4 | `lru-cache` for settings/dashboard/CMS + invalidation on write | ⬜ |
| 10.5 | `rate-limit-mongo` store + per-account login lockout | ⬜ |

**Gate:** kill process mid-queue → all emails eventually send exactly once; cron de-dupes via lock; login counts survive redeploy.

---

## Phase 11 — Testing

| # | Task | Status |
|---|------|--------|
| 11.1 | Backend coverage ≥80% (uploads, leads, CMS, measurements, settings, transactions) | ⬜ |
| 11.2 | Frontend unit tests (Vitest + Testing Library) — currently 0 | ⬜ |
| 11.3 | Contract tests (shared schema round-trip) | ⬜ |
| 11.4 | E2E: admin journey, portal journey, product publish, Kanban, auth matrix | ⬜ |
| 11.5 | CI gates: coverage, bundle budget, Lighthouse CI, axe, visual regression | ⬜ |

---

## Phase 12 — Infra, observability, staging

| # | Task | Status |
|---|------|--------|
| 12.1 | Staging env + PR preview deploys | ⬜ |
| 12.2 | Atlas PITR + nightly dumps + quarterly restore test | ⬜ |
| 12.3 | Sentry (both apps), structured logs, kill PII `console.*` | ⬜ |
| 12.4 | Slow-query logging + `explain()` audit | ⬜ |
| 12.5 | Versioned migrations + zero-downtime deploy | ⬜ |
| 12.6 | IaC + secrets rotation policy | ⬜ |

---

## Phase 13 — Enterprise features

| # | Task | Status |
|---|------|--------|
| 13.1 | GST invoicing + PDF + GSTR export | ⬜ |
| 13.2 | Razorpay gateway + webhooks | ⬜ |
| 13.3 | WhatsApp Cloud API templates | ⬜ |
| 13.4 | Inventory & SKUs | ⬜ |
| 13.5 | Attendance & payroll automation | ⬜ |
| 13.6 | Telugu i18n | ⬜ |
| 13.7 | Analytics depth | ⬜ |
| 13.8 | Multi-branch readiness | ⬜ |

---

## Verification commands

```bash
# Backend
cd backend && npm run lint && npm run build && npm test

# Frontend
cd frontend && npm run lint && npm run typecheck && npm run build

# Contract + design-system guards (repo root)
node scripts/sync-shared.mjs --check
node scripts/check-tokens.mjs
```

## Definition of Done (per phase)

1. **Functional** — acceptance gate met end-to-end
2. **Verified** — automated tests cover it
3. **Secure** — no injection, authz server-side, audited if mutating
4. **Observable** — logs, errors, and a metric that reveals breakage
