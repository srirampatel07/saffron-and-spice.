import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { orderRules } from '../config.js';
import { createHttpError } from '../lib/errors.js';
import { normalizeIndianPhone } from '../lib/phone.js';
import {
  createOrder,
  lookupOrder,
  quoteOrder,
} from '../services/orders.js';

const itemSchema = z.object({
  menuItemId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(orderRules.maxQuantityPerItem),
});

const quoteSchema = z.object({
  items: z.array(itemSchema).min(1).max(orderRules.maxDistinctItems),
});

const createSchema = z.object({
  items: z.array(itemSchema).min(1).max(orderRules.maxDistinctItems),
  customer: z.object({
    name: z.string().trim().min(2, 'Enter your full name.').max(80, 'Please use a shorter name.'),
    phone: z.string().trim().min(10).max(16),
    address: z
      .string()
      .trim()
      .min(10, 'Enter a delivery address with at least 10 characters.')
      .max(300, 'Please keep the address under 300 characters.'),
    notes: z.string().trim().max(300, 'Please keep notes under 300 characters.').optional().default(''),
  }),
  paymentMethod: z.enum(['cod', 'razorpay']),
});

const lookupSchema = z.object({
  orderNumber: z.string().trim().min(6).max(40),
  phone: z.string().trim().min(10).max(16),
});

function validationError(result) {
  return createHttpError(
    400,
    'Please check the highlighted details and try again.',
    'VALIDATION_ERROR',
    result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  );
}

function orderLimiter(windowMs, limit, message) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: { message, code: 'RATE_LIMITED' } });
    },
  });
}

const quoteLimiter = orderLimiter(60 * 1000, 60, 'Too many price checks. Please wait a moment.');
const createLimiter = orderLimiter(
  10 * 60 * 1000,
  18,
  'Too many order attempts. Please wait a few minutes and try again.',
);
const lookupLimiter = orderLimiter(
  5 * 60 * 1000,
  25,
  'Too many tracking attempts. Please wait a few minutes and try again.',
);

export function ordersRouter(db) {
  const router = express.Router();

  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/quote', quoteLimiter, (req, res) => {
    const result = quoteSchema.safeParse(req.body);
    if (!result.success) throw validationError(result);

    const quote = quoteOrder(db, result.data.items);
    res.json(quote);
  });

  router.post('/lookup', lookupLimiter, (req, res) => {
    const result = lookupSchema.safeParse(req.body);
    if (!result.success) throw validationError(result);

    if (!normalizeIndianPhone(result.data.phone)) {
      throw createHttpError(400, 'Enter a valid 10-digit Indian mobile number.', 'INVALID_PHONE');
    }

    const order = lookupOrder(db, result.data);
    if (!order) {
      throw createHttpError(
        404,
        'We could not find an order with that number and phone. Check the details and try again.',
        'ORDER_NOT_FOUND',
      );
    }
    res.json({ order });
  });

  router.post('/', createLimiter, (req, res) => {
    const result = createSchema.safeParse(req.body);
    if (!result.success) throw validationError(result);

    if (!normalizeIndianPhone(result.data.customer.phone)) {
      throw createHttpError(400, 'Enter a valid 10-digit Indian mobile number.', 'INVALID_PHONE');
    }

    const idempotencyKey = String(req.get('X-Idempotency-Key') || '').trim();
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(idempotencyKey)) {
      throw createHttpError(
        400,
        'A valid Idempotency-Key header is required.',
        'MISSING_IDEMPOTENCY_KEY',
      );
    }

    if (result.data.paymentMethod === 'razorpay' && !req.app.locals.onlinePaymentsEnabled) {
      throw createHttpError(
        503,
        'Online payment is not configured. Please choose Cash on Delivery.',
        'ONLINE_PAYMENT_UNAVAILABLE',
      );
    }

    const { order, replayed } = createOrder(db, {
      items: result.data.items,
      customer: result.data.customer,
      paymentMethod: result.data.paymentMethod,
      idempotencyKey,
    });

    res.status(replayed ? 200 : 201).json({ order, replayed });
  });

  return router;
}
