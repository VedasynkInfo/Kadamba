/**
 * Static server for the prerendered build.
 *
 * `vite preview` always falls back to the root `index.html` for extensionless
 * routes, which hides the per-route `dist/<route>/index.html` files that
 * `scripts/prerender.mjs` writes. This server resolves the directory index
 * first (the behaviour the production static host should be configured for),
 * then falls back to the SPA shell for unknown routes.
 *
 * Usage: node scripts/serve-dist.mjs --port 3002
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const portArgIndex = process.argv.indexOf('--port');
const port = Number(portArgIndex >= 0 ? process.argv[portArgIndex + 1] : process.env.PORT || 3002);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

async function fileIfExists(file) {
  try {
    const info = await stat(file);
    return info.isFile() ? info : null;
  } catch {
    return null;
  }
}

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url || '/', 'http://local').pathname);
    const safe = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    const direct = path.join(dist, safe);
    const candidates = [
      direct,
      path.join(direct, 'index.html'),
      path.join(dist, `${safe}.html`),
      path.join(dist, 'index.html'),
    ];

    for (const candidate of candidates) {
      if (!candidate.startsWith(dist)) continue;
      const info = await fileIfExists(candidate);
      if (!info) continue;
      res.statusCode = 200;
      res.setHeader('Content-Type', MIME[path.extname(candidate)] || 'application/octet-stream');
      // HTML must stay fresh so a new deploy is visible immediately; assets
      // keep their hashed filenames and can be cached.
      res.setHeader(
        'Cache-Control',
        candidate.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
      );
      res.end(await readFile(candidate));
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not found');
  } catch (error) {
    res.statusCode = 500;
    res.end(String(error));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`prerendered server on http://localhost:${port}`);
});
