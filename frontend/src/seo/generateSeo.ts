/**
 * Shared SEO pack generation from title (+ summary/image + Settings defaults).
 * Used by CMS admin forms — Module 12.
 */

export interface SeoSiteDefaults {
  siteName?: string;
  titleTemplate?: string;
  defaultDescription?: string;
  localityPhrase?: string;
  defaultOgImage?: string;
}

export interface GenerateSeoInput {
  title: string;
  summary?: string;
  imageUrl?: string;
  site?: SeoSiteDefaults;
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
  imageTitle: string;
  imageCaption: string;
  imageDescription: string;
}

export function slugifyTitle(title: string): string {
  return (
    title
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
  const siteName = input.site?.siteName?.trim() || "Kadamba's Designer Studio";
  const locality = input.site?.localityPhrase?.trim() || 'Kurnool';
  const template = input.site?.titleTemplate || '{{title}} | {{siteName}}';

  const metaTitle = truncate(
    template.replace(/\{\{\s*title\s*\}\}/g, title).replace(/\{\{\s*siteName\s*\}\}/g, siteName),
    60,
  );

  const summary = (input.summary || '').trim();
  const fallbackDesc =
    input.site?.defaultDescription?.trim() ||
    `${title} at ${siteName} in ${locality} — boutique and custom tailoring for women's traditional and bridal wear.`;
  const metaDescription = truncate(summary || fallbackDesc, 160);

  const imageUrl = input.imageUrl || input.site?.defaultOgImage || '';
  const imageAlt = `${title} — ${siteName}, ${locality}`;

  return {
    slug: slugifyTitle(title),
    metaTitle,
    metaDescription,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    ogImage: imageUrl,
    twitterTitle: metaTitle,
    twitterDescription: metaDescription,
    twitterImage: imageUrl,
    imageAlt,
    imageTitle: title,
    imageCaption: title,
    imageDescription: `${title} from ${siteName} in ${locality}.`,
  };
}

export type SeoAutoFlags = Partial<
  Record<
    | 'slug'
    | 'metaTitle'
    | 'metaDescription'
    | 'ogTitle'
    | 'ogDescription'
    | 'ogImage'
    | 'twitterTitle'
    | 'twitterDescription'
    | 'twitterImage'
    | 'imageAlt',
    boolean
  >
>;

export const defaultSeoAutoFlags: Required<SeoAutoFlags> = {
  slug: true,
  metaTitle: true,
  metaDescription: true,
  ogTitle: true,
  ogDescription: true,
  ogImage: true,
  twitterTitle: true,
  twitterDescription: true,
  twitterImage: true,
  imageAlt: true,
};
