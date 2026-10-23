import crypto from 'node:crypto';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const TOKEN_VERSION = 'saffron-spice-admin-token-v2';

function digest(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

function adminKey(signingKey) {
  return crypto.createHmac('sha256', TOKEN_VERSION).update(String(signingKey)).digest();
}

/** Constant-time comparison so password checks do not leak timing. */
export function verifyAdminPassword(input, expectedPassword) {
  if (!expectedPassword || typeof input !== 'string') return false;
  const supplied = digest(input);
  const expected = digest(expectedPassword);
  return crypto.timingSafeEqual(supplied, expected);
}

export function issueAdminToken(signingKey, now = Date.now(), ttlMs = TOKEN_TTL_MS) {
  if (!signingKey) throw new Error('An admin token signing key is required.');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'admin', iat: now, exp: now + ttlMs }),
    'utf8',
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', adminKey(signingKey))
    .update(payload)
    .digest('base64url');
  return { token: `${payload}.${signature}`, expiresAt: new Date(now + ttlMs).toISOString() };
}

export function verifyAdminToken(token, signingKey, now = Date.now()) {
  if (typeof token !== 'string' || !signingKey) return false;

  // Exactly two non-empty segments. Reject trailing segments instead of
  // silently ignoring them.
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  if (!payload || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return false;

  const expected = crypto
    .createHmac('sha256', adminKey(signingKey))
    .update(payload)
    .digest('base64url');
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return (
      parsed?.sub === 'admin' &&
      Number.isSafeInteger(parsed.iat) &&
      Number.isSafeInteger(parsed.exp) &&
      parsed.exp > now &&
      parsed.exp > parsed.iat
    );
  } catch {
    return false;
  }
}

export function parseBearerToken(header) {
  if (typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
