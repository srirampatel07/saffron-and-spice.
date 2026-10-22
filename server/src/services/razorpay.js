import Razorpay from 'razorpay';
import { config } from '../config.js';
import { createHttpError } from '../lib/errors.js';

let client = null;

export function getRazorpayClient() {
  if (!config.razorpayTestConfigured) {
    throw createHttpError(
      503,
      'Online payment is not configured. Please choose Cash on Delivery.',
      'ONLINE_PAYMENT_UNAVAILABLE',
    );
  }
  if (!client) {
    client = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });
  }
  return client;
}

export async function createProviderOrder(order) {
  const razorpay = getRazorpayClient();
  try {
    return await razorpay.orders.create({
      amount: order.total_paise,
      currency: 'INR',
      receipt: order.order_number,
      notes: {
        orderNumber: order.order_number,
      },
      payment_capture: 1,
    });
  } catch (error) {
    console.error(`[razorpay] Could not create an order for ${order.order_number}:`, error?.message || 'unknown');
    throw createHttpError(
      502,
      'Online payment is temporarily unavailable. Please choose Cash on Delivery or try again.',
      'PAYMENT_PROVIDER_ERROR',
    );
  }
}
