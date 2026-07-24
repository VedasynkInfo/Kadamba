# Module 12 — SEO Management

## Purpose

Define **SEO automation and override** behavior for Kadamba CMS entities (and any future public ERP-driven pages). When an editor enters a **title**, the system auto-generates slug, meta title/description, image alt/title/caption/description, Open Graph fields, and Twitter card fields — while allowing full **manual override** and enforcing **duplicate slug prevention**.

## Business Goal

Help a small boutique team publish bridal and ethnic content that is discoverable on Google and shareable on social apps without hiring an SEO specialist for every post — without locking them out of fine-tuning.

## Objectives

- Auto-generate a complete SEO pack from title (+ optional summary/image)  
- Allow field-level override and “reset to auto”  
- Prevent duplicate slugs within each content collection  
- Centralize generation rules for reuse across Blog, Service, Portfolio, Gallery, etc.  
- Respect site-wide SEO defaults from Settings (Module 14)  
- Keep implementation as shared helpers/components — not a separate SEO microservice  

## Features

### 1. Auto-generation from title

On title change (when field still “auto-managed”):

| Field | Generation rule (baseline) |
|-------|------------------------------|
| Slug | Lowercase, hyphenated, strip punctuation; brand-safe |
| Meta title | `{title} \| {siteName}` truncated ~60 chars |
| Meta description | From summary if present; else trimmed excerpt / template with brand + locality |
| Image alt | `{title} — Kadamba's Designer Studio, Kurnool` |
| Image title | Same as title or title + entity type |
| Image caption | Optional short caption from title |
| Image description | Longer description with boutique context |
| OG title / description / image | Mirror meta + primary image |
| Twitter title / description / image | Mirror OG/meta |

Include locality cues (“Kurnool”) in default descriptions where length allows, using Settings defaults.

### 2. Manual override

- Each field has `isAuto: boolean` or a shared “Auto SEO” toggle  
- Editing a field locks it to manual until reset  
- “Regenerate from title” button restores autos for unlocked fields  

### 3. Duplicate slug prevention

- Async check on blur/change  
- Block save if slug taken within the same collection  
- Suggest suffix (`-2`, `-3`) when conflict detected  
- Soft-deleted/archived docs: decide policy (prefer reserve slug until purge)  

### 4. Shared UI

- `SlugField` + `SeoFields` components (already targeted in CMS Phase 2)  
- Character counters for meta title/description  
- Preview snippet (optional): Google-like title/URL/description  

### 5. Entity coverage

Must support at least: Blogs, Services, Portfolio, Gallery items (if public detail exists), Banners only where SEO relevant.

## Workflow

1. Editor types title  
2. Slug + SEO fields populate automatically  
3. Editor uploads image → alt/title/caption auto-fill if still auto  
4. Editor tweaks meta description manually → that field becomes manual  
5. On save, server revalidates slug uniqueness and required SEO minimums  

## UI Requirements

- SEO section on every relevant admin form  
- Clear visual: auto vs custom (badge or lock icon)  
- Inline error if slug conflict  
- Do not hide SEO behind advanced-only without access — boutique staff need it visible but not intimidating  

## Forms / Fields

| Field | Auto | Override |
|-------|------|----------|
| slug | Yes | Yes |
| metaTitle | Yes | Yes |
| metaDescription | Yes | Yes |
| canonicalUrl | Optional | Yes |
| ogTitle | Yes | Yes |
| ogDescription | Yes | Yes |
| ogImage | From primary image | Yes |
| twitterTitle | Yes | Yes |
| twitterDescription | Yes | Yes |
| twitterImage | From primary | Yes |
| image.alt / title / caption / description | Yes | Yes |

## Tables / Columns

List pages may show:

| Column | Notes |
|--------|-------|
| Slug | Monospace / muted |
| SEO | “Complete” / “Needs review” if meta description empty |

## Filters / Search / Actions

**Filters (optional):** missing meta description, duplicate-risk (admin tool).

**Search:** by slug.

**Actions:** regenerate SEO, copy public URL.

## Validations

- Slug: required, pattern `^[a-z0-9]+(?:-[a-z0-9]+)*$`, unique per collection  
- Meta title: warn > 60–70 chars  
- Meta description: warn if empty or > ~160 chars  
- OG image URL must be valid if set  
- Server-side uniqueness is authoritative (never trust UI only)  

## Data Model (high level)

```
SeoBlock {
  slug
  metaTitle
  metaDescription
  canonicalUrl?
  ogTitle?
  ogDescription?
  ogImage?
  twitterTitle?
  twitterDescription?
  twitterImage?
  autoFlags? { slug, metaTitle, metaDescription, ... }
}
```

Alternatively flat fields matching current schemas — generation layer should adapt.

Settings defaults:

```
SeoDefaults {
  siteName
  titleTemplate          // "%s | Kadamba's Designer Studio"
  defaultDescription
  defaultOgImage
  localityPhrase         // "Kurnool"
}
```

## API Requirements

- Shared utility on backend: `generateSeoFromTitle({ title, summary, siteDefaults, image })`  
- `GET /api/admin/:collection/slug-available?slug=&excludeId=`  
- Existing create/update endpoints validate slug  
- No public “SEO API” required beyond normal content payloads including meta for `<Helmet>` / SSR-less client meta tags  

## Relationships

| Module | Relationship |
|--------|--------------|
| 11 Website CMS | Primary consumer |
| 07 Services | Consumer |
| 14 Settings | Defaults |
| 06 Products | Future public catalog pages |
| Public frontend | Renders meta tags from API |

## Acceptance Criteria

- [x] Creating a blog/service with only a title yields slug + meta + OG/Twitter defaults  
- [x] Manual edits persist and are not overwritten on unrelated saves  
- [x] Duplicate slug blocked with clear message + suggestion  
- [x] Image alt auto-fills and remains editable  
- [x] Site name/locality come from Settings defaults when present  
- [x] Works across multiple CMS entity forms via shared components  

## Future Enhancements

- Sitemap auto-regeneration on publish  
- Structured data (LocalBusiness, Product, Article)  
- SEO score checklist  
- Redirect manager when slugs change  
- Telugu meta variants  
