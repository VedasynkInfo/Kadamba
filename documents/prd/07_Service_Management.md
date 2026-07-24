# Module 07 — Service Management

## Purpose

Specify how **boutique services** are managed by extending the **existing CMS Services** module and adding a light **operations view** for service offerings that Kadamba sells and fulfills: bridal wear stitching, designer blouses, custom tailoring, maggam / embroidery work, alterations, and related services.

This is **not** a rebuild of ServicesAdminPage. Preserve current public service pages and admin CRUD; enhance with SEO automation hooks, ops metadata, and clearer linkage to Orders.

## Business Goal

Keep the marketing site’s service storytelling strong while giving operations a structured list of fulfillable services that can appear on orders, enquiries, and reports — aligned with Kadamba’s real workroom offerings in Kurnool.

## Objectives

- Preserve and extend existing Services CMS (list, create, edit, public detail)  
- Align service catalog copy with boutique positioning (bridal, blouses, maggam, custom tailoring)  
- Integrate Module 12 SEO automation (slug, meta, OG) and CMS Phase 2 UX patterns  
- Add ops fields useful for orders (fulfillable flag, default product type link, lead time estimate)  
- Avoid inventing a second parallel “services” database  

## Features

### 1. Existing CMS capabilities (preserve)

- Admin services list & editor  
- Public `/services` and service detail routes  
- Images, descriptions, ordering  
- Publish / draft if already supported — keep behavior  

### 2. Boutique service catalog (content + ops)

Recommended core services (seed/update copy, not hardcode forever):

| Service | Ops notes |
|---------|-----------|
| Bridal wear (custom) | Full bridal sets, lehengas, reception |
| Designer blouses | Including maggam / heavy work |
| Custom tailoring | Ethnic / festive outfits |
| Maggam & embroidery | Standalone or add-on work |
| Alterations & fittings | Trials, resizing |
| Kids / girls ethnic stitching | Optional |

### 3. Ops view enhancements

On admin service edit, add:

- `isFulfillable` — can appear on orders  
- `linkedProductTypeIds[]` — optional bridge to Product Catalog  
- `defaultLeadTimeDays` — planning hint  
- `basePriceFrom` — optional indicative starting price (INR)  
- Tags for filtering  

### 4. SEO & CMS Phase 2

- Auto slug / meta via Module 12  
- ImageUpload + crop guidance  
- Skeletons, confirm delete, tags chips  
- SlugField + SeoFields components  

### 5. Enquiry interest mapping

Public enquiry / lead forms may reference a service id or slug so conversion to Order preselects the service line.

## Workflow

1. Admin creates/edits service in existing Services admin  
2. SEO fields auto-fill from title; admin overrides as needed  
3. Marks service fulfillable + links product types if relevant  
4. Public site shows service; visitors enquire  
5. Staff converts enquiry → order with service line item  
6. Reports attribute revenue to service when Finance exists  

## UI Requirements

- Extend `frontend/src/pages/admin/services/ServicesAdminPage.tsx`  
- Do not replace the page wholesale; additive fields and UX polish  
- Reuse SeoFields, SlugField, ImageUpload, TagsInput, ConfirmDialog, BannerSizeGuide patterns where images apply  
- Ops fields grouped under an “Operations” section collapsed by default if crowded  
- Public UI: preserve design system; update copy only where brand-outdated  

## Forms / Fields

| Field | Required | Notes |
|-------|----------|-------|
| Title | Yes | |
| Slug | Yes | Auto from title; unique |
| Summary | Yes | Short |
| Body / description | Yes | |
| Hero / gallery images | No | Via ImageUpload |
| Meta title / description | No | Auto + override |
| OG / Twitter | No | Auto + override |
| Publish status | Yes | If model supports |
| Sort order | No | |
| Tags | No | |
| isFulfillable | No | Default true for boutique services |
| linkedProductTypeIds | No | |
| defaultLeadTimeDays | No | |
| basePriceFrom | No | INR |

## Tables / Columns

| Column | Notes |
|--------|-------|
| Title | |
| Slug | |
| Fulfillable | Badge |
| Status | Draft/published |
| Updated | |
| Actions | Edit, delete/archive |

## Filters / Search / Actions

**Filters:** published status, fulfillable, tags.

**Search:** title, slug.

**Actions:** create, edit, publish, archive, duplicate, open public preview.

## Validations

- Unique slug (Module 12 duplicate prevention)  
- Title required  
- Lead time ≥ 0 if set  
- Linked product types must exist  
- Delete: confirm; block hard delete if open orders reference service (archive instead)  

## Data Model (high level)

Extend existing Service model rather than new collection:

```
Service {
  ...existing CMS fields
  tags[]?
  seo { ... }                 // or flat meta fields per current schema
  isFulfillable?: boolean
  linkedProductTypeIds?: ObjectId[]
  defaultLeadTimeDays?: number
  basePriceFrom?: number
}
```

## API Requirements

- Extend existing service routes/controllers  
- Ensure list/detail admin APIs return new ops fields  
- Public APIs remain unchanged in shape where possible (ignore unknown fields client-side)  
- Optional: `GET /api/services?fulfillable=true` for order pickers  

## Relationships

| Module | Relationship |
|--------|--------------|
| Existing public Services pages | Source of truth for marketing |
| 06 Product Catalog | Optional links for measurement-heavy work |
| 03 Orders | Service as line item |
| 11 Website CMS | Shared UX/components |
| 12 SEO | Automation |
| 02 Dashboard | Quick action “Add Service” |
| Leads | Interest mapping |

## Acceptance Criteria

- [ ] Existing services admin and public pages still work  
- [ ] Boutique service copy reflects tailoring/bridal — not interiors  
- [ ] Ops fields save and appear in admin  
- [ ] SEO auto-generation hooks work with manual override  
- [ ] Order picker can list fulfillable services  
- [ ] Confirm dialogs / skeletons applied consistently with Phase 2  

## Future Enhancements

- Service packages (bridal package pricing)  
- Online booking calendar for consultations  
- Per-service FAQs  
- Before/after gallery linked from service detail  
