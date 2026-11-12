import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'robots.txt', 'sitemap.xml'],
      manifest: false,
      workbox: {
        // No `navigateFallback`: the public routes are prerendered, and a
        // blanket fallback to `/index.html` would serve the home page's head
        // on every deep link. Navigation requests go to the network (or the
        // precached HTML when available); unknown routes still use the SPA.
        runtimeCaching: [
          {
            // Studio media served by our own API. The backend already sends
            // long-lived immutable cache headers for generated variants, so
            // caching here matches what the browser does anyway — and keeps a
            // repeat visit (or an offline one) instant.
            urlPattern: ({ url }) => url.pathname.startsWith('/uploads/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'kadamba-uploads',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Placeholder artwork shipped with the app.
            urlPattern: /^\/media\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kadamba-media',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Routes are already split per desk. What remains is the shared vendor
    // layer: keeping the chart, motion, form and realtime libraries in their own
    // chunks means a dashboard visit does not download the board's dnd-kit, and
    // a library upgrade invalidates one chunk rather than the entry.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-realtime',
              priority: 30,
              test: /node_modules[\\/](socket\.io-client|engine\.io-client|socket\.io-parser)[\\/]/,
            },
            {
              name: 'vendor-charts',
              priority: 25,
              test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|internmap)[\\/]/,
            },
            {
              name: 'vendor-motion',
              priority: 24,
              test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/,
            },
            {
              name: 'vendor-forms',
              priority: 23,
              test: /node_modules[\\/](react-hook-form|zod)[\\/]/,
            },
            {
              name: 'vendor-dnd',
              priority: 22,
              test: /node_modules[\\/]@dnd-kit[\\/]/,
            },
            {
              name: 'vendor-react',
              priority: 21,
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: 'vendor',
              priority: 1,
              minSize: 20_000,
              test: /node_modules[\\/]/,
            },
          ],
        },
      },
    },
  },
});
