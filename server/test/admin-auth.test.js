import test from 'node:test';
import assert from 'node:assert/strict';
import {
  issueAdminToken,
  parseBearerToken,
  verifyAdminPassword,
  verifyAdminToken,
} from '../src/lib/adminAuth.js';
import { validateProductionEnv } from '../src/lib/productionGuard.js';

const SIGNING_KEY = 'test-signing-key-that-is-long-and-random-0123456789';

test('admin password comparison is correct and rejects empty input', () => {
  assert.equal(verifyAdminPassword('correct horse battery staple', 'correct horse battery staple'), true);
  assert.equal(verifyAdminPassword('wrong password', 'correct horse battery staple'), false);
  assert.equal(verifyAdminPassword('', 'correct horse battery staple'), false);
  assert.equal(verifyAdminPassword('anything', ''), false);
});

test('issued admin tokens verify and carry a 12-hour expiry', () => {
  const now = Date.now();
  const session = issueAdminToken(SIGNING_KEY, now);
  assert.equal(verifyAdminToken(session.token, SIGNING_KEY, now), true);
  assert.equal(new Date(session.expiresAt).getTime(), now + 12 * 60 * 60 * 1000);
});

test('admin tokens reject tampering, wrong keys, expiry and malformed shapes', () => {
  const now = Date.now();
  const { token } = issueAdminToken(SIGNING_KEY, now);
  const [payload, signature] = token.split('.');

  const tamperedPayload = `${payload.slice(0, -1)}${payload.endsWith('A') ? 'B' : 'A'}.${signature}`;
  const tamperedSignature = `${payload}.${signature.slice(0, -1)}${signature.endsWith('A') ? 'B' : 'A'}`;

  assert.equal(verifyAdminToken(tamperedPayload, SIGNING_KEY, now), false);
  assert.equal(verifyAdminToken(tamperedSignature, SIGNING_KEY, now), false);
  assert.equal(verifyAdminToken(token, 'a-different-signing-key-0123456789', now), false);
  assert.equal(verifyAdminToken(token, SIGNING_KEY, now + 12 * 60 * 60 * 1000 + 1), false);
  assert.equal(verifyAdminToken(`${token}.extra`, SIGNING_KEY, now), false);
  assert.equal(verifyAdminToken(`${payload}.not-base64url`, SIGNING_KEY, now), false);
  assert.equal(verifyAdminToken('', SIGNING_KEY, now), false);
  assert.equal(verifyAdminToken(token, '', now), false);
});

test('expired tokens can be issued with an explicit timestamp', () => {
  const expired = issueAdminToken(SIGNING_KEY, Date.now() - 13 * 60 * 60 * 1000);
  assert.equal(verifyAdminToken(expired.token, SIGNING_KEY), false);
});

test('bearer parsing requires the Bearer scheme', () => {
  assert.equal(parseBearerToken('Bearer abc.def'), 'abc.def');
  assert.equal(parseBearerToken('bearer abc.def'), 'abc.def');
  assert.equal(parseBearerToken('Basic abc.def'), null);
  assert.equal(parseBearerToken(undefined), null);
});

test('production config guard accepts only strong, separate admin credentials', () => {
  const strong = {
    NODE_ENV: 'production',
    ADMIN_PASSWORD: 'a-long-unique-admin-password-42',
    ADMIN_TOKEN_SECRET: 'a-separate-random-token-signing-secret-0123456789',
  };
  assert.deepEqual(validateProductionEnv(strong), []);
  assert.deepEqual(validateProductionEnv({ ...strong, NODE_ENV: 'development' }), []);

  assert.equal(validateProductionEnv({ ...strong, ADMIN_PASSWORD: '' }).length, 1);
  assert.equal(validateProductionEnv({ ...strong, ADMIN_PASSWORD: 'saffron-demo-kitchen' }).length, 1);
  assert.equal(validateProductionEnv({ ...strong, ADMIN_PASSWORD: 'short' }).length, 1);
  assert.equal(validateProductionEnv({ ...strong, ADMIN_TOKEN_SECRET: '' }).length, 1);
  assert.equal(validateProductionEnv({ ...strong, ADMIN_TOKEN_SECRET: 'too-short' }).length, 1);
  assert.equal(
    validateProductionEnv({
      ...strong,
      ADMIN_TOKEN_SECRET: strong.ADMIN_PASSWORD,
    }).length,
    1,
  );
});
