# Module 11 — Website CMS (Phase 2)

## Purpose

Document **CMS Phase 2** enhancements for the existing Kadamba admin content tools: dashboard polish hooks, global image component, SEO automation integration, Gallery / Services / Portfolio / Blog UX upgrades, banner size guidance, tags, skeletons, and confirmation dialogs.

**Critical rule:** Preserve existing CMS pages and APIs. Enhance in place. Do not rebuild the marketing site or replace working admin screens wholesale.

## Business Goal

Make content operations faster and safer for boutique staff publishing bridal/gallery work, services, portfolio pieces, and blogs — with consistent image handling and SEO — while the ERP modules grow alongside.

## Objectives

- Standardize image upload/crop/compress across CMS entities  
- Apply SEO automation consistently (see Module 12)  
- Improve list/filter UX with tags, skeletons, empty states, confirm dialogs  
- Document correct banner sizes and guides in-admin  
- Align Gallery, Services, Portfolio, Blogs with shared components already under `frontend/src/pages/admin/components/`  
- Keep public routes and content schemas stable unless additive  

## Features

### 1. Shared admin components (reuse / complete)

| Component | Use |
|-----------|-----|
| ImageUpload | Cloudinary upload, progress, replace, remove |
| ImageCropper | Aspect ratios per entity |
| BannerSizeGuide | In-context size recommendations |
| SeoFields | Meta title/description, OG, Twitter |
| SlugField | Slug edit + uniqueness feedback |
| TagsInput | Chip tags |
| DataTable / FilterBar | List pages |
| Skeleton / EmptyState | Loading & zero data |
| ConfirmDialog | Delete / unpublish |
| MetricCard / QuickActions | Dashboard (Module 02) |

### 2. Entity UX upgrades

For **Gallery, Services, Portfolio, Blogs** (and Banners / Testimonials if present):

- Consistent create/edit layout: content → media → SEO → publish  
- Filters + search on list pages  
- Soft delete / archive with confirmation  
- Tag support where meaningful (gallery categories, blog topics)  
- Loading skeletons instead of blank flashes  

### 3. Image standards

- Compress before upload when client-side feasible  
- Enforce max file size with clear errors  
- Store alt, title, caption, description (auto from Module 12, editable)  
- Crop presets: square (gallery), landscape (blog hero), banner ratios per guide  

### 4. Banner management

- Size guide for hero / secondary / mobile banners  
- Preview aspect ratio in admin  
- Do not invent new banner system if one exists — extend  

### 5. Dashboard polish

- Wire quick actions and any CMS-specific stats already available (published counts)  
- Defer order/revenue widgets to Module 02 dependency notes  

### 6. Brand content

- Ensure CMS placeholder/help text references boutique/tailoring in Kurnool  
- Strip any leftover interior-design sample copy if found during polish  

## Workflow

1. Editor opens existing admin section (e.g. Blogs)  
2. Creates item → title drives slug + SEO defaults  
3. Uploads images via ImageUpload (+ crop)  
4. Adjusts tags, body, SEO overrides  
5. Publishes → public site reflects content  
6. Delete/archive requires ConfirmDialog  

## UI Requirements

- Work in existing pages:
  - `BlogsAdminPage.tsx`
  - `GalleryAdminPage.tsx`
  - `PortfolioAdminPage.tsx`
  - `ServicesAdminPage.tsx`
  - Settings / Banners as applicable  
- Match existing admin layout chrome  
- Accessibility: dialogs focus trap; buttons with clear labels  
- Mobile-friendly forms  

## Forms / Fields

Common pattern across entities:

| Field group | Examples |
|-------------|----------|
| Core | Title, summary, body/rich text, status |
| Media | Images with alt/title/caption |
| Taxonomy | Tags, category |
| SEO | Slug, meta title/description, OG, Twitter |
| Publish | Published at, featured flag |

Entity-specific fields remain as today (portfolio client, gallery category, etc.).

## Tables / Columns

Standardize list columns where possible:

| Column | Notes |
|--------|-------|
| Thumbnail | |
| Title | |
| Status | |
| Tags | |
| Updated | |
| Actions | Edit, delete |

## Filters / Search / Actions

**Filters:** status, tags/category, date range.

**Search:** title, slug.

**Actions:** create, edit, publish/unpublish, duplicate (optional), delete with confirm.

## Validations

- Title required  
- Unique slug per collection  
- Image type/size limits  
- Confirm before destructive actions  
- SEO fields length warnings (not hard blocks unless product decides)  

## Data Model (high level)

Additive fields on existing CMS collections as needed:

```
seo {
  metaTitle, metaDescription
  ogTitle, ogDescription, ogImage
  twitterTitle, twitterDescription, twitterImage
}
images[] { url, publicId, alt, title, caption, description }
tags[]
```

Do not rename existing collections casually; migrate additively.

## API Requirements

- Extend existing CMS routes; keep response envelope  
- Upload via existing `uploadRoutes` / upload service  
- Optional slug availability: `GET /api/admin/:entity/slug-available?slug=`  
- No breaking changes to public content APIs without versioning or additive fields  

## Relationships

| Module | Relationship |
|--------|--------------|
| 12 SEO | Automation engine used by CMS forms |
| 14 Settings | Default SEO site name, banner size config |
| 02 Dashboard | Quick actions into CMS creates |
| 07 Services | Services are part of CMS + ops fields |
| Existing Leads | Untouched except shared UI patterns |

## Acceptance Criteria

- [x] Gallery, Services, Portfolio, Blogs use shared ImageUpload + SEO fields  
- [x] Delete/unpublish flows use ConfirmDialog  
- [x] Lists show skeletons and empty states  
- [x] Banner size guide visible where banners edited  
- [x] No regression on public pages  
- [x] Brand copy remains boutique/tailoring  
- [x] Existing auth and upload pipeline reused

## Future Enhancements

- Media library / asset manager across entities  
- Scheduled publishing  
- Content localization (Telugu) — see Roadmap  
- WebP/AVIF pipeline tuning  
- Bulk tag edit  
