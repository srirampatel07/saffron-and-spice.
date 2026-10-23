# Saffron & Spice

A premium, demo-ready Indian restaurant ordering experience: a warm storefront, a persistent cart, server-priced checkout, Cash on Delivery, optional Razorpay **test-mode** payments, public order tracking, and a password-protected staff dashboard.

Built with React + Vite on the client and Node/Express + SQLite on the server. Food photography is stored locally, with SVG fallbacks, and fonts are self-hosted, so the app runs without external image or font CDNs.

---

## Quick start

**Requirements:** Node.js 20.19+ (tested on Node 24) and npm 10+.

```bash
# from the repository root
npm install
cp .env.example .env       # macOS/Linux
# Copy-Item .env.example .env   # Windows PowerShell
```

Open `.env` and set at least an admin password. Then:

```bash
npm run dev
```

| Service | URL |
| --- | --- |
| Storefront | http://localhost:5173 |
| API | http://localhost:5000 |
| Staff dashboard | http://localhost:5173/admin |
| Health check | http://localhost:5000/api/health |

One command starts both Vite and the API. The database is created and the menu seeded automatically on first boot.

> If PowerShell blocks `npm.ps1`, use `npm.cmd run dev` (or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once).

### Minimum `.env` for the demo

```dotenv
PORT=5000
CLIENT_URL=http://localhost:5173
ADMIN_PASSWORD=replace-with-a-long-random-password
# Optional in development; required in production:
# ADMIN_TOKEN_SECRET=replace-with-at-least-32-random-characters
```

Razorpay keys are optional. With no keys, checkout offers **Cash on Delivery only**; the online payment option explains that it is not configured. The app never collects card details.

> The local `.env` is gitignored. Use a unique demo password, and never reuse demo credentials in production. Production refuses to boot with a missing or weak `ADMIN_PASSWORD`, or with a missing/short `ADMIN_TOKEN_SECRET`.

---

## What is included

### Storefront
- Brand-led home page, full menu with categories, search, dietary marks, availability, and spice levels.
- Cart persisted in `localStorage`, with quantity controls, a drag-to-dismiss drawer, free-delivery progress, and a mobile cart bar.
- Checkout with inline validation for name, Indian mobile number (10 digits starting 6–9, optional `+91`), address, and kitchen notes.
- Server-quoted totals (subtotal, delivery, 5% GST), COD or Razorpay test-mode payment, and duplicate-order protection via an idempotency key.
- Confirmation and public tracking pages with a live status timeline, receipt, delivery details, and payment retry when a Razorpay payment is still pending.
- Staff dashboard with order queue, status counts, filtering, and one-click status updates.

### Server
- Express 5, SQLite (`better-sqlite3`), strict Zod validation, Helmet, exact-origin CORS (`CLIENT_URL` plus optional `CLIENT_ORIGINS`), and rate limiting.
- Production boot guard for admin credentials, with a separate HMAC signing key for admin tokens.
- All prices and totals are calculated from the database; the client only sends menu item IDs and quantities.
- Razorpay order creation plus HMAC-SHA256 signature verification using `crypto.timingSafeEqual`.
- Raw-body Razorpay webhook with signature verification, event-ID idempotency, provider-order matching, currency and exact-total checks, and payment-ID reuse protection.
- Menu and orders tables, order item snapshots, webhook event log, and safe menu re-seeding.
- Optional built-client hosting with clean URLs, real 404 responses, noindex headers for private routes, and security headers.

### SEO
- Prerendered HTML for `/`, `/menu`, `/story`, `/credits`, `/track`, and the 404 page, with a client-side React mount on top.
- Unique titles and descriptions, canonical URLs, Open Graph/Twitter metadata, and a 1200×630 share image.
- Schema.org `Restaurant`, `WebSite`, `Menu`, `BreadcrumbList`, and `AboutPage` JSON-LD. Fictional address, service area, phone, hours, ratings, and reviews are deliberately omitted.
- `sitemap.xml`, `robots.txt`, noindex metadata/headers for private routes, and a `check:seo` validation script.
- Responsive hero/story/interior image variants, preloads, modulepreload, and route-level code splitting for private screens.

### Quality
- Keyboard focus management, semantic landmarks, skip link, alt text, visible focus rings, reduced-motion and increased-contrast support.
- Self-hosted variable fonts (Fraunces + Manrope), 32 local WebP photos plus responsive variants, and 35 SVG fallbacks. Three dishes intentionally keep their illustrations.
- Server tests for totals, Indian phone validation, signature verification, order idempotency, unavailable items, webhook idempotency, admin auth, production configuration, and safe error responses (33 tests).

---

## How ordering works

1. The client sends only `{ menuItemId, quantity }` lines to `POST /api/orders/quote` and `POST /api/orders`.
2. The server loads current menu rows, rejects unavailable dishes, validates quantities, and calculates every paise.
3. A client-generated `X-Idempotency-Key` prevents duplicate orders. Replaying the same key with the same phone returns the original order.
4. COD orders start at `pending` with payment status `cod_pending`.
5. Razorpay orders start at `pending` with payment status `unpaid`, then are verified server-side and moved to `paid` (and `confirmed`) after a valid signature or webhook.
6. The customer can track an order with the order number **and** the matching phone number.

### Order statuses

`pending → confirmed → preparing → out_for_delivery → delivered`

`cancelled` is available from the admin dashboard. Payment statuses are `unpaid`, `paid`, `failed`, and `cod_pending`. Marking a COD order delivered settles it to `paid`.

### Admin dashboard

Set `ADMIN_PASSWORD` in `.env`, restart the server, then visit `/admin`. The dashboard signs in with a single shared password and receives a stateless, HMAC-signed 12-hour bearer token stored in `sessionStorage`. Admin tokens are signed with `ADMIN_TOKEN_SECRET`; development falls back to a domain-separated key derived from the password and prints a warning. Production requires a separate secret of at least 32 characters.

Without `ADMIN_PASSWORD`, the dashboard is intentionally disabled and `/api/admin/*` returns `503 ADMIN_NOT_CONFIGURED`.

---

## Razorpay test mode

> Only `rzp_test_…` keys are accepted. If live-looking keys are present, the server keeps online payments disabled. Never put secrets in client code or commit them.

1. Create a Razorpay account and switch the dashboard to **Test mode**.
2. Copy the test **Key ID** and **Key Secret** into `.env`:

   ```dotenv
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. Restart `npm run dev`. Checkout now shows **Pay online** with a “Test mode” badge.
4. Pay using Razorpay’s test instruments (test card/UPI details are listed in the Razorpay test docs). Card data is entered only inside Razorpay Checkout.
5. The client sends the signed payment result to `POST /api/payments/razorpay/verify`; the server verifies `HMAC-SHA256(order_id + "|" + payment_id, key_secret)` before marking the order paid.

### Webhooks

Webhooks keep orders correct if the browser closes after payment. They require a public HTTPS URL, so use a tunnel for local testing (for example `ngrok http 5000` or a Cloudflare Tunnel).

1. Add a webhook in the Razorpay dashboard (Test mode) with URL:

   ```text
   https://<your-public-tunnel>/api/webhooks/razorpay
   ```

2. Choose a webhook secret and add the same value to `.env`:

   ```dotenv
   RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
   ```

3. Subscribe to at least:
   - `payment.captured` (and/or `order.paid`)
   - `payment.failed`
4. Restart the server and trigger a test payment. The endpoint reads the exact raw body, verifies `X-Razorpay-Signature`, and records `X-Razorpay-Event-Id` in `webhook_events` before applying side effects. Replayed event IDs return `duplicate: true` and are not applied twice.

The automated test suite exercises webhook signature validity and idempotency without contacting Razorpay.

---

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start API (watch mode) + Vite dev server |
| `npm run dev:server` | Start only the API |
| `npm run dev:client` | Start only Vite |
| `npm run seed` | Upsert the menu without deleting orders |
| `npm run generate:images` | Regenerate the local SVG illustrations |
| `npm run generate:responsive` | Regenerate responsive WebP variants from the source photos |
| `npm run generate:og` | Regenerate the 1200×630 social share image |
| `npm test` | Run the server test suite (Node test runner) |
| `npm run lint` | Lint the whole repository |
| `npm run build` | Build the client and prerender public HTML to `client/dist` |
| `npm run check:seo` | Validate metadata, JSON-LD, prerendered content, sitemap, and robots |

`npm run build` needs `SITE_URL` for production. If it is unset or points to localhost, canonical and sitemap URLs use `http://localhost:5173` and the build prints a warning. Run `npm run check:seo` with the same `SITE_URL` value (or set it in `.env`); the checker compares generated canonicals and sitemap URLs against that origin.

To reset the demo database: stop the server, delete `server/data/saffron-spice.db*`, then restart. The menu is reseeded automatically.

---

## Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `CLIENT_URL` | `http://localhost:5173` | Primary exact CORS origin; always allowed |
| `CLIENT_ORIGINS` | empty | Optional comma-separated extra exact CORS origins, such as the current public tunnel. No wildcards |
| `ADMIN_PASSWORD` | empty | Empty disables the staff dashboard; production requires 16+ characters |
| `ADMIN_TOKEN_SECRET` | empty | Admin token signing key; production requires 32+ characters and a value different from the password |
| `RAZORPAY_KEY_ID` | empty | Must start with `rzp_test_` for online payments |
| `RAZORPAY_KEY_SECRET` | empty | Server-side only |
| `RAZORPAY_WEBHOOK_SECRET` | empty | Required for webhook processing |
| `DB_PATH` | `server/data/saffron-spice.db` | Optional SQLite path |
| `NODE_ENV` | `development` | Set `production` for the credential guard, CSP, and HSTS |
| `SITE_URL` | `http://localhost:5173` | Public HTTPS origin used for canonical URLs, sitemap, and JSON-LD at build time |
| `SERVE_CLIENT` | `false` | Set `true` to serve `client/dist` from Express after a build |
| `VITE_API_URL` | empty | Client build-time API origin when frontend and API are on different hosts |

For a split deployment, build the client with `SITE_URL=https://www.example.com` and `VITE_API_URL=https://api.example.com`, and set the server’s `CLIENT_URL` to the exact storefront origin.

### Public tunnel (development)

Vite proxies browser `/api` requests to Express. The proxy rewrites the `Host` header (`changeOrigin: true`) but **forwards the browser’s `Origin` header**, so Express must allow the tunnel origin. Add the current exact tunnel origin to `CLIENT_ORIGINS`:

```dotenv
CLIENT_URL=http://localhost:5173
CLIENT_ORIGINS=https://your-current-tunnel.example
```

- `CLIENT_URL` is always included; this keeps localhost working.
- Multiple origins are comma-separated, with no trailing slash.
- Restart the API after changing the value. When the tunnel hostname changes, replace the old entry in `.env`; no source edit is required.
- Do not use `*` or reflect arbitrary origins in Express, and do not disable Express CORS. Localhost and the listed tunnel origins are matched exactly.
- Vite’s dev-server CORS middleware is disabled (`server.cors: false`) so `/api` preflights reach Express instead of being answered by Vite’s localhost-only policy. Do not replace it with a wildcard Vite CORS policy.
- Leave `VITE_API_URL` empty when using the Vite proxy. If it is set, the browser calls Express directly and that API URL must be publicly reachable and separately secured.
- If the client calls Express directly instead of through the Vite proxy, add the tunnel origin to this list as well and ensure the backend is reachable from the browser.


### Hosting

- **Single Express host:** run `npm run build`, set `SERVE_CLIENT=true`, and start the production server. This serves clean URLs, real 404s, noindex headers for `/admin`, `/checkout`, `/order/*`, and `/track`, and the same helmet policy as the API.
- **External static host:** serve `client/dist` and rewrite clean URLs to the matching prerendered HTML files (`/menu` → `menu/index.html`, `/order/*` → `order/index.html`, and unknown paths to `404.html` with a 404 status). Replicate the CSP/HSTS/noindex/cache headers. Do not rewrite everything to `index.html`, or unknown URLs return the home page with status 200.
- Set `SITE_URL` to the final HTTPS origin before building; do not build production artifacts with the localhost fallback.
- SQLite needs a persistent volume. The current schema also assumes a single API instance; scale-out requires a shared database, shared rate-limit store, and a database-level uniqueness constraint for provider payment IDs.
- Razorpay webhooks require a public HTTPS endpoint. Update the webhook URL in the Razorpay dashboard whenever the hostname changes.

---

## API reference

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/menu` | Categories and menu items |
| `GET` | `/api/config` | Public payment/order rules (no secrets) |
| `POST` | `/api/orders/quote` | Server-priced cart quote |
| `POST` | `/api/orders` | Create an order (requires `X-Idempotency-Key`) |
| `POST` | `/api/orders/lookup` | Track by order number + phone |
| `POST` | `/api/payments/razorpay/order` | Create a Razorpay order |
| `POST` | `/api/payments/razorpay/verify` | Verify a checkout payment signature |
| `POST` | `/api/webhooks/razorpay` | Raw-body, signed, idempotent webhook |
| `POST` | `/api/admin/login` | Exchange the admin password for a bearer token |
| `GET` | `/api/admin/orders?status=` | List recent orders (admin) |
| `PATCH` | `/api/admin/orders/:orderNumber/status` | Update order status (admin) |

Error responses use `{ "error": { "message", "code", "details?" } }`. Rate limits apply per IP on order creation, lookup, login, and payment routes.

---

## Project layout

```text
.
├── client/
│   ├── public/images/        # 32 source WebP photos, responsive variants, 35 SVG fallbacks
│   └── src/
│       ├── components/       # navigation, cart, timeline, receipt, SafeImage, Seo, UI primitives
│       ├── config.js         # restaurant identity, contact, hours, delivery rules, SEO gate
│       ├── context/          # menu, cart, toast providers
│       ├── data/             # photo credits
│       ├── lib/              # API client, validation, Razorpay, order status, formatting, SEO, initial menu
│       ├── pages/            # home, menu, story, checkout, confirmation, tracking, credits, admin
│       └── styles/           # tokens, base, layout, pages, feature CSS
├── server/
│   ├── src/
│   │   ├── data/menu.js      # menu catalogue seed data
│   │   ├── lib/              # pricing, phone, signatures, auth, production guard, errors
│   │   ├── routes/           # public, order, payment, admin, webhook routes
│   │   ├── services/         # orders, Razorpay provider, webhook processing
│   │   ├── app.js            # middleware and route wiring
│   │   ├── db.js             # schema and seeding
│   │   ├── static.js         # optional built-client host
│   │   └── index.js          # server entry point
│   └── test/                 # Node test runner suites
├── scripts/
│   ├── generate-images.mjs
│   ├── generate-responsive.mjs
│   ├── generate-og.mjs
│   ├── prerender.mjs         # Vite SSR prerender + sitemap/robots
│   └── check-seo.mjs         # SEO regression checks
├── SECURITY_AUDIT.md
├── SEO_NOTES.md
├── CREDITS.md
├── IMAGES.md
├── PROGRESS.md
└── .env.example
```

---

## Demo scope and production notes

This repository is intentionally a **demo**, not a production-ready commerce system.

**Implemented:** full menu/cart/checkout, server-side pricing, COD, Razorpay test-mode code path, signature verification, webhook idempotency, tracking, admin status management, rate limiting, tests, responsive accessible UI, local assets.

**Placeholder / demo choices:**
- The restaurant, menu, prices, hours, address, phone, ratings, and reviews are fictional or placeholders. The photography is licensed stock used for this demo; see [CREDITS.md](CREDITS.md).
- Structured data currently omits address, telephone, service area, and opening hours until `restaurant.seo.emitBusinessDetails` is enabled with verified data. It emits no ratings or reviews.
- Admin authentication is one shared password, not staff accounts. The token is stateless and cannot be revoked individually.
- Tracking polls every 30 seconds; there is no WebSocket/push channel, email, or SMS.
- No inventory reservation, delivery-radius check, map, refunds, cancellation UI, or invoice/email receipt.
- SQLite and in-memory rate limits are single-instance. There are no automated schema migrations.
- Webhook delivery is idempotent but there is no retry queue or dead-letter handling.

**Required before production:**
1. Replace the shared admin password with real staff identity, roles, MFA, short-lived sessions, CSRF protection where applicable, and audit logging.
2. Serve everything over HTTPS; use production Razorpay keys and a properly rotated webhook secret. Set a separate 32+ character `ADMIN_TOKEN_SECRET`; never reuse the admin password.
3. Set `SITE_URL` to the real HTTPS origin, replace the verified restaurant name/address/phone/hours, and only then enable `restaurant.seo.emitBusinessDetails`. Add real social profiles before emitting `sameAs`.
4. Submit the sitemap to Google Search Console and Bing Webmaster Tools after the domain is live; verify the rendered pages and monitor indexing. Do not expect rankings from markup alone.
5. Add a persistent operations database with migrations and backups, or move to a managed database; plan for multiple instances and a shared rate-limit store.
6. Add monitoring, structured logs, alerting, a webhook retry/dead-letter queue, and a database-level uniqueness constraint for provider payment IDs.
7. Replace the demo stock photography with owned or commissioned images (or keep the licences and attribution current); add legal/privacy pages, allergen and licensing disclosures, and terms of service.
8. Add fulfilment operations: inventory, delivery zones, driver assignment, refunds, cancellations, and customer notifications.
9. Commission an independent security review and an accessibility audit with real assistive technology. The local review in [SECURITY_AUDIT.md](SECURITY_AUDIT.md) is not a penetration test or a guarantee.

See [SECURITY_AUDIT.md](SECURITY_AUDIT.md), [SEO_NOTES.md](SEO_NOTES.md), [IMAGES.md](IMAGES.md), and [PROGRESS.md](PROGRESS.md) for details.
