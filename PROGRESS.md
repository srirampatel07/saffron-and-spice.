# Progress — Saffron & Spice

**Status: complete — demo-ready, with documented production gaps.** Last updated 23 October 2026.

The site is a working full-stack demo: premium storefront, persistent cart, server-priced checkout, Cash on Delivery, optional Razorpay test-mode payments, public tracking, and a password-protected staff dashboard.

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Inspect workspace and design plan | Done |
| 1 | Foundation, design system, navigation | Done |
| 2 | Homepage, menu, photo library | Done |
| 3 | Cart and checkout experience | Done |
| 4 | Secure backend, database, orders | Done |
| 5 | Razorpay test mode and webhooks | Done |
| 6 | Confirmation, tracking, admin | Done |
| 7 | Quality pass and documentation | Done |

---

## Phase 0 — Inspect

- Workspace started empty except the Apple Design skill at `.agents/skills/apple-design/SKILL.md` and `skills-lock.json`.
- The Apple Design guidance was read in full. Applied principles: immediate press feedback, interruptible spring motion, spatial consistency, focus restoration, restrained surfaces, and reduced-motion alternatives.
- Environment: Node v24.22.1, npm 11.19.1 on Windows/PowerShell. In this shell, npm is invoked as `npm.cmd` because `npm.ps1` is blocked by execution policy.
- No existing application needed to be preserved. The app was built in `/client` and `/server` with a root workspace `package.json`.

## Phase 1 — Foundation

- React + Vite client, React Router, Express API, and a root `npm run dev` that starts both processes.
- Warm saffron / maroon / cream design tokens, fluid type scale, self-hosted Fraunces and Manrope variable fonts, and plain CSS with custom properties.
- Responsive announcement bar, navigation, footer, skip link, page focus management, and shared Button, Card, Badge, Drawer, quantity, dietary and toast components.
- Restaurant name, contact details, hours, delivery rules, and admin path are centralised in `client/src/config.js`.
- Accessibility foundations: semantic landmarks, visible `:focus-visible` rings, AA-targeted contrast, reduced-motion and increased-contrast media queries, and no motion-only feedback.

## Phase 2 — Homepage and menu

- Homepage: editorial hero, signature dishes, kitchen story, dining-room visit card, delivery reassurance, and responsive layouts.
- Menu: six categories, 32 dishes, search, diet filters, spice indicators, featured and sold-out states, add-to-cart controls, loading/error states.
- Seeded sold-out examples: Sarson Salmon Tikka and Malabar Prawn Curry, so unavailable-item handling is demonstrable.
- Photo library: 29 licensed dish photographs plus 3 editorial photos, served locally as WebP; the original 35 SVGs remain as fallbacks. Three dishes keep their illustrations.
- All assets inventoried with photo/placeholder status, sizing, and fallback behaviour in [IMAGES.md](IMAGES.md); per-photo attribution is in [CREDITS.md](CREDITS.md).
- Desktop and mobile visual checks completed, including the mobile navigation, menu filters, and empty states.

## Phase 3 — Cart and checkout

- `localStorage`-persisted cart with quantity limits, removal, clear-cart, unavailable-item guard, and live subtotal/GST/delivery estimates.
- Cart drawer enters from the right with a custom rAF spring drag-to-dismiss; focus is trapped and restored; reduced-motion fallback is provided.
- Mobile fixed cart bar, free-delivery threshold progress, and desktop cart drawer verified at both viewport sizes.
- Checkout collects name, Indian mobile number, address, and kitchen notes. Validation is inline and also enforced server-side.
- The checkout summary requests a server quote before submission. The client never supplies prices or totals.
- Payment choice supports Cash on Delivery and, when test keys are configured, Razorpay test mode with a clear test-mode badge. Card details are never collected by this site.
- Submit is disabled while a request is pending; network and validation errors are announced inline.

## Phase 4 — Backend and orders

- Express 5 server with Helmet, exact-origin CORS (`CLIENT_URL` plus optional `CLIENT_ORIGINS`), per-route rate limits, central error handling, and intentional 503 behaviour for unconfigured features.
- SQLite via `better-sqlite3` with `menu_items`, `orders`, `order_items`, and `webhook_events`. Schema and menu seed run automatically at startup.
- The server loads current menu data, rejects unavailable dishes and malformed/duplicate lines, and calculates subtotal, delivery, 5% GST, and total in paise.
- Client order payloads carry only `{ menuItemId, quantity }` lines, customer details, and the payment method. Client-supplied money is ignored.
- Duplicate-order protection uses a client idempotency key plus phone match. Replaying the same request returns the original order instead of creating a second one.
- Indian mobile normalisation accepts 10 digits starting with 6–9, optional `+91`, and common separators; lookup requires both order number and matching phone.
- Order statuses: `pending`, `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`. Payment statuses: `unpaid`, `paid`, `failed`, `cod_pending`.
- Admin auth uses a 12-hour HMAC-signed bearer token derived from `ADMIN_PASSWORD`; the shared demo password itself is never sent after login.
- `npm run seed` safely upserts menu content without deleting order data.

## Phase 5 — Razorpay test mode

- Official Razorpay Node SDK creates provider orders; the key secret stays server-side.
- Only `rzp_test_…` keys enable online payment. Live-looking keys are refused by configuration, and missing keys leave the checkout working COD-only.
- Checkout signature verification uses `HMAC-SHA256(order_id|payment_id)` and `crypto.timingSafeEqual`.
- `POST /api/webhooks/razorpay` uses the exact raw request body, verifies `X-Razorpay-Signature`, and records `X-Razorpay-Event-Id` before side effects. Replayed events return `duplicate: true` without re-applying changes.
- `payment.captured` / `order.paid` mark payment paid; `payment.failed` records failure without automatically cancelling an order.
- This workspace intentionally has no Razorpay keys. Online payment is therefore disabled here, while COD works end to end. The payment code paths are covered by automated signature and webhook tests.

## Phase 6 — Confirmation, tracking, and admin

- **Confirmation:** loads the remembered order, shows status timeline, itemised receipt, delivery details, payment state, and a retry action for unpaid Razorpay orders.
- **Tracking:** lookup by order number and phone; prefill from the latest order or query string; 30-second status refresh; timeline, receipt, delivery and payment summary.
- **Admin:** login with the configured password, session-scoped token, order counts and status filters, 30-second refresh, one-click status updates, and logout. The page is marked `noindex`.
- Cancelled orders display a distinct state, and payment-pending prompts are suppressed where they no longer make sense.
- Headless Edge verification completed for a real COD checkout (`SS-261022-8EC006`): form validation, server quote, order creation, cart clearing, and confirmation rendering all succeeded with no console errors.
- The same order was moved from `pending` to `confirmed` through the admin UI; counts, filters, and toast feedback updated correctly.

## Phase 7 — Quality and documentation

- Lint now reports **0 errors and 0 warnings** after splitting context hooks into standalone modules and fixing a Drawer cleanup reference.
- Server test suite: **33/33 passing**.
- Production client build succeeds.
- Desktop and mobile visual QA completed for home, menu, cart, drawer, checkout, confirmation, tracking, and admin.
- Public pages and API surfaces were exercised against the live local server: menu loading, quote calculation, COD order creation, idempotent replay, lookup, unavailable-item rejection, admin login, and status update.
- Documentation: [README.md](README.md) covers setup, configuration, Razorpay test mode, webhook tunnels, API routes, and production limits. [IMAGES.md](IMAGES.md) covers the photo/placeholder inventory and fallback behaviour; [CREDITS.md](CREDITS.md) lists per-photo attribution.

## Verification log

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm.cmd run lint` | 0 errors, 0 warnings |
| Tests | `npm.cmd test` | 33 passed, 0 failed |
| Build | `npm.cmd run build` | Passed — client bundle + prerendered route HTML; `SITE_URL` is unset locally, so canonical/sitemap URLs fall back to localhost |
| COD checkout | Headless Edge against local dev server | Passed; order created and cart cleared |
| Admin update | Headless Edge against local dev server | Passed; `pending → confirmed` |
| Photo inventory | Local file check | 32 WebP photos (29 dishes, 3 scenes); all dishes 800×600 and under 150 KB; hero 343,142 B |
| Photo browser QA | Headless Edge, 1440×1000 and 390×844 | Home 7/7 and menu 32/32 images loaded; all 32 cards across six categories; no broken images, console errors, failed responses, or document overflow |
| Image fallback | Headless Edge | Forced WebP error swapped to the matching SVG with no retry loop |
| Credits page | Headless Edge | `/credits` rendered 32 rows and footer “Photo credits” link resolved |
| Layout stability | Headless Edge / LayoutShiftObserver | Home 0.007, menu 0; checkout 0.0004 and direct confirmation load 0.027; admin mobile 0.0004 |
| Razorpay live UI | Not run | No test keys in this workspace; logic covered by tests |

### What the tests cover

- Server-side menu pricing and refusal of unavailable dishes.
- COD order idempotency, duplicate lines, quantity bounds, and phone-bound lookup.
- Indian phone normalisation and rejection cases.
- Delivery threshold, GST rounding, and invalid subtotal handling.
- Razorpay checkout signature verification.
- Webhook HMAC validity, malformed and tampered signatures.
- Webhook event-ID idempotency for paid and failed payment events.

## Demo data and known limitations

- The restaurant, menu, prices, address, and hours are fictional. Photography is licensed stock used for the demo; see [CREDITS.md](CREDITS.md). Three dishes retain generated illustrations.
- Two dishes are intentionally seeded unavailable to demonstrate the sold-out path.
- The local `.env` is gitignored and currently enables a demo-only admin password. Change it before sharing or deploying.
- Admin access is a single shared password, not individual staff accounts; tokens are stateless and cannot be individually revoked.
- Tracking updates by polling every 30 seconds. There is no SMS/email notification or push channel.
- SQLite and the in-memory rate limiter are single-instance. There are no schema migrations or automated backups.
- There is no inventory reservation, delivery-zone check, driver dispatch, cancellation UI, refund flow, or emailed invoice.
- Razorpay must be exercised with test keys and a public HTTPS tunnel for full provider/webhook validation. Never use live keys in this demo.

See [README.md](README.md#demo-scope-and-production-notes) for the full Implemented / Placeholder / Required-before-production breakdown.

---

## Photo Upgrade

**Status: complete.** Local, licensed food photography now replaces 29 of the 32 dish illustrations; three editorial scenes are also photographs. The remaining three dishes keep clean SVG illustrations because no accurate licensed match was found.

- [x] Re-read `PROGRESS.md`, `IMAGES.md`, and the Apple Design guidance.
- [x] Confirmed web search, web fetch, and PowerShell HTTPS downloads are available.
- [x] Captured the starting asset baseline: 35 SVGs, 752,845 bytes total.
- [x] Installed/confirmed Sharp for WebP processing.
- [x] Sourced and visually reviewed licensed candidates for all 32 dishes.
- [x] Sourced and reviewed hero, kitchen-story, and dining-room scene photos.
- [x] Downloaded and optimised all approved photos locally.
- [x] Kept SVG fallbacks and added `SafeImage` WebP-to-SVG error handling.
- [x] Added `CREDITS.md`, a public `/credits` page, and the footer credits link.
- [x] Updated `IMAGES.md` with real-photo / placeholder status per asset.
- [x] Ran lint, tests, and production build.
- [x] Browser-checked desktop and mobile storefront, cart, checkout, tracking, credits, and admin with no broken images, document overflow, or console errors.
- [x] Recorded final replaced / placeholder counts and total image weight.

**Final inventory:** 32 photographs (29 dishes + 3 scenes) and 35 SVG fallbacks. WebP total **2,504,682 bytes** (dishes 1,783,486; scenes 721,196). Retained SVG total **752,845 bytes**; folder total **3,257,527 bytes**. The hero is **343,142 bytes** (under 350 KB); the largest dish photo is **135,168 bytes** (under 150 KB).

**Placeholders retained:** Laal Maas, Peshawari Naan, and Gulab Jamun Cheesecake. Each lacked an accurate, appetising, appropriately licensed match; a clean illustration was preferred to a misleading photo.

**Final browser QA:** Headless Edge at 1440×1000 and 390×844; home 7/7 images loaded, menu 32/32 loaded across all six categories (5/6/6/5/5/5), fallback swap verified, cart/checkout/confirmation/tracking and admin login/status update passed. No broken images, console errors, failed responses, or horizontal document overflow.

Source rules: Unsplash, Pexels, Pixabay, or Wikimedia Commons only; Commons images must be CC0, CC BY, or CC BY-SA. No paid stock, Google Images, AI-generated imagery, brand-heavy scenes, or uncertain licences. A clean placeholder is preferred to a mismatched dish photo.

---

# Security + SEO

**Status: complete — demo-ready, with documented production gaps.** Last updated 23 October 2026.

## Checkpoint 0 — Start state

- Started: 23 October 2026.
- Branch: `main`. Current commit: `94efe56bc7b0d41234e765d9f4cb5cebe6b78331` (`Improve food image source preparation`).
- The working tree already contained uncommitted photo-upgrade work. It is preserved, not reverted:
  - Modified: `IMAGES.md`, `client/src/App.jsx`, `client/src/components/CartDrawer.jsx`, `client/src/components/DishCard.jsx`, `client/src/components/Footer.jsx`, `client/src/components/OrderReceipt.jsx`, `client/src/main.jsx`, `client/src/pages/CheckoutPage.jsx`, `client/src/pages/HomePage.jsx`, `client/src/pages/TrackOrderPage.jsx`, `server/src/data/menu.js`.
  - Untracked: `CREDITS.md`, `client/src/components/SafeImage.jsx`, `client/src/pages/CreditsPage.jsx`, `client/src/styles/credits.css`, `client/src/data/`, 32 WebP dish images plus 3 WebP scene images, and `scripts/_*.mjs` image helpers.
- Baseline checks were run before any audit edit:
  - `node --version` → v24.22.1; `npm.cmd --version` → 11.19.1.
  - `npm.cmd run lint` → passed, 0 errors, 0 warnings.
  - `npm.cmd test` → 15 passed, 0 failed, 0 skipped (duration 843.63 ms).
  - `npm.cmd run build` → passed; Vite produced `client/dist` (JS 384.30 kB / 113.30 kB gzip; CSS 112.24 kB / 23.17 kB gzip).
  - `npm.cmd audit --json` → 0 vulnerabilities across 309 dependencies (102 prod, 208 dev, 54 optional).
  - Lighthouse 13.5.0, mobile, against the running local dev server (Chrome available):
    - Home: performance 26, accessibility 96, best-practices 100, SEO 92.
    - Menu: performance 25, accessibility 100, best-practices 100, SEO 92.
    - Dev-server numbers are unminified and include HMR; they are the recorded baseline, not a production estimate.
- These are the baseline values; any later failure is compared against them.

## Checkpoint A — Security audit

### Dependencies and secrets

- `package-lock.json` is present and tracked. `npm.cmd audit` reports 0 known vulnerabilities across 309 reported dependencies (102 production, 208 development, 54 optional).
- Removed the unused `zod` dependency from `client/package.json`; the client never imported it and uses its own validation module. The server keeps Zod for request validation.
- Current tree and Git history contain no real key/token/password values. `.env.example` contains placeholders only. `.env` and `server/data/*.db*` are gitignored and not tracked. No `.env`, database, private key or live Razorpay key was found in history. README/test `rzp_test_...` strings are placeholders/fixtures.
- `client/dist` contains no Razorpay key secret, webhook secret, token secret or private key. It does contain the literal `ADMIN_PASSWORD` only as the setup-instruction text in the admin UI, not a value.

### Fixes applied

- Added a production configuration gate (`server/src/lib/productionGuard.js`) called before the database opens. Production refuses to boot if `ADMIN_PASSWORD` is missing, shorter than 16 characters, a known demo/common value, or if `ADMIN_TOKEN_SECRET` is missing, shorter than 32 characters, or equal to the password. Verified with two real `NODE_ENV=production` boot attempts (both exited 1 with generic reasons, no secret output).
- Admin tokens now use a separate signing key (`ADMIN_TOKEN_SECRET`) with a domain-separated HMAC-SHA256 derivation. Local development falls back to a development-only key derived from `ADMIN_PASSWORD` and warns; production requires the separate secret. Token verification rejects extra dot segments, malformed signatures, bad subjects, invalid timestamps and expired tokens.
- Added a 250 ms delay to failed admin logins in addition to the existing per-IP limit of 8 attempts per 15 minutes.
- Added Zod validation for admin params/query and made order/payment/admin body schemas strict. Money, status and payment-status fields sent by a client are now rejected as unknown fields. Quantities must be real integers, not coerced strings/booleans.
- Tightened order-number and Razorpay ID/signature formats before reaching services.
- Added generic handling for oversized and malformed JSON, plus generic 5xx codes/messages. Internal SQLite/error codes and stack traces no longer reach clients.
- Added explicit production headers: HSTS, frame denial, referrer policy, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, and the existing Razorpay CSP allow-list. CORS now restricts allowed headers to `Content-Type`, `Authorization` and `X-Idempotency-Key`.
- Webhooks now require the provider order ID to match the local order, currency to be INR, and the captured/paid amount to equal the server-calculated total. A provider payment ID cannot settle two local orders. `markOrderPaid` no longer overwrites an already-paid order.
- Confirmed no `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `document.write` in client source. Confirmed all SQL uses prepared statements; the only template interpolation is a generated list of `?` placeholders.
- Admin token remains in `sessionStorage`; this is documented as an XSS tradeoff. The production CSP reduces but does not eliminate that risk.

### Tests added

- `server/test/admin-auth.test.js`: password comparison, token issue/verify, tamper, wrong key, expiry, malformed tokens, bearer parsing, production guard.
- `server/test/security.test.js`: every admin route with no/bad/tampered/expired token, login rate limiting and delay, client money/quantity/phone tampering, duplicate orders, tracking enumeration and identical not-found responses, oversized/malformed JSON, CORS allow/deny, webhook invalid signature and replay, safe 404.
- `server/test/webhooks.test.js`: amount mismatch, wrong provider order, reused payment ID, updated fixtures with amount/currency.

### Verification at this checkpoint

- `npm.cmd run lint` → 0 errors, 0 warnings.
- `npm.cmd test` → 33 passed, 0 failed.
- `npm.cmd build` → passed before SEO changes; the final build is verified in Checkpoint B.
- `npm.cmd audit` → 0 vulnerabilities.
- Production boot refusal → exit 1 in both missing/weak fixture tests.

### Remaining security limitations (documented, not “fixed”)

- In-memory rate limits reset on restart and are per instance; distributed brute force and multi-instance deployments need a shared store.
- `trust proxy` is set to `1` in production for a single proxy (e.g. Render). A different topology must configure this deliberately.
- Admin auth is one shared password, not staff accounts/MFA; tokens are stateless and cannot be revoked individually.
- Tracking returns the order's own contact/address to a caller who knows both order number and phone; this is intentional but is PII exposure if either is shared.
- Webhook endpoint relies on signature verification and has no separate rate limit, to avoid dropping provider retries.
- Multi-instance payment-ID uniqueness still needs a database constraint; the current guard is synchronous within one process.
- No professional penetration test, WAF, monitoring, alerting, dependency scanning CI, or secret-scanning CI has been performed.

## Checkpoint B — Technical SEO

### Architecture

- Added `client/src/lib/seo.js` as the single source for page titles, descriptions, canonical paths, Open Graph/Twitter data, and JSON-LD.
- Added the `Seo` component inside `Layout` so client-side navigation updates the same head data as the prerendered pages. Prerendered meta/canonical/JSON-LD tags are marked `data-seo-managed`/`data-seo-jsonld`, so the client reuses or replaces them instead of adding duplicates.
- Removed the legacy per-page `usePageTitle` hook; `Seo` is the single owner of page titles. This fixes incorrect titles after client-side navigation.
- Added an additive `/story` route and navigation/footer links; no existing route was removed.
- Added the smallest compatible prerender path: Vite SSR with React `renderToString` and `StaticRouter` in `scripts/prerender.mjs`. No framework migration.
- The client still mounts with `createRoot`; this is a prerendered shell plus client mount, not full React hydration. Public content is present without JavaScript; cart/checkout/admin/tracking interactions still require JavaScript.
- The build writes prerendered `index.html`, `menu/index.html`, `story/index.html`, `credits/index.html`, `track/index.html`, private shells for checkout/admin/order, `404.html`, `sitemap.xml`, and `robots.txt`.

### Indexing and structured data

- Sitemap contains only `/`, `/menu`, `/story`, `/credits`.
- `/track` is `noindex, nofollow` and excluded from the sitemap. `/admin`, `/checkout`, `/order/*`, and the 404 page are noindex; the static host also sends `X-Robots-Tag: noindex, nofollow` for private routes.
- `robots.txt` allows public pages, disallows `/admin`, `/checkout`, `/order`, and `/api/`, and points to the sitemap.
- JSON-LD: `Restaurant` + `WebSite` (home), `Menu` + `BreadcrumbList` (menu), `AboutPage` + `BreadcrumbList` (story), `BreadcrumbList` (credits).
- `restaurant.seo.emitBusinessDetails` remains false, so address, service area, telephone, and opening hours are omitted. No ratings or reviews are emitted. The placeholder Instagram URL is not emitted as `sameAs`.
- Open Graph/Twitter metadata uses a real local 1200×630 `og-share.jpg`.

### Performance and hosting

- Added responsive WebP variants for the hero, story, and interior images, with `srcSet`/`sizes` and matching preload `imagesrcset`/`imagesizes`.
- Added font preloads, entry `modulepreload`, image dimensions, lazy loading for below-fold images, and route-level lazy loading for private screens.
- Fixed the home ritual-number contrast issue and marked the decorative numbers `aria-hidden`.
- The initial menu snapshot is a non-executable `<script type="application/json" id="initial-menu">` block, read by `client/src/lib/initialMenu.js`, so the production CSP does not need inline scripts.
- Added optional `SERVE_CLIENT=true` Express static hosting with clean URLs, real 404 status, noindex headers, and cache policy. `express.static` now has `redirect: false`, so `/menu` serves directly rather than redirecting to `/menu/`.

### Verification

- `npm.cmd run lint` → 0 errors, 0 warnings.
- `npm.cmd test` → 33 passed, 0 failed.
- `npm.cmd run build` → passed; Vite client build plus prerender.
- `npm.cmd run check:seo` → 153 checks passed, 0 failed.
- Production-origin build with `SITE_URL=https://saffron-and-spice.example` → 153/153 SEO checks; no localhost URLs in canonical, sitemap, or robots.
- Static host in production mode → 38/38 checks passed: `/menu` 200 with no redirect; CSP/HSTS/nosniff/frame/referrer headers; noindex on `/admin`, `/checkout`, `/track`, `/order/*`; real 404; no-cache HTML/robots/sitemap; immutable hashed assets.
- Browser CSP check → 0 CSP violations; 32 menu snapshot items; add-to-cart worked.
- Browser head/navigation check → exactly one description, canonical, robots, OG image, and Twitter card at `/menu`, `/`, and `/story`; correct page-specific JSON-LD after SPA navigation; 0 console/CSP errors.
- Browser E2E with a temporary database → COD order `SS-261023-247F60`, admin login, status `pending → confirmed`, tracking showed `confirmed`. Temporary DB was deleted.
- `npm.cmd audit` → 0 known vulnerabilities across 309 reported dependencies.
- Lighthouse 13.5 mobile, final production build served locally for three runs per page:
  - Home: performance 66, 66, 68 (median 66); accessibility 100; best-practices 100; SEO 100; FCP 3.8–3.9 s; LCP 6.6–6.7 s; TBT 60–150 ms; CLS 0.
  - Menu: performance 64, 66, 66 (median 66); accessibility 100; best-practices 100; SEO 100; FCP 4.1–4.2 s; LCP 6.6–6.7 s; TBT 130–180 ms; CLS 0.
  - Repeated three-run sets measured home medians of 66–68 and a consistent menu median of 66; the difference is run-to-run variance.
  - Baseline for comparison was home 26/96/100/92 and menu 25/100/100/92 on the Vite dev server. The before/after comparison is directional, not a controlled experiment.

### Remaining production work

- Set `SITE_URL` to the real HTTPS origin and rebuild.
- Replace the demo name/address/phone/hours with verified data, then set `emitBusinessDetails: true`; use proper `opens`/`closes` values for opening hours and real social profiles before adding `sameAs`.
- Verify the production host and submit the sitemap to Google Search Console/Bing after the domain is live.
- Replace the shared admin password with staff accounts/MFA/auditable sessions; use a managed database, shared rate-limit store, and a database-level payment-ID uniqueness constraint.
- Add live payment operations, webhook retry/dead-letter handling, monitoring, CI dependency/secret scanning, and an independent security/accessibility review.

See `SECURITY_AUDIT.md` and `SEO_NOTES.md` for the detailed records. No commits, pushes, deployments, or real credential changes were made; the pre-existing photo-upgrade work was preserved.

## Checkpoint C — Public tunnel CORS fix

- **Confirmed cause:** Two layers were involved. First, the API child PID 17376 started at 2:29:29 PM, while the root `.env` was last written at 2:32:12 PM. `node --watch` restarts on watched source changes but does not reload `.env`, so the running child kept the old origin set. Second, even after the API reloaded, Vite’s default dev-server CORS middleware intercepted `/api` `OPTIONS` preflights and returned `204` without an ACAO for the tunnel origin, so admin login would still fail at the browser’s preflight.
- **Fix:** Added optional `CLIENT_ORIGINS`, a comma-separated list of extra exact origins. `CLIENT_URL` remains the primary origin and is always included. Express uses an exact `Set`; no wildcard or origin reflection. Vite’s dev-server CORS middleware is disabled so API preflights reach Express; same-origin Vite assets do not need CORS. Express CORS is not disabled.
- **Config:** `server/src/config.js` normalizes the primary and extra origins, removes duplicates, and exposes `config.clientOrigins`; `server/src/app.js` checks the origin against a `Set`. `client/vite.config.js` sets `server.cors: false`.
- **Launch/env check:** The API child’s working directory is `E:\restaurant\server`; the npm and shell parent processes do not set `CLIENT_URL` or `CLIENT_ORIGINS`. `server/src/config.js` loads `E:\restaurant\.env` through an absolute path derived from `import.meta.url`, so `.env` loading is independent of the launch directory.
- **Tests:** The CORS regression test covers the localhost origin, two configured tunnel origins, no-origin requests, a preflight request, an unrelated origin, a suffix-lookalike origin, and a wrong localhost port. `npm.cmd test` passes 33/33. A temporary probe using the real `.env` confirmed the tunnel origin is parsed and allowed while `https://evil.example` is rejected.
- **Runtime probe:** The public tunnel `GET /api/health` returns 200 with the exact ACAO; `OPTIONS /api/admin/login` returns 204 with the exact ACAO; a dummy-password login returns 401 (not a CORS error) with the exact ACAO; `https://evil.example` returns 403.
- **No security regressions:** Admin password/token validation, login rate limiting and delay, Helmet/CSP/HSTS, strict schemas, webhook checks, and payment settings were not changed.
- **Validation:** `npm.cmd run lint` 0/0; `npm.cmd test` 33/33; `npm.cmd run build` passed; `npm.cmd run check:seo` 153/153.
- **Restart:** After changing `CLIENT_ORIGINS`, restart the API so dotenv re-reads `.env`. Vite reloads `vite.config.js` on its own; restart the Vite dev server if it does not. Replace the tunnel origin in `.env` when the Cloudflare hostname changes; no source edit is required. Localhost remains allowed through `CLIENT_URL`.
