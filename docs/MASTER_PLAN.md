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
| 0.4 | Error-code taxonomy in shared contract (`ERROR_CODES`) | ✅ (defined + adopted in 5.1) |
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
| 4.1 | `UPLOAD_DIR` → Render Persistent Disk; `migrateUploads.ts` (checksum-verified, never deletes) | ✅ |
| 4.2 | `sharp` pipeline: WebP/AVIF variants @ 400/800/1200/1600/2400 + blurhash + EXIF strip | ✅ |
| 4.2 | `ImageAsset` model (hash, widths, blurhash, dims, bytes) | ✅ |
| 4.3 | `optimizeExisting.ts` idempotent backfill (dry-run + progress) | ✅ |
| 4.4 | `OptimizedImage` emits real `srcset` + `sizes` + `<picture>` AVIF/WebP/JPEG | ✅ |
| 4.4 | Replace all raw `<img>` (admin tables, logos, modals) | ✅ |
| 4.4 | Replace 62 Unsplash hotlinks with local assets | ✅ |
| 4.5 | Immutable caching on `/uploads/optimized/*` | ✅ |
| 4.6 | Wire `react-easy-crop` (aspect presets) into `MediaUpload` | ✅ |
| 4.7 | Admin media library (usage count, orphan-safe delete, alt text) | ✅ |
| 4.8 | Video: poster frame + `preload="metadata"` | ✅ |

**Gate:** Lighthouse ≥95; LCP <1.8s; 0 CLS; originals byte-identical after migration; variants ready <2s.

**Notes / follow-ups**
- Cloudinary was removed entirely (`cloudinary`, `multer-storage-cloudinary`, `config/cloudinary.ts`, the `env.cloudinary` block and `cloudinaryOptimizedUrl`). Originals stay in `UPLOAD_DIR`; variants live in `UPLOAD_DIR/optimized/<hash>/<width>.<ext>`, which is disposable and regenerable.
- `targetWidths()` never upscales: configured widths ≤ the source width, plus the source width itself when the last configured width is strictly smaller, so every image gets one full-size modern-format variant. AVIF is capped at `IMAGE_AVIF_MAX_WIDTH` (1600); WebP and JPEG are produced for every width.
- EXIF auto-orient runs *before* metadata is dropped. `sharp`'s `metadata()` reports pre-rotation dimensions, so `processImageFile` swaps width/height when `orientation >= 5` — stored dimensions, aspect ratio and variant widths all describe the displayed image. Originals are never rewritten.
- Deleting an asset is orphan-safe: `409` while any content still references it, unless `?force=true`; the original is unlinked only when forced **and** the resolved path is verified to sit inside `UPLOAD_DIR`.
- The renderer avoids N+1 metadata lookups via a public `GET|POST /api/media/resolve?urls=…` (unauthenticated, `/uploads/`-only, `Cache-Control: public, max-age=300, stale-while-revalidate=86400`) batched and memoised client-side by `services/media/assetResolver.ts`.
- Media curation is gated by new `media:read` / `media:write` permissions (`media:read` is in `DEFAULT_STAFF_PERMISSIONS`); `POST /api/upload` stays role-gated to `admin`/`staff`.
- All 62 third-party image hotlinks (plus one hotlinked video) were replaced with locally generated, committed artwork (`frontend/public/media/placeholders/*.jpg`, produced by `backend npm run assets:placeholders`) plus a raster `og-default.jpg` — social crawlers do not render SVG. The frontend now has **zero external media dependencies**.
- `sizes` was set on 32 public call sites (heroes `100vw`, catalogue grids 2/3/4-up, masonry, lightbox `80vw`, fixed-size marquee) so `srcset` only fetches what a viewport needs. Logos use `responsive={false}`.
- **Blocking infra:** durability requires **Render Paid + a Persistent Disk** mounted at `UPLOAD_DIR` (`render.yaml` already declares `kadamba-uploads` @ `/var/data`). Without it, uploads are lost on redeploy.
- Deferred: transcoding uploaded video to a poster frame + streaming variants (video items render a poster and stream with `preload="metadata"`).

---

## Phase 5 — Sync layer

| # | Task | Status |
|---|------|--------|
| 5.1 | TanStack Query v5 — replace data responsibilities of 9 contexts | 🚧 (CMS + leads + theme done; admin desks remain) |
| 5.1 | Delete seed-data swallowing → real error states | ✅ |
| 5.1 | Error-code adoption on the backend (`code` on every error) | ✅ |
| 5.2 | Zod schemas shared via contract (server + client) | ✅ |
| 5.3 | React Router v7 data router (loaders/actions/errorElement) | ✅ (loaders + errorElement + scroll restoration; actions intentionally not adopted — see notes) |
| 5.4 | Typed order state machine (shared transitions) | ✅ (enforced + mirrored in the console; `INVALID_TRANSITION`) |
| 5.5 | Socket events → query cache invalidation | ✅ (coalesced; the legacy soft-refresh channel remains only for the hand-rolled desks) |
| 5.6 | Offline mutation retry queue + offline banner | ✅ (pause/resume queue + counted banner; durable across reloads is the outbox slice, see notes) |

**Gate:** every surface has loading/error/empty; optimistic UI rolls back on 4xx; zero raw `useEffect` fetches.

**Notes / follow-ups**
- **Backend error contract** (Phase 0.4's deferred half) is live: `errorHandler` always emits `code`, and `ApiError` derives one from the status code unless a call site names a specific code — so all 211 existing `new ApiError(...)` sites were correct without edits. Multer, duplicate-key (11000), Mongoose `ValidationError`/`CastError` and the upload-message branches each carry an explicit code. `notFoundHandler` → `NOT_FOUND`. Covered by `backend/src/__tests__/errorContract.test.ts` (401/403/404/400/409/423/upload + the `defaultErrorCode` mapping).
- **Frontend query backbone:** one `QueryClient` singleton (`lib/queryClient.ts`); 4xx responses are never retried; queries surface failures through a single global toast handler, mutations only when they opt in via `meta.surfaceErrors`. `lib/apiError.ts` normalises anything thrown (axios envelope, transport failure, timeout, plain `Error`) into `AppError { code, status, message, fieldErrors, requestId }`. `lib/queryKeys.ts` roots every domain (`qk.<domain>.all`) so one call invalidates a whole domain, and keeps public (`published:true`) reads in a separate cache family from admin reads — drafts can never be served to a visitor.
- **Seed swallowing is gone.** `usePublicContent`, `AdminContentContext`, `useLeadsStore` and `ThemeContext` no longer substitute bundled demo content on an empty or failed response; they expose `error` and `isEmpty`, and writes reject instead of swallowing (a failed lead create used to toast a success that never happened). The ~1,300 lines of demo arrays those fallbacks fed were deleted from `frontend/src/pages/{gallery,services,portfolio,blogs,leads,home,request-service}/data.ts`, leaving types, pure helpers and brand prose. That content now lives in the database: `backend npm run seed:cms` (`--dry-run`, `--force`; idempotent on slug/id; never deletes).
- **Every CMS-backed public surface has all three states.** New shared primitives `components/feedback/ContentState.tsx` (`ContentLoading` / `ContentEmpty` / `ContentError`, `tone` for light vs dark sections) are used by the home services + journal strips, all four catalogue sections, the three detail pages and the enquiry form. Detail pages distinguish "failed to load" from "no such slug" — a 500 no longer silently redirects to the index. `MeasurementsPage` no longer swallows a failed silhouette-template fetch (inline warning, desk still usable).
- **Settings defaults are configuration, not demo data.** `mergeWebsiteSettings` deep-merges the API document onto the studio's own defaults so an unconfigured section renders sensibly instead of crashing on `settings.media.bannerPresets[0]`. Its input type is a *shallow-per-section* partial (`WebsiteSettingsInput`), which is what the API actually sends.
- **Tests:** the frontend had no unit runner. Added Vitest + jsdom + Testing Library (`npm test`, currently 36 tests) covering `apiError`, the query-key hierarchy (including the published-vs-draft separation), `mergeWebsiteSettings`, and the loading → data → error behaviour of the CMS query hook. The token ratchet now skips `*.test.ts(x)`: a test asserting `{ accent: '#123456' }` round-trips is checking plumbing, not shipping a colour.
- **Remaining for 5.1:** ~30 admin desks still own hand-rolled `useEffect` fetches; they need the same query treatment (Phase 7 rewrites most of those components anyway, so the two phases meet there).
- **Routing smell found while testing, and fixed in 5.3:** `router.use('/admin', createSlugAvailableRouter())` applied its `content:write` gate to *any* unmatched `/api/admin/*` path, so a staff user without `content:write` got `403` instead of `404` for an unknown admin URL — a permission error where the truth was "no such endpoint". The gate is now attached per route, and `errorContract.test.ts` locks it with a 404 assertion.

**5.2 — one schema for both ends**
- `shared/schemas.ts` is the payload half of the contract (`shared/enums.ts` is the vocabulary half): the success/error envelopes, pagination, the four CMS records, the settings document, the lead record, the four CMS write payloads and the public enquiry payload. `scripts/sync-shared.mjs` now copies a *file list* (`enums.ts`, `schemas.ts`) and `--check` fails if either drifts. Only `zod` and `./enums` are imported, because the copy must compile under both the backend's CommonJS `rootDir: ./src` build and Vite.
- **Server side:** `middleware/validateBody(schema)` replaces the hand-written `express-validator` body chains on the gallery/service/portfolio/blog create-and-update routes and on the enquiry form. The payload the SPA sends is now checked against the same definition the SPA validates with, and the parsed result replaces `req.body`, so `"false"` arrives as a boolean and `"1200"` as a number instead of each service re-casting them. The write schemas are `looseObject`s, which is what makes that safe: fields the contract does not police (a service's `gallery`, `pricing`, …) still reach the service untouched rather than being stripped by a strict parse. `express-validator` keeps params and query strings.
- **`__tests__/contract.test.ts` is the proof.** A schema is only worth having if it describes real responses, so these tests create a record through the API and parse what comes back — gallery, service, portfolio, post, the settings document, the enquiry receipt and the leads list — and assert the transcribed category vocabularies still match the models value for value. That test is what makes it safe to transcribe the enums rather than import them.
- **Client side:** services no longer assert their own response shape with `data.data!`. `lib/parse.ts` validates the envelope and the payload against the shared schema and throws an `ApiContractError` attributed to the surface that asked ("the gallery list"), which `toAppError` reports as the new client-originated code `UNEXPECTED_RESPONSE` — distinguishable in logs from a network fault and never retried (retrying reproduces it). Responses are parsed with `looseObject`, so a field the server adds later passes through instead of invalidating a collection.
- **Settings read through one adapter.** `settingsApi` parses the (partial, sometimes `null`) settings document and returns the result of `mergeWebsiteSettings`, so every caller keeps receiving a complete `WebsiteSettings` while the wire shape stays honest.
- **Bug found and fixed:** `extractFieldErrors` only looked for `message`, but express-validator names its field detail `msg` — so *every* validation failure had been arriving in the UI with no field detail at all. Both are now read, and `validateBody` emits `message`.
- `leadRequestSchema` carries the two business rules the enquiry route used to hold inline (a dialable phone number, no preferred date in the past), so the form and the server can enforce the same rule from one definition.
- **Not yet migrated:** orders, customers, measurements, product catalog and the portal still validate with `express-validator` alone and still use `data.data!` in their services; their entity schemas are the next slice of the same pattern.

**5.3 — a data router**
- `createBrowserRouter` replaces `<BrowserRouter><Routes>`, configured once at module scope in `@/router` (`App.tsx` is now only providers → `RouterProvider`). The page inventory moved to `@/router/pages` — a route table is configuration, and holding it in the same file as 51 lazy components made the module look like a component module (52 fast-refresh warnings, all gone).
- **`errorElement` on the root and on each layout.** A page or loader that throws renders a designed page instead of React Router's developer overlay — and because the copy sits on `MainLayout`/`AdminLayout`/`PortalLayout`, the error renders *inside* the shell, keeping the navbar and a way out. `RouteErrorPage` distinguishes 404 / 5xx / thrown-render-error instead of flattening all three into "something went wrong", offers "Try again" (`useRevalidator`) where retrying can help, and prints the raw error in development only.
- **`ScrollRestoration`** (in `RouterShell`) fixes a bug that had been there since the SPA was built: nothing handled scroll on navigation, so following a link from halfway down the gallery landed you halfway down the service page, and back/forward lost your place in a long list. Only a data router can do both halves.
- **Loaders overlap the fetch with the chunk download.** Each public content route prefetches through `queryClient.ensureQueryData` using the *same descriptor object* its component's `useQuery` reads, so the request starts during navigation instead of after mount, and the hook finds it already in the cache (asserted by a test: one request, not two). Two decisions keep this safe: the prefetch disables `retry` (a loader blocks navigation, so the query layer's retry policy would hold the visitor on the *previous* page for seconds while a slow API times out) and swallows failure (the page's own `ContentError` is a better home for a failed collection than a route error screen that discards the navbar). Admin routes deliberately do not prefetch: the access token lives in memory, so a loader running before the refresh-cookie exchange would fire an anonymous 401.
- **Actions are intentionally not adopted.** React Router actions exist to post a form and let the router revalidate. Every write here goes through a TanStack Query mutation so it can be optimistic, invalidate both cache families and report through the shared error bridge; routing the same writes through actions would put two owners on one piece of server state. Recorded as a decision rather than an omission.
- **Not-found inside the console and the portal.** `/admin/<unknown>` used to match the `admin` layout and render its chrome around an empty outlet; both subtrees now have a `*` child rendering the branded 404.

**5.4 — the order lifecycle, enforced and mirrored**
- `ORDER_STATUS_TRANSITIONS` existed but only one end used it: the API refused illegal jumps with a generic 409 while the console offered all eleven statuses — including from enquiry to *Delivered* — and let the operator find out by failing. Two of three quick actions in the orders table were unreachable-by-design (`Mark Delivered` on an enquiry, `Move to Finishing` on a delivered order, which the machine forbids).
- **The machine is now a call, not a map.** `allowedOrderTransitions`, `canTransitionOrder` and `isOrderStatusTerminal` live in `shared/enums.ts` next to the transition table, so both ends compute the same answer from the same source. The console renders its choices with `orderStatusChoices()`, the API refuses with the same list, and the two can no longer drift.
- **A refusal that answers the question.** Illegal moves now return `409 INVALID_TRANSITION` (its own code, because "that slug is taken" and "a stitching order cannot be delivered" need different words) with the allowed set in `errors[0].message` — so the toast reads *"An order in stitching cannot move to delivery. From stitching an order can move to: embroidery_maggam, trial, finishing, cancelled, on_hold."* A delivered order instead says its lifecycle is complete. The order desk shows that detail as a toast description rather than swallowing it.
- **The machine now records what its states mean.** Reaching `trial` stamps `actualTrialAt` and `delivery` stamps `actualDeliveryAt` (only when unset, so a date corrected by hand survives). Those fields previously existed only to be filled in by hand from the edit form, while reports and the customer portal read them as fact.
- **The console stopped keeping its own copy of the flow.** `OrderDetailAdminPage` had a hand-written nine-entry `ORDER_STATUS_FLOW` for its "is this move backwards?" heuristic — a second, silent definition of the lifecycle. It now reads `ORDER_PRODUCTION_FLOW` and asks `transitionNeedsNote()`, which still demands a reason for a cancel, a hold, or rework (a finished garment sent back to trial). The status `<select>` offers only legal moves and renders a plain "lifecycle complete" line instead of a selector when there is nowhere left to go.
- **`Order.status` is `OrderStatus`**, not `string`, in the SPA's own type — so a typo in a stage name is a compile error rather than a 409 at runtime.
- Not in this workstream: order/customer/portal payloads still use `express-validator` alone rather than the shared zod contract (that is the remaining "not yet migrated" slice above); 5.4 is the lifecycle itself.

**5.5 — the socket stops being a fetch instruction**
- The realtime channel used to command: every list page subscribed to a `soft-refresh` hint and re-ran its own fetch. One order edit could fire a dozen uncoordinated requests, and a page that forgot to subscribe simply stopped updating — with nothing to tell you which kind of page you were looking at.
- Now an event is only a *hint*: `invalidateForRealtime(event)` maps it to the cache families it makes stale (`lib/realtimeInvalidation.ts`), and whichever of those queries is mounted refetches once, through the same query layer as everything else. Correctness no longer depends on a surface remembering to listen.
- Coarse on purpose. A write touches more than the row it names — confirming an order moves its lead, the customer's history, the badge counts and the dashboard — so events invalidate whole families rather than trying to enumerate the joins, which would be a second and quietly-wrong copy of the server's rules. Bursts are coalesced (200 ms) so one write that pokes three families is one refetch pass.
- `onSoftRefresh` survives as a legacy hint for the desks that still own their fetches (the two dashboards today). It is explicitly a transportation detail: it dies with the last hand-rolled desk in Phase 7, and nothing new should subscribe to it.
- **Not extended to the public site**, deliberately. Anonymous visitors hold no socket (the connection is token-authenticated), and opening one per visitor to watch for CMS edits is a cost this plan has not justified. Public content stays stale-while-revalidate: a 5-minute `staleTime`, the studio's own writes invalidating both cache families in the same browser, and `refetchOnReconnect`.

**5.6 — offline, told honestly**
- The fetch layer already paused work offline (`networkMode: 'online'`, set in 5.1) — which is exactly the problem: forms kept accepting input and nothing on screen changed. `useOfflineState()` reads the state from the layers that *are* the truth (`onlineManager` and the mutation cache) via `useSyncExternalStore`, so the banner cannot claim "online" over a queue that is stuck.
- `OfflineBanner` renders in `RouterShell`, so the public site, the console and the portal all get it and none can forget. It distinguishes "offline, showing the last content that loaded" from "offline, *n* changes will be sent when the connection returns", and reports "back online — sending…" while the queue drains. Writes made offline are paused, not failed, and resume by themselves.
- **Not durable across a reload, on purpose.** A queue that survives a refresh has to replay *service calls*, not closures — it needs a declarative mutation registry and idempotency keys so a write that did reach the server is not applied twice. That is the same mechanism the planned `EmailOutbox` needs; faking it with a localStorage dump of ad-hoc mutation closures would silently double-apply writes, which is worse than losing them. Recorded here rather than quietly implied by "offline support".

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
| 6.5 | Radix-backed primitives + missing components (DropdownMenu, Tooltip, Command, DataTable…) | ✅ |
| 6.6 | Remove the inline `style={{}}` colour blocks | ✅ |
| 6.7 | Motion tokens from CSS vars | ✅ |

**Gate:** hex literals in TSX → 0 (ratchet); inline style <20; `.admin-scope` gone; all primitives keyboard-accessible.

- Hex literals: **0** across `frontend/src` (was 927 on the ratchet), with the baseline locked at 0 so the next one fails.
- `.admin-scope`: gone.
- Primitives: Radix Dialog / DropdownMenu / Tooltip / Popover / Tabs, `cmdk` Command, and a hand-built `DataTable`; sortable headers are buttons, selection is native checkboxes, dialogs trap and restore focus.
- Inline styles: **689 → 1** block that sets a colour property, and the survivor references `var(--color-espresso)` rather than a value — see 6.6.

**6.1 — one place a value is defined**
- `src/index.css` is now the single source, in three layers: raw palette (`--color-gold`), the semantic layer (`--color-surface-raised`, `--color-ink`), and the settings-driven names a studio can retheme (`--public-*`, `--admin-*`). The semantic layer is built *out of* the settings layer, so retheming flows through the whole app instead of patching class names.
- `theme/designTokens.ts` keeps only what JavaScript needs — durations, easing curves, breakpoints — and `theme/__tests__/designTokens.test.ts` pins them to the CSS custom properties, so changing a duration on one side fails the suite. That test reads the stylesheet from disk, which is why `tsconfig.app.json` now lists `node` in `types`.
- `theme/palettes.ts` holds the theme *data* (the default theme, four presets, the chart ramps) and is the single entry on the token linter's allowlist: preset data is colour by definition, and putting it in a component was what forced 114 literals into `ThemeTab`.
- `@theme` versus `:root` is a deliberate split, not a leftover: `@theme` holds what must generate a utility, `:root` holds plain values (the spacing rhythm, motion) that must be emitted unconditionally and cannot be tree-shaken.

**6.2 — a semantic layer the shells re-point**
- The vocabulary is surfaces (`surface`, `surface-raised`, `surface-sunken`, `surface-field`, `surface-inverse`), text (`ink`, `ink-raised`, `ink-inverse`, `ink-on-brand`), `line`/`line-strong`, `brand`, and `danger`. A component names the *surface* it is painting; the shell decides what that surface is worth. `bg-surface-raised` is correct on the cream public site, in the blue-grey console and in the warm-black portal without any of them knowing about the others.
- **`.admin-scope` was a bug, not a style.** It rewrote utility *classes* — `.admin-scope .text-black { color: var(--admin-text) }` — so `text-black` meant "light text" inside the console, and all 43 `bg-cream` panels in the admin rendered light-on-cream. Deleting the block is the fix; nothing lost a feature.
- Four palettes now exist, three of them named: the public site's cream (the `@theme` defaults), `.admin-shell`, `.portal-shell` (the studio's warm black, a branded experience rather than an internal tool), and `.invoice-paper`. The invoice needed its own block because a PDF has to look like the page it was printed from even when previewed inside the dark console.
- **A shell must re-point *every* token.** The test that asserts shell completeness caught `.invoice-paper` inheriting the console's `--color-surface`, `--color-ink` and `--color-danger`, which would have printed a dark invoice. Incomplete shells are now a failing test rather than a screenshot nobody looks at.
- The 436 dead `var(--x, #hex)` fallbacks are gone. Every one of those variables is declared, so the fallback could never apply — it was 436 hex literals pretending to be safety. The exception is the theme editor, where a field really can be empty and the fallback really can fire: `t.adminBg || '#0b0f17'` became `t.adminBg || 'var(--admin-bg)'` (the live value, so an unset field previews what the console is actually using), and each `ColorField`'s fallback now reads `DEFAULT_THEME_TOKENS.<field>` — which is what "normalise the three conflicting `--admin-card` fallbacks" meant: the literals in the editor were a *third* set of defaults, different from both `:root` and the presets.
- `--color-ink-raised` exists because the studio can retheme the text on a panel separately from the text on the page; all four shipped presets happen to set them equal, but 142 sites read the card-text variable, and collapsing the two would have been a settings field that silently stopped working.
- **Mapped, not mechanically renamed.** `bg-cream` was doing five jobs — page, panel, form field, inset well, and a decorative tint on a dark panel — so each of the 56 occurrences was classified by hand into `surface`, `surface-raised`, `surface-field`, `surface-sunken`, `bg-ink-inverse/…` or `bg-current/10`.
- **Deliberately not migrated:** the `white/*` utilities and the status palettes (`rose`/`emerald`/`amber`/`blue`, ~330 usages across alerts, badges, stat cards and config tables). Status tone is a separate axis — it is *data* a desk reads, not a decision a shell makes — and folding it into the surface vocabulary would have been a second, quietly different meaning for the same tokens. It is Phase 7 work. The one exception is `--color-danger`, for a destructive *action*, which has to be legible wherever the action appears.
- The settings contract stayed live: public background/text/card, admin background/text/card/card-text/border/primary/sidebar. Four settings were already inert *before* this phase (`adminAccent`, `adminSidebarText`, `primaryHover`, `publicSurface` — no CSS read them); they are still inert, recorded here so it is not mistaken for something the consolidation broke.

**6.3 — last-wins instead of `!important`**
- `cn()` is `twMerge(clsx(…))`, so a caller's class now beats the variant's by position rather than by force. The six surviving `hover:!border-gold`-style overrides were deleted with it: a `!important` in a codebase with a merge helper is a workaround for a problem that no longer exists.

**6.4 — the spacing footgun, defused**
- The rhythm is `--space-xs|sm|md|lg|xl`, deliberately *not* `--spacing-*`: Tailwind maps that namespace onto utilities, so `max-w-lg` would have resolved to 4rem and collapsed body copy into a one-word column. Value-only names cannot collide with a utility.

**6.5 — the primitives, and what Radix actually bought**
- `Modal` and `Drawer` are now Radix Dialog. Deleted: the hand-rolled Escape listener, the `body.style.overflow` scroll lock, the `querySelectorAll` Tab-cycling loop, the backdrop target check and the hand-written `role`/`aria-modal`/`aria-labelledby`. Radix supplies the focus trap, Escape, scroll lock, the ARIA wiring, and `aria-hidden` on the rest of the page. Focus *restore* stays ours, because Radix returns focus to a `Dialog.Trigger` and this controlled `open` prop has none.
- `Tabs` moved to Radix behind an unchanged API, which is where the roving-focus arrow keys came from — the old markup was a row of buttons that only Tab could reach. It renders no panels (call sites use it as a filter strip), so its `aria-controls` points at an id that does not exist; a real caveat, recorded rather than papered over, and one that disappears when the admin's tab strips get real panels.
- New primitives: `DropdownMenu`, `Tooltip`, `Popover` (Radix), `Command` (`cmdk`, for Phase 7's `⌘K`) and `DataTable`.
- **`DataTable` is hand-built, on purpose.** A desk shows tens of rows: `@tanstack/react-table` would add a dependency and a second table model for features at this size. Sorting (controlled or internal), selection with a select-all and an indeterminate header, a sticky header, empty and loading states. Sortable headers are real `<button>`s inside `<th aria-sort>` and selection uses native checkboxes, so the whole widget is operable from the keyboard.
- `Checkbox` and `Radio` stay native `<input>` elements. They are already keyboard-accessible and carry native form semantics; reimplementing them as styled Radix buttons would have been a downgrade dressed as a migration.
- **Portals escape the shell class**, which is a real trap: Radix renders into `document.body`, which sits outside the `.admin-shell` div, so a dialog opened in the console would have resolved `bg-surface-raised` against the light root values and come out white. `ui/PortalShell` re-applies the active shell class inside the portal as a `display: contents` wrapper — box-less, so the shell's own background cannot paint over the panel, only its custom properties are inherited. Phase 7's `CommandDialog` will need the same treatment.

**6.6 — the inline colour styles**
- **689 → 1**, and the one that remains is the portal's login backdrop, which carries `var(--color-espresso)` and not a value: the gradient now *references* the palette, which is the point of the exercise.
- This could not be a find-and-replace, because an inline colour was the old app's way of saying several different things. Three shapes needed a decision:
  - The row-action menus keep their geometry inline (`top`/`bottom`/`right`) — a position computed at runtime is not a design decision — and their `boxShadow` was *deleted* rather than translated, because `shadow-2xl` was already on the element and the inline shadow existed only to override it.
  - A colour that meant "the accent, tinted" became opacity on the accent (`bg-brand/12`, `border-brand/25`) rather than a second literal, so the tint moves when the studio moves the accent.
  - The status accents on the preview modals and the totals bars became the same Tailwind status utilities the rest of the app already used (`bg-emerald-500/[0.08]`, `border-emerald-500/30`), which keeps the deferred status axis in one place instead of two.
- Four decorative gold SVG patterns were the exception that proved the rule: they were inline `backgroundImage` data-URIs with the hex *inside the SVG markup*, where no theme could reach them. They are now mask utilities (`pattern-grid`, `pattern-cross`, `pattern-lattice`, `pattern-lattice-dot`) in `index.css` that paint `currentColor`, so the pattern follows `text-gold` like everything else.
- The theme editor is the other legitimate owner of an inline colour, and it does not put one in a style property: the preview transports the studio's chosen colours as custom properties and the classes name the surface (`bg-[var(--pv-card)]`). A colour the user is *choosing* is not a hard-coded colour.

**Found while consolidating** — each of these was already broken before this phase, and each was invisible until the tokens were made honest:
- The console chrome (sidebar and mobile header) sat *outside* `.admin-shell` — the class was on the page container — so `bg-surface-inverse`/`text-ink-inverse` on the sidebar resolved against the *public* palette. The class now sits on the layout root.
- Radix portals to `document.body`, outside every shell (see 6.5): `ui/PortalShell` exists for exactly this.
- The `<select>` chevron was a data-URI with a black stroke baked into the SVG, so it was invisible in the dark console. It is a real inline SVG now, inheriting `currentColor`.
- `animate-fade-in` was referenced by 30-odd panels and defined nowhere, so none of them animated; it is defined now.
- `.card-beam`, `.btn-modern` and the `shimmer` keyframes were declared and used by nothing.
- 436 `var(--x, #hex)` fallbacks could never fire, because every one of those variables is declared (see 6.2).
- Three theme *settings* were already inert before this phase (`adminAccent`, `adminSidebarText`, `primaryHover` — no CSS read them). They are still inert; wiring them is Phase 7 work, recorded so that the consolidation is not blamed for them.

**6.7 — motion from the stylesheet**
- `--duration-fast|base|slow`, `--ease-luxury` and `--ease-out-soft` live in `index.css`; `designTokens.ts` holds the same numbers where JavaScript needs them and the drift test keeps the two honest. The arbitrary-value form `ease-[var(--ease-luxury)]` is now the generated utility `ease-luxury`.
- Three hand-written classes went with the rewrite (`card-beam`, `btn-modern` and the `shimmer` keyframes): nothing referenced them in the old tree either, and unused CSS inside a design system is the same problem as an unused token.

---

## Phase 7 — Admin premium redesign

| # | Task | Status |
|---|------|--------|
| 7.1 | Lucide SVG icons replace all emoji | ✅ |
| 7.1 | Collapsible nav groups + `layoutId` spring | ✅ |
| 7.2 | `⌘K` command palette (cmdk) across all entities | ✅ |
| 7.3 | Motion language (row stagger, count-up, spring modals, tab indicators) | ✅ |
| 7.4 | **Order Kanban pipeline** (dnd-kit, optimistic + audit) | ✅ |
| 7.5 | Data table upgrade (sticky, bulk actions, virtualised, saved filters) | ✅ |
| 7.6 | Real dashboard (metrics, sparklines, needs-action queue) | ✅ |
| 7.7 | react-hook-form + zod; multi-step New Order wizard | ✅ |
| 7.8 | Sonner toasts, conflict alerts, error boundary | ✅ |
| 7.9 | AA+ contrast + keyboard audit | ✅ |
| 7.10 | Virtualisation + `React.memo` + per-desk chunks | ✅ |

**Gate:** INP <200ms; `⌘K` ≤3 keystrokes to any record; Kanban writes audit row; 100% keyboard; zero emoji nav; zero inline colour styles.

**7.1 — one vocabulary, and the gate that keeps it**
- **417 → 0.** `scripts/check-emoji.mjs` fails the build on a pictographic emoji, and on the dingbats this codebase used as icons (✕ ✓ ↑ ↓ ← → ↗ ⚠ ⌕), with a `// emoji-lint-disable-next-line` escape for genuine prose. It sits beside `check-tokens.mjs`, runs in CI, and its baseline is locked at 0.
- The vocabulary is one file (`components/icons/glyphs.ts`) behind one component (`<Icon>`), so "which glyph means orders?" has exactly one answer. A call site asks for `orders`, not for lucide's `ShoppingBag`: retheming the console's iconography becomes one edit, and two desks cannot pick two different metaphors for the same noun.
- lucide ships no logos, so the social channels use the official Simple Icons marks (CC0) in `components/icons/social.tsx`. A social channel is the one place a generic icon is the wrong answer, because a designer reads the mark, not the label beside it.
- A glyph is a font character: it renders differently on every platform, cannot take a stroke weight, cannot inherit `currentColor` cleanly, and carries no accessible name. The nav used twenty of them, and the row-menu triggers were emoji with *no label at all* — an icon-only button whose accessible name was "👁️".
- The nav is six named groups (Overview, Front desk, Atelier, Catalogue, Ledger, Console) rather than twenty flat links: a flat list is a list, a named map is a place you can learn. Groups collapse, and the open one is *derived* — the group holding the current page is always open whatever the stored state says, because hiding where you are is the one way a nav can lie. The active desk is marked by a framer-motion `layoutId` pill that springs between items.
- The mobile console had a horizontally scrolling strip of twenty links. It is a Drawer now, with the focus trap, Escape and scroll lock Radix gives for free.
- The console shell gained the two things the public shell already had: a skip link and a `#admin-main` target.

**7.2 — the palette**
- `⌘K` opens a cmdk palette that answers three questions in order: *where do I go* (the desks, filtered by what this user may actually open), *what do I make* (the four things a studio makes), and *where is that* (leads, orders and customers, searched as you type).
- "New order" is not a menu item that navigates to a page and hopes: the palette goes to `/admin/orders?new=1`, the desk sees the intent, opens the form it already owns, and drops the parameter again (`useCreateIntent`). The alternative — a shell-level "open the order modal" event bus — would give the shell a handle on every desk's internals.
- The record search is the only part that touches the network, so it is debounced (220ms), only runs once there is something to search for, and ignores a response that a newer query has already superseded.
- The palette is a Radix Dialog around cmdk inside a `PortalShell` — the same escape hatch `Modal` and `Drawer` use, because a portal to `document.body` would resolve the console's colours against the light root palette.
- `src/test/setup.ts` carries the two jsdom shims any Radix-plus-cmdk test needs (`ResizeObserver`, `scrollIntoView`); without them the palette cannot be rendered in a test at all.

**7.3 — the console's motion language**
- Three ideas and nothing else: a panel arrives with a little weight, a list arrives row by row, and a number counts up to its value.
- **The row stagger is CSS.** The delay is a `:nth-child` rule, not an inline style and not twenty motion components: a table of twenty rows animates with one stylesheet rule that runs on the compositor, so the INP budget of a desk is spent on the desk's data. The delays stop at the twelfth row — a long table should not take a second to finish arriving.
- **The count-up runs once, when the figure scrolls into view** (`components/motion/CountUp`), and never for anyone who has asked the system not to animate: `usePrefersReducedMotion` sets the value outright.
- **The tab strips were ten hand-written underlines.** Each drew its own `border-b-2`, so switching tabs looked like a page reload rather than a move. `ui/TabStrip` draws the indicator with a framer-motion `layoutId` that slides from one tab to the next, and every strip in the console uses it now: settings, finance, the order wizard, the measurement wizard, the staff wizard and the content forms.
- A dialog arrives with weight (`animate-spring-in`) instead of sliding in from nowhere.
- **The reduced-motion story is now complete.** The JavaScript half was already there (`usePrefersReducedMotion`); the CSS half was missing, so the stylesheet animations ran regardless of the preference. There is now a `prefers-reduced-motion` block in `index.css` that turns the entrance animations off.

**7.8 — toasts, conflicts, and the error boundary**
- **The toast renderer changed; the toast API did not.** The viewport is Sonner now — stacking, swipe-to-dismiss, a promise API, action buttons — but every call site still says `toast({ title, description, tone })`, because changing a toast library is not a reason to edit eighty files. The colours are the ones the old viewport used (`bg-black` with a gold title), which is deliberate: a toast sits on top of whatever shell is behind it, and `ink-inverse` on black reads in all three.
- `toast.promise(save(), { loading, success, error })` is new: a write that takes a moment says *saving* while it happens and *saved* when it does, in one call.
- **A failed write now reports itself.** `meta.surfaceErrors` was an opt-in that no call site ever set, so a mutation that failed and a form that forgot to catch it was a silent failure. Mutations report by default; a desk that has already said something opts out with `surfaceErrors: false`. The bridge's de-duplication window means a form's toast and the bridge's toast are one toast, not two.
- **A conflict is not a failure, it is a race.** A 409 (or an invalid order transition) gets its own message — "someone else changed this" — and a *Refresh* action that invalidates the cache, instead of "something went wrong", which sends the user looking for a fault that is not theirs.
- The error boundary now offers **Try again** as well as *Back to home*: a transient fault may not happen twice, and re-rendering in place is cheaper than losing the desk. The error's own text is there behind a *Technical detail* disclosure for whoever is going to look.

**7.4 — the production board**
- The board is the order desk's natural shape: a list answers "what is open", a board answers "what is stuck". It lives at `/admin/orders/board`, with a link from the desk.
- **The state machine decides what a drag means.** The board reads the same shared transition map the API enforces, so a card can only be dropped where the server would accept it — and a refusal is explained ("an order at Quality Finishing cannot go straight to Trial & Fitting") rather than silently ignored.
- **The move is optimistic and reversible.** The card lands in the new column immediately, because a board that lags behind the server feels broken, and the cache is rolled back if the write is refused.
- **Cancelling, pausing and reworking ask for a reason**, because the audit trail should say *why*, not just *that*. The reason travels with the transition and lands in the audit row the API writes.
- Every move is a status change, and every status change is written to the audit log by the API: dragging a card is a recorded act, not a visual trick.
- dnd-kit gives each card a transform while it is held, so the card follows the pointer without the board re-rendering on every move.

**7.6 — the real dashboard**
- A dashboard of totals answers *how is the studio doing*. It does not answer *what do I do next*, and that is the question someone opens the console with. The desk now has a **Needs attention** rail: overdue orders, fits waiting for approval, unanswered enquiries, outstanding balance — the queues where a person, not a machine, is the blocker.
- Only queues with something in them appear. Four zeroes are not a to-do list; an empty rail says the studio is clear, once.
- **The ordering is urgency, not size.** Sorting the rail by its numbers would compare two overdue orders with three fit approvals and ₹1,00,000 of balance as if they shared a unit. The priority is fixed and the rows say why they are in that order: a broken delivery promise, then work that cannot start, then a client waiting, then money owed.
- **`overdueOrders` is a server count.** The first cut filtered `actionOrders`, which is capped at five and sorted by delivery date — so the metric would have read "5" forever once a backlog existed. The summary endpoint now counts open orders (`not delivered`, `not cancelled`) whose `expectedDeliveryAt` has passed, and `on_hold` still counts because a paused order is still a promise. The backend test seeds overdue, upcoming, delivered, cancelled and paused orders and asserts the count is two.
- **`deliverablesDue` is not in the rail.** It counts every open order that has a delivery date, which is a plan, not a wait. The stat card keeps it as context ("N with delivery dates"); a queue that includes the whole workshop is not a queue.
- **Sparklines are drawn, not charted.** `ui/Sparkline` is thirty pixels of path in a 100×26 viewBox — a charting library would bring axes, a responsive container and a layout pass to render a decoration for a figure that is already on the page. The stroke uses `non-scaling-stroke`, so stretching the line to any card width does not thicken it, and it is `aria-hidden` because the number it decorates is right above it.
- The trend colour is read from the series (`utils/trend`), not supplied by each call site: up is emerald, down is rose, flat is brand. A 2% deadband keeps a flat month with a rupee of rounding from claiming a trend.
- **Only real time series get a sparkline.** Open leads and revenue have monthly series; Active Orders and Pending Fits are snapshots, and a by-status distribution is not a trend — an earlier cut drew one under Active Orders anyway, which would have been a lie drawn in a straight line. Those two cards keep their numbers and their subs.
- Numeric `StatCard` values now arrive through the 7.3 `CountUp` (once, in view, reduced-motion aware). String values — "₹1,23,456" — are printed exactly as given, because a currency string with its own formatting should not be re-parsed to be animated.
- The attention rail and the production queue share the right-hand column. Dropped in as a fourth child of a three-column grid, the queue wrapped onto an orphan row; the rail is one column, stacked, and the page keeps its 2 + 1 shape.
- The queue is a pure function (`pages/admin/dashboard/attentionQueue`) so it can be tested without rendering Recharts: the tests cover empty queues, dropped zeroes, priority order, the server-count rule and Indian money grouping. `Sparkline` and `StatCard` carry their own tests, and `src/test/setup.ts` gained the `IntersectionObserver` stub that `useInView` needs in jsdom.

**7.5 — the table stops being a list**
- `DataTable` had the plumbing (selection, sorting, empty/loading states) but no production call site. It now carries the four things a studio desk needs and the Orders desk is its first real user: a sticky header inside a capped scroll area, row virtualisation, a bulk-action bar, and saved filters.
- **Virtualisation is opt-in and thresholded.** Below forty rows the plain table is cheaper than measuring; above it, `@tanstack/react-virtual` renders a window and two spacer rows, which keeps the markup a real `<table>` rather than a grid of absolutely positioned divs.
- **Bulk actions are a prop, not a product decision.** The table offers a bar with the actions the desk supplies; Orders supplies the one action an order list actually needs — export the selected rows as CSV. Selection survives paging, and clears when the filter changes, because a selection you cannot see is a trap.
- **Saved filters are per desk, per browser.** `useSavedFilters` persists the query, status and priority under a versioned key, restores only keys the current desk knows, and treats corrupt storage as "no preference" rather than a broken page. The defaults object is captured once, so reset cannot drift.
- Pagination now windows its page numbers (ends + neighbourhood with gaps) instead of rendering one button per page.
- **The desk's old page bug is gone.** Order filters and the page number are one piece of state: changing a filter resets to page 1, and the table, the footer count and the pager all read the same response.

**7.7 — the form that knows what a valid order is**
- The New Order modal was three uncontrolled tabs plus a parent that validated by hand after the fact. It is now one `useForm` over one zod schema (`orderFormSchema`), with the schema as the definition of a valid order and the wizard as the order in which to ask.
- **The steps gate.** Continue runs `trigger()` on the fields that step owns; jumping ahead from the tab strip validates every step in between. The final Create can therefore never fail for something the user could have been told two screens earlier.
- **No new resolver dependency.** `lib/zodResolver` runs `safeParse`, then rebuilds zod's path arrays into the nested `errors` object RHF reads. It is twenty lines, tested for nested `lineItems[0].name` paths and first-message-wins, and it keeps zod and the form layer on one version.
- The schema enforces the rules the API would otherwise reject later: title length, an existing *or* new customer, a 10-digit phone, optional email shape, at least one named garment, whole-number quantities, advance ≤ quote, and delivery not before trial.
- The modal sits on `ui/Modal` now, so the wizard inherits the focus trap, Escape, scroll lock and focus restore that the hand-rolled overlay did not have. Numeric fields keep their string shape (`'50000'`) through the schema so the API payload conversion stays in one place.
- Schema, resolver and the three-step component each have tests; the component test walks the wizard, proves an invalid step cannot advance, and asserts the submitted values.

**7.9 — contrast is a token problem, not a page problem**
- **Text and fills are different colours now.** One accent cannot be both a button background and readable text: `#b59410` gives black text 7:1 on a button and 2.7:1 as a link on cream. Text and icons use `--color-brand-strong`; filled actions keep `--color-brand`. `ThemeContext` derives the text-safe variant from the studio's actual accent and page background with `utils/contrast` (`readableOn`), so a custom or dark theme cannot produce an invisible link.
- **Surfaces follow the theme.** `--color-surface` now resolves from `--public-bg` (default cream, matching the identity) and the line tokens are mixed from `--public-text`, which fixes the dark presets that previously painted cream sections and black hairlines on a near-black page.
- **Two presets failed AA on their own primary buttons.** Midnight Gold's white on `#b59410` and Royal Emerald's white on `#059669` were both below 4.5:1; both now use black, which passes with room.
- **Focus is its own token.** The global outline was gold in every shell, which is invisible on cream. `--color-focus` is the readable accent per shell (dark gold in public, gold in the console and portal), and the shared primitives' `ring-gold`/`ring-brand`/`border-gold` focus styles now use it.
- Muted text stops at a readable floor: every `text-ink/35–50` (and the inverse equivalents) became `/70`, placeholders moved from 40% to 60%, and the shared Table/Tabs/Dropdown/StatusBadge/CommandPalette labels follow. These were the systemic failures; page-level decorative alpha remains where it decorates rather than informs.
- **Keyboard:** `ConfirmDialog` is now a `Modal`, not a hand-rolled overlay — it gains a focus trap, Escape, initial focus and focus restore, and loses two fixed ids shared by every dialog on the page. The Modal's explicit `aria-describedby={undefined}` (which disabled Radix's automatic description wiring) is gone. `Table` sortable headers are buttons with `aria-sort`, not clickable `<th>`s. `RouterShell` moves focus to the new `main` after a client-side route change without stealing it on first paint.
- **The audit is executable.** `theme/__tests__/contrast.test.ts` merges every preset over the defaults and fails if body, card, sidebar, primary-button or derived-accent pairs drop below 4.5:1 (3:1 for the focus ring). The token gate remains at zero raw hex.

**7.10 — spend the render where the user is looking**
- `DashboardCharts` is a memoised subtree: a live notification or an expanded queue row re-renders the dashboard, but not four Recharts panels whose series have not changed. `ReportChart` is memoised for the same reason while the table search types, and the board's columns and cards are memoised so a drag repaints the hovered column rather than forty cards.
- Row virtualisation from 7.5 is the table half of the budget: a studio with thousands of orders keeps a constant DOM.
- **The shell stays while a desk loads.** `AdminLayout`, `MainLayout` and `PortalLayout` each own a `Suspense` boundary around their outlet, so a lazy page chunk shows the spinner inside the existing nav rather than replacing the whole frame. `RouterShell` keeps the outer boundary as the backstop for a layout chunk.
- **Vendor chunks are explicit.** Vite's rolldown output groups React, charts, motion, forms, dnd-kit and realtime libraries separately. The entry chunk fell from ~698 kB to ~134 kB; charts (399 kB) and realtime (41 kB) are only fetched by the desks that use them, and a dependency upgrade invalidates one vendor chunk instead of the entry.


---

## Phase 8 — Public site premium push

| # | Task | Status |
|---|------|--------|
| 8.1 | GSAP ScrollTrigger storytelling (timeline, collections, portfolio) | ✅ |
| 8.2 | Lenis smooth scroll (reduced-motion aware) | ✅ |
| 8.3 | Route transitions (`AnimatePresence` / view-transition API) | ✅ |
| 8.4 | Layered parallax hero + char-reveal + preloader | ✅ |
| 8.5 | Magnetic buttons, link sweeps, clip-path image reveals | ✅ |
| 8.6 | Rich media: video hero, lightbox shared-element, before/after inertia | ✅ |
| 8.7 | Scroll-velocity marquee + unified counters | ✅ |
| 8.8 | Public `/products` + `/products/:slug` from ProductType | ✅ |
| 8.9 | Prerender public routes; Product/LocalBusiness/FAQ structured data | ✅ |

**Gate:** Lighthouse Perf/SEO/A11y ≥95; LCP <1.8s; INP <200ms; CLS <0.05; 60fps mid-range Android. Build, type and unit gates are green; Lighthouse must be re-measured on a deployment with a live API and seeded catalogue (the local prerender path needs both).

**8.1 - GSAP, but only where the scroll is the story**
- `motion/gsap.ts` is the single registration point for `ScrollTrigger`; `hooks/useScrollReveal` scopes animations with `gsap.context()` and reverts them, so route changes and StrictMode cannot leave orphaned triggers.
- The process timeline now draws its connective line while the four stages arrive in sequence - one shared scroll position rather than four independent `whileInView` guesses. Collections and portfolio stories use the same primitive for their entrance cadence.
- Reduced motion returns the unanimated tree. Nothing is hidden first and then revealed by a hook that might not run.

**8.2 - Lenis is a public-site decision**
- `layout/SmoothScroll` mounts only inside `MainLayout`, so the admin console and customer portal keep direct, precise scrolling for tables, boards and forms.
- The wheel easing is disabled entirely under reduced motion. Dialogs, drawers and both lightboxes carry `data-lenis-prevent` (plus a `[role="dialog"]` fallback), so an open overlay owns its own scroll.
- `html.lenis` gets the small CSS reset Lenis requires; the native `scroll-behavior` is authoritative again the moment it unmounts.

**8.3 - route transitions without owning the outlet**
- Navigation links use React Router's `viewTransition` prop, which gives supporting browsers a native old/new snapshot without the router having to keep both routes mounted.
- A keyed `.route-enter` fade/rise is the fallback for every other browser. Both paths collapse under `prefers-reduced-motion`.

**8.4 - depth, type, and one short curtain**
- The hero photograph moves on a slower scroll transform than the copy, with a second gold-glow layer and a small pointer drift on fine pointers. The image is pre-scaled so parallax cannot expose an edge.
- `SplitText` animates characters but keeps the sentence as the heading's accessible name; it is decorative inside an already-labelled `<h1>`.
- `SitePreloader` is capped at 700ms, appears once per session, and is skipped for reduced motion. It covers font/theme settling without delaying first content.

**8.5 - small, deliberate interaction primitives**
- `Magnetic` is pointer-only and does not clone or re-wrap the action, so keyboard semantics stay unchanged.
- `ClipReveal` uncovers an image with `clip-path` instead of fading a card; it is used by portfolio tiles, product cards and the product banner.
- `.link-sweep` grows an underline from the start on nav/footer links, in the current text colour, so it follows a studio theme.

**8.6 - rich media that still has a fallback**
- The first hero slide has a 202 kB, six-second H.264 loop (`public/media/hero-atelier.mp4`) generated from the bridal still. The poster image remains the reduced-motion and failed-video fallback; the video is muted, looping, inline, metadata-preload and decorative.
- Collection, marquee and gallery lightboxes share an element with their thumbnail through the View Transitions API (`utils/viewTransition`); unsupported browsers simply open the overlay.
- The before/after comparison is a draggable divider with `dragMomentum`, keyboard arrows and a 0-100 accessible slider value. Reduced motion shows both photographs side by side.

**8.7 - the ribbon is attached to the page**
- The marquee reads scroll delta, briefly multiplies its `timeScale` (capped at 4x) and eases back after 160ms of quiet. It no longer runs on an unrelated 40-second clock.
- Home statistics and About achievements now use the shared `CountUp`; the two bespoke counter implementations are gone.

**8.8 - the workshop catalogue becomes a storefront**
- `GET /api/products` returns only active categories and products; `GET /api/products/:slug` resolves by canonical slug, computed slug, or workshop code. Neither route sits behind the admin router's blanket authentication.
- `ProductType.slug` is unique and sparse. New/renamed records derive a slug from the garment name (not the workshop code), and `npm run data:backfill-product-slugs` fills older documents. Public reads also backfill lazily, so deploying does not need a migration window.
- `/products` filters by category from the API; `/products/:slug` shows the piece, price range, process stages, FAQ, related pieces and consultation CTA. Both receive loaders that prefetch settings and catalogue data and are linked from the navbar, footer and sitemap.
- Public DTOs deliberately omit measurement-template codes and inactive records.

**8.9 - crawlable, even before hydration**
- `productJsonLd`, `faqJsonLd` and `itemListJsonLd` join the existing LocalBusiness/Service/Article helpers. Product pages emit Product + FAQ, the index emits ItemList, and the detail copy is the same copy rendered in the DOM.
- `frontend/scripts/prerender.mjs` runs the built SPA in Chromium against a local static server, proxies `/api`/`/uploads` to `PRERENDER_API_URL`, enumerates service/portfolio/blog/product slugs from the API, writes `dist/<route>/index.html`, and regenerates a route-complete `sitemap.xml`. It is best-effort: no API, no Chromium, or a sleeping API leaves the normal client-rendered build untouched and exits successfully.
- Enable it in deployment with `PRERENDER_API_URL=https://kadamba-api.onrender.com npm run build:prerender`. Static hosts must serve the generated directory indexes before the SPA rewrite.

**Verification:** frontend `tsc -b`, Vitest (218 tests), Vite build and backend `tsc --noEmit`, Vitest (116 tests) all pass; `check:tokens` and `check:emoji` remain at their zero baselines. The prerenderer was exercised against a mock API: it wrote all static routes plus a Product/FAQ detail page and regenerated `sitemap.xml`.

---

## Phase 9 - Product catalog & admin management

| # | Task | Status |
|---|------|--------|
| 9.1 | `measurementTemplateId` -> real ref; add gallery/variants/leadTime/tags/featured/seo | Done |
| 9.1 | Make Service <-> ProductType relationship explicit | Done |
| 9.2 | Master/detail editor + drag reorder + bulk ops + CSV import/export | Done |
| 9.2 | Live template preview; unlink-usage warning; "orders using" count | Done |
| 9.3 | Multi-image gallery + cover selection + alt text | Done |
| 9.4 | Public catalog + featured collections from `featured` flag | Done |
| 9.5 | Inventory seam (`sku`/`stockItem`) left open, not built | Done |

**Gate:** end-to-end product publish with zero deploys; reorder persists; unlink warns with usage; CSV validates row-by-row. Met in code and tests.

**9.1 - one canonical fit-card reference**
- `ProductType.measurementTemplateId` is now an ObjectId reference to `MeasurementTemplate`, not a copied template code. Admin writes still accept a legacy code (and CSV sends codes) but resolve it to the real reference before saving.
- Gallery, variants, lead time, tags, `featured`, nested SEO and the inventory seams `sku`/`stockItem` live on the product document. The console edits the marketing fields; inventory is deliberately not connected yet.
- `npm run data:backfill-product-template-refs` converts older code-valued records. The script uses the raw collection so Mongoose does not reject the legacy value during the migration window.

**9.1 - the service relationship is explicit**
- `Service.linkedProductTypeIds` remains the single stored Service -> ProductType relation. The product desk reads it through `GET /api/admin/products/product-types/:id/usage` rather than duplicating links on the product.
- Usage counts include order line items matched by both the product code and the linked template code, so renaming a product does not hide its order history.

**9.2 - the catalogue is edited as a master/detail desk**
- The left list supports drag reorder through `@dnd-kit`, multi-select bulk activate/draft/feature/unfeature/move-to-category, and a cover thumbnail. Reordering is disabled while a search or filter is active so dragging cannot silently reshuffle unseen products.
- The detail editor has Story & fit, Gallery, Variants and SEO tabs. A selected fit card previews its actual fields, and changing/unlinking a template used by orders opens a confirmation that explains existing orders keep their original fit card.
- `PATCH /api/admin/products/product-types/reorder` persists the ordered ids. `PATCH .../bulk` applies one status/feature/category change to a selection. Both are permission-gated with `catalog:write`.
- CSV import uses a real RFC 4180 parser (quoted commas, doubled quotes, newlines in descriptions) and sends row numbers to `POST .../import`. The server validates and saves each row independently, returning created/updated counts and per-row failures. Export is lossless for nested gallery/variants/SEO through JSON columns.

**9.3 - gallery and cover are separate decisions**
- `image` remains the explicit cover used by cards and social previews; `gallery` is the ordered detail-page set. Every gallery item carries an id, URL and alt text. Editors can upload, reorder, set a cover or remove an image without losing the legacy cover on first edit.

**9.4 - the storefront reads the same flag**
- The home Featured Collections section now prefers active products with `featured: true` and falls back to the curated static set while the public API is unavailable. Product cards link to their detail pages instead of opening a lightbox when a catalogue href exists.
- Product detail pages render the gallery, lead time, tags and active variants, and use product-level SEO fields for the document head and Product JSON-LD. Public DTOs still omit workshop-only fields such as template ids and SKUs.
- `GET /api/products?featured=true` filters the public catalogue without a separate collection document or deploy.

**9.5 - the inventory seam stays a seam**
- `sku` and `stockItem` are stored and validated but intentionally absent from the public DTO and the editor. This keeps the schema ready for Phase 13 without pretending stock movements exist now.

**Verification:** backend `npm run lint`, `npm run build`, `npx tsc --noEmit` and Vitest (120 tests) pass; frontend `npm run lint`, `npm run typecheck`, Vite production build and Vitest (227 tests) pass. `check:tokens`, `check:emoji` and `check:contract` remain at their zero/clean baselines.

---

## Phase 10 — Jobs, email, caching, cron (no Redis)

| # | Task | Status |
|---|------|--------|
| 10.1 | `EmailOutbox` + cron drain w/ exponential backoff | ✅ |
| 10.2 | Cron: follow-ups, trial/delivery reminders, orphan cleanup, nightly backup | ✅ |
| 10.3 | In-process job pool for images/exports/bulk | ✅ |
| 10.4 | `lru-cache` for settings/dashboard/CMS + invalidation on write | ✅ |
| 10.5 | `rate-limit-mongo` store + per-account login lockout | ✅ |

**Gate:** kill process mid-queue → all emails eventually send exactly once; cron de-dupes via lock; login counts survive redeploy.

**10.1 - email leaves the request path**
- `EmailOutbox` (`backend/src/models/EmailOutbox.ts`) is a durable queue in Mongo. A notification writes a row and returns; the request never touches SMTP.
- Every producer was moved onto the outbox: lead requests, contact form, order confirmation, measurement pending/approved, payment receipt, password reset. The `Settings → Send test email` button still sends inline on purpose — it is a connectivity probe, not a notification.
- The producers `await` their enqueue. A fire-and-forget enqueue would leave a window where a process killed right after the response loses the message, which is exactly what the gate forbids.
- `enqueueEmail()` takes an optional `dedupeKey` backed by a **unique sparse index**, so a retried request cannot create a second row. `request-admin`, `request-customer`, `measurement-*`, `payment-receipt` and `order-confirmed-*` are all keyed by the entity they describe.
- The drainer (`services/emailOutboxService.ts`) claims rows with `findOneAndUpdate` — `status: 'sending'` plus a lease token — so two workers can never send the same row. A row whose lease expired (a `kill -9` between the claim and the result) is reclaimed after `EMAIL_OUTBOX_LEASE_MS`.
- Failures retry with exponential backoff and jitter (`60s → 30m`, capped) up to `EMAIL_OUTBOX_MAX_ATTEMPTS`, then the row is marked `failed` and kept for `EMAIL_OUTBOX_RETENTION_DAYS` as an audit trail.
- Each send carries a stable `Message-ID` (`<outbox-<id>@kadamba.local>`). SMTP has no cross-process idempotency key, so delivery is at-least-once by nature; the Message-ID lets a receiving system collapse a retry that followed a crash, and the dedupe key means the application never creates the duplicate in the first place.

**10.2 - the scheduler and its jobs**
- `services/cronService.ts` is a plain timer in the API process. There is no external cron service and no Redis.
- `services/cronLockService.ts` provides the lease. The unique index on `CronLock.name` is what makes it race-free: the loser of an `upsert` race gets a duplicate-key error and reads it as "someone else holds the lock". A crashed holder's lease simply expires.
- Every job body runs under `runWithCronLock`, so two instances (or an overlapping deploy) execute each job once per window. `isJobDue()` gives interval jobs a plain period and the daily jobs a wall-clock time.
- Jobs: `email-outbox` (every 30s), `lead-followups` (15m), `order-reminders` (1h), `orphan-cleanup` (03:00), `nightly-backup` (02:00). Daily jobs run once per calendar day, not once per process start.
- `lead-followups` reminds the studio about an open lead with a pending follow-up in the past, keyed per lead+follow-up+day.
- `order-reminders` emails the customer about an upcoming fitting trial or delivery, keyed per order+milestone+date.
- `orphan-cleanup` prunes expired refresh tokens, portal messages whose customer or order no longer exists, and media rows whose original file is gone. It **never** deletes a file from `uploads/` — existing originals are canonical and are never removed.
- `nightly-backup` writes a gzipped newline-delimited JSON archive of the working collections to `BACKUP_DIR` and prunes archives older than `BACKUP_RETENTION_DAYS`. `npm run data:backup` runs the same code on demand.
- `GET /api/health` now reports the outbox depth, the scheduler state, the job-pool stats and the cache size.

**10.3 - bounded in-process work**
- `services/jobPool.ts` is a bounded queue with three pools: `images` (2), `exports` (2), `bulk` (1). A full backlog rejects with 503 rather than growing without bound.
- Image encoding (`registerUploadedFile`, `regenerateVariants`), CSV/report exports (leads, reports) and catalogue bulk operations (reorder, bulk update, CSV import) now run through a pool, so one large upload cannot starve the event loop.
- The pool is request-scoped, not durable — losing the process loses the request too. Durable work (email) lives in the outbox.

**10.4 - LRU cache**
- `services/cacheService.ts` wraps `lru-cache` (1000 entries, 60s default TTL). Values are cloned in and out, because the dashboard controller redacts finance fields for staff users and a shared object would leak that redaction into the next admin request.
- Cached: public/admin settings, the resolved SMTP config, the dashboard summary, and the CMS list/detail reads (blog, portfolio, services, gallery, public catalogue and public product).
- Invalidation is a **Mongoose plugin** (`models/cacheInvalidation.ts`) applied to the schemas at compile time, mapping each model to the cache namespace it feeds. Doing it as a plugin rather than as a call in every service is the difference between "the cache is invalidated on write" and "on the writes somebody remembered to touch" — and it was the only way to make it work on Mongoose 9, which ignores `post` middleware registered after a model is compiled.
- Settings writes additionally invalidate explicitly, so the service is correct even outside the model layer.

**10.5 - durable rate limiting and lockout**
- `services/rateLimitMongoStore.ts` is a Mongo-backed `express-rate-limit` store. It replaces the default MemoryStore, whose counters vanish on every deploy and hand an attacker a fresh budget.
- The counters are written with a single atomic aggregation pipeline, so two instances cannot lose an increment to a read-then-write race, and each limiter has its own prefix so the global, auth, write, reset and per-account budgets stay separate.
- The per-account login throttle is keyed on the submitted email and survives a redeploy, because the counter lives in Mongo.
- The per-account **lockout** now increments with a single atomic `$inc` and locks with a targeted `$set`, instead of a read-modify-write on a whole document. A successful sign-in clears the counter with a targeted `$set`/`$unset` so it cannot clobber a concurrent failed attempt.
- **Deviation from the plan wording:** the plan said "`rate-limit-mongo` store". That package (v2.3.2) depends on `mongodb@3` and implements the pre-v7 callback `Store` interface, which `express-rate-limit` v8 no longer accepts; installing it would have added a second, six-year-old driver to the tree. The store here is written against the v8 `Store` interface and keeps the same behaviour the plan asked for: Mongo-backed counters that survive a redeploy.

**Verification:** backend `npm run lint`, `npx tsc --noEmit`, `npm run build` and Vitest (200 tests) pass — 80 new tests across `emailOutbox`, `cron`, `cache`, `jobPool`, `rateLimit`, `backup`, `phase10Gate` and `outboxIntegration`. `check:contract` stays in sync. The gate is covered directly: `phase10Gate.test.ts` simulates a mid-queue kill (three of ten emails sent, then the process dies) and asserts that the restart delivers the remaining seven with no duplicate, that a row claimed but never completed is reclaimed once its lease expires, and that a cron job runs once when two instances race for the lock. `rateLimit.test.ts` asserts the failed-login count is still in Mongo after a "restart" and that two more failures reach the lockout threshold. Frontend is untouched by this phase; its `npm run lint`, `npm run typecheck`, Vite production build and Vitest (227 tests) still pass.

---

## Phase 11 — Testing

| # | Task | Status |
|---|------|--------|
| 11.1 | Backend coverage ≥80% (uploads, leads, CMS, measurements, settings, transactions) | ✅ |
| 11.2 | Frontend unit tests (Vitest + Testing Library) — currently 0 | ✅ |
| 11.3 | Contract tests (shared schema round-trip) | ✅ |
| 11.4 | E2E: admin journey, portal journey, product publish, Kanban, auth matrix | ✅ |
| 11.5 | CI gates: coverage, bundle budget, Lighthouse CI, axe, visual regression | ✅ |

**11.1 - the backend suite grew from 120 to 200 tests, and now has a floor**
- Coverage is measured with the v8 provider and gated in `backend/vitest.config.ts`: lines, statements and functions at 80%, branches at 65%. The branch number is lower because a large share of the branches are defensive guards — a `catch` that returns a default, a `??` on a nullable field — and a gate that counted them would be a gate on how many `catch` blocks the code has, not on how well it is tested.
- The new tests cover the surfaces that had none: `measurements`, `settings`, `leads`, `transactions`, `uploads`, `cms`, `reportCoverage`, `orderLifecycle`, `portalSurfaces`, `authSurfaces`, `realtime`, `sharedRoundTrip`.
- The measured result is **86.14% lines / 83.03% statements / 89.55% functions / 65.19% branches** — up from a 69.65% baseline.

**11.2 - the frontend suite, and the two things that were quietly broken**
- The frontend now has 248 Vitest tests. Coverage is configured the same way, but as a **ratchet**: the thresholds are the numbers the suite actually reaches (lines 10, statements 10, functions 7, branches 8). The admin pages are large declarative shells driven by Playwright rather than unit tests, so a "80%" gate there would be a gate on how the pages are written, not on whether they work.
- Two defects were hiding behind the missing coverage. The suite does not run with `globals: true`, so Testing Library's automatic cleanup never registered and one test's rendered tree stayed in the next test's document — every later test was querying an ambiguous element. And `Input` and `Textarea` fell back to `props.name` for the field id, so a field with neither an `id` nor a `name` had a `<label>` with no `for`: an unlabelled control. Both are fixed, and `@testing-library/jest-dom` and `user-event` are now dev dependencies so the assertions can be about behaviour rather than about markup.

**11.3 - the contract, proved on both sides**
- `backend/src/__tests__/sharedRoundTrip.test.ts` takes every response and write schema in `shared/schemas.ts`, parses it, puts the result through `JSON.stringify`/`JSON.parse` (which is what actually happens over the wire), and parses it again. The frontend's copy of the contract is then held to the same payloads, and the two files are asserted byte-identical.
- This is the test that would have caught a schema edited on one side only — the failure mode the shared folder exists to prevent.

**11.4 - the journeys, in a browser**
- The suite drives a scriptable API mock (`frontend/e2e/helpers/api.ts`) rather than a live backend. The mock tracks whether a session is signed in, so a reload exchanges the "refresh cookie" the way the real client does.
- Five spec files: the auth matrix (8 cases), the admin journey (5), the portal journey (6), product publish (3) and the order board (4).
- The Playwright projects are scoped: `desktop-chromium` runs everything; `mobile-safari` runs `public.spec.ts` only. The console and the portal are desktop tools, and running the same journeys through an emulated iPhone produced pure flake. Workers are 3 locally and 2 in CI — a desk of twenty orders is a heavy page, and eight at once starved the assertions into timeouts.

**11.5 - the gates that run on every push**
- **Coverage** — both suites run with `--coverage` and fail the build when a threshold is missed.
- **Bundle budget** — `frontend/scripts/check-bundle-budget.mjs` measures the gzipped JavaScript in `dist/assets` and fails over the entry chunk, the total, or the largest chunk. The current build sits at 43.6 kB for the entry chunk and 777 kB for the whole tree.
- **Lighthouse CI** — `frontend/lighthouserc.cjs` asserts performance, accessibility, best practices and SEO against the public pages, with three runs each.
- **axe** — `frontend/e2e/accessibility.spec.ts` scans the home page, products, contact, the console sign-in, the console itself and the customer portal against WCAG 2.1 A/AA. It found real defects, which are fixed: the console sign-in page was cream-on-cream after the palette change, a "secondary" button was a white card with cream text on a dark section, and the brand gold was 1.8:1 as text on paper. Gold is now surface-aware — `.on-dark` re-points the token, so `text-gold` reads on both.
- **Visual regression** — `frontend/e2e/visual.spec.ts` keeps baselines for the home page, the services band and the console sign-in. A platform without a baseline skips rather than fails; the first run on a new platform writes the image, which is then reviewed and committed like any other change.

**Verification:** backend `npm run lint`, `npx tsc --noEmit`, `npm run build` and Vitest (200 tests) pass, at 86.14% line coverage. Frontend `npm run lint`, `npm run typecheck`, Vite production build and Vitest (248 tests) pass, and Playwright runs 44 browser journeys (44 passed, 1 skipped) plus the axe scan and the visual baselines. `check:contract`, `check:tokens` and `check:emoji` remain at their zero/clean baselines.

---

## Phase 11A — The studio refresh

Unplanned work, requested after the phase plan was written: the console read as a different product from the public site, the type was three fonts, and every dropdown drew its own operating-system widget.

| # | Task | Status |
|---|------|--------|
| 11A.1 | One light scheme across the site and the console; gold actions | ✅ |
| 11A.2 | One type family (Syne) across site, console and portal | ✅ |
| 11A.3 | Navigation rail: its own tokens, its own contrast, its own active state | ✅ |
| 11A.4 | Modern compact tables (ledger rhythm, tabular figures, sticky header) | ✅ |
| 11A.5 | Custom accessible `Select` — no native `<select>` anywhere | ✅ |
| 11A.6 | Custom accessible `DateField` / `DateTimeField` — no native date picker anywhere | ✅ |
| 11A.7 | Home page: fifteen sections, each with a scroll-driven entrance | ✅ |
| 11A.8 | Accessibility gate (axe) over the public site, the console and the portal | ✅ |
| 11A.9 | Invoice redesign — a document, not a screen | ✅ |
| 11A.10 | A shared row menu, so every desk offers the same actions | ✅ |
| 11A.11 | Sitemap and robots generated from the live catalogue | ✅ |
| 11A.12 | The journal: sixty articles, Kurnool first | ✅ |
| 11A.13 | Kurnool locality pages, FAQ schema, a journal index by cluster | ✅ |
| 11A.14 | Product and service pages: the same scroll treatment as the home page | ✅ |

**11A.1 - one light scheme, and a deliberate exception**
- The public ground moves from cream to warm paper and the console from blue-black to paper. The two now differ by accent and density rather than by being different products — which was the complaint.
- Gold is the action colour. A filled button is gold with dark ink on it, the only pairing that stays legible on a light surface.
- The rail gets its own tokens (`--color-sidebar`, `--color-sidebar-ink`) rather than borrowing "inverse", so the studio's sidebar colour setting still means something *and* a dark card still means the brand's dark.
- **The portal stays dark, on purpose.** It is a branded space for a customer rather than a desk an operator sits at, it is read on a phone, and every portal page is written against that shell. Half-migrating it would have produced a light page with unreadable cream text; keeping it dark and saying so is the honest version of "complete light".

**11A.2 - one type**
- Syne for the whole product. The previous mix — Playfair Display for headings, Manrope for the body, Manrope again for the console — is what made the three shells look like three products.

**11A.5/11A.6 - the controls, and the 106 native widgets they replaced**
- `Select` is the ARIA listbox pattern: a button trigger with `aria-haspopup="listbox"`, a `role="listbox"` list, `aria-activedescendant` for the active option, arrow keys, Home/End, type-ahead, Escape. It is not a native select, because a native select's option list is drawn by the operating system — it ignores the theme, the design system and the font, and on a long list it offers no search.
- `DateField` is a calendar with the same keyboard grammar (arrows by day and week, Page Up/Down by month, Home/End, Enter, Escape). `DateTimeField` pairs it with a list of studio hours, which is how the last `datetime-local` input went away.
- 89 native `<select>` elements, 16 native date inputs and one `datetime-local` were migrated. The custom controls take a **value**, not an event — the native contract belongs to the browser, not to the product.

**11A.7 - fifteen sections**
- The home page now reads: hero, services, featured collections, marquee, testimonials, why choose us, how the portal works, process, statistics, **the atelier**, **the cloth**, **Kurnool**, journal, **enquiry**, closing call to action. The four new ones carry real content — the disciplines, the fabric vocabulary, why Kurnool, and a short enquiry form that posts a lead.
- The new `useParallax` hook is the scroll-driven drift the atelier and locality sections use, and it is skipped entirely when the visitor has asked for reduced motion.

**11A.9 - the invoice as a document**
- The masthead is the studio: the name in the display face with a gold rule under it, the invoice number opposite, and the three figures that matter — quoted, paid, balance — as a strip across the top, before anything else.
- A payment bar says how far along the payment is, which is the question a client actually has.
- The print rules live in `index.css`: A4 margins, a repeating table header, and a rule that keeps a row from splitting across a page. The invoice keeps its own paper palette in every shell, because a PDF has to look like the page it was printed from.

**11A.10 - one row menu**
- Every desk offered the same actions — view, edit, publish, copy, delete — and every desk wrote its own dropdown: eleven copies, each with its own labels, its own icons, and a raw `⋮` glyph for the trigger that no icon system could restyle.
- `RowActionsMenu` is the one version: a labelled button that opens a real menu (`role="menu"`, arrow keys, Escape, focus returned to the trigger), anchored to the viewport because a table scrolls horizontally and a menu inside one is clipped by it. All eleven desks use it: gallery, blogs, portfolio and services, plus customers, finance expenses, invoices, payments, leads, measurements and staff.
- `RowAction` gained `hidden?: (row) => boolean`, so an action that has no meaning for a row — a payment reminder on a settled invoice, a WhatsApp receipt with no number, an approve action on a finished fit — is absent rather than disabled. The menu counts only the visible actions when deciding whether to open upwards.
- The migration removed each desk's anchor state, click-outside effect, positioning handler and floating panel with the trigger. Navigation actions use `useNavigate` inside `onSelect`, because the menu's contract is actions rather than links.
- The trigger now names its row (`Actions for …`). The blog table had been passing the literal string `Actions for item.title`; that was fixed in the same pass.

**11A.11 - the sitemap is written, not hand-kept**
- `frontend/scripts/generate-sitemap.mjs` reads the live catalogue — the products, the articles, the services — and adds them to the static routes, and writes `robots.txt` with it. A sitemap written by hand is wrong within a week: a product is published, an article is posted, and neither is in the file.
- It runs as part of the build, and it degrades to the static routes when no API is reachable, so a build never fails for want of a sitemap.

**11A.12 - sixty articles, Kurnool first**
- The journal is the studio's long tail: it is how a woman who is not ready to buy still finds the studio, and how a woman in Vijayawada decides to make the trip to Kurnool. Eight articles were already seeded; fifty-two more were written, across bridal, traditional wear, tailoring and studio notes.
- Every article answers a question the studio is actually asked, in the words of the person who asks it — what to wear to a wedding in April, how many trials a lehenga needs, what a good fitting room should look like, how to store a zardozi border. The setting is Kurnool and the district: the heat, the Telugu festivals, the handlooms, the fabrics.
- An article that only exists to carry a keyword is an article a reader leaves and a search engine learns to ignore, so the rule was that the article has to be worth reading on its own.

**11A.14 - the product and service pages**
- A product page now carries eight sections: the banner, the notes, **the making** (cloth, pattern, hand, fitting), the gallery, **looking after it** (store it folded, keep it out of the sun, wash it the day after, bring it back), the questions, the related pieces and the closing call to action. The two new ones are the parts a shop front cannot tell.
- A service page now carries eight as well, and the questions are per service — twenty questions across the four services, written as the questions the studio is actually asked. They are also the `FAQPage` schema for the page, so the same text is both readable and marked up.
- Every new section reveals on scroll through the same `useScrollReveal` grammar the home page uses, and every one of them is skipped when the visitor has asked for reduced motion.

**Verification:** frontend `npm run lint`, `npm run typecheck`, Vite production build and Vitest (248 tests) pass; Playwright runs 44 journeys (44 passed, 1 skipped), the axe scan over six surfaces and three visual baselines. The bundle budget passes at 43.6 kB for the entry chunk and 777 kB for the tree. Backend `npm run lint`, `npx tsc --noEmit`, `npm run build` and Vitest (403 tests) pass at 86.06% lines, 82.94% statements, 89.45% functions and 65.16% branches, with the journal and the new theme defaults in the seed.

---

## Phase 11B — The public house

11A finished the console and the portal. The public site is the part a client meets first, and it was still the older page: a banner that did not move, a home page that stopped after fifteen sections, and interior pages whose headers belonged to a previous design. This phase rebuilt every public surface a client can reach, and audited the console for the two things the brief kept returning to — no native form widgets, and no image fields that ask for a URL instead of a file.

| # | Task | Status |
|---|------|--------|
| 11B.1 | The home page: eighteen sections, local to global | ✅ |
| 11B.2 | One public type system and one width/gutter scale | ✅ |
| 11B.3 | Every interior page rebuilt on `PageHero` and `SectionHead` | ✅ |
| 11B.4 | The catalogue: URL-synced filters, three-up plates, honest meta | ✅ |
| 11B.5 | Placeholder plates and demo-media normalisation | ✅ |
| 11B.6 | Controls and media audit: no native widgets, no image URLs | ✅ |
| 11B.7 | API connection audit across public and console | ✅ |
| 11B.8 | Finish the shared row menu on the remaining seven desks | ✅ (11A.10) |
| 11B.9 | Kurnool locality pages and the journal by cluster | ✅ (11A.13) |

**11B.1 — eighteen sections, and an arc rather than a list**
- The home page runs: banner, manifesto, services, collections, marquee, atelier, bridal, making, gallery rail, reach, record, principles, cloth, journal, Kurnool, questions, enquiry, closing band. The order is fixed and documented at the top of `HomePage.tsx`, because a story with the locality section before the atelier is a different story.
- The arc is local to global: the studio's room in Kurnool, the hands and the cloth, the record, and only then the five countries the work has travelled to. Nothing claims a scale the studio cannot show.
- `HeroBanner` slides and animates between slides; `PageHero` is the quieter interior version. Both read the same `useCarousel` clock, so there is one timer in the product and not one per section.
- Every entrance is `Reveal`, `ClipReveal` or a scroll transform, and every one is skipped under `prefers-reduced-motion`.

**11B.2 — one public type system, one width**
- Cormorant Garamond is the display and heading face, Syne the body, console and portal face. The public shell re-points `--font-heading` rather than adding a second token, so a component written for the console renders in the right face on the site without knowing which shell it is in.
- `--shell-max: 84rem` and `--gutter: clamp(1.25rem, 4vw, 2.5rem)` live on `.public-shell`; the `:root` fallbacks stay at 72rem/1rem so the console stays compact. Navbar, Footer, `PageHero` and `Container` all use `house-container`, which is why the banner text, the section heads and the footer columns finally share an edge.

**11B.3 — the interior pages**
- About, Services, Collections, Gallery, Portfolio, Blogs, Contact and Consultation all open on `PageHero` and close on `CtaBand` (Contact deliberately does not — it already is the call to action). The old per-page hero and CTA section files were deleted and the barrels updated, so there is one banner pattern rather than eight.
- Filter rows are underlined type (`FilterRow`), not pills: a row of six pills above a catalogue reads as a dashboard, and this is a shop front.
- About lost its count-up animation. A number that animates from zero reads as marketing; the same number sitting still reads as a record. The team plates are captioned "Cloth study" with honest alts because they are placeholder art, not portraits.

**11B.4 — the catalogue**
- Collection cards link to `/products?category=CODE`; `ProductsPage` reads the param through `useSearchParams` and falls back to All when the code is unknown, so a shared link cannot produce an empty grid.
- The grid is three-up at desktop with price and lead-time meta. The per-card `ClipReveal` was removed: on the first column of each row it could stay at `inset(0 0 100%)` after scrolling, leaving an invisible card. A plain wrapper is the honest fix; the section still reveals as a whole.
- One seeded category is genuinely named `TEST`. It is left visible rather than hidden in code — it is data, and the fix is to rename it in the console.

**11B.5 — plates, not stock photography**
- The placeholder art is generated (`backend/src/scripts/generatePlaceholders.ts`): seventeen atelier plates plus `og-default.jpg`, about 1 MB total, in ivory, parchment, sand, oxblood, espresso, charcoal, gold, rose and olive, using drape, loom, arch, bolt, field and veil motifs. They are deliberately abstract — a stock photograph of a different studio's work would be a lie about whose work it is.
- `normaliseDemoMedia.ts` rewrote the seeded `/uploads/*` references that had no file behind them to branded plates, so the seeded site has no broken images. It is a one-off, recorded here rather than hidden in a component.

**11B.6 — controls and media**
- The audit found one native `<select>` left (the salary month) and no native date inputs. The month is now the shared `Select`; every other desk already used `Select`, `DateField` or `DateTimeField`.
- Every image field now takes a file. The per-record SEO drawer's OG and Twitter fields and the product gallery's replacement field were text inputs labelled "URL"; both are `MediaUpload` now, with hints for the intended crop. Blogs, gallery, portfolio, services, product gallery, settings logo and the measurement directives were already uploads.
- No page asks an operator to paste a URL to make an image appear.

**11B.7 — the API audit**
- Public: `/api/health`, `/api/settings/public`, `/api/products`, `/api/services`, `/api/blogs`, `/api/gallery` and `/api/portfolio` all return `200` with `success: true`.
- Console: sign-in, `/admin/dashboard/summary`, `/badges`, `/customers`, `/orders`, `/leads`, `/admin/products/categories`, `/admin/products/product-types`, `/admin/staff`, `/admin/finance/{summary,payments,invoices,expenses,salaries}`, `/admin/settings`, `/admin/media`, `/admin/users` and `/admin/reports/orders-by-status` all return `200`.
- The 404s seen during the audit were guessed paths (`/admin/products`, `/admin/reports/summary`); the console calls `/admin/products/categories`, `/admin/products/product-types` and named report slugs, and those are the ones above.
- Home collections, the journal, the gallery rail, the enquiry form and the FAQ band all read live data. The editorial copy of the home page (the manifesto, the principles, the reach list) lives in `content.ts`, not the CMS; that is a content-model gap, not a wiring gap, and is recorded as such.

**11B.8 — the last seven row menus**
- Customers, finance expenses, invoices, payments, leads, measurements and staff were the desks still carrying a hand-written dropdown. Each was migrated by locating its trigger and its floating panel, deleting the panel with the state and effect that existed only to position it, and writing the same actions into `RowActionsMenu`.
- Conditional actions became `hidden` predicates: a reminder on an unpaid invoice, a receipt on a payment that has a phone number, an approve action on a pending fit, a WhatsApp action on a staff member with a number, and the archive label that changes with the row's status. The visible count feeds the height calculation, so a two-action menu near the bottom of the viewport still opens upwards.
- The actions were checked desk by desk before the old panel was removed: preview, profile and measurements, WhatsApp, print, record payment, lead dossier, status change, duplicate, archive, deactivate and reactivate. No action was dropped.
- The trigger's accessible name now includes the row; the blog desk had been rendering the literal string `Actions for item.title`.

**11B.9 — Kurnool & the district, and the journal by cluster**
- `/kurnool` is an index, and `/kurnool/:slug` gives five locality pages: Kurnool City, Adoni, Nandyal, Yemmiganur and Dhone. They are not branch pages. Every one says that the studio is in Kurnool city and the garment is cut there; what changes is the journey — how many visits a commission takes, what to bring, and whether the date is realistic before someone travels.
- Each locality page carries its practical note, the studio address and hours from Settings, the services that make sense from there, and its own question list. That list is also the page's `FAQPage` markup through `faqJsonLd`, so the accordion and the search result cannot drift apart.
- The journal gained a second index at `/blogs/cluster/:cluster`: Bridal, Traditional, Tailoring, Kurnool, Fabric & care and Wedding season. A cluster cuts across the four categories because a reader arrives with a question ("a Kurnool summer wedding"), not with the studio's taxonomy. `BlogClustersSection` puts the counts and links on `/blogs`.
- The sitemap script now writes the locality and cluster routes, and the footer and the home page's reach section link to `/kurnool`.

**Verification:** frontend `npm run lint`, `npm run typecheck` and the production build pass; Vitest passes 258 tests (the ten new ones cover locality data integrity and cluster matching) and backend Vitest passes 403. Manual pass over `/`, `/about`, `/services`, `/collections`, `/products`, `/gallery`, `/portfolio`, `/blogs`, `/contact` and `/consultation` at desktop and mobile widths, plus `/products?category=BRIDAL` for the deep link. The new routes were checked at 1440px: `/kurnool`, `/kurnool/adoni`, `/blogs` and `/blogs/cluster/kurnool` render with live data, the locality page emits one `FAQPage` block, `/blogs` exposes six cluster links, and the generated sitemap contains 25 static URLs.

**Open, recorded honestly**
- The home page's editorial copy is code, not CMS. Moving it into `SiteSettings` would make it editable without a deploy and is the next content-model step.
- The Phase 8 Lighthouse gate still needs a deployed build with a live API and a seeded catalogue; it cannot be measured honestly against a dev server.

---


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
