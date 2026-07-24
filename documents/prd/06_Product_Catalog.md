# Module 06 — Product Catalog

## Purpose

Define the **Product Catalog** for Kadamba's Designer Studio as an admin-managed catalog of **boutique garment / product types** that drive Measurement templates and Order line items. This is **not** a generic e-commerce inventory system (stock SKUs, warehouses, barcodes) — those belong to the Future Roadmap.

The catalog must stay aligned with the Measurement System ladies/girls product list (bridal, blouses, kurtis, gowns, salwar, kids, custom).

## Business Goal

Let the boutique add or adjust garment types (e.g. a new peplum blouse variant) and automatically connect them to the correct measurement form — without developer deploys — while Orders and Portal speak the same product language.

## Objectives

- Provide CRUD for product categories and product types  
- Link each product type to a `MeasurementTemplate`  
- Seed the complete Kurnool bridal/ethnic catalog consistent with Module 05  
- Expose product types to Orders and (later) Portal browse/request flows  
- Explicitly defer inventory quantities, purchase cost, and multi-warehouse stock  
- Keep codes stable (e.g. `BL-MG` Maggam Blouse) for reporting  

## Features

### 1. Categories

Canonical categories (align with Measurement PRD):

- Bridal Collection  
- Ethnic / Designer Blouses  
- Kurtis & Tunics  
- Gowns & Dresses  
- Salwar / Suit Sets  
- Kids / Girls  
- Custom / Other  

Admin can rename display labels; codes should remain stable.

### 2. Product types

Each product type includes:

- Code (unique, e.g. `BR-LH`)  
- Name (e.g. Bridal Lehenga)  
- Category  
- Short description (ops-facing)  
- Optional public description (for portal/CMS later)  
- Linked measurement template id  
- Active / inactive flag  
- Sort order  
- Optional default production stages (which order statuses apply)  
- Optional image (inspiration / sample)  

### 3. Template linkage

- Selecting a product type in Measurements or Orders loads the linked template  
- Changing the template on a product type affects **new** profiles only; existing profiles keep field snapshots  
- Admin warning when unlinking a template that has active usage  

### 4. Seed data

On first deploy / migration: seed all product types from Module 05 catalog tables (Bridal, Blouses, Kurtis, Gowns, Salwar, Kids, Custom). Idempotent seed by `code`.

### 5. Out of scope (v1)

- Stock on hand, SKUs, variants (size S/M/L ready-made)  
- Purchase orders / suppliers  
- Online cart checkout  
- Price lists as full commerce (optional `indicativePriceRange` text OK)  

## Workflow

1. Admin opens Product Catalog  
2. Creates or edits category / product type  
3. Links measurement template (or creates template first in Measurements)  
4. Activates product type  
5. Staff selecting that type in Measurements/Orders gets auto form / correct labeling  
6. Reports later group revenue by product type code  

## UI Requirements

- Admin route: `/admin/products` (categories + types; tabs or nested list)  
- Reuse DataTable, FilterBar, ConfirmDialog, SlugField only if public slug needed (usually internal code, not SEO slug)  
- Detail drawer or page for product type edit  
- Show template name + “Open template” link  
- Empty state when no seed run  

## Forms / Fields

| Field | Required | Notes |
|-------|----------|-------|
| Code | Yes | Unique, uppercase-friendly |
| Name | Yes | |
| Category | Yes | |
| Description | No | |
| Measurement template | Yes for measurable garments; optional for light service-like types |
| Active | Yes | Default true |
| Sort order | No | |
| Indicative price range | No | Text, e.g. “₹8,000–₹25,000” |
| Default stages | No | Multi-select of order statuses |
| Image | No | |

## Tables / Columns

| Column | Notes |
|--------|-------|
| Code | |
| Name | |
| Category | |
| Template | Name or “—” |
| Active | Badge |
| Orders using | Count optional |
| Actions | Edit, deactivate |

## Filters / Search / Actions

**Filters:** category, active, has template / missing template.

**Search:** code, name.

**Actions:** create, edit, activate/deactivate, clone product type (clones metadata; template link shared or cloned per UX choice — document: clone metadata, keep same template by default).

## Validations

- Unique `code`  
- Name required  
- Cannot deactivate if forced dependency policy says otherwise — prefer soft inactive  
- Template must exist and belong to same garment family when set  
- Code immutable after first order uses it (or allow with strong warning)  

## Data Model (high level)

```
ProductCategory {
  _id, code, name, sortOrder, active
}

ProductType {
  _id
  code                // BR-LH
  name
  categoryId
  description?
  publicDescription?
  measurementTemplateId?
  active
  sortOrder
  indicativePriceRange?
  defaultStages[]
  image?
  createdAt, updatedAt
}
```

## API Requirements

- `GET /api/admin/product-categories`  
- `POST/PATCH` category endpoints (admin)  
- `GET /api/admin/product-types?category=&search=&active=`  
- `GET /api/admin/product-types/:id`  
- `POST /api/admin/product-types`  
- `PATCH /api/admin/product-types/:id`  
- `POST /api/admin/product-types/seed` — idempotent seed (admin only, protected)  
- Optional public/portal: `GET /api/product-types` active only (Module 10)  

## Relationships

| Module | Relationship |
|--------|--------------|
| 05 Measurements | Template per product type |
| 03 Orders | Line items reference product types |
| 07 Services | Parallel catalog for service offerings; do not conflate |
| 08 Finance | Revenue by product type |
| 10 Portal | Browse / request products |
| 13 Reports | Groupings by category/type |

## Acceptance Criteria

- [ ] Full seed catalog matches Measurement System garment list  
- [ ] Admin CRUD for types; inactive hidden from new order pickers  
- [ ] Selecting product type resolves measurement template  
- [ ] Codes unique and documented  
- [ ] No inventory quantity fields in v1 UI  
- [ ] Extends existing backend patterns; no separate microservice  

## Future Enhancements

- Ready-made inventory & SKUs  
- Fabric catalog linked to products  
- Price books / packages (bridal packages)  
- Public catalog pages auto-generated from product types  
- Barcode / QR for job cards  
