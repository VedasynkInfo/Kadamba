/**
 * Palette data: the colours a studio picks, kept in one module.
 *
 * Colour here is data rather than styling. The Settings → Theme editor writes
 * these values into CSS custom properties at runtime, the API stores them on the
 * settings record, and the editor offers presets drawn from them. They therefore
 * have to exist as literals somewhere in JS — this is that somewhere. It is a
 * *source*, not presentation, which is why `scripts/check-tokens.mjs` allowlists
 * it.
 *
 * Everything that is *rendered* must instead use the semantic utilities generated
 * by `src/index.css` (`bg-surface-raised`, `text-ink`, `border-line`, `bg-brand`,
 * …) or read a CSS custom property, never a raw hex literal or a value from here.
 *
 * Import-direction wart: we take the `WebsiteSettings` *type* from
 * `pages/admin/data.ts`, while `data.ts` takes `DEFAULT_THEME_TOKENS` back from
 * here. That reads as a cycle, but the type import is erased at build time, so
 * the only runtime edge is `data.ts → palettes.ts`. Kept rather than lifting the
 * settings type into its own module because `ThemeContext` already imports it
 * this same way.
 */
import type { WebsiteSettings } from '@/pages/admin/data';

/**
 * The built-in theme, used until the studio saves its own.
 *
 * Typed `Required` because the defaults are exactly that: every field the editor
 * can set has a value here. That is what lets the editor use
 * `DEFAULT_THEME_TOKENS.<field>` as a field's fallback and get a `string` — one
 * source of defaults rather than a literal per control.
 */
export const DEFAULT_THEME_TOKENS: Required<WebsiteSettings['theme']> = {
  primary: '#000000',
  primaryHover: '#1a1a1a',
  primaryText: '#ffffff',
  accent: '#b59410',
  publicBg: '#ffffff',
  publicText: '#171717',
  publicCard: '#ffffff',
  publicCardText: '#171717',
  publicSurface: '#fafafa',
  adminBg: '#0b0f17',
  adminText: '#f3f4f6',
  adminCard: '#1f2937',
  adminCardText: '#f3f4f6',
  adminSidebar: '#111827',
  adminSidebarText: '#f3f4f6',
  adminPrimary: '#b59410',
  adminPrimaryText: '#000000',
  adminAccent: '#ffd700',
  fontFamily: 'Manrope, sans-serif',
};

/**
 * The curated atelier palettes offered in the theme editor.
 *
 * Each preset only overrides the tokens it means to change, so `tokens` is a
 * partial theme and the editor merges it over the current form. `swatches` is
 * the four signature dots drawn on the preset tile, and `labelClassName` its
 * label tone — tile presentation, but still palette data, so it lives here with
 * the values it describes rather than back in the component.
 */
export const THEME_PRESETS: ReadonlyArray<{
  id: string;
  name: string;
  description: string;
  tokens: Partial<WebsiteSettings['theme']>;
  swatches: readonly string[];
  labelClassName: string;
}> = [
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    description: 'Signature Atelier',
    tokens: {
      primary: '#b59410',
      accent: '#d4af37',
      publicBg: '#0f141c',
      publicText: '#f3f4f6',
      publicCard: '#141b26',
      publicCardText: '#f3f4f6',
      primaryText: '#ffffff',
      adminBg: '#0b0f17',
      adminText: '#f3f4f6',
      adminSidebar: '#0f141c',
      adminSidebarText: '#f3f4f6',
      adminCard: '#141b26',
      adminCardText: '#f3f4f6',
      adminPrimary: '#b59410',
      adminPrimaryText: '#ffffff',
      adminAccent: '#d4af37',
    },
    swatches: ['#0b0f17', '#141b26', '#b59410', '#d4af37'],
    labelClassName: 'text-amber-400',
  },
  {
    id: 'haute-monochrome',
    name: 'Haute Monochrome',
    description: 'Architectural Minimal',
    tokens: {
      primary: '#27272a',
      accent: '#52525b',
      publicBg: '#09090b',
      publicText: '#fafafa',
      publicCard: '#18181b',
      publicCardText: '#fafafa',
      primaryText: '#ffffff',
      adminBg: '#09090b',
      adminText: '#fafafa',
      adminSidebar: '#18181b',
      adminSidebarText: '#fafafa',
      adminCard: '#18181b',
      adminCardText: '#fafafa',
      adminPrimary: '#3f3f46',
      adminPrimaryText: '#ffffff',
      adminAccent: '#a1a1aa',
    },
    swatches: ['#09090b', '#18181b', '#3f3f46', '#fafafa'],
    labelClassName: 'text-white',
  },
  {
    id: 'royal-emerald',
    name: 'Royal Emerald',
    description: 'Zardozi Heritage',
    tokens: {
      primary: '#059669',
      accent: '#10b981',
      publicBg: '#061712',
      publicText: '#ecfdf5',
      publicCard: '#0d2820',
      publicCardText: '#ecfdf5',
      primaryText: '#ffffff',
      adminBg: '#04100c',
      adminText: '#ecfdf5',
      adminSidebar: '#09211a',
      adminSidebarText: '#ecfdf5',
      adminCard: '#0d2820',
      adminCardText: '#ecfdf5',
      adminPrimary: '#059669',
      adminPrimaryText: '#ffffff',
      adminAccent: '#34d399',
    },
    swatches: ['#04100c', '#0d2820', '#059669', '#10b981'],
    labelClassName: 'text-emerald-400',
  },
  {
    id: 'rose-gold-velvet',
    name: 'Rose Gold Velvet',
    description: 'Bridal Romance',
    tokens: {
      primary: '#be185d',
      accent: '#f43f5e',
      publicBg: '#1c0812',
      publicText: '#fdf2f8',
      publicCard: '#2c0d1d',
      publicCardText: '#fdf2f8',
      primaryText: '#ffffff',
      adminBg: '#14050d',
      adminText: '#fdf2f8',
      adminSidebar: '#230a17',
      adminSidebarText: '#fdf2f8',
      adminCard: '#2c0d1d',
      adminCardText: '#fdf2f8',
      adminPrimary: '#be185d',
      adminPrimaryText: '#ffffff',
      adminAccent: '#fb7185',
    },
    swatches: ['#14050d', '#2c0d1d', '#be185d', '#fb7185'],
    labelClassName: 'text-pink-400',
  },
];

/** Categorical series colours for pie/donut charts, in display order. */
export const CHART_COLORS = ['#ffd700', '#f59e0b', '#10b981', '#6366f1', '#ec4899'] as const;

/** Single-series fill for the revenue bar. */
export const CHART_REVENUE = '#10b981';

/**
 * The report desk's ink-and-gold series ramp — an ordered scale, darkest first,
 * for stacked and grouped bars. It is deliberately the studio's palette rather
 * than the categorical one above: a P&L breakdown reads as one family.
 */
export const REPORT_CHART_COLORS = [
  '#000000',
  '#b59410',
  '#8a731e',
  '#4a3f12',
  '#c5a228',
  '#6b5a1a',
] as const;

/** Named members of `REPORT_CHART_COLORS`, for single-series charts. */
export const REPORT_CHART_SERIES = {
  gold: '#b59410',
  ink: '#000000',
  bronze: '#8a731e',
  umber: '#4a3f12',
} as const;

/** Chart grid hairline: alpha, so it sits on whatever surface the chart is on. */
export const REPORT_CHART_GRID = '#00000015';
