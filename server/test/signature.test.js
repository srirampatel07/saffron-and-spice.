import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyHmacSha256, verifyRazorpaySignature } from '../src/lib/signature.js';

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

test('webhook HMAC accepts a genuine signature', () => {
  const payload = Buffer.from('{"event":"payment.captured"}');
  const signature = sign(payload, 'whsec_demo');
  assert.equal(verifyHmacSha256(payload, signature, 'whsec_demo'), true);
});

test('webhook HMAC rejects modified payloads, secrets and malformed signatures', () => {
  const payload = Buffer.from('{"event":"payment.captured"}');
  const signature = sign(payload, 'whsec_demo');
  assert.equal(verifyHmacSha256(Buffer.from('{"event":"payment.failed"}'), signature, 'whsec_demo'), false);
  assert.equal(verifyHmacSha256(payload, signature, 'wrong_secret'), false);
  assert.equal(verifyHmacSha256(payload, 'not-hex', 'whsec_demo'), false);
  assert.equal(verifyHmacSha256(payload, '', 'whsec_demo'), false);
});

test('Razorpay checkout signature uses order_id|payment_id', () => {
  const razorpayOrderId = 'order_TEST123';
  const razorpayPaymentId = 'pay_TEST456';
  const signature = sign(`${razorpayOrderId}|${razorpayPaymentId}`, 'rzp_test_secret');

  assert.equal(
    verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      signature,
      secret: 'rzp_test_secret',
    }),
    true,
  );
  assert.equal(
    verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId: 'pay_TAMPERED',
      signature,
      secret: 'rzp_test_secret',
    }),
    false,
  );
});
