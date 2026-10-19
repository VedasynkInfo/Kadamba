import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { settingsApi } from '@/services/settings/settingsService';
import type { WebsiteSettings } from '@/pages/admin/data';

interface ThemeContextType {
  theme: WebsiteSettings['theme'];
  logoUrl?: string;
  logoDarkUrl?: string;
  updateThemeTokens: (theme: WebsiteSettings['theme'], logoUrl?: string, logoDarkUrl?: string) => void;
}

const defaultThemeTokens: WebsiteSettings['theme'] = {
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<WebsiteSettings['theme']>(defaultThemeTokens);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoDarkUrl, setLogoDarkUrl] = useState<string>('');

  useEffect(() => {
    settingsApi
      .get()
      .then((settings) => {
        if (settings?.theme) {
          const merged = { ...defaultThemeTokens, ...settings.theme };
          setTheme(merged);
          applyThemeVariables(merged);
        }
        if (settings?.logoUrl) setLogoUrl(settings.logoUrl);
        if (settings?.logoDarkUrl) setLogoDarkUrl(settings.logoDarkUrl);
      })
      .catch((err) => {
        console.warn('Could not load theme settings, using defaults', err);
        applyThemeVariables(defaultThemeTokens);
      });
  }, []);

  const updateThemeTokens = (next: WebsiteSettings['theme'], newLogo?: string, newDarkLogo?: string) => {
    setTheme(next);
    applyThemeVariables(next);
    if (newLogo !== undefined) setLogoUrl(newLogo);
    if (newDarkLogo !== undefined) setLogoDarkUrl(newDarkLogo);
  };

  return (
    <ThemeContext.Provider value={{ theme, logoUrl, logoDarkUrl, updateThemeTokens }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
