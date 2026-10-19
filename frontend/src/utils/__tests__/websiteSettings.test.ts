import { describe, expect, it } from 'vitest';
import { mergeWebsiteSettings } from '@/utils/websiteSettings';
import { defaultWebsiteSettings } from '@/pages/admin/data';

describe('mergeWebsiteSettings', () => {
  it('returns the studio defaults when nothing has been configured', () => {
    const merged = mergeWebsiteSettings(undefined);
    expect(merged).toEqual(defaultWebsiteSettings);
    expect(merged).not.toBe(defaultWebsiteSettings);
  });

  it('treats null the same as absent', () => {
    expect(mergeWebsiteSettings(null)).toEqual(defaultWebsiteSettings);
  });

  it('overrides scalar values from the API', () => {
    const merged = mergeWebsiteSettings({ email: 'studio@example.com' });
    expect(merged.email).toBe('studio@example.com');
    // Untouched scalars keep their defaults.
    expect(merged.city).toBe(defaultWebsiteSettings.city);
  });

  it('accepts a partial nested section and fills the rest from defaults', () => {
    const merged = mergeWebsiteSettings({ seo: { siteName: 'Kadamba Atelier' } });

    expect(merged.seo.siteName).toBe('Kadamba Atelier');
    // Every other SEO field still exists, so components can index into it.
    expect(merged.seo.titleTemplate).toBe(defaultWebsiteSettings.seo.titleTemplate);
    expect(merged.theme).toEqual(defaultWebsiteSettings.theme);
  });

  it('substitutes defaults for sections the API left empty rather than blanking the UI', () => {
    const merged = mergeWebsiteSettings({
      addressLines: [],
      hours: [],
      social: [],
    });

    expect(merged.addressLines).toEqual(defaultWebsiteSettings.addressLines);
    expect(merged.hours).toEqual(defaultWebsiteSettings.hours);
    expect(merged.social).toEqual(defaultWebsiteSettings.social);
  });

  it('prefers non-empty API arrays over the defaults', () => {
    const merged = mergeWebsiteSettings({
      addressLines: ['12 Test Street', 'Kurnool'],
    });

    expect(merged.addressLines).toEqual(['12 Test Street', 'Kurnool']);
  });

  it('deep-merges the media section and keeps its banner presets', () => {
    const merged = mergeWebsiteSettings({
      media: { bannerPresets: [] },
    });

    expect(merged.media.bannerPresets).toEqual(defaultWebsiteSettings.media.bannerPresets);
    expect(merged.media.defaultUnit).toBe(defaultWebsiteSettings.media.defaultUnit);
  });

  it('deep-merges the email templates section', () => {
    const merged = mergeWebsiteSettings({ emailConfig: { templates: [] } });

    expect(merged.emailConfig?.templates).toEqual(defaultWebsiteSettings.emailConfig?.templates);
  });

  it('deep-merges the social handles and theme tokens', () => {
    const merged = mergeWebsiteSettings({
      socialNamed: { instagram: 'https://instagram.com/kadamba' },
      theme: { accent: '#123456' },
    });

    expect(merged.socialNamed.instagram).toBe('https://instagram.com/kadamba');
    expect(merged.socialNamed.facebook).toBe(defaultWebsiteSettings.socialNamed.facebook);
    expect(merged.theme.accent).toBe('#123456');
    expect(merged.theme.fontFamily).toBe(defaultWebsiteSettings.theme.fontFamily);
  });

  it('does not mutate the defaults it merges onto', () => {
    const before = JSON.stringify(defaultWebsiteSettings);
    mergeWebsiteSettings({ email: 'mutated@example.com' });
    expect(JSON.stringify(defaultWebsiteSettings)).toBe(before);
  });

  it('returns a detached object, so a caller cannot corrupt the defaults', () => {
    const merged = mergeWebsiteSettings();
    merged.seo.siteName = 'Changed';
    merged.addressLines.push('Injected');

    expect(defaultWebsiteSettings.seo.siteName).not.toBe('Changed');
    expect(defaultWebsiteSettings.addressLines).not.toContain('Injected');
  });
});
