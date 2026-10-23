import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import { createHttpError } from '../lib/errors.js';
import { normalizeIndianPhone } from '../lib/phone.js';
import { verifyRazorpaySignature } from '../lib/signature.js';
import {
  attachRazorpayOrder,
  findOrderRowByNumber,
  getOrderByNumber,
  markOrderPaid,
} from '../services/orders.js';
import { createProviderOrder } from '../services/razorpay.js';

const ORDER_NUMBER_INPUT = /^SS-\d{6}-[A-F0-9]{6}$/i;
const RAZORPAY_ID = /^[A-Za-z0-9_]{4,100}$/;
const RAZORPAY_SIGNATURE = /^[a-f0-9]{64}$/i;

const createOrderSchema = z
  .object({
    orderNumber: z.string().trim().regex(ORDER_NUMBER_INPUT, 'Invalid order number.'),
    phone: z.string().trim().min(10).max(16),
  })
  .strict();

const verifySchema = z
  .object({
    orderNumber: z.string().trim().regex(ORDER_NUMBER_INPUT, 'Invalid order number.'),
    razorpayOrderId: z.string().trim().regex(RAZORPAY_ID, 'Invalid Razorpay order ID.'),
    razorpayPaymentId: z.string().trim().regex(RAZORPAY_ID, 'Invalid Razorpay payment ID.'),
    razorpaySignature: z.string().trim().regex(RAZORPAY_SIGNATURE, 'Invalid Razorpay signature.'),
  })
  .strict();

function validationError(result) {
  return createHttpError(
    400,
    'Payment details are incomplete or invalid.',
    'VALIDATION_ERROR',
    result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  );
}

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: { message: 'Too many payment attempts. Please wait a few minutes.', code: 'RATE_LIMITED' },
    });
  },
});

export function paymentsRouter(db) {
  const router = express.Router();

  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/razorpay/order', paymentLimiter, async (req, res) => {
    if (!config.razorpayTestConfigured || !req.app.locals.onlinePaymentsEnabled) {
      throw createHttpError(
        503,
        'Online payment is not configured. Please choose Cash on Delivery.',
        'ONLINE_PAYMENT_UNAVAILABLE',
      );
    }

    const result = createOrderSchema.safeParse(req.body);
    if (!result.success) throw validationError(result);

    const phone = normalizeIndianPhone(result.data.phone);
    if (!phone) {
      throw createHttpError(400, 'Enter a valid 10-digit Indian mobile number.', 'INVALID_PHONE');
    }

    const order = findOrderRowByNumber(db, result.data.orderNumber);
    if (!order || order.customer_phone !== phone) {
      throw createHttpError(404, 'Order not found.', 'ORDER_NOT_FOUND');
    }
    if (order.status === 'cancelled') {
      throw createHttpError(409, 'This order has been cancelled.', 'ORDER_CANCELLED');
    }
    if (order.payment_method !== 'razorpay') {
      throw createHttpError(409, 'This order is set to Cash on Delivery.', 'PAYMENT_METHOD_MISMATCH');
    }
    if (order.payment_status === 'paid') {
      throw createHttpError(409, 'This order is already paid.', 'ALREADY_PAID');
    }

    const providerOrder = await createProviderOrder(order);
    const attached = attachRazorpayOrder(db, order.order_number, providerOrder.id);
    if (!attached) {
      throw createHttpError(409, 'This order is already paid.', 'ALREADY_PAID');
    }

    res.json({
      keyId: config.razorpayKeyId,
      razorpayOrderId: providerOrder.id,
      amountPaise: order.total_paise,
      currency: 'INR',
      orderNumber: order.order_number,
      prefill: {
        name: order.customer_name,
        contact: order.customer_phone,
      },
      testMode: true,
    });
  });

  router.post('/razorpay/verify', paymentLimiter, (req, res) => {
    if (!config.razorpayTestConfigured) {
      throw createHttpError(
        503,
        'Online payment is not configured.',
        'ONLINE_PAYMENT_UNAVAILABLE',
      );
    }

    const result = verifySchema.safeParse(req.body);
    if (!result.success) throw validationError(result);

    const { orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = result.data;
    const order = findOrderRowByNumber(db, orderNumber);
    if (!order) {
      throw createHttpError(404, 'Order not found.', 'ORDER_NOT_FOUND');
    }
    if (order.payment_method !== 'razorpay') {
      throw createHttpError(409, 'This order is not an online payment order.', 'PAYMENT_METHOD_MISMATCH');
    }
    if (order.razorpay_order_id !== razorpayOrderId) {
      throw createHttpError(400, 'The payment does not match this order.', 'PAYMENT_MISMATCH');
    }
    if (order.payment_status === 'paid') {
      if (order.razorpay_payment_id === razorpayPaymentId) {
        res.json({ order: getOrderByNumber(db, orderNumber), alreadyVerified: true });
        return;
      }
      throw createHttpError(409, 'This order has already been paid.', 'ALREADY_PAID');
    }
    if (order.status === 'cancelled') {
      throw createHttpError(409, 'This order has been cancelled.', 'ORDER_CANCELLED');
    }

    const validSignature = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      signature: razorpaySignature,
      secret: config.razorpayKeySecret,
    });
    if (!validSignature) {
      throw createHttpError(
        400,
        'We could not verify that payment. If money was deducted, please contact us with your order number.',
        'PAYMENT_SIGNATURE_INVALID',
      );
    }

    const paidOrder = markOrderPaid(db, { orderNumber, razorpayPaymentId });
    if (!paidOrder) {
      throw createHttpError(
        409,
        'That payment is already linked to another order. Please contact us with your order number.',
        'PAYMENT_ALREADY_USED',
      );
    }
    res.json({ order: paidOrder, alreadyVerified: false });
  });

  return router;
}
