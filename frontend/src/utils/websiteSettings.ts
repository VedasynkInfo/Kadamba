import { defaultWebsiteSettings, type WebsiteSettings } from '@/pages/admin/data';

/**
 * The shape the API actually sends: a settings document where any section may
 * be missing entirely, or present with only the fields an editor has filled in.
 * `Partial<WebsiteSettings>` would be wrong here — it would require every nested
 * section to be complete.
 */
export type WebsiteSettingsInput = {
  [K in keyof WebsiteSettings]?: NonNullable<WebsiteSettings[K]> extends Array<infer U>
    ? Array<U>
    : NonNullable<WebsiteSettings[K]> extends object
      ? Partial<NonNullable<WebsiteSettings[K]>>
      : WebsiteSettings[K];
};

/**
 * Deep-merge API settings onto the studio's defaults.
 *
 * Settings arrive as a *partial* document: sections an editor has never opened
 * are absent entirely. Components index into those sections unconditionally
 * (`settings.media.bannerPresets[0]`, `settings.seo.siteName`), so a missing
 * section would crash the page rather than render a blank field.
 *
 * This is not demo content: for a single-tenant boutique these defaults are the
 * studio's own configuration. It exists so an unconfigured section renders its
 * sensible default rather than throwing.
 */
export function mergeWebsiteSettings(
  partial?: WebsiteSettingsInput | null,
): WebsiteSettings {
  const base = structuredClone(defaultWebsiteSettings);
  if (!partial) return base;

  return {
    ...base,
    ...partial,
    addressLines: partial.addressLines?.length ? partial.addressLines : base.addressLines,
    hours: partial.hours?.length ? partial.hours : base.hours,
    social: partial.social?.length ? partial.social : base.social,
    socialNamed: { ...base.socialNamed, ...(partial.socialNamed || {}) },
    seo: { ...base.seo, ...(partial.seo || {}) },
    media: {
      ...base.media,
      ...(partial.media || {}),
      bannerPresets: partial.media?.bannerPresets?.length
        ? partial.media.bannerPresets
        : base.media.bannerPresets,
    },
    emailConfig: {
      ...base.emailConfig!,
      ...(partial.emailConfig || {}),
      templates: partial.emailConfig?.templates?.length
        ? partial.emailConfig.templates
        : base.emailConfig!.templates,
    },
    theme: { ...base.theme, ...(partial.theme || {}) },
  };
}
