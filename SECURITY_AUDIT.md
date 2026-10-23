# Security Audit — Saffron & Spice

Date: 23 October 2026.

## Scope

Local, source-level review and targeted fixes for the Saffron & Spice demo:

- Express API, SQLite order storage, admin authentication, order/quote endpoints, Razorpay payment verification and webhooks.
- React client handling of tokens, cart/checkout data, and rendered content.
- Production headers, CORS, error handling, credential boot checks, and dependency posture.
- Regression tests and a browser end-to-end check using a temporary database.

Constraints:

- No production penetration test, WAF, external scanner, load test, or monitoring review was performed.
- No real credential values were printed, rotated, or committed. Test runs overrode admin credentials and used temporary databases; no live Razorpay payment was attempted.
- No commits, pushes, or deployments were made.
- The repository contains pre-existing uncommitted photo-upgrade work; it was preserved.

## Baseline

Before the audit:

- `npm run lint`: 0 errors, 0 warnings
- `npm test`: 15/15 passing
- `npm run build`: passing
- `npm audit`: 0 known vulnerabilities across 309 reported dependencies
- Lighthouse 13.5 mobile, Vite dev server: home 26/96/100/92, menu 25/100/100/92

Findings below are changes or residual risks relative to that baseline. A pre-existing issue is not described as a regression.

## Findings

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| S-01 | High | Production could start without a strong, separate admin credential set | Fixed |
| S-02 | High | Signed Razorpay events were not fully bound to the local order/amount/currency, and a payment ID could be reused across orders | Fixed |
| S-03 | Medium | Admin token format/signature validation and signing-key separation were too permissive | Fixed |
| S-04 | Medium | Admin login had no deliberate failure delay; the existing IP limit was the only anti-guessing control | Mitigated |
| S-05 | Medium | Order/payment schemas were not strict enough; client money fields and coercive values needed explicit rejection | Fixed |
| S-06 | Medium | Oversized/malformed request handling could return internal error detail; server errors needed a generic production shape | Fixed |
| S-07 | Medium | Production browser security headers and CORS allow-list needed to be explicit and tested | Fixed |
| S-08 | Medium | Shared admin password, 12-hour bearer token in `sessionStorage`, and no MFA remain demo-level identity controls | Accepted for demo |
| S-09 | Medium | SQLite and in-memory rate limits are single-instance controls; payment-ID uniqueness is enforced in application code | Accepted for demo |
| S-10 | Low | Public order lookup deliberately returns order details to a matching order number + phone pair | Accepted for demo |
| S-11 | Low | `trust proxy=1` assumes one trusted reverse proxy; webhook processing has no retry/dead-letter queue | Accepted for demo |
| S-12 | Informational | No known vulnerable dependencies at audit time; `npm audit` is not a guarantee and CI scanning is not configured | Noted |

No Critical finding was confirmed within this scope.

## Detailed findings and fixes

### S-01 — Production credential boot guard (High, fixed)

**Risk:** A production deployment could start with a missing or demo admin password, or derive the token-signing key from the same password. That makes password guessing and token forgery more likely.

**Fix:** `server/src/lib/productionGuard.js` runs before the database opens or the server listens (`server/src/index.js`). In `NODE_ENV=production` it rejects:

- missing `ADMIN_PASSWORD`;
- passwords shorter than 16 characters or in a known weak/demo list;
- missing `ADMIN_TOKEN_SECRET`;
- token secrets shorter than 32 characters;
- a token secret equal to the admin password.

The messages describe the failed rule without echoing the secret. Development remains usable with a fallback key derived from the password, but prints a warning. `server/src/lib/adminAuth.js` domain-separates the signing key with a version label (`saffron-spice-admin-token-v2`).

### S-02 — Razorpay webhook binding (High, fixed)

**Risk:** A validly signed event that did not belong to the local order, or did not match the server-calculated total/currency, could change payment state. A replayed payment ID could also settle more than one order.

**Fix:**

- `server/src/services/webhooks.js` requires the provider order ID to match the local `razorpay_order_id`.
- Paid events must use INR and an amount equal to the server-calculated order total.
- `server/src/services/orders.js` checks that a Razorpay payment ID is not already attached to another order, refuses to overwrite an already-paid order, and keeps duplicate event processing idempotent.
- A failed event records failure without cancelling the order.

The tests cover wrong amounts, wrong orders, duplicate event IDs, duplicate payment IDs, and failed payments.

### S-03 — Admin token validation and key separation (Medium, fixed)

**Risk:** Loose token parsing or a password-derived key could permit malformed-token acceptance or make token forgery easier if the password leaked.

**Fix:** Tokens are exactly two segments; the signature segment must be 43 base64url characters. Verification uses a timing-safe comparison and validates `sub === "admin"`, safe-integer `iat`/`exp`, expiry, and `exp > iat`. A separate `ADMIN_TOKEN_SECRET` is required in production. Regression tests cover tampering, wrong keys, expiry, malformed shapes, and the Bearer scheme.

### S-04 — Login guessing and timing (Medium, mitigated)

**Risk:** Repeated password guesses could be made from one IP; a fast failure response could provide a timing signal.

**Fix:** The existing login limiter remains at 8 attempts per 15 minutes per IP. Failed attempts now wait 250 ms before returning the same generic error. This is defence in depth, not a substitute for MFA or account-level lockout.

### S-05 — Strict request validation (Medium, fixed)

**Risk:** Coercive Zod schemas and unvalidated client fields could let unexpected types or client-supplied money values reach order/payment logic.

**Fix:** Order, quote, lookup, admin login/status, and Razorpay schemas are strict. Quantities must be integers within limits; order numbers and Razorpay IDs/signatures use explicit patterns; unknown fields are rejected. The server continues to price every line from the database and never trusts client totals. Tests cover client money fields, invalid quantities, duplicate lines, invalid phones, and unavailable dishes.

### S-06 — Safe error responses (Medium, fixed)

**Risk:** Parser errors or server exceptions could leak stack traces, SQL text, or internal codes.

**Fix:** The central handler returns generic JSON for oversized bodies (413), malformed JSON (400), unsupported encodings (415), and server failures (500). Production does not include stack traces or internal error codes for 5xx responses. JSON output is escaped. Unknown API routes return a safe JSON 404. Tests assert the generic shapes.

### S-07 — Headers and CORS (Medium, fixed)

**Fix:** Production Helmet policy explicitly sets:

- `default-src 'self'`, `base-uri 'self'`, `object-src 'none'`
- `script-src 'self' https://checkout.razorpay.com` with no `unsafe-inline`
- `frame-ancestors 'none'`, `form-action 'self'`
- `img-src 'self' data: https:`, `style-src 'self' 'unsafe-inline'`, `font-src 'self' data:`
- `connect-src` and `frame-src` limited to the app and Razorpay endpoints
- HSTS (`max-age=31536000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a strict-origin referrer policy

CORS allows only the exact origins in `CLIENT_URL` plus optional comma-separated `CLIENT_ORIGINS` (for example, a current development tunnel). It never uses a wildcard or reflects arbitrary origins. The headers actually used are allowed (`Content-Type`, `Authorization`, `X-Idempotency-Key`). `X-Powered-By` is disabled. Browser verification found zero CSP violations; the initial menu snapshot is a non-executable JSON data block, not an inline script.

**Post-audit tunnel fix:** Vite's `/api` proxy forwards the browser `Origin` while rewriting only `Host`, so a public tunnel origin was rejected with `CORS_NOT_ALLOWED`. `CLIENT_ORIGINS` now adds exact extra origins to the same allowlist; `CLIENT_URL` remains always allowed. Tests cover localhost, two tunnel origins, a rejected unrelated origin, and a rejected suffix-lookalike. Vite's dev-server CORS middleware is disabled so its localhost-only `OPTIONS` handler cannot answer `/api` preflights without ACAO; Express remains the exact API allowlist. No wildcard, credential, authentication, rate-limit, or header policy was relaxed.

### S-08 — Residual identity risk (Medium, accepted for demo)

Still true:

- One shared admin password; no individual staff accounts, roles, MFA, or audit log.
- The token is stateless for 12 hours and stored in `sessionStorage`; an XSS bug could read it. The strict CSP and React escaping reduce, but do not eliminate, that risk.
- There is no server-side session revocation list.

Production should replace this with real identity, short-lived server-side sessions, MFA, role checks, and audit logging.

### S-09 — Residual single-instance risk (Medium, accepted for demo)

SQLite and `express-rate-limit` memory stores assume one API instance. The payment-ID uniqueness check is synchronous application logic; a multi-instance deployment needs a database unique constraint or transaction-level guarantee. Rate limits should move to a shared store. The admin token is stateless and will work across instances if the same `ADMIN_TOKEN_SECRET` is configured.

### S-10 — Order lookup privacy (Low, accepted for demo)

`POST /api/orders/lookup` returns an order when the caller supplies both the order number and the matching phone number. This is intentional for public tracking, but it is still personal data. The endpoint is rate-limited (25 attempts per 5 minutes per IP) and returns the same not-found message for a wrong phone and an unknown order. A production system should add stronger verification or a signed tracking link, plus retention and privacy policies.

### S-11 — Proxy and webhook operations (Low, accepted for demo)

`trust proxy` is set to `1`, which assumes exactly one trusted reverse proxy. If the deployment topology differs, rate-limit IPs and secure-cookie/protocol decisions may be wrong. Webhook event IDs are idempotent, but there is no retry queue, dead-letter queue, or alerting for failed processing. Those are operational requirements, not code defects in the demo.

### S-12 — Dependency and secret posture (Informational)

`npm audit` reports 0 known vulnerabilities across 309 reported dependencies (102 production, 208 development, 54 optional). The unused client-side `zod` dependency was removed. This is a point-in-time result, not a guarantee; no CI dependency or secret scanning is configured. A manual search found no tracked real secrets, and `.env` is gitignored. Real secrets must never be committed.

## Regression evidence

All commands were run from `E:\restaurant` on Windows with `npm.cmd`.

| Check | Result |
| --- | --- |
| `npm run lint` | 0 errors, 0 warnings |
| `npm test` | 33/33 passing |
| `npm run build` | Passed; client build + prerender |
| `npm run check:seo` | 153/153 checks passing |
| `npm audit` | 0 known vulnerabilities, 309 reported dependencies |
| Static host production check | 38/38 checks passing |
| Browser CSP check | 0 violations; JSON menu snapshot read; add-to-cart worked |
| Browser E2E | Temporary COD order `SS-261023-247F60`; admin login; `pending → confirmed`; tracking showed `confirmed` |

The E2E run used a temporary SQLite database and test-only credentials. The order and database were deleted afterward; `SS-261023-247F60` is not a real order. Production header checks covered CSP, HSTS, nosniff, frame/referrer policy, noindex on private routes, real 404 status, and immutable hashed assets. The static host serves `/menu` directly with status 200 and no trailing-slash redirect.

## Residual production requirements

1. **Identity:** replace the shared password with staff accounts, MFA, short-lived sessions, role checks, and audit logging. Do not rely on the demo token model for production.
2. **Credentials:** use a unique `ADMIN_PASSWORD` of 16+ characters and a random, separate `ADMIN_TOKEN_SECRET` of 32+ characters. Rotate both if exposed. Keep `.env` out of source control.
3. **Transport:** serve everything over HTTPS with HSTS. Verify the production CSP on the real host and avoid adding broad inline-script exceptions.
4. **Data:** move to a managed database with migrations, backups, and a unique constraint for provider payment IDs. Move rate limits to a shared store before scaling horizontally.
5. **Payment operations:** use live Razorpay keys only after review; configure webhook retry/dead-letter handling, alerting, and reconciliation. Test refunds and failure paths with real operational procedures.
6. **Privacy and abuse:** add tracking-link verification or stronger customer verification, retention rules, privacy policy, and monitoring for lookup abuse.
7. **Assurance:** commission an independent security review/penetration test, add CI dependency and secret scanning, and monitor authentication, payment, and webhook failures.
8. **Headers and hosting:** if using an external static host, reproduce the CSP/HSTS/noindex/404 behavior verified for the Express host.

## What this audit does not claim

This document does not certify the application as secure, does not guarantee that no vulnerabilities remain, and does not replace a production penetration test, threat model, privacy review, or operational monitoring. It records the local review, the fixes made, the tests run, and the known residual risks.
