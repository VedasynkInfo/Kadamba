# Module 04 — Customer Management (CRM)

## Purpose

Specify the **Customer Management** CRM for Kadamba's Designer Studio: a durable profile for every boutique client (walk-in, enquiry conversion, or portal user) including contact details, address/locality, order history, measurement profiles, enquiry history, tags, and notes.

This module is the hub that Orders, Measurements, Portal, and Notifications hang from. It extends the stack; it does not replace existing Lead records — leads convert into or link to customers.

## Business Goal

Give the boutique a searchable memory of every client in Kurnool and beyond — phone, locality, past bridal/blouse jobs, saved measurements — so repeat orders are faster and staff do not re-ask for the same details.

## Objectives

- Maintain a single customer record across enquiries, orders, and portal login  
- Capture boutique-relevant locality context (Prakash Nagar, near Kurnool Bazar, etc.)  
- Surface order history and measurement profiles on one page  
- Support tags and freeform notes for relationship context  
- Enable fast search/filter by name, phone, email, locality, tags  
- Prepare clean links for Reference ID / portal user association  

## Features

### 1. Customer list

- Paginated CRM table  
- Search and filters  
- Create customer (walk-in)  
- Open detail  

### 2. Customer profile (detail)

Route suggestion: `/admin/customers/:id`

Sections:

- Identity & contact  
- Address & locality  
- Tags & notes  
- Measurement profiles (link to Module 05)  
- Order history (Module 03)  
- Enquiry / lead history  
- Portal status (not activated / activated / locked)  
- Quick actions: new order, new measurement, send notification (later)  

### 3. Contact & address

- Full name, alternate name / preferred name  
- Primary mobile (required for most boutique ops), secondary phone  
- Email (optional but needed for portal & email notifications)  
- WhatsApp number (default = mobile)  
- Address lines, landmark, locality/area, city (default Kurnool), state, pincode  
- Source (walk-in, Instagram, Google, referral, website)  

### 4. Tags & notes

- Tags: bridal, VIP, rush, maggam, wholesale-ref, etc.  
- Notes: timestamped, author-attributed; optional pin  

### 5. Lead / enquiry linkage

- List related leads  
- Convert lead → customer (idempotent if already exists by phone)  
- Duplicate detection warning on phone/email match  

### 6. Portal linkage

- Store `referenceIds[]` or primary reference from confirmed orders  
- Flag `portalUserId` when Module 10 activates account  
- CRM does not implement portal UI; only displays status  

## Workflow

1. Walk-in / phone: staff creates customer  
2. Website enquiry: lead created → staff converts to customer (match phone)  
3. Staff attaches measurements and places orders against customer  
4. On order confirm: Reference ID associated; customer eligible for portal  
5. Future visits: search by phone → reuse profile  

## UI Requirements

- `/admin/customers`, `/admin/customers/:id`, `/admin/customers/new`  
- Reuse DataTable, FilterBar, TagsInput, ConfirmDialog, Skeleton, EmptyState  
- Detail page with tabbed or sectioned layout: Overview | Orders | Measurements | Enquiries | Notes  
- Prominent phone click-to-call / WhatsApp deep link (open external)  
- Duplicate warning modal when creating with existing phone  

## Forms / Fields

| Field | Required | Notes |
|-------|----------|-------|
| Full name | Yes | |
| Phone | Yes | Unique preferred; warn on duplicate |
| Email | No | Unique if present |
| WhatsApp | No | Defaults to phone |
| Gender | No | Optional; boutique primarily women clients |
| Date of birth / anniversary | No | Future marketing |
| Address line 1/2 | No | |
| Landmark | No | e.g. beside Gulf Cafe |
| Locality | No | Prakash Nagar, Kurnool Bazar, etc. |
| City | No | Default Kurnool |
| State | No | Andhra Pradesh |
| Pincode | No | |
| Source | No | Enum |
| Tags | No | |
| Notes | No | On create optional |

## Tables / Columns

| Column | Notes |
|--------|-------|
| Name | |
| Phone | |
| Locality | |
| Orders | Count |
| Last order | Date |
| Tags | Chips |
| Portal | Badge |
| Created | |
| Actions | View / edit |

## Filters / Search / Actions

**Filters:** locality, tags, has open orders, portal status, source, created date range.

**Search:** name, phone, email, reference id (via related orders).

**Actions:** create, edit, archive, convert from lead, start order, start measurement, merge duplicates (future).

## Validations

- Name min length 2  
- Phone: Indian mobile format recommended; normalize before unique check  
- Email format if provided  
- Soft uniqueness on phone (block or confirm merge)  
- Cannot hard-delete customer with orders; archive only  
- Staff may have create/edit but not delete per roles  

## Data Model (high level)

```
Customer {
  _id
  name
  phone           // normalized
  email?
  whatsapp?
  address { line1, line2, landmark, locality, city, state, pincode }
  source
  tags[]
  notes[] { body, pinned, createdBy, createdAt }
  leadIds[]
  portalUserId?
  portalStatus    // none | invited | active | locked
  preferredUnit?  // in | cm for measurements UI
  archivedAt?
  createdAt, updatedAt
}
```

## API Requirements

- `GET /api/admin/customers` — list, search, filters, pagination  
- `GET /api/admin/customers/:id` — detail + summary counts  
- `POST /api/admin/customers`  
- `PATCH /api/admin/customers/:id`  
- `POST /api/admin/customers/:id/notes`  
- `POST /api/admin/customers/from-lead/:leadId`  
- `GET /api/admin/customers/:id/orders` — optional nested  
- `GET /api/admin/customers/:id/measurements` — optional nested  

Envelope and JWT as existing.

## Relationships

| Module | Relationship |
|--------|--------------|
| Existing Leads | Convert / link |
| 03 Orders | Order history |
| 05 Measurements | Profiles belong to customer |
| 10 Portal | Auth user maps to customer |
| 16 Notifications | Email/SMS recipient |
| 06 Products | Interest tags only in CRM; products on orders |

## Acceptance Criteria

- [ ] CRUD (with archive) for customers in admin  
- [ ] Search by name/phone works reliably with normalization  
- [ ] Detail shows orders, measurements, enquiries sections (empty states OK)  
- [ ] Lead conversion creates or matches customer by phone  
- [ ] Tags and notes persist with author metadata  
- [ ] Locality/address fields suitable for Kurnool boutique context  
- [ ] No rebuild of leads module; linkage only  

## Future Enhancements

- Duplicate merge tool  
- Family / related customers (mother–daughter bridal)  
- Anniversary reminders  
- WhatsApp conversation timeline import  
- Customer lifetime value on profile  
