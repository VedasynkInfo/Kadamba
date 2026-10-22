/**
 * Lighthouse CI configuration.
 *
 * The thresholds are the ones the site has actually been serving, with a
 * little headroom. A regression that pushes the page past them fails the
 * build rather than reaching a visitor.
 */
module.exports = {
  ci: {
    collect: {
      // The built site, served by the preview server. The API is not needed:
      // these are the public pages, and the content is in the bundle.
      staticDistDir: './dist',
      url: ['http://localhost/', 'http://localhost/products', 'http://localhost/services'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 400 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
