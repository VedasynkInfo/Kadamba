import type { WebsiteSettings } from '../data';

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

function ColorField({ label, sub, value, fallback, onChange }: ColorFieldProps) {
  const current = value || fallback;

  return (
    <div
      className="rounded-xl border p-3 flex items-center justify-between gap-3 transition-colors"
      style={{
        backgroundColor: 'rgba(128, 128, 128, 0.04)',
        borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
      }}
    >
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
            className="h-8 w-8 cursor-pointer rounded-lg border border-black/20 bg-transparent p-0.5 opacity-90 hover:opacity-100"
            title={`Select ${label}`}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          className="w-20 rounded-lg border py-1.5 px-2 text-[11px] font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] text-center"
          style={{
            backgroundColor: 'rgba(128, 128, 128, 0.08)',
            borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
            color: 'inherit',
          }}
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
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-3 transition-colors"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
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
          {/* Preset 1: Midnight Gold */}
          <button
            type="button"
            onClick={() =>
              applyPreset({
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
              })
            }
            className="rounded-xl border p-3 text-left transition hover:scale-[1.02] cursor-pointer"
            style={{
              backgroundColor: '#141b26',
              borderColor: '#b59410',
            }}
          >
            <div className="flex gap-1 mb-2">
              <span className="h-4 w-4 rounded-full bg-[#0b0f17] border border-white/20" />
              <span className="h-4 w-4 rounded-full bg-[#141b26] border border-white/20" />
              <span className="h-4 w-4 rounded-full bg-[#b59410]" />
              <span className="h-4 w-4 rounded-full bg-[#d4af37]" />
            </div>
            <span className="font-bold text-xs text-amber-400 block">Midnight Gold</span>
            <span className="text-[10px] opacity-60">Signature Atelier</span>
          </button>

          {/* Preset 2: Haute Couture Monochrome */}
          <button
            type="button"
            onClick={() =>
              applyPreset({
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
              })
            }
            className="rounded-xl border p-3 text-left transition hover:scale-[1.02] cursor-pointer"
            style={{
              backgroundColor: '#18181b',
              borderColor: '#3f3f46',
            }}
          >
            <div className="flex gap-1 mb-2">
              <span className="h-4 w-4 rounded-full bg-[#09090b] border border-white/20" />
              <span className="h-4 w-4 rounded-full bg-[#18181b] border border-white/20" />
              <span className="h-4 w-4 rounded-full bg-[#3f3f46]" />
              <span className="h-4 w-4 rounded-full bg-[#fafafa]" />
            </div>
            <span className="font-bold text-xs text-white block">Haute Monochrome</span>
            <span className="text-[10px] opacity-60">Architectural Minimal</span>
          </button>

          {/* Preset 3: Royal Emerald */}
          <button
            type="button"
            onClick={() =>
              applyPreset({
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
              })
            }
            className="rounded-xl border p-3 text-left transition hover:scale-[1.02] cursor-pointer"
            style={{
              backgroundColor: '#0d2820',
              borderColor: '#059669',
            }}
          >
            <div className="flex gap-1 mb-2">
              <span className="h-4 w-4 rounded-full bg-[#04100c] border border-white/20" />
              <span className="h-4 w-4 rounded-full bg-[#0d2820] border border-white/20" />
              <span className="h-4 w-4 rounded-full bg-[#059669]" />
              <span className="h-4 w-4 rounded-full bg-[#10b981]" />
            </div>
            <span className="font-bold text-xs text-emerald-400 block">Royal Emerald</span>
            <span className="text-[10px] opacity-60">Zardozi Heritage</span>
          </button>

          {/* Preset 4: Rose Gold Velvet */}
          <button
            type="button"
            onClick={() =>
              applyPreset({
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
              })
            }
            className="rounded-xl border p-3 text-left transition hover:scale-[1.02] cursor-pointer"
            style={{
              backgroundColor: '#2c0d1d',
              borderColor: '#be185d',
            }}
          >
            <div className="flex gap-1 mb-2">
              <span className="h-4 w-4 rounded-full bg-[#14050d] border border-white/20" />
              <span className="h-4 w-4 rounded-full bg-[#2c0d1d] border border-white/20" />
              <span className="h-4 w-4 rounded-full bg-[#be185d]" />
              <span className="h-4 w-4 rounded-full bg-[#fb7185]" />
            </div>
            <span className="font-bold text-xs text-pink-400 block">Rose Gold Velvet</span>
            <span className="text-[10px] opacity-60">Bridal Romance</span>
          </button>
        </div>
      </div>

      {/* Live Interactive Preview Card */}
      <div
        className="rounded-2xl border p-5 shadow-xs transition-colors"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        <div className="border-b pb-3 mb-4" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
          <h3 className="font-heading text-sm font-bold tracking-wide">Real-time Interface Palette Preview</h3>
          <p className="text-[10px] opacity-60 mt-0.5">Live mockup of your selected studio color combinations</p>
        </div>

        <div
          className="rounded-xl border p-4 transition-colors"
          style={{
            backgroundColor: t.adminBg || '#0b0f17',
            borderColor: 'rgba(128, 128, 128, 0.2)',
            color: t.adminText || '#f3f4f6',
          }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Sidebar Mockup */}
            <div
              className="w-full sm:w-44 rounded-lg p-3 space-y-2"
              style={{
                backgroundColor: t.adminSidebar || '#0f141c',
                color: t.adminSidebarText || '#f3f4f6',
              }}
            >
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
              <div
                className="rounded-lg p-3.5 border shadow-xs"
                style={{
                  backgroundColor: t.adminCard || '#141b26',
                  borderColor: 'rgba(128, 128, 128, 0.2)',
                  color: t.adminCardText || '#f3f4f6',
                }}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs">Atelier Card Surface</span>
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${t.adminAccent || '#d4af37'}25`,
                      color: t.adminAccent || '#d4af37',
                    }}
                  >
                    Accent Gold
                  </span>
                </div>
                <p className="text-[11px] opacity-75">
                  Dynamic card surface typography, tables, and dialog surfaces automatically reflect this configuration.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                    style={{
                      backgroundColor: t.adminPrimary || '#b59410',
                      color: t.adminPrimaryText || '#ffffff',
                    }}
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
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-4 transition-colors"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        <div className="border-b pb-3" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
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
            fallback="#0b0f17"
            onChange={(val) => updateTheme('adminBg', val)}
          />
          <ColorField
            label="Admin Page Text"
            sub="Body typography"
            value={t.adminText || ''}
            fallback="#f3f4f6"
            onChange={(val) => updateTheme('adminText', val)}
          />
          <ColorField
            label="Sidebar Background"
            sub="Navigation rail"
            value={t.adminSidebar || ''}
            fallback="#0f141c"
            onChange={(val) => updateTheme('adminSidebar', val)}
          />
          <ColorField
            label="Sidebar Text"
            sub="Nav menu items"
            value={t.adminSidebarText || ''}
            fallback="#f3f4f6"
            onChange={(val) => updateTheme('adminSidebarText', val)}
          />
          <ColorField
            label="Card / Panel Surface"
            sub="Data tables & cards"
            value={t.adminCard || ''}
            fallback="#141b26"
            onChange={(val) => updateTheme('adminCard', val)}
          />
          <ColorField
            label="Card Text Color"
            sub="Headers in cards"
            value={t.adminCardText || ''}
            fallback="#f3f4f6"
            onChange={(val) => updateTheme('adminCardText', val)}
          />
          <ColorField
            label="Primary Action Button"
            sub="Save, create & submit"
            value={t.adminPrimary || ''}
            fallback="#b59410"
            onChange={(val) => updateTheme('adminPrimary', val)}
          />
          <ColorField
            label="Primary Button Text"
            sub="Typography on button"
            value={t.adminPrimaryText || ''}
            fallback="#ffffff"
            onChange={(val) => updateTheme('adminPrimaryText', val)}
          />
          <ColorField
            label="Admin Accent Gold"
            sub="Pills, badges & highlights"
            value={t.adminAccent || ''}
            fallback="#d4af37"
            onChange={(val) => updateTheme('adminAccent', val)}
          />
        </div>
      </div>

      {/* Public Storefront Theme Variables */}
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-4 transition-colors"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        <div className="border-b pb-3" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
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
            fallback="#b59410"
            onChange={(val) => updateTheme('primary', val)}
          />
          <ColorField
            label="Public Accent Gold"
            sub="Embellishments & borders"
            value={t.accent || ''}
            fallback="#d4af37"
            onChange={(val) => updateTheme('accent', val)}
          />
          <ColorField
            label="Public Page Background"
            sub="Storefront backdrop"
            value={t.publicBg || ''}
            fallback="#0f141c"
            onChange={(val) => updateTheme('publicBg', val)}
          />
          <ColorField
            label="Public Page Text"
            sub="Headings & paragraphs"
            value={t.publicText || ''}
            fallback="#f3f4f6"
            onChange={(val) => updateTheme('publicText', val)}
          />
          <ColorField
            label="Public Card Surface"
            sub="Product & gallery tiles"
            value={t.publicCard || ''}
            fallback="#141b26"
            onChange={(val) => updateTheme('publicCard', val)}
          />
          <ColorField
            label="Public Card Text"
            sub="Titles on cards"
            value={t.publicCardText || ''}
            fallback="#f3f4f6"
            onChange={(val) => updateTheme('publicCardText', val)}
          />
          <ColorField
            label="Public Button Text"
            sub="Button label color"
            value={t.primaryText || ''}
            fallback="#ffffff"
            onChange={(val) => updateTheme('primaryText', val)}
          />
        </div>
      </div>
    </div>
  );
}
