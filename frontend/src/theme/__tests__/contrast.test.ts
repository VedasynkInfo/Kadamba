import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME_TOKENS, THEME_PRESETS } from '@/theme/palettes';
import { contrastRatio, readableOn } from '@/utils/contrast';

type Theme = typeof DEFAULT_THEME_TOKENS;

const themes: Array<{ name: string; theme: Theme }> = [
  { name: 'default', theme: DEFAULT_THEME_TOKENS },
  ...THEME_PRESETS.map((preset) => ({
    name: preset.name,
    theme: { ...DEFAULT_THEME_TOKENS, ...preset.tokens } as Theme,
  })),
];

const AA = 4.5;
const UI = 3;

for (const { name, theme } of themes) {
  describe(`${name} theme`, () => {
    it('keeps body text at AA on the page and on cards', () => {
      expect(contrastRatio(theme.publicText, theme.publicBg)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(theme.publicCardText, theme.publicCard)).toBeGreaterThanOrEqual(AA);
    });

    it('keeps filled button labels at AA', () => {
      expect(contrastRatio(theme.primaryText, theme.primary)).toBeGreaterThanOrEqual(AA);
    });

    it('keeps the console readable', () => {
      expect(contrastRatio(theme.adminText, theme.adminBg)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(theme.adminCardText, theme.adminCard)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(theme.adminSidebarText, theme.adminSidebar)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(theme.adminPrimaryText, theme.adminPrimary)).toBeGreaterThanOrEqual(AA);
    });

    it('derives an accent that is legible as text', () => {
      const textAccent = readableOn(theme.publicBg, theme.accent);
      expect(contrastRatio(textAccent, theme.publicBg)).toBeGreaterThanOrEqual(AA);
    });

    it('has a focus ring that is visible on the page', () => {
      expect(
        contrastRatio(readableOn(theme.publicBg, theme.accent, UI), theme.publicBg),
      ).toBeGreaterThanOrEqual(UI);
    });
  });
}

describe('default semantic tokens', () => {
  it('keeps the static first-paint accent text-safe on cream', () => {
    expect(contrastRatio('#8a6d2f', DEFAULT_THEME_TOKENS.publicBg)).toBeGreaterThanOrEqual(AA);
  });

  it('keeps the public focus ring visible on cream', () => {
    expect(contrastRatio('#8a6d2f', DEFAULT_THEME_TOKENS.publicBg)).toBeGreaterThanOrEqual(UI);
  });

  it('keeps danger text at AA in both shells', () => {
    expect(contrastRatio('#b91c1c', DEFAULT_THEME_TOKENS.publicBg)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio('#fb7185', DEFAULT_THEME_TOKENS.adminBg)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio('#fb7185', DEFAULT_THEME_TOKENS.adminCard)).toBeGreaterThanOrEqual(AA);
  });
});
