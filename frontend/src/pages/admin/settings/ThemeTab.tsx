import type { CSSProperties } from 'react';
import type { WebsiteSettings } from '../data';
import { DEFAULT_THEME_TOKENS, THEME_PRESETS } from '@/theme/palettes';

interface ThemeTabProps {
  form: WebsiteSettings;
  patchForm: (updater: (prev: WebsiteSettings) => WebsiteSettings) => void;
  onResetTheme: () => void;
}

interface ColorFieldProps {
  label: string;
  sub: string;
  value: string;
  fallback: string;
  onChange: (val: string) => void;
}

/**
 * The presets and the live preview paint colours the studio is *choosing*, so
 * they cannot be static classes. They can still stay out of the style
 * attribute's colour properties: these helpers hand the values over as custom
 * properties, and the class names say which surface each one is — the same
 * split the real interface uses.
 */
type PreviewVars = CSSProperties & Record<`--${string}`, string>;

function previewVars(vars: Record<`--${string}`, string>): PreviewVars {
  return vars;
}

function ColorField({ label, sub, value, fallback, onChange }: ColorFieldProps) {
  const current = value || fallback;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-sunken p-3 transition-colors">
      <div className="min-w-0 flex-1">
        <label className="block text-[11px] font-semibold tracking-wide truncate">
          {label}
        </label>
        <span className="text-[10px] opacity-60 block truncate mt-0.5">{sub}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <input
            type="color"
            value={current.startsWith('#') ? current : fallback}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded-lg border border-line bg-transparent p-0.5 opacity-90 hover:opacity-100"
            title={`Select ${label}`}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          className="w-20 rounded-lg border border-line bg-surface-sunken py-1.5 px-2 text-center text-[11px] font-mono uppercase text-ink focus:outline-none focus:ring-1 focus:ring-focus"
        />
      </div>
    </div>
  );
}

export function ThemeTab({ form, patchForm, onResetTheme }: ThemeTabProps) {
  const t = form.theme;

  function updateTheme(key: keyof typeof t, val: string) {
    patchForm((f) => ({
      ...f,
      theme: {
        ...f.theme,
        [key]: val,
      },
    }));
  }

  function applyPreset(preset: Partial<typeof t>) {
    patchForm((f) => ({
      ...f,
      theme: {
        ...f.theme,
        ...preset,
      },
    }));
  }

  return (
    <div className="space-y-6 text-xs">
      {/* Luxury Theme Presets */}
      <div className="space-y-3 rounded-2xl border border-line bg-surface-raised p-5 text-ink-raised shadow-xs transition-colors">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-heading text-sm font-bold tracking-wide">
              Haute Couture Palette Presets
            </h3>
            <p className="text-[10px] opacity-60 mt-0.5">
              1-click luxury atelier themes inspired by royal fabrics and midnight atelier palettes
            </p>
          </div>
          <button
            type="button"
            onClick={onResetTheme}
            className="text-xs font-semibold text-rose-400 hover:underline cursor-pointer"
          >
            ↺ Reset to Default
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.tokens)}
              className="cursor-pointer rounded-xl border border-[var(--pv-border)] bg-[var(--pv-card)] p-3 text-left transition hover:scale-[1.02]"
              style={previewVars({
                '--pv-card': preset.tokens.adminCard ?? 'var(--admin-card)',
                '--pv-border': preset.tokens.adminPrimary ?? 'var(--admin-border)',
              })}
            >
              <div className="flex gap-1 mb-2">
                {preset.swatches.map((color, index) => (
                  <span
                    key={`${preset.id}-swatch-${index}`}
                    className={
                      index < 2
                        ? 'h-4 w-4 rounded-full border border-white/20 bg-[var(--pv-swatch)]'
                        : 'h-4 w-4 rounded-full bg-[var(--pv-swatch)]'
                    }
                    style={previewVars({ '--pv-swatch': color })}
                  />
                ))}
              </div>
              <span className={`font-bold text-xs block ${preset.labelClassName}`}>{preset.name}</span>
              <span className="text-[10px] opacity-60">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Interactive Preview Card */}
      <div className="rounded-2xl border border-line bg-surface-raised p-5 text-ink-raised shadow-xs transition-colors">
        <div className="border-b border-line pb-3 mb-4">
          <h3 className="font-heading text-sm font-bold tracking-wide">Real-time Interface Palette Preview</h3>
          <p className="text-[10px] opacity-60 mt-0.5">Live mockup of your selected studio color combinations</p>
        </div>

        {/* Every preview colour is set once, here, and inherited: the elements
            below name the surface they are painting, never the colour. */}
        <div
          className="rounded-xl border border-line bg-[var(--pv-page)] p-4 text-[var(--pv-page-text)] transition-colors"
          style={previewVars({
            '--pv-page': t.adminBg || 'var(--admin-bg)',
            '--pv-page-text': t.adminText || 'var(--admin-text)',
            '--pv-sidebar': t.adminSidebar || 'var(--admin-sidebar)',
            '--pv-sidebar-text': t.adminSidebarText || 'var(--admin-sidebar-text)',
            '--pv-card': t.adminCard || 'var(--admin-card)',
            '--pv-card-text': t.adminCardText || 'var(--admin-card-text)',
            '--pv-brand': t.adminPrimary || 'var(--admin-primary)',
            '--pv-brand-text': t.adminPrimaryText || 'var(--admin-primary-text)',
            '--pv-accent': t.adminAccent || 'var(--admin-accent)',
          })}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Sidebar Mockup */}
            <div className="w-full space-y-2 rounded-lg bg-[var(--pv-sidebar)] p-3 text-[var(--pv-sidebar-text)] sm:w-44">
              <div className="font-bold text-xs pb-1 border-b border-white/10">Kadamba Studio</div>
              <div className="text-[10px] opacity-80 space-y-1">
                <div className="p-1 rounded bg-white/10 font-medium">Dashboard</div>
                <div className="p-1 rounded">Orders</div>
                <div className="p-1 rounded">Measurements</div>
                <div className="p-1 rounded">Finance</div>
              </div>
            </div>

            {/* Content Mockup */}
            <div className="flex-1 space-y-3">
              <div className="rounded-lg border border-line bg-[var(--pv-card)] p-3.5 text-[var(--pv-card-text)] shadow-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs">Atelier Card Surface</span>
                  <span className="rounded bg-[var(--pv-accent)]/25 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--pv-accent)]">
                    Accent Gold
                  </span>
                </div>
                <p className="text-[11px] opacity-75">
                  Dynamic card surface typography, tables, and dialog surfaces automatically reflect this configuration.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    className="cursor-pointer rounded-lg bg-[var(--pv-brand)] px-3 py-1.5 text-xs font-bold text-[var(--pv-brand-text)] shadow-xs"
                  >
                    Primary Button
                  </button>
                  <span className="text-[10px] opacity-60">Interactive state</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Studio Theme Variables */}
      <div className="space-y-4 rounded-2xl border border-line bg-surface-raised p-5 text-ink-raised shadow-xs transition-colors">
        <div className="border-b border-line pb-3">
          <h3 className="font-heading text-sm font-bold tracking-wide">
            1. Admin Studio Workspace Variables
          </h3>
          <p className="text-[10px] opacity-60 mt-0.5">
            Controls colors for admin sidebar, workspace background, panel surfaces, and action buttons
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ColorField
            label="Admin Page Background"
            sub="Workspace backdrop"
            value={t.adminBg || ''}
            fallback={DEFAULT_THEME_TOKENS.adminBg}
            onChange={(val) => updateTheme('adminBg', val)}
          />
          <ColorField
            label="Admin Page Text"
            sub="Body typography"
            value={t.adminText || ''}
            fallback={DEFAULT_THEME_TOKENS.adminText}
            onChange={(val) => updateTheme('adminText', val)}
          />
          <ColorField
            label="Sidebar Background"
            sub="Navigation rail"
            value={t.adminSidebar || ''}
            fallback={DEFAULT_THEME_TOKENS.adminSidebar}
            onChange={(val) => updateTheme('adminSidebar', val)}
          />
          <ColorField
            label="Sidebar Text"
            sub="Nav menu items"
            value={t.adminSidebarText || ''}
            fallback={DEFAULT_THEME_TOKENS.adminSidebarText}
            onChange={(val) => updateTheme('adminSidebarText', val)}
          />
          <ColorField
            label="Card / Panel Surface"
            sub="Data tables & cards"
            value={t.adminCard || ''}
            fallback={DEFAULT_THEME_TOKENS.adminCard}
            onChange={(val) => updateTheme('adminCard', val)}
          />
          <ColorField
            label="Card Text Color"
            sub="Headers in cards"
            value={t.adminCardText || ''}
            fallback={DEFAULT_THEME_TOKENS.adminCardText}
            onChange={(val) => updateTheme('adminCardText', val)}
          />
          <ColorField
            label="Primary Action Button"
            sub="Save, create & submit"
            value={t.adminPrimary || ''}
            fallback={DEFAULT_THEME_TOKENS.adminPrimary}
            onChange={(val) => updateTheme('adminPrimary', val)}
          />
          <ColorField
            label="Primary Button Text"
            sub="Typography on button"
            value={t.adminPrimaryText || ''}
            fallback={DEFAULT_THEME_TOKENS.adminPrimaryText}
            onChange={(val) => updateTheme('adminPrimaryText', val)}
          />
          <ColorField
            label="Admin Accent Gold"
            sub="Pills, badges & highlights"
            value={t.adminAccent || ''}
            fallback={DEFAULT_THEME_TOKENS.adminAccent}
            onChange={(val) => updateTheme('adminAccent', val)}
          />
        </div>
      </div>

      {/* Public Storefront Theme Variables */}
      <div className="space-y-4 rounded-2xl border border-line bg-surface-raised p-5 text-ink-raised shadow-xs transition-colors">
        <div className="border-b border-line pb-3">
          <h3 className="font-heading text-sm font-bold tracking-wide">
            2. Public Storefront Theme Variables
          </h3>
          <p className="text-[10px] opacity-60 mt-0.5">
            Controls client-facing homepage, lookbook, services catalog, and consultation portal
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ColorField
            label="Public Brand Primary"
            sub="Hero links & buttons"
            value={t.primary || ''}
            fallback={DEFAULT_THEME_TOKENS.primary}
            onChange={(val) => updateTheme('primary', val)}
          />
          <ColorField
            label="Public Accent Gold"
            sub="Embellishments & borders"
            value={t.accent || ''}
            fallback={DEFAULT_THEME_TOKENS.accent}
            onChange={(val) => updateTheme('accent', val)}
          />
          <ColorField
            label="Public Page Background"
            sub="Storefront backdrop"
            value={t.publicBg || ''}
            fallback={DEFAULT_THEME_TOKENS.publicBg}
            onChange={(val) => updateTheme('publicBg', val)}
          />
          <ColorField
            label="Public Page Text"
            sub="Headings & paragraphs"
            value={t.publicText || ''}
            fallback={DEFAULT_THEME_TOKENS.publicText}
            onChange={(val) => updateTheme('publicText', val)}
          />
          <ColorField
            label="Public Card Surface"
            sub="Product & gallery tiles"
            value={t.publicCard || ''}
            fallback={DEFAULT_THEME_TOKENS.publicCard}
            onChange={(val) => updateTheme('publicCard', val)}
          />
          <ColorField
            label="Public Card Text"
            sub="Titles on cards"
            value={t.publicCardText || ''}
            fallback={DEFAULT_THEME_TOKENS.publicCardText}
            onChange={(val) => updateTheme('publicCardText', val)}
          />
          <ColorField
            label="Public Button Text"
            sub="Button label color"
            value={t.primaryText || ''}
            fallback={DEFAULT_THEME_TOKENS.primaryText}
            onChange={(val) => updateTheme('primaryText', val)}
          />
        </div>
      </div>
    </div>
  );
}
