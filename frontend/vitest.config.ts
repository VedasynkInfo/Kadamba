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
    restoreMocks: true,
  },
});
