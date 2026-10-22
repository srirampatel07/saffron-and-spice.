import crypto from 'node:crypto';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function digest(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

function adminKey(password) {
  return crypto.createHmac('sha256', 'saffron-spice-admin-token-v1').update(password).digest();
}

/** Constant-time comparison so password checks do not leak timing. */
export function verifyAdminPassword(input, expectedPassword) {
  if (!expectedPassword || typeof input !== 'string') return false;
  const supplied = digest(input);
  const expected = digest(expectedPassword);
  return crypto.timingSafeEqual(supplied, expected);
}

export function issueAdminToken(password, now = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({ sub: 'admin', iat: now, exp: now + TOKEN_TTL_MS }),
    'utf8',
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', adminKey(password))
    .update(payload)
    .digest('base64url');
  return { token: `${payload}.${signature}`, expiresAt: new Date(now + TOKEN_TTL_MS).toISOString() };
}

export function verifyAdminToken(token, password, now = Date.now()) {
  if (typeof token !== 'string' || !password) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = crypto.createHmac('sha256', adminKey(password)).update(payload).digest('base64url');
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return parsed?.sub === 'admin' && Number(parsed.exp) > now;
  } catch {
    return false;
  }
}

export function parseBearerToken(header) {
  if (typeof header !== 'string') return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
