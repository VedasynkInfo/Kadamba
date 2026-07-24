import { getPublicSettings } from '../services/settingsService';

export interface GenerateSeoInput {
  title: string;
  summary?: string;
  imageUrl?: string;
  siteName?: string;
  localityPhrase?: string;
  titleTemplate?: string;
  defaultDescription?: string;
  defaultOgImage?: string;
}

export interface SeoPack {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  imageAlt: string;
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'item'
  );
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function generateSeoFromTitle(input: GenerateSeoInput): SeoPack {
  const title = input.title.trim() || 'Untitled';
  const siteName = input.siteName?.trim() || "Kadamba's Designer Studio";
  const locality = input.localityPhrase?.trim() || 'Kurnool';
  const template = input.titleTemplate || '{{title}} | {{siteName}}';

  const metaTitle = truncate(
    template.replace(/\{\{\s*title\s*\}\}/g, title).replace(/\{\{\s*siteName\s*\}\}/g, siteName),
    60,
  );

  const summary = (input.summary || '').trim();
  const fallbackDesc =
    input.defaultDescription?.trim() ||
    `${title} at ${siteName} in ${locality} — boutique and custom tailoring for women's traditional and bridal wear.`;
  const metaDescription = truncate(summary || fallbackDesc, 160);
  const imageUrl = input.imageUrl || input.defaultOgImage || '';

  return {
    slug: slugify(title),
    metaTitle,
    metaDescription,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    ogImage: imageUrl,
    twitterTitle: metaTitle,
    twitterDescription: metaDescription,
    twitterImage: imageUrl,
    imageAlt: `${title} — ${siteName}, ${locality}`,
  };
}

/** Load Settings SEO defaults then generate. */
export async function generateSeoWithSettings(
  input: Omit<GenerateSeoInput, 'siteName' | 'localityPhrase' | 'titleTemplate' | 'defaultDescription' | 'defaultOgImage'>,
): Promise<SeoPack> {
  const site: Omit<GenerateSeoInput, 'title'> = {};
  try {
    const settings = await getPublicSettings();
    const seo = (settings.seo || {}) as Record<string, unknown>;
    site.siteName = String(seo.siteName || settings.studioName || '');
    site.localityPhrase = String(seo.localityPhrase || settings.location || 'Kurnool');
    site.titleTemplate = String(seo.titleTemplate || '{{title}} | {{siteName}}');
    site.defaultDescription = String(seo.defaultDescription || '');
    site.defaultOgImage = String(seo.defaultOgImage || '');
  } catch {
    // Settings optional
  }
  return generateSeoFromTitle({ ...site, ...input });
}

/**
 * Suggest next free slug (`-2`, `-3`, …) when `base` is taken.
 */
export async function suggestUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let n = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}
