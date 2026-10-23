import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import {
  issueAdminToken,
  parseBearerToken,
  verifyAdminPassword,
  verifyAdminToken,
} from '../lib/adminAuth.js';
import { createHttpError } from '../lib/errors.js';
import {
  ORDER_NUMBER_PATTERN,
  ORDER_STATUSES,
  listOrders,
  updateOrderStatus,
} from '../services/orders.js';

const loginSchema = z
  .object({
    password: z.string().min(1).max(200),
  })
  .strict();

const statusSchema = z
  .object({
    status: z.string().refine((value) => ORDER_STATUSES.includes(value), 'Invalid order status.'),
  })
  .strict();

const listQuerySchema = z
  .object({
    status: z.string().refine((value) => ORDER_STATUSES.includes(value), 'Invalid order status.').optional(),
  })
  .strict();

const orderNumberParamsSchema = z
  .object({
    orderNumber: z.string().trim().regex(ORDER_NUMBER_PATTERN, 'Invalid order number.'),
  })
  .strict();

const FAILED_LOGIN_DELAY_MS = 250;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: { message: 'Too many login attempts. Please wait 15 minutes.', code: 'RATE_LIMITED' },
    });
  },
});

function requireAdmin(req, res, next) {
  if (!config.adminEnabled) {
    next(
      createHttpError(
        503,
        'The admin dashboard is not configured. Set ADMIN_PASSWORD on the server.',
        'ADMIN_NOT_CONFIGURED',
      ),
    );
    return;
  }

  const token = parseBearerToken(req.get('authorization'));
  if (!verifyAdminToken(token, config.adminTokenSigningKey)) {
    next(createHttpError(401, 'Your admin session is invalid or has expired. Sign in again.', 'UNAUTHORIZED'));
    return;
  }

  next();
}

export function adminRouter(db) {
  const router = express.Router();

  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.post('/login', loginLimiter, async (req, res) => {
    if (!config.adminEnabled) {
      throw createHttpError(
        503,
        'The admin dashboard is not configured. Set ADMIN_PASSWORD on the server and restart.',
        'ADMIN_NOT_CONFIGURED',
      );
    }

    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      throw createHttpError(400, 'Enter the admin password.', 'VALIDATION_ERROR');
    }
    if (!verifyAdminPassword(result.data.password, config.adminPassword)) {
      // Slow failed guesses without changing the response shape. The IP limit
      // remains the primary control; this is defence in depth.
      await sleep(FAILED_LOGIN_DELAY_MS);
      throw createHttpError(401, 'That password is not correct.', 'INVALID_PASSWORD');
    }

    const session = issueAdminToken(config.adminTokenSigningKey);
    res.json({ token: session.token, expiresAt: session.expiresAt });
  });

  router.get('/orders', requireAdmin, (req, res) => {
    const query = listQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw createHttpError(400, 'Invalid order status filter.', 'INVALID_STATUS');
    }

    res.json(listOrders(db, { status: query.data.status }));
  });

  router.patch('/orders/:orderNumber/status', requireAdmin, (req, res) => {
    const params = orderNumberParamsSchema.safeParse(req.params);
    if (!params.success) {
      throw createHttpError(400, 'Invalid order number.', 'INVALID_ORDER_NUMBER');
    }

    const result = statusSchema.safeParse(req.body);
    if (!result.success) {
      throw createHttpError(400, 'Choose a valid order status.', 'INVALID_STATUS');
    }

    const order = updateOrderStatus(db, params.data.orderNumber, result.data.status);
    res.json({ order });
  });

  return router;
}
