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
