import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const serverRoot = path.resolve(currentDir, '..');
export const projectRoot = path.resolve(serverRoot, '..');

dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true });

function parsePort(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
}

const trim = (value) => (typeof value === 'string' ? value.trim() : '');

const razorpayKeyId = trim(process.env.RAZORPAY_KEY_ID);
const razorpayKeySecret = trim(process.env.RAZORPAY_KEY_SECRET);
const razorpayWebhookSecret = trim(process.env.RAZORPAY_WEBHOOK_SECRET);
const razorpayTestConfigured = Boolean(razorpayKeyId && razorpayKeySecret && razorpayKeyId.startsWith('rzp_test_'));
const razorpayLiveKeysPresent = Boolean(razorpayKeyId && !razorpayKeyId.startsWith('rzp_test_'));

const adminPassword = trim(process.env.ADMIN_PASSWORD);

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT, 5000),
  clientUrl: trim(process.env.CLIENT_URL) || 'http://localhost:5173',
  dbPath: process.env.DB_PATH
    ? path.resolve(projectRoot, process.env.DB_PATH)
    : path.join(serverRoot, 'data', 'saffron-spice.db'),
  razorpayKeyId,
  razorpayKeySecret,
  razorpayWebhookSecret,
  razorpayTestConfigured,
  razorpayLiveKeysPresent,
  razorpayWebhookConfigured: Boolean(razorpayWebhookSecret),
  adminPassword,
  adminEnabled: Boolean(adminPassword),
  isProduction: process.env.NODE_ENV === 'production',
});

export const orderRules = Object.freeze({
  deliveryFeePaise: 4900,
  freeDeliveryThresholdPaise: 99900,
  taxRateBps: 500,
  maxQuantityPerItem: 20,
  maxDistinctItems: 30,
});
