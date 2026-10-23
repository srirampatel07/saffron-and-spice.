import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createServer } from 'vite';
import { getMenu, openDatabase, seedMenu } from '../server/src/db.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientDir = path.join(root, 'client');
const distDir = path.join(clientDir, 'dist');
const templatePath = path.join(distDir, 'index.html');

dotenv.config({ path: path.join(root, '.env'), quiet: true });

const siteUrl = (process.env.SITE_URL || 'http://localhost:5173').replace(/\/+$/, '');
if (siteUrl.includes('localhost')) {
  console.warn('[seo] SITE_URL is unset or points to localhost; sitemap and canonical URLs will use localhost.');
}
if (!fs.existsSync(templatePath)) {
  throw new Error('client/dist/index.html is missing. Run the client build first.');
}

function buildInitialMenu() {
  const db = openDatabase(':memory:');
  try {
    seedMenu(db);
    return getMenu(db);
  } finally {
    db.close();
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderHead(meta, jsonLd) {
  const managed = 'data-seo-managed="true"';
  const tags = [
    `<meta name="description" ${managed} content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" ${managed} content="${meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`,
  ];

  if (meta.canonical) {
    tags.push(`<link rel="canonical" ${managed} href="${escapeHtml(meta.canonical)}" />`);
  }

  tags.push(
    `<meta property="og:type" ${managed} content="${escapeHtml(meta.type)}" />`,
    `<meta property="og:site_name" ${managed} content="${escapeHtml(meta.siteName)}" />`,
    `<meta property="og:locale" ${managed} content="${escapeHtml(meta.locale)}" />`,
    `<meta property="og:title" ${managed} content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" ${managed} content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" ${managed} content="${escapeHtml(meta.canonical || siteUrl)}" />`,
    `<meta property="og:image" ${managed} content="${escapeHtml(meta.image)}" />`,
    `<meta property="og:image:width" ${managed} content="${meta.imageWidth}" />`,
    `<meta property="og:image:height" ${managed} content="${meta.imageHeight}" />`,
    `<meta property="og:image:alt" ${managed} content="${escapeHtml(meta.imageAlt)}" />`,
    `<meta name="twitter:card" ${managed} content="summary_large_image" />`,
    `<meta name="twitter:title" ${managed} content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" ${managed} content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" ${managed} content="${escapeHtml(meta.image)}" />`,
    `<meta name="twitter:image:alt" ${managed} content="${escapeHtml(meta.imageAlt)}" />`,
  );

  for (const documentData of jsonLd) {
    JSON.parse(JSON.stringify(documentData));
    tags.push(
      `<script type="application/ld+json" data-seo-jsonld="page">${JSON.stringify(documentData)
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')}</script>`,
    );
  }

  return tags.join('\n    ');
}

function renderPreloads({ heroImage, fonts, entryScript }) {
  const links = [];
  if (entryScript) {
    links.push(`<link rel="modulepreload" crossorigin href="${entryScript}" />`);
  }
  if (heroImage) {
    const attributes = [
      'rel="preload"',
      'as="image"',
      `href="${heroImage.src}"`,
      'type="image/webp"',
      'fetchpriority="high"',
    ];
    if (heroImage.srcSet) {
      attributes.push(`imagesrcset="${heroImage.srcSet}"`, `imagesizes="${heroImage.sizes}"`);
    }
    links.push(`<link ${attributes.join(' ')} />`);
  }
  for (const font of fonts) {
    links.push(`<link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />`);
  }
  return links.join('\n    ');
}

const template = fs.readFileSync(templatePath, 'utf8');
const entryScript = (template.match(/<script type="module"[^>]*\bsrc="([^"]+)"/) || [])[1] || null;
const assetNames = fs.readdirSync(path.join(distDir, 'assets'));
const fonts = assetNames
  .filter((name) => /^(fraunces-latin-opsz-normal|manrope-latin-wght-normal).*\.woff2$/.test(name))
  .sort();

const initialMenu = buildInitialMenu();
const vite = await createServer({
  root: clientDir,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

try {
  const { renderPage } = await vite.ssrLoadModule('/src/prerender-entry.jsx');
  const seo = await vite.ssrLoadModule('/src/lib/seo.js');

  function buildPage({ route, headPath = route, render = true, heroImage = null }) {
    const meta = seo.getPageSeo(headPath, siteUrl);
    const jsonLd = seo.jsonLdForPath(headPath, siteUrl, initialMenu);
    const body = render ? renderPage(route, initialMenu) : '';

    let html = template;
    html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeHtml(meta.title)}</title>`);
    html = html.split('<!--seo-head-->').join(renderHead(meta, jsonLd));
    html = html.split('<!--seo-preloads-->').join(renderPreloads({ heroImage, fonts, entryScript }));
    html = html.split('<div id="root"></div>').join(`<div id="root">${body}</div>`);
    html = html.split('<script type="module"').join(
      `<script type="application/json" id="initial-menu">${seo.serialiseJsonLd(initialMenu)}</script>\n    <script type="module"`,
    );
    return html;
  }

  const pages = [
    {
      route: '/',
      file: 'index.html',
      heroImage: {
        src: '/images/hero-thali-800.webp',
        srcSet:
          '/images/hero-thali-640.webp 640w, /images/hero-thali-800.webp 800w, /images/hero-thali-1120.webp 1120w, /images/hero-thali.webp 1920w',
        sizes: '(max-width: 720px) 92vw, (max-width: 1100px) 46vw, 34rem',
      },
    },
    { route: '/menu', file: 'menu/index.html' },
    {
      route: '/story',
      file: 'story/index.html',
      heroImage: {
        src: '/images/story-spice-720.webp',
        srcSet:
          '/images/story-spice-480.webp 480w, /images/story-spice-720.webp 720w, /images/story-spice.webp 900w',
        sizes: '(max-width: 720px) 88vw, 29rem',
      },
    },
    { route: '/credits', file: 'credits/index.html' },
    { route: '/track', file: 'track/index.html' },
    { route: '/checkout', file: 'checkout/index.html', render: false },
    { route: '/admin', file: 'admin/index.html', render: false },
    {
      route: '/order',
      headPath: '/order/SS-000000-AAAAAA',
      file: 'order/index.html',
      render: false,
    },
    {
      route: '/__not_found__',
      headPath: '/__not_found__',
      file: '404.html',
      render: true,
    },
  ];

  for (const page of pages) {
    const output = path.join(distDir, page.file);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, buildPage(page), 'utf8');
    console.log(`[seo] wrote ${path.relative(root, output)}`);
  }

  const publicPages = seo.publicSeoPages(siteUrl);
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...publicPages.map(
      (page) =>
        `  <url>\n    <loc>${escapeHtml(page.canonical)}</loc>\n    <lastmod>${new Date()
          .toISOString()
          .slice(0, 10)}</lastmod>\n    <changefreq>${page.changeFrequency}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`[seo] wrote client/dist/sitemap.xml (${publicPages.length} URLs)`);

  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /checkout',
    'Disallow: /order',
    'Disallow: /api/',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robots, 'utf8');
  console.log('[seo] wrote client/dist/robots.txt');
} finally {
  await vite.close();
}
