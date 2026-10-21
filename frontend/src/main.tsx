import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { queryClient } from '@/lib/queryClient';
import './index.css';

registerSW({ immediate: true });

// React 19 hoists the <title>/<meta> rendered by react-helmet-async into
// <head>. Drop the static shell copies first so crawlers and the prerenderer
// never see duplicate document titles or descriptions. Without JavaScript the
// shell copies remain in the built HTML.
document
  .querySelectorAll('title[data-static], meta[name="description"][data-static]')
  .forEach((node) => node.remove());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>,
);
