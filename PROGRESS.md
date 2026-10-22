# Progress — Saffron & Spice

**Status: complete — demo-ready.** Last updated 23 October 2026.

The site is a working full-stack demo: premium storefront, persistent cart, server-priced checkout, Cash on Delivery, optional Razorpay test-mode payments, public tracking, and a password-protected staff dashboard.

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Inspect workspace and design plan | Done |
| 1 | Foundation, design system, navigation | Done |
| 2 | Homepage, menu, local artwork | Done |
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
- 35 local SVG illustrations generated with `npm run generate:images`: 32 dish images plus hero, story, and visit scenes. No remote image or font dependencies.
- All images inventoried with art direction and replacement notes in [IMAGES.md](IMAGES.md).
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

- Express 5 server with Helmet, CORS limited to `CLIENT_URL`, per-route rate limits, central error handling, and intentional 503 behaviour for unconfigured features.
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
- Server test suite: **15/15 passing**.
- Production client build succeeds.
- Desktop and mobile visual QA completed for home, menu, cart, drawer, checkout, confirmation, tracking, and admin.
- Public pages and API surfaces were exercised against the live local server: menu loading, quote calculation, COD order creation, idempotent replay, lookup, unavailable-item rejection, admin login, and status update.
- Documentation: [README.md](README.md) covers setup, configuration, Razorpay test mode, webhook tunnels, API routes, and production limits. [IMAGES.md](IMAGES.md) covers all 35 assets.

## Verification log

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm.cmd run lint` | 0 errors, 0 warnings |
| Tests | `npm.cmd test` | 15 passed, 0 failed |
| Build | `npm.cmd run build` | Passed — production client bundle written to `client/dist` |
| COD checkout | Headless Edge against local dev server | Passed; order created and cart cleared |
| Admin update | Headless Edge against local dev server | Passed; `pending → confirmed` |
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

- The restaurant, menu, prices, address, hours, and artwork are fictional.
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

**Status: in progress.** Replacing the generated SVG artwork with local, properly licensed food photography.

- [x] Re-read `PROGRESS.md`, `IMAGES.md`, and the Apple Design guidance.
- [x] Confirmed web search, web fetch, and PowerShell HTTPS downloads are available.
- [x] Captured the starting asset baseline: 35 SVGs, 752,845 bytes total.
- [ ] Install/confirm WebP processing (Sharp).
- [ ] Source and visually review licensed candidates for all 32 dishes.
- [ ] Source and review hero, kitchen-story, and dining-room scene photos.
- [ ] Download and optimise all approved photos locally.
- [ ] Keep SVG fallbacks and add image error handling.
- [ ] Add `CREDITS.md`, a `/credits` page, and the footer credits link.
- [ ] Update `IMAGES.md` with real-photo / placeholder status per asset.
- [ ] Run lint, tests, and build.
- [ ] Browser-check desktop and mobile storefront, cart, and admin with no broken images or console errors.
- [ ] Record final replaced / placeholder counts and total image weight.

Source rules: Unsplash, Pexels, Pixabay, or Wikimedia Commons only; Commons images must be CC0, CC BY, or CC BY-SA. No payment stock, Google Images, AI-generated imagery, brand-heavy scenes, or uncertain licences. A clean placeholder is preferred to a mismatched dish photo.
