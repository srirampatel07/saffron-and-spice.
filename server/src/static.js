import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
const PAGE_ROOTS = new Set(['menu', 'story', 'credits', 'track', 'checkout', 'admin', 'order']);
const NOINDEX_PREFIXES = ['/admin', '/checkout', '/order', '/track'];

function pageFileFor(pathname) {
  if (pathname === '/') return 'index.html';
  const clean = pathname.replace(/\/+$/, '');
  const root = clean.split('/')[1];
  if (!PAGE_ROOTS.has(root)) return null;
  if (root === 'order') return 'order/index.html';
  return `${root}/index.html`;
}

function isNoindex(pathname) {
  return NOINDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Optional production static host. Security headers are installed before this
 * middleware, so prerendered HTML receives the same helmet policy as the API.
 * Unknown routes get a real 404 status and the generated 404 page.
 */
export function mountClient(app) {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) return false;

  app.use(
    express.static(distDir, {
      index: false,
      redirect: false,
      dotfiles: 'deny',
      fallthrough: true,
      setHeaders(res, filePath) {
        const name = path.basename(filePath);
        if (filePath.endsWith('.html') || name === 'robots.txt' || name === 'sitemap.xml') {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (/-[A-Za-z0-9_-]{8}\.(?:js|css|woff2)$/.test(name)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      },
    }),
  );

  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api/')) return next();
    if (path.extname(req.path)) return next();

    const pageFile = pageFileFor(req.path);
    if (pageFile) {
      if (isNoindex(req.path)) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(pageFile, { root: distDir }, (error) => {
        if (error) next(error);
      });
      return;
    }

    res.status(404);
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile('404.html', { root: distDir }, (error) => {
      if (error) next(error);
    });
  });

  return true;
}
