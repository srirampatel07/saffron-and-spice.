# SEO Notes — Saffron & Spice

Last updated: 23 October 2026.

## Scope and constraints

This is a technical SEO pass on a demo restaurant site. The work was limited to the repository, local builds, and a few read-only public competitor page fetches. No directory submissions, forms, paid tools, or ranking guarantees are involved.

The site has **no verified public domain, address, phone number, opening hours, ratings, or reviews**. The restaurant and menu are fictional demo content. For that reason:

- The public canonical/sitemap origin is configurable with `SITE_URL`; the checked-in fallback is `http://localhost:5173`.
- Structured data deliberately omits `address`, `areaServed`, `telephone`, and `openingHoursSpecification` until `restaurant.seo.emitBusinessDetails` is set to `true` with verified data.
- No `aggregateRating`, `review`, or other invented trust markup is emitted.
- The placeholder Instagram URL is not emitted as `sameAs`.

## What was implemented

### 1. Unique page metadata

`client/src/lib/seo.js` is the single source for titles, descriptions, canonical paths, Open Graph/Twitter fields, and JSON-LD. Every public page has a unique title and description:

- `/` — restaurant home
- `/menu` — menu
- `/story` — kitchen story (new additive route)
- `/credits` — photography credits

Private or transactional routes (`/track`, `/checkout`, `/admin`, `/order/*`, the 404 page) are `noindex, nofollow` and have no canonical URL.

The client-side `Seo` component keeps metadata in sync during SPA navigation, and `scripts/prerender.mjs` writes the same tags into the static HTML. Prerendered tags carry `data-seo-managed` (and JSON-LD carries `data-seo-jsonld="page"`), so the client updates and replaces them instead of appending duplicates. The legacy per-page `usePageTitle` hook was removed; `Seo` is now the only owner of `document.title`.

### 2. Prerendered HTML, without a framework migration

The build uses Vite SSR with React `renderToString` and `StaticRouter`:

- `npm run build` builds the client, then generates:
  - `index.html`
  - `menu/index.html`
  - `story/index.html`
  - `credits/index.html`
  - `track/index.html`
  - `checkout/index.html`, `admin/index.html`, `order/index.html` as noindex client shells
  - `404.html`
  - `sitemap.xml` and `robots.txt`

The browser still mounts with `createRoot`; this is a **prerendered shell plus client mount**, not a claim of full React hydration. The benefit is that crawlers and no-JavaScript visitors receive the home, menu, story, credits, tracking, and 404 content in the original HTML. Interactive cart, checkout, admin, and tracking search still require JavaScript.

The build-time menu snapshot is stored in a non-executable `<script type="application/json" id="initial-menu">` data block. This keeps it compatible with the production CSP, which does not allow inline executable scripts.

### 3. Structured data

The following JSON-LD types are emitted where appropriate:

- `Restaurant` and `WebSite` on `/`
- `Menu` and `BreadcrumbList` on `/menu`
- `AboutPage` and `BreadcrumbList` on `/story`
- `BreadcrumbList` on `/credits`

Menu sections and menu items come from the same catalogue as the visible menu, including INR prices, availability, images, and vegetarian labels. The `Restaurant` node contains only facts the demo can support: name, description, URL, image, cuisine, and menu URL. Local-business fields are gated behind `emitBusinessDetails`.

### 4. Indexation and sharing

- `sitemap.xml` contains only the four indexable pages: `/`, `/menu`, `/story`, `/credits`.
- `robots.txt` allows public pages, disallows `/admin`, `/checkout`, `/order`, and `/api/`, and points to the sitemap.
- `/track` is deliberately not blocked in robots because it uses a `noindex` meta tag; blocking it would prevent crawlers from seeing that directive. It is excluded from the sitemap.
- Canonical URLs are absolute and use the configured `SITE_URL`.
- Open Graph/Twitter metadata uses a real local 1200×630 share image at `/og-share.jpg`.
- The Express static host also sends `X-Robots-Tag: noindex, nofollow` on private routes, so the directive is present even before the client renders.

### 5. Performance and rendering

- Responsive WebP variants for the hero, story, and interior images, with `srcSet`, `sizes`, and matching preload `imagesrcset`/`imagesizes`.
- Preload of the primary image and the two Latin variable fonts; `modulepreload` for the entry chunk.
- Private pages (`/admin`, `/checkout`, `/order/*`) are split into lazy-loaded chunks. Public routes remain statically imported so prerendering stays synchronous.
- Decorative step numbers were marked `aria-hidden` and given a darker contrast token, fixing the remaining home-page accessibility failure.
- Image dimensions are declared to avoid layout shift; `CLS` measured 0 on both audited pages.
- The static host serves hashed assets as immutable, while HTML, `robots.txt`, and `sitemap.xml` are revalidated.

### 6. Server and static-host parity

`SERVE_CLIENT=true` makes Express serve `client/dist` after the API routes. The host:

- serves `/` and clean URLs such as `/menu` and `/story` without a trailing-slash redirect;
- returns the generated 404 page with a real `404` status;
- applies the same CSP/HSTS/nosniff/frame/referrer policy as the API;
- adds `noindex, nofollow` to `/admin`, `/checkout`, `/order/*`, and `/track`;
- serves `robots.txt` and `sitemap.xml` as `no-cache`.

If an external static host is used instead, it must reproduce these behaviors. Rewriting every unknown path to `index.html` with a `200` is not acceptable for SEO.

## Validation

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors, 0 warnings |
| `npm test` | 33/33 tests passing |
| `npm run build` | Passed; client bundle plus prerendered HTML, sitemap, robots |
| `npm run check:seo` | 153 checks passed, 0 failed |
| Production-origin build with `SITE_URL=https://saffron-and-spice.example` | 153/153 SEO checks; no `localhost` URLs in canonical, sitemap, or robots |
| Static-host production checks | 38/38 passed (status, redirects, headers, noindex, cache, 404) |
| Browser CSP check | 0 CSP violations; 32 menu snapshot items; add-to-cart worked |
| Browser head/navigation check | Exactly one description, canonical, robots, OG image, and Twitter card at `/menu`, `/`, and `/story`; correct page-specific JSON-LD after SPA navigation; 0 console/CSP errors |
| Browser E2E | COD order created, admin login succeeded, `pending → confirmed`, tracking showed `confirmed` using a temporary database |
| `npm audit` | 0 known vulnerabilities across 309 reported dependencies |

The production-origin example domain is a placeholder used only to prove absolute-URL generation. It is not a deployed domain.

### Lighthouse

Baseline (mobile Lighthouse 13.5, Vite dev server):

| Page | Performance | Accessibility | Best practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Home | 26 | 96 | 100 | 92 |
| Menu | 25 | 100 | 100 | 92 |

Final production build (mobile Lighthouse 13.5, served by the Express static host; three runs per page):

| Page | Performance runs | Median | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| Home | 66, 66, 68 | 66 | 100 | 100 | 100 | 3.8–3.9 s | 6.6–6.7 s | 60–150 ms | 0 |
| Menu | 64, 66, 66 | 66 | 100 | 100 | 100 | 4.1–4.2 s | 6.6–6.7 s | 130–180 ms | 0 |

Notes on the comparison:

- The baseline was a development server; the final run used the production build. This is a before/after directional check, not a controlled lab experiment.
- The final build was served in development mode locally to avoid the production CSP's insecure-request upgrade on plain HTTP. Production headers and the production CSP were verified separately against the same build.
- Performance varies by run on shared hardware. The table reports the final three runs; repeated three-run sets on this build measured home medians of 66–68 and a menu median of 66. SEO, accessibility, and best-practices scores were 100 in every final run.
- The remaining performance cost is the render-blocking CSS/JS payload and simulated mobile latency. Further gains would need critical-CSS inlining, deeper CSS splitting, or infrastructure-level caching.

## Competitor observations

These are read-only observations of public home pages on 23 October 2026. They are not a ranking study, and no competitor copy, images, or code were reused.

| Site | HTTP | Parsed `<h1>` | Parsed `<h2>` | JSON-LD observed | Canonical | Robots/sitemap notes |
| --- | ---: | ---: | ---: | --- | --- | --- |
| [Toit](https://toit.in/) | 200 | 0 | 6 | Top-level `@type` did not resolve with a simple parser; needs deeper graph parsing to classify | `https://toit.in/` | Robots allows indexing and disallows `/wp-admin/` except `admin-ajax.php`; sitemap index with child sitemaps |
| [MTR](https://www.mavallitiffinrooms.com/) | 200 | 1 | 3 | `Organization` | `https://mavallitiffinrooms.com` | Robots allows indexing and disallows `/__forms.html` and `/admin`; 28-URL sitemap |
| [Burma Burma](https://www.burma.in/) | 200 | 3 | 111 | Top-level `@type` did not resolve with a simple parser; needs deeper graph parsing to classify | `https://burmaburma.in/` | Robots allows all; 97-URL sitemap |

What was applied from those observations, without copying:

- One clear `<h1>` per public page, with a logical heading order.
- Unique titles/descriptions and absolute canonicals.
- Structured data that matches visible facts, not aspirational facts.
- A small, intentional sitemap and a robots file that does not block pages that need to be crawled.
- Server-rendered content for primary pages, so the page is useful before JavaScript runs.

What was **not** concluded: that any competitor's rankings, traffic, or rich results are caused by these observations. Search performance depends on many factors outside this repository.

## Remaining production SEO work

1. **Set the real origin.** Build with `SITE_URL=https://<real-domain>` and confirm canonical, Open Graph, sitemap, and robots URLs use it. Rebuild after any domain change.
2. **Replace demo business facts.** Update the name/address/phone/hours in `client/src/config.js`, verify them against the real business, then set `restaurant.seo.emitBusinessDetails = true`. When enabling hours, replace the current `description`-based opening-hours mapping with proper `opens`/`closes` values.
3. **Use real social profiles.** Replace the placeholder Instagram URL before emitting `sameAs`, or leave `sameAs` out.
4. **Verify the live host.** Check that `/menu` does not redirect to `/menu/`, unknown URLs return 404, private routes carry noindex, and the production CSP has no inline-script exceptions.
5. **Search Console and Bing.** Verify the final domain, submit `https://<real-domain>/sitemap.xml`, and monitor indexing. Sitemap submission is a discovery aid, not a ranking guarantee.
6. **Reviews and ratings.** Only add review/rating markup if genuine, first-party reviews are displayed with the required policy compliance. Do not mark up testimonials that are not visible on the page.
7. **Content depth.** Add real menu descriptions, allergen/dietary notes, location and delivery-zone content, and useful editorial pages only when the facts are verified. Avoid keyword stuffing or doorway pages.
8. **Repeat measurement.** Re-run Lighthouse and `check:seo` after real content and domain changes; record the environment and date.

See `SECURITY_AUDIT.md` for the security work and `PROGRESS.md` for the build log.
