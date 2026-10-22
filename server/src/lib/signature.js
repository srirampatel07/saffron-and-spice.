import crypto from 'node:crypto';

/**
 * Constant-time HMAC-SHA256 verification used for Razorpay checkout
 * signatures and webhook signatures. The provided signature is hex encoded.
 */
export function verifyHmacSha256(payload, signature, secret) {
  if (!secret || typeof signature !== 'string' || signature.length === 0) return false;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  let supplied;
  try {
    supplied = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }

  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, signature, secret }) {
  if (!razorpayOrderId || !razorpayPaymentId) return false;
  return verifyHmacSha256(`${razorpayOrderId}|${razorpayPaymentId}`, signature, secret);
}
