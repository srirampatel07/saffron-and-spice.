import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { restaurant } from '../client/src/config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'client', 'dist');
dotenv.config({ path: path.join(root, '.env'), quiet: true });

const siteUrl = (process.env.SITE_URL || 'http://localhost:5173').replace(/\/+$/, '');
const failures = [];
const passes = [];

function check(condition, message) {
  if (condition) passes.push(message);
  else failures.push(message);
}

function read(file) {
  return fs.readFileSync(path.join(dist, file), 'utf8');
}

function titleOf(html) {
  return (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
}

function attr(html, pattern) {
  return (html.match(pattern) || [])[1] || null;
}

function jsonLdOf(html) {
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      failures.push(`JSON-LD is not valid JSON: ${error.message}`);
      return null;
    }
  }).filter(Boolean);
}

const pages = {
  home: read('index.html'),
  menu: read('menu/index.html'),
  story: read('story/index.html'),
  credits: read('credits/index.html'),
  track: read('track/index.html'),
  notFound: read('404.html'),
  checkout: read('checkout/index.html'),
  admin: read('admin/index.html'),
  order: read('order/index.html'),
};

const publicPaths = {
  home: '/',
  menu: '/menu',
  story: '/story',
  credits: '/credits',
};
const titles = new Set();
const descriptions = new Set();

for (const [name, html] of Object.entries(pages)) {
  check(/<html lang="en">/.test(html), `${name}: html lang is en`);
  check(!html.includes('<!--seo-head-->'), `${name}: SEO head placeholder was replaced`);
  check(!html.includes('<!--seo-preloads-->'), `${name}: preload placeholder was replaced`);
  check(/<script type="application\/json" id="initial-menu">/.test(html), `${name}: initial menu snapshot is present`);
  check(/<meta property="og:image"[^>]*content="[^"]*og-share\.jpg"/.test(html), `${name}: Open Graph image is present`);
  check(/<meta name="twitter:card"[^>]*content="summary_large_image"/.test(html), `${name}: Twitter card is present`);
  check(/<meta property="og:image:width"[^>]*content="1200"/.test(html), `${name}: OG image width is present`);
  check(/<meta property="og:image:height"[^>]*content="630"/.test(html), `${name}: OG image height is present`);
}

for (const [name, pathname] of Object.entries(publicPaths)) {
  const html = pages[name];
  const title = titleOf(html);
  const description = attr(html, /<meta name="description"[^>]*content="([^"]*)"/);
  const canonical = attr(html, /<link rel="canonical"[^>]*href="([^"]*)"/);
  const h1s = [...html.matchAll(/<h1[^>]*>[\s\S]*?<\/h1>/g)];
  check(Boolean(title), `${name}: has a title`);
  check(Boolean(description), `${name}: has a meta description`);
  check(!titles.has(title), `${name}: title is unique`);
  check(!descriptions.has(description), `${name}: description is unique`);
  titles.add(title);
  descriptions.add(description);
  check(h1s.length === 1, `${name}: exactly one h1 (found ${h1s.length})`);
  check(canonical === `${siteUrl}${pathname === '/' ? '/' : pathname}`, `${name}: canonical is ${siteUrl}${pathname}`);
  check(/content="index, follow/.test(html), `${name}: robots meta allows indexing`);
}

const homeLd = jsonLdOf(pages.home);
const menuLd = jsonLdOf(pages.menu);
const storyLd = jsonLdOf(pages.story);

check(homeLd.some((entry) => entry['@type'] === 'Restaurant'), 'home: Restaurant JSON-LD is present');
check(homeLd.some((entry) => entry['@type'] === 'WebSite'), 'home: WebSite JSON-LD is present');
check(menuLd.some((entry) => entry['@type'] === 'Menu'), 'menu: Menu JSON-LD is present');
check(menuLd.some((entry) => entry['@type'] === 'BreadcrumbList'), 'menu: BreadcrumbList JSON-LD is present');
check(storyLd.some((entry) => entry['@type'] === 'AboutPage'), 'story: AboutPage JSON-LD is present');

const restaurantLd = homeLd.find((entry) => entry['@type'] === 'Restaurant');
if (restaurantLd) {
  check(restaurantLd.name === restaurant.name, 'restaurant JSON-LD name matches config');
  check(restaurantLd.url === `${siteUrl}/`, 'restaurant JSON-LD URL is the site root');
  check(!('aggregateRating' in restaurantLd), 'restaurant JSON-LD has no invented rating');
  if (!restaurant.seo?.emitBusinessDetails) {
    check(!('address' in restaurantLd), 'restaurant JSON-LD omits unverified address');
    check(!('areaServed' in restaurantLd), 'restaurant JSON-LD omits unverified areaServed');
    check(!('telephone' in restaurantLd), 'restaurant JSON-LD omits unverified phone');
    check(!('openingHoursSpecification' in restaurantLd), 'restaurant JSON-LD omits unverified hours');
  }
}

const menuLdData = menuLd.find((entry) => entry['@type'] === 'Menu');
if (menuLdData) {
  check(Array.isArray(menuLdData.hasMenuSection) && menuLdData.hasMenuSection.length >= 5, 'Menu JSON-LD has menu sections');
  check(
    menuLdData.hasMenuSection?.some((section) =>
      section.hasMenuItem?.some((item) => item.name === 'Amritsari Paneer Tikka'),
    ),
    'Menu JSON-LD includes a known dish',
  );
}

for (const [name, html] of Object.entries(pages)) {
  for (const entry of jsonLdOf(html)) {
    check(entry['@context'] === 'https://schema.org', `${name}: JSON-LD context is schema.org`);
    check(Boolean(entry['@type']), `${name}: JSON-LD has an @type`);
  }
}

for (const name of ['track', 'checkout', 'admin', 'order', 'notFound']) {
  check(/content="noindex, nofollow"/.test(pages[name]), `${name}: is noindex`);
}
check(!/<link rel="canonical"/.test(pages.track), 'track: has no canonical URL');
check(!/<link rel="canonical"/.test(pages.notFound), '404: has no canonical URL');

check(pages.home.includes('The warmth of India'), 'home: hero content is present without JavaScript');
check(pages.menu.includes('Amritsari Paneer Tikka'), 'menu: dish content is present without JavaScript');
check(pages.story.includes('A kitchen that measures in patience'), 'story: story content is present without JavaScript');
check(pages.notFound.includes('This table'), '404: not-found content is present');

const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
for (const pathname of ['/', '/menu', '/story', '/credits']) {
  check(sitemapLocs.includes(`${siteUrl}${pathname}`), `sitemap: includes ${pathname}`);
}
for (const pathname of ['/admin', '/checkout', '/order', '/track']) {
  check(!sitemapLocs.includes(`${siteUrl}${pathname}`), `sitemap: excludes ${pathname}`);
}

const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
check(robots.includes('Disallow: /admin'), 'robots: disallows /admin');
check(robots.includes('Disallow: /checkout'), 'robots: disallows /checkout');
check(robots.includes('Disallow: /order'), 'robots: disallows /order');
check(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), 'robots: points to the sitemap');

check(fs.existsSync(path.join(dist, 'og-share.jpg')), 'share image exists at /og-share.jpg');
check(fs.existsSync(path.join(dist, '404.html')), '404.html exists');

for (const line of passes) console.log(`PASS ${line}`);
for (const line of failures) console.error(`FAIL ${line}`);
console.log(`\n${passes.length} checks passed, ${failures.length} failed.`);
if (failures.length > 0) process.exit(1);
