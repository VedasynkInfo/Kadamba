# Module 18 — Engagement, Sync & Owner Polish (Packed Chat)

## Purpose

One **token-efficient** implementation chat that makes Kadamba more helpful for **owners** and more **engaging / connected** for **website visitors** and **portal customers** — without starting a full rebuild or P3 roadmap items.

## Brand

**Kadamba's Designer Studio** · Kurnool · women's boutique & custom tailoring (bridal, maggam, designer blouses).

## Already done (do NOT rebuild)

- Leads ↔ Orders sync on request (enquiry order + order #)
- Proper invoice document (admin + portal) + print
- Admin Payments month filter; Invoices list
- Measurement pending-approval tab + searchable customer
- Customer portal: orders, measurements, chat, payments, requests
- Socket.IO chat only (`portalSocket.ts` — `portal:chat` / `portal:watch`)

## Objectives (this pack only)

| Audience | Goal |
|----------|------|
| **Owner (admin)** | See money + pipeline at a glance; act fast (WhatsApp, confirm, approve); **live notification sync** |
| **Portal user** | Feel connected: status clarity, trial countdown, unread chat, invoice access, **realtime updates** |
| **Website visitor** | Clear path: enquire → trust → WhatsApp / request / activate portal |

## Features (ship in ONE chat)

### A. Notifications essentials (Module 16 slim) + email

1. Email (or log if SMTP unset) when:
   - Public/portal request creates lead+order
   - Order status → `confirmed` (harden Reference ID + activate link)
   - Measurement submitted (`pending_approval`) → notify admin
   - Measurement approved → notify customer
   - Payment recorded → notify customer (optional short receipt)
2. Reuse existing email helper; no SMS/WhatsApp Business API — deep-link stubs only

### A2. WebSocket live notification sync (admin + portal) ← REQUIRED

Extend existing Socket.IO (`backend/src/realtime/portalSocket.ts`) — **do not** add a second realtime stack.

**Rooms**
- Customer: `customer:{customerId}` (already used for chat)
- Admin desk: `admin:notifications` (all admin/staff sockets join on connect)
- Optional: keep `admin:portal` / `portal:watch` for chat

**Events (payload: small JSON only)**

| Event | Emit when | Recipients |
|-------|-----------|------------|
| `notify:lead` | New request/lead + enquiry order created | `admin:notifications` |
| `notify:order` | Order status / payment summary change | admin + owning customer room |
| `notify:measurement` | Profile submitted / approved / status change | admin + owning customer |
| `notify:payment` | Payment recorded | admin + owning customer |
| `notify:chat` | Already exists as `portal:chat` — keep; also bump unread badge | both sides |
| `notify:badge` | Optional aggregate `{ leads, measurements, chat }` | admin and/or customer |

**Client UX**
- **Admin:** toast + optional bell/dropdown feed; refresh badges; soft-refresh open list pages (leads/orders/measurements) when matching event arrives
- **Portal:** toast + dashboard/nav badge refresh; soft-refresh orders/measurements/payments when event matches current customer
- Auth: reuse JWT on socket handshake (same as chat)
- Graceful: if socket down, pages still work via HTTP; reconnect silently

**Out of WS scope:** full document push, binary files, public website sockets

### B. Settings → public website sync (Module 14 slim)

1. Expand settings fields used by footer/contact if missing
2. Public contact block / footer / request page phone+address **read from settings API** (settings win over hardcoded)
3. Keep `data.ts` brand prose; contact/address/logo from settings

### C. Admin owner helpers

1. Dashboard: replace any “Finance module required” placeholders with **live** revenue MTD, pending balances, open enquiries, pending measurement approvals (wire existing APIs)
2. Leads list: WhatsApp deep-link button (`wa.me` + prefill) next to phone
3. Order detail: one-click WhatsApp to customer
4. Badge counts in admin nav driven by `notify:badge` / REST fallback: pending measurements, new leads

### D. Portal engagement

1. Dashboard cards: next trial/delivery date countdown; outstanding balance; unread chat count; pending measurement status
2. Order status timeline — **customer-safe status labels** + short “what happens next” line
3. After measurement submit / approve: toast + **socket-driven** dashboard refresh
4. Invoices empty states (“No invoice until order quoted”)

### E. Website engagement (light, no redesign)

1. Stronger CTAs on Home/Services: Request consultation + WhatsApp (settings phone)
2. Short “How it works” strip (Enquire → Confirm → Reference ID → Portal) if missing
3. Portal activate teaser on request success when applicable

## Out of scope (this chat)

- GST / inventory / attendance / Telugu / multi-branch
- Full SEO automation rewrite
- WhatsApp Business API / SMS gateway
- Redesigning admin chrome or portal visual system
- Socket on public marketing pages

## Acceptance criteria

- [x] Settings contact/address reflected on public footer/contact
- [x] Admin dashboard shows real finance/lead/measurement metrics (no dead placeholders)
- [x] Owner can open WhatsApp to lead/customer from admin in ≤2 clicks
- [x] Customer gets email (or console log) on measurement approve + request received
- [x] Portal dashboard shows trial/delivery + balance + unread chat + pending fits
- [x] Website CTA path to request + WhatsApp works with settings numbers
- [x] **WebSocket:** admin receives live notify on new lead / pending measurement / payment
- [x] **WebSocket:** portal customer receives live notify on order status / measurement approved / payment / chat
- [x] Socket auth via existing JWT; reconnect safe; HTTP still works offline
- [x] No regressions to invoice document, lead↔order sync, measurement approval tab, or chat sockets

## Spec cross-links

- `documents/prd/16_Notifications.md`
- `documents/prd/14_Settings.md`
- `documents/prd/02_Admin_Dashboard.md`
- `documents/prd/10_Customer_Portal.md`
- `documents/prd/11_Website_CMS.md` (CTA polish only)
- Existing: `backend/src/realtime/portalSocket.ts`

## Cursor prompt

See `documents/START_HERE.md` → **Chat 16 — Engagement pack**.
