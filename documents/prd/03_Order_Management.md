# Module 03 — Order Management

## Purpose

Define the **Order Management** module for Kadamba's Designer Studio: the system of record for every garment job from first enquiry through delivery. Each order ties together customer, product/service, measurements, payments, assigned staff, status timeline, and notes — with a dedicated **individual order detail page** for day-to-day boutique operations.

## Business Goal

Replace scattered notebooks and WhatsApp threads with a single order lifecycle so bridal and ethnic jobs (lehenga, designer blouse, maggam, custom stitching) move predictably through the workroom, customers get clear Reference IDs, and Finance / Portal / Dashboard can trust one source of truth.

## Objectives

- Model the full boutique production pipeline, including embroidery/maggam and trial stages  
- Provide list + rich detail views for admin and staff  
- Link orders to customers, products, measurement profiles, payments, and staff  
- Support enquiry → confirmed conversion that issues a **Reference ID** for portal activation  
- Maintain an auditable status timeline and internal notes  
- Enable filters/search for floor managers hunting by phone, name, or reference  

## Features

### 1. Order list

- Paginated table of all orders  
- Status badges color-coded by lifecycle stage  
- Quick view of customer, product, due dates, assigned staff, payment summary  
- Create order (from scratch or from lead/enquiry)  

### 2. Order detail page (individual)

Route suggestion: `/admin/orders/:id`

Sections:

- Header: Order number / Reference ID, status, priority, due dates  
- Customer card (link to CRM)  
- Line items: product types / services, quantity, fabric notes, design notes  
- Linked measurement profile(s) with open/print actions  
- Payment summary (advance, balance, link to Finance)  
- Assigned staff by role (cutter, stitcher, maggam, finishing)  
- Status timeline (immutable event log)  
- Internal notes / chat-visible notes flag for portal later  
- Attachments (inspiration images, fabric photos) via ImageUpload  

### 3. Lifecycle statuses

Canonical ordered statuses:

| Status | Meaning |
|--------|---------|
| `enquiry` | Interest captured; not yet confirmed |
| `confirmed` | Accepted; Reference ID issued; portal activation eligible |
| `measurements` | Measuring / measurement profile linked |
| `cutting` | Fabric cutting in progress |
| `stitching` | Stitching in progress |
| `embroidery_maggam` | Maggam / embroidery / heavy work |
| `trial` | Customer trial / fitting scheduled or done |
| `finishing` | Final finishing, fall/pico, packing prep |
| `delivery` | Delivered / ready for pickup completed |
| `cancelled` | Cancelled (reason required) |
| `on_hold` | Paused (fabric delay, customer decision, etc.) |

Admin may move forward or backward with reason when correcting mistakes; timeline records every change.

### 4. Reference ID

- Generated on transition to `confirmed` (or on create-as-confirmed)  
- Unique, human-readable (e.g. `KDS-2026-0842`)  
- Used for customer portal verification (Module 10) and notifications (Module 16)  
- Immutable after issue  

### 5. Production dates

- Expected trial date  
- Expected delivery date  
- Actual trial / delivery timestamps  
- Optional stage due dates for long bridal jobs  

### 6. Conversion from public enquiry / lead

- Admin can “Convert to order” from existing lead  
- Prefills customer fields and interest → product  
- Original lead id retained for analytics  

## Workflow

1. Enquiry arrives (public form or walk-in) → create order in `enquiry` **or** create customer + order  
2. Boutique confirms scope & advance → status `confirmed` → Reference ID + confirmation email  
3. Take or reuse measurements → `measurements`  
4. Assign staff → move through `cutting` → `stitching` → `embroidery_maggam` as applicable (skip stages allowed if N/A, with note)  
5. Schedule trial → `trial`  
6. Finish → `finishing` → `delivery`  
7. Throughout: record payments, notes, attachments  
8. Customer (after portal activation) sees selected status & chat (Module 10)  

Skipping rules: e.g. simple blouse may skip embroidery; admin marks stage N/A rather than inventing fake work.

## UI Requirements

- Routes under `/admin/orders` and `/admin/orders/:id`  
- Reuse DataTable, FilterBar, ConfirmDialog, Skeleton, EmptyState, TagsInput, ImageUpload  
- Status change via dropdown or stepper with confirmation when moving to cancelled / on_hold  
- Timeline vertical component on detail page  
- Staff assignment multi-select filtered by specialization (when Staff module exists)  
- Mobile: detail sections collapse into accordion  

## Forms / Fields

### Create / Edit Order

| Field | Required | Notes |
|-------|----------|-------|
| Customer | Yes | Existing or inline create |
| Source lead | No | Link if converted |
| Product type(s) / service | Yes | From Product Catalog / Services |
| Title / summary | Yes | e.g. “Bridal lehenga + blouse – Ananya” |
| Status | Yes | Default `enquiry` |
| Priority | No | normal / high / rush |
| Expected trial date | No | |
| Expected delivery date | No | |
| Fabric / design notes | No | Long text |
| Measurement profile | No | Link existing or create later |
| Assigned staff | No | Multi |
| Advance amount | No | Hand off to Finance payment record preferred |
| Tags | No | e.g. bridal, rush, maggam |
| Internal notes | No | |

### Status change dialog

| Field | Required |
|-------|----------|
| New status | Yes |
| Note / reason | Required for cancel, hold, or backward move |
| Notify customer | Optional checkbox (email) |

## Tables / Columns

| Column | Notes |
|--------|-------|
| Reference / Order # | Primary identity |
| Customer | Name + phone snippet |
| Product | Primary product type |
| Status | Badge |
| Trial / Delivery | Dates |
| Staff | Avatars or initials |
| Payment | Paid / partial / due |
| Updated | Last activity |
| Actions | View, edit status, assign |

## Filters / Search / Actions

**Filters:** status (multi), date range (created / delivery), product category, assigned staff, payment state, priority, locality (via customer).

**Search:** reference id, customer name, phone, email.

**Actions:** create, view, edit, change status, assign staff, link measurement, add payment, convert lead, print summary, soft-cancel.

## Validations

- Customer required before confirm  
- At least one product/service line before confirm  
- Reference ID unique  
- Cannot set `delivery` without payment policy check (configurable: warn vs block if balance > 0)  
- Cancelled orders cannot move forward without reopen permission  
- Delivery date should not be before trial when both set (warn)  
- Staff assignments must reference active staff  

## Data Model (high level)

```
Order {
  _id
  orderNumber          // internal sequence
  referenceId          // KDS-YYYY-#### when confirmed
  customerId
  leadId?
  status
  priority
  title
  lineItems[] { productTypeId?, serviceId?, name, notes, qty }
  measurementProfileIds[]
  assignedStaff[] { staffId, roleOnOrder }
  expectedTrialAt, expectedDeliveryAt
  actualTrialAt, actualDeliveryAt
  tags[]
  notes[] { body, visibility: internal|customer, createdBy, createdAt }
  timeline[] { status, note, actorId, at }
  paymentSummary { advance, totalQuoted, totalPaid, balance } // denormalized from Finance
  attachments[]
  cancelledReason?
  createdAt, updatedAt, archivedAt?
}
```

## API Requirements

- `GET /api/admin/orders` — list + filters + search + pagination  
- `GET /api/admin/orders/:id` — detail with populated relations  
- `POST /api/admin/orders` — create  
- `PATCH /api/admin/orders/:id` — update fields  
- `POST /api/admin/orders/:id/status` — status transition + timeline event  
- `POST /api/admin/orders/:id/assign` — staff assignment  
- `POST /api/admin/orders/from-lead/:leadId` — conversion helper  
- Auth: admin full; staff per permissions (Module 15)  

Public/portal read of order status is defined in Module 10 (not open admin APIs).

## Relationships

| Entity | Relationship |
|--------|--------------|
| Customer (04) | Many orders per customer |
| Measurement profiles (05) | Linked 1..n |
| Product types (06) | Line items |
| Services (07) | Optional line items |
| Finance (08) | Payments against order |
| Staff (09) | Assignments |
| Portal (10) | Customer views order via Reference ID account |
| Notifications (16) | Emails on enquiry received & confirmed |
| Dashboard / Reports (02, 13) | Aggregations |

## Acceptance Criteria

- [ ] Admin can create, list, filter, and open order detail  
- [ ] Full status lifecycle including embroidery/maggam and trial is supported  
- [ ] Timeline records every status change with actor and timestamp  
- [ ] Confirm issues unique Reference ID  
- [ ] Order links customer, products, measurements, staff, and payment summary  
- [ ] Lead conversion prefills order  
- [ ] Staff with limited role cannot delete/cancel without permission  
- [ ] No regression on existing leads CMS  

## Future Enhancements

- Stage checklists per product type (bridal vs blouse)  
- SMS status updates  
- Calendar view of trials  
- Automatic SLA alerts for overdue maggam stages  
- Multi-garment kits (lehenga set) as order templates  
