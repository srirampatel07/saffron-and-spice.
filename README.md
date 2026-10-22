# Saffron & Spice

A premium, demo-ready Indian restaurant ordering experience: a warm storefront, a persistent cart, server-priced checkout, Cash on Delivery, optional Razorpay **test-mode** payments, public order tracking, and a password-protected staff dashboard.

Built with React + Vite on the client and Node/Express + SQLite on the server. Menu artwork is generated locally as SVG, so the app runs without external image or font CDNs.

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
ADMIN_PASSWORD=choose-a-long-demo-password
```

Razorpay keys are optional. With no keys, checkout offers **Cash on Delivery only**; the online payment option explains that it is not configured. The app never collects card details.

> The local `.env` in this workspace uses the demo-only password `saffron-demo-kitchen`. Change it before sharing the build. `.env` is gitignored.

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
- Express 5, SQLite (`better-sqlite3`), Zod validation, Helmet, CORS restricted to `CLIENT_URL`, and rate limiting.
- All prices and totals are calculated from the database; the client only sends menu item IDs and quantities.
- Razorpay order creation plus HMAC-SHA256 signature verification using `crypto.timingSafeEqual`.
- Raw-body Razorpay webhook with signature verification and event-ID idempotency.
- Menu and orders tables, order item snapshots, webhook event log, and safe menu re-seeding.

### Quality
- Keyboard focus management, semantic landmarks, skip link, alt text, visible focus rings, reduced-motion and increased-contrast support.
- Self-hosted variable fonts (Fraunces + Manrope) and 35 local SVG illustrations.
- Server tests for totals, Indian phone validation, signature verification, order idempotency, unavailable items, and webhook idempotency.

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

Set `ADMIN_PASSWORD` in `.env`, restart the server, then visit `/admin`. The dashboard signs in with a single shared password and receives a stateless, HMAC-signed 12-hour bearer token stored in `sessionStorage`.

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
| `npm test` | Run the server test suite (Node test runner) |
| `npm run lint` | Lint the whole repository |
| `npm run build` | Production client build to `client/dist` |

To reset the demo database: stop the server, delete `server/data/saffron-spice.db*`, then restart. The menu is reseeded automatically.

---

## Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `5000` | API port |
| `CLIENT_URL` | `http://localhost:5173` | Exact allowed CORS origin |
| `ADMIN_PASSWORD` | empty | Empty disables the staff dashboard |
| `RAZORPAY_KEY_ID` | empty | Must start with `rzp_test_` for online payments |
| `RAZORPAY_KEY_SECRET` | empty | Server-side only |
| `RAZORPAY_WEBHOOK_SECRET` | empty | Required for webhook processing |
| `DB_PATH` | `server/data/saffron-spice.db` | Optional SQLite path |
| `NODE_ENV` | `development` | Set `production` for stricter CSP / proxy trust |
| `VITE_API_URL` | empty | Client build-time API origin when frontend and API are on different hosts |

For a split deployment, build the client with `VITE_API_URL=https://api.example.com` (set it in the shell or `client/.env.production`), and set the server’s `CLIENT_URL` to the exact storefront origin.

### Hosting limitations

- The API does not serve the built client. Host `client/dist` on a static host and rewrite unknown paths to `index.html` so BrowserRouter deep links such as `/order/SS-…`, `/track`, and `/admin` resolve on refresh.
- Build the client with the deployed API origin in `VITE_API_URL`; CORS only accepts the one origin in `CLIENT_URL`.
- SQLite needs a persistent volume. The current schema also assumes a single API instance; scale-out requires a shared database and shared rate-limit store.
- Razorpay webhooks require a public HTTPS endpoint. Update the webhook URL in the Razorpay dashboard whenever the tunnel or hostname changes.

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
│   ├── public/images/        # 35 local SVG illustrations
│   └── src/
│       ├── components/       # navigation, cart, timeline, receipt, UI primitives
│       ├── config.js         # restaurant identity, contact, hours, delivery rules
│       ├── context/          # menu, cart, toast providers
│       ├── lib/              # API client, validation, Razorpay, order status, formatting
│       ├── pages/            # home, menu, checkout, confirmation, tracking, admin
│       └── styles/           # tokens, base, layout, pages, feature CSS
├── server/
│   ├── src/
│   │   ├── data/menu.js      # menu catalogue seed data
│   │   ├── lib/              # pricing, phone, signatures, auth, errors
│   │   ├── routes/           # public, order, payment, admin, webhook routes
│   │   ├── services/         # orders, Razorpay provider, webhook processing
│   │   ├── app.js            # middleware and route wiring
│   │   ├── db.js             # schema and seeding
│   │   └── index.js          # server entry point
│   └── test/                 # Node test runner suites
├── scripts/generate-images.mjs
├── IMAGES.md
├── PROGRESS.md
└── .env.example
```

---

## Demo scope and production notes

This repository is intentionally a **demo**, not a production-ready commerce system.

**Implemented:** full menu/cart/checkout, server-side pricing, COD, Razorpay test-mode code path, signature verification, webhook idempotency, tracking, admin status management, rate limiting, tests, responsive accessible UI, local assets.

**Placeholder / demo choices:**
- The restaurant, menu, prices, hours, address, and generated SVG artwork are fictional.
- Admin authentication is one shared password, not staff accounts. The token is stateless and cannot be revoked individually.
- Tracking polls every 30 seconds; there is no WebSocket/push channel, email, or SMS.
- No inventory reservation, delivery-radius check, map, refunds, cancellation UI, or invoice/email receipt.
- SQLite and in-memory rate limits are single-instance. There are no automated schema migrations.
- Webhook delivery is idempotent but there is no retry queue or dead-letter handling.

**Required before production:**
1. Replace the shared admin password with real staff identity, roles, MFA, short-lived sessions, CSRF protection where applicable, and audit logging.
2. Serve everything over HTTPS; use production Razorpay keys and a properly rotated webhook secret.
3. Add a persistent operations database with migrations and backups, or move to a managed database; plan for multiple instances.
4. Add monitoring, structured logs, alerting, rate-limit storage, and a webhook retry/dead-letter queue.
5. Add real product photography or licensed art, legal/privacy pages, allergen and licensing disclosures, and terms of service.
6. Add fulfilment operations: inventory, delivery zones, driver assignment, refunds, cancellations, and customer notifications.
7. Complete a security review (CSP, secrets management, dependency scanning) and an accessibility audit with real assistive technology.

See [IMAGES.md](IMAGES.md) for the asset inventory and [PROGRESS.md](PROGRESS.md) for the build log.
