# Module 01 — Project Overview

## Purpose

Define the product vision, scope boundaries, architecture extension rules, brand identity, and module map for **Kadamba Boutique ERP** — the operations platform built on top of the existing Kadamba's Designer Studio marketing website and admin CMS.

This document is the north star for every subsequent module PRD. Implementers must treat it as binding: extend the current stack; do not rebuild; keep brand and technical conventions intact.

## Business Goal

Evolve Kadamba's Designer Studio from a **brochure + CMS site** into a purpose-built **Boutique ERP + CRM + Order / Tailoring Management + Customer Portal**, so the Kurnool boutique can run day-to-day bridal and ethnic tailoring operations digitally — measurements, orders, staff workload, payments, customer communication — without abandoning the working public website or admin CMS already in production.

Comparable product categories (for orientation only): Tailor Management ERP, Bridal Boutique ERP, lightweight Zoho-style boutique ops with a customer order-tracking portal.

## Objectives

- Establish a single, coherent product vision across CMS, ERP, CRM, and portal layers  
- Lock **extend-not-rebuild** architecture rules so Cursor and developers do not fork the stack  
- List all modules with clear dependencies and a locked implementation order  
- Anchor brand copy and locality (Kurnool Bazar / Prakash Nagar) for every UI surface  
- Clarify what is in scope now vs deferred to the Future Roadmap  
- Give acceptance criteria that prevent regression on the public site and existing admin CMS  

## Features

### Product layers

| Layer | Responsibility |
|-------|----------------|
| **Website CMS** | Public content: Home, About, Services, Gallery, Portfolio, Blogs, Contact, Banners, SEO, Settings-driven contact/address |
| **ERP Ops** | Orders, Measurements, Products, Staff, Finance, Reports |
| **CRM** | Customers, enquiries, tags, notes, communication / enquiry history |
| **Customer Portal** | Post-confirmation account: dashboard, orders, measurements, chat, invoices, notifications |

### Module inventory

| # | Module | Role |
|---|--------|------|
| 01 | Project Overview | Vision & rules (this doc) |
| 02 | Admin Dashboard | Business metrics, charts, quick actions |
| 03 | Order Management | Full garment order lifecycle |
| 04 | Customer Management | CRM profiles & history |
| 05 | Measurement System | Dynamic templates & profiles (**start here**) |
| 06 | Product Catalog | Boutique garment types ↔ measurement templates |
| 07 | Service Management | CMS services + boutique ops view |
| 08 | Finance | Payments, expenses, salaries, P&L |
| 09 | Staff Management | Employees, skills, workload |
| 10 | Customer Portal | Reference-ID activation & self-service |
| 11 | Website CMS | Phase 2 polish of existing CMS |
| 12 | SEO Management | Auto SEO + overrides |
| 13 | Reports & Analytics | Business reports |
| 14 | Settings | Expanded settings + public site sync |
| 15 | User Roles | Admin / Staff / Customer permissions |
| 16 | Notifications | Email (+ SMS/WhatsApp-ready) |
| 17 | Future Roadmap | Inventory, GST, attendance, Telugu UI, etc. |

### What this product is *not*

- Not a greenfield rewrite of frontend or backend  
- Not an interior-design / home-décor studio product  
- Not a full e-commerce inventory storefront in v1 (inventory is future)  
- Not a replacement of existing JWT auth, MongoDB models, or Cloudinary upload patterns  

## Workflow

### Implementation order (locked)

1. **Measurement System** — active first chunk  
2. Product Catalog (harden types ↔ templates if not fully seeded in step 1)  
3. Staff Management  
4. Customer Management  
5. Order Management  
6. Finance  
7. User Roles + Customer Portal  
8. Notifications  
9. Admin Dashboard metrics (depends on Orders / Finance / Leads)  
10. Website CMS / SEO / Settings polish  
11. Reports & Analytics  
12. Future Roadmap items (deferred)  

### Typical end-to-end boutique journey (target state)

1. Visitor submits **enquiry** on the public site (no login)  
2. Admin / staff converts enquiry → **customer** + **order**  
3. Order moves through statuses; **measurements** taken / reused  
4. Staff assigned; production stages completed; trials & finishing  
5. On **confirmation**, customer receives email with **Reference ID**  
6. Customer verifies Reference ID → sets password → uses **portal**  
7. Payments recorded in **Finance**; dashboard & reports reflect reality  

## UI Requirements

- Preserve existing admin shell, navigation patterns, and design tokens  
- Prefer reusable components under `frontend/src/pages/admin/components/` (DataTable, FilterBar, ImageUpload, SeoFields, SlugField, ConfirmDialog, Skeleton, etc.)  
- Public site continues to use brand helpers from `frontend/src/pages/home/data.ts` → `brand` object  
- New ERP modules appear as additional admin routes; do not gut CMS pages  
- Mobile-usable admin forms for floor staff taking measurements  

## Forms / Fields

N/A as a standalone UI module. Cross-cutting field conventions:

- Phone: Indian mobile preferred; store with country code when possible  
- Locality: free text + optional known Kurnool areas (e.g. Prakash Nagar, near Kurnool Bazar)  
- Money: INR; store as decimal/number consistently with Finance module  
- Dates: ISO in API; locale-friendly display in UI  
- Status enums: shared constants between frontend and backend  

## Tables / Columns

N/A. Module list above is the inventory table of record.

## Filters / Search / Actions

N/A for this overview. Each module PRD defines its own.

## Validations

Architecture / process validations for implementers:

- No new parallel auth system  
- No duplicate “settings” or “upload” stacks if existing ones can be extended  
- No brand copy that describes interior design or generic luxury interiors  
- New APIs must use response envelope `{ success, message, data }`  
- Soft-delete / archive preferred over hard delete for business records  

## Data Model (high level)

Conceptual entities introduced across the ERP (detailed in module PRDs):

```
Customer ──< Order >── ProductType / Service
    │           │
    │           ├── MeasurementProfile
    │           ├── Payment
    │           └── StaffAssignment
    │
    └── MeasurementProfile (multiple)

Enquiry ──> Customer / Order (conversion)

Staff ──< OrderAssignment
User (auth) ── role: admin | staff | customer
Settings ──> public site contact/address/company
```

Existing CMS entities (Blog, Gallery, Portfolio, Service, Banner, Lead) remain; ERP entities link where natural (e.g. Lead → Customer/Order).

## API Requirements

Cross-cutting API rules:

- Base: existing Express app under `backend/src/`  
- Auth: existing JWT middleware; role checks per Module 15  
- Envelope: `{ success: boolean, message: string, data: unknown }`  
- Errors: existing `errorHandler` patterns; meaningful validation messages  
- Uploads: extend existing upload routes / Cloudinary integration  
- Pagination: list endpoints support `page`, `limit`, `search`, filters  

## Relationships

| Document | Relationship |
|----------|--------------|
| `00_INDEX.md` | Index & template reminder |
| `05_Measurement_System.md` | First implementation module |
| `documents/boutique_erp_prompts.md` | Master feature + Cursor prompts |
| `active_chunk.md` / `current_chunk.md` | Live implementation brief |
| Modules 02–17 | Detailed specs that must not contradict this overview |

## Acceptance Criteria

- [ ] All module PRDs exist under `documents/prd/` and follow the standard section template  
- [ ] Implementation order starts with Measurements and is reflected in status trackers  
- [ ] Brand identity is consistently boutique/tailoring in Kurnool (bridal, maggam, designer blouses)  
- [ ] Architecture rules explicitly forbid rebuild / wholesale CMS replacement  
- [ ] Existing public site and admin CMS remain operational during ERP rollout  
- [ ] Dependencies between Orders, Finance, Portal, Dashboard, and Reports are documented  

## Future Enhancements

See [17_Future_Roadmap.md](./17_Future_Roadmap.md): inventory/SKU, GST invoicing, attendance, WhatsApp deep integration, Telugu UI, multi-branch, barcode measurement books, etc.

---

### Brand lock (copy this into module UIs)

**Kadamba's Designer Studio** in **Kurnool** is a women's **boutique and custom tailoring** business specializing in traditional and bridal wear, designer blouses, and maggam / embroidery work. Area context: near **Kurnool Bazar / Prakash Nagar** (beside Gulf Cafe), Kurnool, Andhra Pradesh. Never position the product as interior design.
