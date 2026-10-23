import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';

// Configure a controlled local fixture environment before importing config.
// These are test-only values, never real provider credentials.
process.env.NODE_ENV = 'test';
process.env.ADMIN_PASSWORD = 'controlled-admin-password-for-tests';
process.env.ADMIN_TOKEN_SECRET = 'controlled-token-signing-secret-0123456789abcdef';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.CLIENT_ORIGINS = 'https://saffron-demo.trycloudflare.com,https://preview.example.test';
process.env.RAZORPAY_KEY_ID = 'rzp_test_local_fixture';
process.env.RAZORPAY_KEY_SECRET = 'local_fixture_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'local_fixture_webhook_secret';

const { openDatabase, seedMenu } = await import('../src/db.js');
const { createApp } = await import('../src/app.js');
const { createOrder, attachRazorpayOrder } = await import('../src/services/orders.js');
const { issueAdminToken } = await import('../src/lib/adminAuth.js');

const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET;

function makeDb() {
  const db = openDatabase(':memory:');
  seedMenu(db);
  return db;
}

async function startApp() {
  const db = makeDb();
  const app = createApp({ db });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    db,
    base: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      db.close();
    },
  };
}

async function request(base, path, { method = 'GET', body, headers = {}, rawBody } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(rawBody !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  return { status: response.status, headers: response.headers, body: parsed };
}

const customer = {
  name: 'Security Test Guest',
  phone: '9876501111',
  address: '14 Lavelle Road, Ashok Nagar, Bengaluru 560001',
  notes: '',
};

function makeOrder(db, { paymentMethod = 'cod', key = 'security-http-key-0001' } = {}) {
  return createOrder(db, {
    items: [{ menuItemId: 1, quantity: 1 }],
    customer,
    paymentMethod,
    idempotencyKey: key,
  }).order;
}

test('admin order routes reject missing, bad, tampered and expired tokens', async () => {
  const app = await startApp();
  const order = makeOrder(app.db);
  const valid = issueAdminToken(TOKEN_SECRET).token;
  const [payload, signature] = valid.split('.');
  const tampered = `${payload}.${signature.slice(0, -1)}${signature.endsWith('A') ? 'B' : 'A'}`;
  const expired = issueAdminToken(TOKEN_SECRET, Date.now() - 13 * 60 * 60 * 1000).token;

  try {
    const getCases = [
      undefined,
      'Bearer not-a-token',
      `Bearer ${tampered}`,
      `Bearer ${expired}`,
    ];
    for (const authorization of getCases) {
      const response = await request(app.base, '/api/admin/orders', {
        headers: authorization ? { Authorization: authorization } : {},
      });
      assert.equal(response.status, 401, `GET should reject ${authorization || 'no token'}`);
    }

    const patchCases = [undefined, 'Bearer not-a-token', `Bearer ${tampered}`, `Bearer ${expired}`];
    for (const authorization of patchCases) {
      const response = await request(app.base, `/api/admin/orders/${order.orderNumber}/status`, {
        method: 'PATCH',
        body: { status: 'confirmed' },
        headers: authorization ? { Authorization: authorization } : {},
      });
      assert.equal(response.status, 401, `PATCH should reject ${authorization || 'no token'}`);
    }

    const validList = await request(app.base, '/api/admin/orders', {
      headers: { Authorization: `Bearer ${valid}` },
    });
    assert.equal(validList.status, 200);
    assert.ok(Array.isArray(validList.body.orders));

    const validPatch = await request(app.base, `/api/admin/orders/${order.orderNumber}/status`, {
      method: 'PATCH',
      body: { status: 'confirmed' },
      headers: { Authorization: `Bearer ${valid}` },
    });
    assert.equal(validPatch.status, 200);
    assert.equal(validPatch.body.order.status, 'confirmed');
  } finally {
    await app.close();
  }
});

test('admin login rate-limits repeated failures and delays the response', async () => {
  const app = await startApp();
  try {
    const good = await request(app.base, '/api/admin/login', {
      method: 'POST',
      body: { password: process.env.ADMIN_PASSWORD },
    });
    assert.equal(good.status, 200);
    assert.equal(typeof good.body.token, 'string');

    const started = Date.now();
    const statuses = [];
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app.base, '/api/admin/login', {
        method: 'POST',
        body: { password: `wrong-${attempt}` },
      });
      statuses.push(response.status);
    }
    const elapsed = Date.now() - started;
    assert.ok(statuses.includes(401));
    assert.ok(statuses.includes(429));
    assert.ok(elapsed >= 250, 'failed attempts should include a small delay');
  } finally {
    await app.close();
  }
});

test('order creation rejects client money fields and invalid quantities/phones', async () => {
  const app = await startApp();
  try {
    const tampered = await request(app.base, '/api/orders/quote', {
      method: 'POST',
      body: { items: [{ menuItemId: 1, quantity: 1, pricePaise: 1 }], totalPaise: 1 },
    });
    assert.equal(tampered.status, 400);
    assert.equal(tampered.body.error.code, 'VALIDATION_ERROR');

    for (const quantity of [-1, 0, 1.5, 999]) {
      const response = await request(app.base, '/api/orders/quote', {
        method: 'POST',
        body: { items: [{ menuItemId: 1, quantity }] },
      });
      assert.equal(response.status, 400, `quantity ${quantity} should be rejected`);
    }

    const stringQuantity = await request(app.base, '/api/orders/quote', {
      method: 'POST',
      body: { items: [{ menuItemId: 1, quantity: '2' }] },
    });
    assert.equal(stringQuantity.status, 400);

    const invalidPhone = await request(app.base, '/api/orders', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': 'security-invalid-phone-0001' },
      body: {
        items: [{ menuItemId: 1, quantity: 1 }],
        customer: { ...customer, phone: '1234567890' },
        paymentMethod: 'cod',
      },
    });
    assert.equal(invalidPhone.status, 400);
    assert.equal(invalidPhone.body.error.code, 'INVALID_PHONE');
  } finally {
    await app.close();
  }
});

test('order creation is idempotent over HTTP and never creates a duplicate', async () => {
  const app = await startApp();
  try {
    const payload = {
      items: [{ menuItemId: 1, quantity: 2 }],
      customer,
      paymentMethod: 'cod',
    };
    const headers = { 'X-Idempotency-Key': 'security-http-idempotency-0001' };
    const first = await request(app.base, '/api/orders', { method: 'POST', headers, body: payload });
    const second = await request(app.base, '/api/orders', { method: 'POST', headers, body: payload });

    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.equal(second.body.replayed, true);
    assert.equal(first.body.order.orderNumber, second.body.order.orderNumber);
    const count = app.db.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
    assert.equal(count, 1);
  } finally {
    await app.close();
  }
});

test('tracking returns the same not-found response for wrong phone and unknown order', async () => {
  const app = await startApp();
  const order = makeOrder(app.db, { key: 'security-tracking-order-0001' });
  try {
    const wrongPhone = await request(app.base, '/api/orders/lookup', {
      method: 'POST',
      body: { orderNumber: order.orderNumber, phone: '9876502222' },
    });
    const unknownOrder = await request(app.base, '/api/orders/lookup', {
      method: 'POST',
      body: { orderNumber: 'SS-000000-AAAAAA', phone: '9876502222' },
    });

    assert.equal(wrongPhone.status, 404);
    assert.equal(unknownOrder.status, 404);
    assert.deepEqual(wrongPhone.body, unknownOrder.body);

    const correct = await request(app.base, '/api/orders/lookup', {
      method: 'POST',
      body: { orderNumber: order.orderNumber, phone: customer.phone },
    });
    assert.equal(correct.status, 200);

    let sawRateLimit = false;
    for (let attempt = 0; attempt < 30 && !sawRateLimit; attempt += 1) {
      const response = await request(app.base, '/api/orders/lookup', {
        method: 'POST',
        body: { orderNumber: order.orderNumber, phone: '9876502222' },
      });
      if (response.status === 429) sawRateLimit = true;
    }
    assert.equal(sawRateLimit, true, 'tracking lookups should be rate-limited');
  } finally {
    await app.close();
  }
});

test('oversized JSON and malformed JSON get safe, generic errors', async () => {
  const app = await startApp();
  try {
    const oversized = await request(app.base, '/api/orders/quote', {
      method: 'POST',
      body: { items: [{ menuItemId: 1, quantity: 1 }], padding: 'x'.repeat(40_000) },
    });
    assert.equal(oversized.status, 413);
    assert.equal(oversized.body.error.code, 'PAYLOAD_TOO_LARGE');
    assert.equal(oversized.body.error.message, 'The request body is too large.');

    const malformed = await request(app.base, '/api/orders/quote', {
      method: 'POST',
      rawBody: '{"items":[',
    });
    assert.equal(malformed.status, 400);
    assert.equal(malformed.body.error.code, 'INVALID_JSON');
    assert.equal(malformed.body.error.message, 'The request body is not valid JSON.');
  } finally {
    await app.close();
  }
});

test('CORS allows the local origin and configured tunnel origins, and rejects others', async () => {
  const app = await startApp();
  const tunnelOrigin = 'https://saffron-demo.trycloudflare.com';
  const secondOrigin = 'https://preview.example.test';
  try {
    for (const origin of [process.env.CLIENT_URL, tunnelOrigin, secondOrigin]) {
      const allowed = await request(app.base, '/api/health', {
        headers: { Origin: origin },
      });
      assert.equal(allowed.status, 200);
      assert.equal(allowed.headers.get('access-control-allow-origin'), origin);
    }

    const noOrigin = await request(app.base, '/api/health');
    assert.equal(noOrigin.status, 200);

    const preflight = await request(app.base, '/api/admin/login', {
      method: 'OPTIONS',
      headers: {
        Origin: tunnelOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization',
      },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), tunnelOrigin);
    assert.match(preflight.headers.get('access-control-allow-methods') || '', /POST/);
    assert.match(preflight.headers.get('access-control-allow-headers') || '', /Authorization/i);

    for (const origin of ['https://evil.example', 'https://saffron-demo.trycloudflare.com.evil.example', 'http://localhost:5174']) {
      const denied = await request(app.base, '/api/health', {
        headers: { Origin: origin },
      });
      assert.equal(denied.status, 403);
      assert.equal(denied.body.error.code, 'CORS_NOT_ALLOWED');
    }
  } finally {
    await app.close();
  }
});

test('webhook rejects invalid signatures and processes a valid event once', async () => {
  const app = await startApp();
  const order = makeOrder(app.db, {
    paymentMethod: 'razorpay',
    key: 'security-webhook-order-0001',
  });
  attachRazorpayOrder(app.db, order.orderNumber, 'order_SECURITY123');
  const payload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_SECURITY123',
          order_id: 'order_SECURITY123',
          amount: order.totals.totalPaise,
          currency: 'INR',
        },
      },
    },
  };
  const rawBody = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  try {
    const missing = await request(app.base, '/api/webhooks/razorpay', {
      method: 'POST',
      rawBody,
      headers: { 'X-Razorpay-Event-Id': 'evt_security_missing' },
    });
    assert.equal(missing.status, 400);
    assert.equal(missing.body.error.code, 'INVALID_WEBHOOK_SIGNATURE');

    const invalid = await request(app.base, '/api/webhooks/razorpay', {
      method: 'POST',
      rawBody,
      headers: {
        'X-Razorpay-Event-Id': 'evt_security_invalid',
        'X-Razorpay-Signature': '0'.repeat(64),
      },
    });
    assert.equal(invalid.status, 400);

    const accepted = await request(app.base, '/api/webhooks/razorpay', {
      method: 'POST',
      rawBody,
      headers: {
        'X-Razorpay-Event-Id': 'evt_security_valid',
        'X-Razorpay-Signature': signature,
      },
    });
    assert.equal(accepted.status, 200);
    assert.deepEqual(accepted.body, {
      received: true,
      duplicate: false,
      handled: true,
      orderNumber: order.orderNumber,
    });

    const replay = await request(app.base, '/api/webhooks/razorpay', {
      method: 'POST',
      rawBody,
      headers: {
        'X-Razorpay-Event-Id': 'evt_security_valid',
        'X-Razorpay-Signature': signature,
      },
    });
    assert.equal(replay.status, 200);
    assert.equal(replay.body.duplicate, true);
  } finally {
    await app.close();
  }
});

test('unknown API routes return a safe JSON 404', async () => {
  const app = await startApp();
  try {
    const response = await request(app.base, '/api/does-not-exist');
    assert.equal(response.status, 404);
    assert.equal(response.body.error.code, 'NOT_FOUND');
    assert.equal(response.body.error.message, 'API route not found.');
  } finally {
    await app.close();
  }
});
