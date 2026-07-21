/**
 * Kadamba design tokens — single source of truth for the luxury theme.
 * Mirrored as CSS custom properties in `index.css` / `@theme`.
 */
export const designTokens = {
  colors: {
    primary: {
      black: '#000000',
      gold: '#FFD700',
      cream: '#FFFDD0',
    },
    backgrounds: {
      dark: '#000000',
      light: '#FFFDD0',
      elevated: '#111111',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#FFD700',
      accent: '#000000',
      muted: 'rgba(255, 253, 208, 0.7)',
      onLight: 'rgba(0, 0, 0, 0.7)',
    },
    border: {
      subtle: 'rgba(255, 215, 0, 0.25)',
      strong: '#FFD700',
      light: 'rgba(0, 0, 0, 0.1)',
    },
  },
  typography: {
    heading: "'Playfair Display', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    sizes: {
      h1: '3rem',
      h2: '2rem',
      h3: '1.5rem',
      body: '1rem',
      sm: '0.875rem',
      xs: '0.75rem',
    },
  },
  spacing: {
    /** Prefer CSS `--kadamba-space-*`. Never map these to Tailwind `--spacing-sm|md|lg|xl`. */
    xs: '0.5rem',
    sm: '1rem',
    md: '2rem',
    lg: '4rem',
    xl: '6rem',
  },
  measure: {
    /** Ideal line length for body / section ledes (~65–75ch). */
    default: '38rem',
    wide: '44rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
  },
  shadows: {
    gold: '0 8px 32px rgba(255, 215, 0, 0.15)',
    soft: '0 4px 24px rgba(0, 0, 0, 0.2)',
  },
  motion: {
    fast: '150ms',
    base: '250ms',
    slow: '400ms',
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
} as const;

export type DesignTokens = typeof designTokens;
