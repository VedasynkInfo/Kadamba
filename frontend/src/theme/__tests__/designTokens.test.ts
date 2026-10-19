import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { breakpoints, duration, ease } from '@/theme/designTokens';

/**
 * The JS tokens and the CSS tokens are two readings of one design decision, and
 * the only way they stay equal is if something checks. This is that something:
 * `index.css` is the source, and these assertions fail the moment a duration or
 * curve is changed on one side only.
 *
 * The stylesheet is read from disk rather than imported: Vite hands CSS imports
 * to its stylesheet pipeline, so a `?raw` import of a `.css` file resolves to an
 * empty module. This is why `tsconfig.app.json` lists `node` in `types` — a test
 * asserting on source files needs the filesystem. The search walks up from the
 * working directory so the test does not care whether Vitest was started from
 * the package or the repository.
 */
function readFromPackage(relativePath: string): string {
  let directory = process.cwd();
  for (let depth = 0; depth < 4; depth += 1) {
    const candidate = resolve(directory, relativePath);
    if (existsSync(candidate)) return readFileSync(candidate, 'utf8');
    directory = resolve(directory, '..');
  }
  throw new Error(`could not find ${relativePath} above ${process.cwd()}`);
}

const css = readFromPackage('src/index.css');

/** The declarations without the prose — comments legitimately *mention* `.admin-scope`. */
const cssRules = css.replace(/\/\*[\s\S]*?\*\//g, '');

function cssToken(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`index.css does not define --${name}`);
  return match[1].trim();
}

describe('motion tokens', () => {
  it('keeps the JS durations equal to the CSS custom properties', () => {
    expect(duration.fast).toBe(Number.parseInt(cssToken('duration-fast'), 10));
    expect(duration.base).toBe(Number.parseInt(cssToken('duration-base'), 10));
    expect(duration.slow).toBe(Number.parseInt(cssToken('duration-slow'), 10));
  });

  it('keeps the JS easing curves equal to the CSS custom properties', () => {
    expect(`cubic-bezier(${ease.luxury.join(', ')})`).toBe(cssToken('ease-luxury'));
    expect(`cubic-bezier(${ease.out.join(', ')})`).toBe(cssToken('ease-out-soft'));
  });
});

describe('breakpoints', () => {
  it('mirrors Tailwind’s default scale, which the CSS media queries rely on', () => {
    expect(breakpoints).toEqual({ sm: 640, md: 768, lg: 1024, xl: 1280 });
  });
});

/**
 * Every token a component can ask for. A shell that sets only some of them is
 * the dangerous case: the missing ones keep the *previous* shell's value, so an
 * invoice rendered inside the dark console would come out with console ink on
 * paper. The completeness assertion below is what caught exactly that.
 */
const SEMANTIC_TOKENS = [
  '--color-surface:',
  '--color-surface-raised:',
  '--color-surface-sunken:',
  '--color-surface-field:',
  '--color-surface-inverse:',
  '--color-ink:',
  '--color-ink-raised:',
  '--color-ink-inverse:',
  '--color-ink-on-brand:',
  '--color-line:',
  '--color-line-strong:',
  '--color-brand:',
  '--color-danger:',
] as const;

function blockDeclarations(selector: string): string {
  const start = cssRules.indexOf(selector);
  expect(start, `${selector} is missing from index.css`).toBeGreaterThan(-1);
  return cssRules.slice(start, cssRules.indexOf('}', start));
}

describe('the shell override', () => {
  it('defines the semantic palette once, in @theme', () => {
    // `@theme` is the public site: it is the only layer that needs no shell
    // class, because the light values *are* the defaults.
    const base = blockDeclarations('@theme {');
    for (const token of SEMANTIC_TOKENS) {
      expect(base, `@theme does not define ${token}`).toContain(token);
    }
  });

  it('re-points every semantic token in each dark shell', () => {
    for (const selector of ['.admin-shell {', '.portal-shell {', '.invoice-paper {']) {
      const declarations = blockDeclarations(selector);
      for (const token of SEMANTIC_TOKENS) {
        expect(declarations, `${selector} does not define ${token}`).toContain(token);
      }
    }
  });

  it('paints the console from the settings-driven variables, not literals', () => {
    // The studio rethemes the console from Settings → Theme, which writes
    // `--admin-*` at runtime. A literal here would be a setting that silently
    // does nothing.
    const shell = blockDeclarations('.admin-shell {');
    for (const token of [
      'var(--admin-bg)',
      'var(--admin-card)',
      'var(--admin-card-text)',
      'var(--admin-text)',
      'var(--admin-border)',
      'var(--admin-primary)',
      'var(--admin-sidebar)',
    ]) {
      expect(shell, `.admin-shell does not consume ${token}`).toContain(token);
    }
  });

  it('no longer rewrites utility classes to reinterpret their meaning', () => {
    // `.admin-scope .text-ink { color: … }` was the hack that made a light
    // panel in the console render light-on-cream. Deleting it is the point.
    expect(cssRules).not.toContain('.admin-scope');
  });
});
