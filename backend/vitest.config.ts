import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/__tests__/helpers/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      /**
       * What counts towards the number.
       *
       * Scripts, type-only files and the shared contract (which has its own
       * round-trip test) are excluded — measuring them would inflate the
       * figure with code that has no runtime behaviour.
       */
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/scripts/**',
        'src/__tests__/**',
        'src/shared/**',
        'src/config/logger.ts',
        'src/**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        /**
         * Branches sit lower than the other three on purpose. This codebase is
         * full of defensive guards (optional ids, absent SMTP, missing
         * settings) and every one of them is a branch, so the number is
         * dominated by "what happens when the input is missing" rather than by
         * "is the main path tested". 65% means the defensive paths are
         * genuinely exercised without pretending every `??` is a risk.
         */
        branches: 65,
      },
    },
  },
});
