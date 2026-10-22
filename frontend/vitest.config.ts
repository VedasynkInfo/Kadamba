import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Unit tests (Playwright owns the end-to-end suite in `e2e/`).
 *
 * The PWA plugin is deliberately not loaded here: service-worker generation has
 * nothing to do with these tests and would slow every run down.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
        'src/shared/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/index.ts',
        'src/**/__tests__/**',
      ],
      /**
       * A ratchet, not a target.
       *
       * The frontend suite covers the logic — hooks, formatters, design-system
       * primitives — but the admin pages are large, mostly declarative tables
       * and forms whose behaviour is covered end-to-end by Playwright rather
       * than by unit tests. These floors sit just below the measured numbers
       * so a change that quietly drops coverage fails the build.
       */
      thresholds: {
        lines: 10,
        functions: 7,
        statements: 10,
        branches: 8,
      },
    },
  },
});
