import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePublicSettings } from '@/hooks/useCmsContent';
import { DEFAULT_THEME_TOKENS } from '@/theme/palettes';
import { readableOn } from '@/utils/contrast';
import type { WebsiteSettings } from '@/pages/admin/data';

interface ThemeContextType {
  theme: WebsiteSettings['theme'];
  logoUrl?: string;
  logoDarkUrl?: string;
  updateThemeTokens: (theme: WebsiteSettings['theme'], logoUrl?: string, logoDarkUrl?: string) => void;
}

const defaultThemeTokens = DEFAULT_THEME_TOKENS;

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultThemeTokens,
  updateThemeTokens: () => {},
});

export function applyThemeVariables(theme: WebsiteSettings['theme']) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme.primary) {
    root.style.setProperty('--color-primary', theme.primary);
  }
  if (theme.primaryText) {
    root.style.setProperty('--color-primary-text', theme.primaryText);
  }
  if (theme.accent) {
    root.style.setProperty('--color-accent', theme.accent);
  }
  if (theme.publicBg) {
    root.style.setProperty('--public-bg', theme.publicBg);
  }
  if (theme.publicText) {
    root.style.setProperty('--public-text', theme.publicText);
  }
  if (theme.publicCard) {
    root.style.setProperty('--public-card', theme.publicCard);
  }
  if (theme.publicCardText) {
    root.style.setProperty('--public-card-text', theme.publicCardText);
  }
  if (theme.publicSurface) {
    root.style.setProperty('--public-surface', theme.publicSurface);
  }
  if (theme.accent) {
    // Text and icons cannot use the raw accent: a studio's gold may read on
    // espresso and vanish on cream. Derive the text-safe variant from the pair
    // actually in use, so every theme change keeps links legible.
    root.style.setProperty(
      '--color-brand-strong',
      readableOn(theme.publicBg || DEFAULT_THEME_TOKENS.publicBg, theme.accent),
    );
  }
  if (theme.adminBg) {
    root.style.setProperty('--admin-bg', theme.adminBg);
  }
  if (theme.adminText) {
    root.style.setProperty('--admin-text', theme.adminText);
  }
  if (theme.adminCard) {
    root.style.setProperty('--admin-card', theme.adminCard);
  }
  if (theme.adminCardText) {
    root.style.setProperty('--admin-card-text', theme.adminCardText);
  }
  if (theme.adminSidebar) {
    root.style.setProperty('--admin-sidebar', theme.adminSidebar);
  }
  if (theme.adminSidebarText) {
    root.style.setProperty('--admin-sidebar-text', theme.adminSidebarText);
  }
  if (theme.adminPrimary) {
    root.style.setProperty('--admin-primary', theme.adminPrimary);
  }
  if (theme.adminPrimaryText) {
    root.style.setProperty('--admin-primary-text', theme.adminPrimaryText);
  }
  if (theme.adminAccent) {
    root.style.setProperty('--admin-accent', theme.adminAccent);
  }
  if (theme.fontFamily) {
    root.style.setProperty('--font-admin', theme.fontFamily);
  }
}

/** Live theme tweaks made in the settings editor, before anything is saved. */
interface ThemeOverride {
  theme: WebsiteSettings['theme'];
  logoUrl?: string;
  logoDarkUrl?: string;
}

/**
 * Applies the studio's theme tokens and logo.
 *
 * The saved settings come from the same query the public site already runs
 * (`usePublicSettings`), so this costs no extra request and the two can never
 * disagree. Until settings arrive — or if the request fails — the built-in
 * tokens keep the site legible; the failure itself is reported by the query
 * layer rather than swallowed here.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const site = usePublicSettings();
  const [override, setOverride] = useState<ThemeOverride | null>(null);

  const saved = useMemo<ThemeOverride | null>(
    () =>
      site.settings
        ? {
            theme: { ...defaultThemeTokens, ...site.settings.theme },
            logoUrl: site.settings.logoUrl,
            logoDarkUrl: site.settings.logoDarkUrl,
          }
        : null,
    [site.settings],
  );

  const active: ThemeOverride = override ?? saved ?? { theme: defaultThemeTokens };

  useEffect(() => {
    applyThemeVariables(active.theme);
  }, [active.theme]);

  const updateThemeTokens = useCallback(
    (next: WebsiteSettings['theme'], newLogo?: string, newDarkLogo?: string) => {
      setOverride((prev) => ({
        theme: next,
        logoUrl: newLogo !== undefined ? newLogo : prev?.logoUrl ?? saved?.logoUrl,
        logoDarkUrl: newDarkLogo !== undefined ? newDarkLogo : prev?.logoDarkUrl ?? saved?.logoDarkUrl,
      }));
    },
    [saved],
  );

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: active.theme,
      logoUrl: active.logoUrl,
      logoDarkUrl: active.logoDarkUrl,
      updateThemeTokens,
    }),
    [active.theme, active.logoUrl, active.logoDarkUrl, updateThemeTokens],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
