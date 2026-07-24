# Module 14 — Settings

## Purpose

Expand the **existing Settings admin page** into the configuration hub for Kadamba's Designer Studio: company identity, logo, contact, address (with **mandatory sync to the public website**), SEO defaults, social links, measurement/banner size presets, staff/roles entry points, email SMTP & templates, and careful theme controls.

Do not create a second settings system. Extend the current settings model, API, and `SettingsAdminPage`.

## Business Goal

Let the boutique update phone, address (Prakash Nagar / Kurnool Bazar context), logo, and social links once — and have the marketing site, emails, SEO defaults, and admin branding all reflect those values without code deploys.

## Objectives

- Centralize company profile used by public footer/contact and notifications  
- **Sync** company name, logo, contact, address to public website consumers  
- Store SEO defaults for Module 12  
- Store social links, banner/measurement size guides  
- Link out to Staff & Roles modules  
- Configure SMTP and email templates for Module 16  
- Allow limited theme tokens without breaking the established brand design system  

## Features

### 1. General (company)

| Field | Sync to public site |
|-------|---------------------|
| Company / trade name | Yes |
| Short name | Yes |
| Logo (light/dark if needed) | Yes |
| Tagline | Yes |
| Phone, alternate phone | Yes |
| WhatsApp number | Yes |
| Email | Yes |
| Address lines, landmark, locality, city, state, pincode | Yes |
| Google Maps URL / embed | Yes if used |
| Business hours | Yes if displayed |

Public pages must read these from settings API (or build-time cache refreshed from API) — not only from hardcoded `data.ts`. Prefer: `data.ts` brand helpers remain for marketing prose, but **contact/address/logo** become settings-driven. If dual sources exist during migration, settings win for contact block.

### 2. SEO defaults

- Site name, title template, default meta description  
- Default OG image  
- Locality phrase (“Kurnool”)  
- Robots / indexing flags if applicable  

### 3. Social

- Instagram, Facebook, YouTube, WhatsApp link, Google Business, others  
- Public footer/icons consume these  

### 4. Measurements & banner sizes

- Default measurement unit (inches)  
- Banner size presets (width/height/aspect) shown by BannerSizeGuide  
- Optional image max upload size  

### 5. Staff & roles

- Section with summary + buttons linking to Staff Management and User Roles  
- Not a duplicate employee editor inside Settings  

### 6. Email (SMTP & templates)

- SMTP host, port, user, password/secret ref, from name/email, secure flag  
- Template keys: enquiry received, order confirmed (Reference ID), password setup, etc.  
- Test email action  
- Secrets never returned in plain GET responses (mask)  

### 7. Theme

- Primary/accent tokens only if safe  
- Font pairing caution — preserve existing expressive fonts  
- “Reset to brand defaults” control  
- Do not encourage generic purple themes  

## Workflow

1. Admin opens Settings  
2. Updates General contact/address → Save  
3. Public Contact/Footer fetch updated values  
4. Admin configures SMTP → sends test email  
5. SEO defaults feed new CMS content generation  
6. Banner size presets appear in CMS image guides  

## UI Requirements

- Extend `frontend/src/pages/admin/settings/SettingsAdminPage.tsx`  
- Sectioned layout (tabs or side nav): General | SEO | Social | Media sizes | Email | Theme | Staff & roles  
- Reuse ImageUpload for logo  
- ConfirmDialog on destructive resets  
- Clear “Public site sync” callout on General section  

## Forms / Fields

See feature sections above. Critical General fields:

| Field | Required |
|-------|----------|
| Company name | Yes |
| Phone | Yes |
| Email | Yes |
| Address / locality / city | Recommended |
| Logo | Recommended |

Email SMTP:

| Field | Required |
|-------|----------|
| Host | Yes to enable mail |
| Port | Yes |
| From email | Yes |
| Auth user/pass | Per provider |

## Tables / Columns

Settings is form-centric. Optional audit table later: who changed what.

Email templates list:

| Key | Subject | Updated | Actions |
|-----|---------|---------|---------|
| enquiry_received | … | … | Edit |
| order_confirmed | … | … | Edit |

## Filters / Search / Actions

**Actions:** save section, reset section, test email, upload logo, open Staff, open Roles.

**Search/filters:** N/A.

## Validations

- Email formats  
- Phone sanity  
- SMTP test must fail gracefully with message  
- Theme colors valid hex  
- Cannot blank company name  
- Mask secrets on read; require re-entry to change password  

## Data Model (high level)

```
Settings {
  general: { name, shortName, tagline, logoUrl, phones[], email, whatsapp, address{}, hours{}, mapsUrl }
  seoDefaults: { siteName, titleTemplate, defaultDescription, defaultOgImage, localityPhrase }
  social: { instagram, facebook, youtube, whatsappLink, googleBusiness, ... }
  media: { defaultUnit, bannerPresets[], maxUploadBytes }
  email: { smtp: { host, port, secure, user, passEncrypted }, fromName, fromEmail, templates[] }
  theme: { primary, accent, ...limited }
  updatedAt, updatedBy
}
```

Prefer single settings document (singleton) as many apps already do.

## API Requirements

- `GET /api/settings/public` — **unauthenticated** subset safe for website (no SMTP secrets)  
- `GET /api/admin/settings` — full admin (secrets masked)  
- `PATCH /api/admin/settings` — sectioned patch  
- `POST /api/admin/settings/test-email`  
- Public frontend Contact/Footer must use `/api/settings/public`  

## Relationships

| Module | Relationship |
|--------|--------------|
| Public website | Consumes public settings |
| 12 SEO | Defaults |
| 11 CMS | Banner sizes, logo |
| 16 Notifications | SMTP + templates |
| 05 Measurements | Default unit |
| 09 / 15 | Link-outs |
| `frontend/src/pages/home/data.ts` | Keep brand prose; sync contact fields from settings |

## Acceptance Criteria

- [x] Existing settings page expanded, not replaced blindly  
- [x] Updating phone/address/logo reflects on public contact/footer without redeploy (API-driven)  
- [x] SEO defaults available to SEO generator  
- [x] Social links render on public site  
- [x] SMTP test email works when configured  
- [x] Secrets masked in API responses  
- [x] Theme changes cannot wipe brand fonts/colors accidentally (reset available)  

## Future Enhancements

- Multi-location branches  
- Per-template visual email builder  
- WhatsApp Business API credentials section  
- Feature flags for ERP modules  
- Audit log of settings changes  
