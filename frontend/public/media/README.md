# Media assets

## `placeholders/`

Fallback artwork for the marketing pages, used when the CMS has no uploaded
content yet (an empty database, a fresh deploy, or an offline preview).

They are **generated locally and committed**, so the site has no third-party
image dependency. Previously these slots hotlinked stock photos from an external
CDN, which meant every page load depended on someone else's uptime, leaked
visitor IPs to a third party, and could not be optimised with `srcset`.

They are deliberately abstract — layered gradients with a textile-inspired
ornament in the studio palette — rather than fabricated "photography". Replace
them with real studio photography as it becomes available.

Regenerate with:

```bash
cd backend && npm run assets:placeholders
```

The generator lives in `backend/src/scripts/generatePlaceholders.ts` because
`sharp` is a backend dependency. It reads and writes files only; it never
touches the database.

## `og-default.jpg`

The default social share card (1200×630). Must be a raster format — WhatsApp,
X/Twitter and Facebook do not render SVG `og:image` — so it is produced as a
JPEG by the same generator.

Uploading a custom image in **Admin → Settings → SEO** overrides it.
