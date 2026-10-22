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
  ORDER_STATUSES,
  listOrders,
  updateOrderStatus,
} from '../services/orders.js';

const loginSchema = z.object({
  password: z.string().min(1).max(200),
});

const statusSchema = z.object({
  status: z.string().refine((value) => ORDER_STATUSES.includes(value), 'Invalid order status.'),
});

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
  if (!verifyAdminToken(token, config.adminPassword)) {
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

  router.post('/login', loginLimiter, (req, res) => {
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
      throw createHttpError(401, 'That password is not correct.', 'INVALID_PASSWORD');
    }

    const session = issueAdminToken(config.adminPassword);
    res.json({ token: session.token, expiresAt: session.expiresAt });
  });

  router.get('/orders', requireAdmin, (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    if (status && !ORDER_STATUSES.includes(status)) {
      throw createHttpError(400, 'Invalid order status filter.', 'INVALID_STATUS');
    }

    res.json(listOrders(db, { status }));
  });

  router.patch('/orders/:orderNumber/status', requireAdmin, (req, res) => {
    const result = statusSchema.safeParse(req.body);
    if (!result.success) {
      throw createHttpError(400, 'Choose a valid order status.', 'INVALID_STATUS');
    }

    const order = updateOrderStatus(db, req.params.orderNumber, result.data.status);
    res.json({ order });
  });

  return router;
}
