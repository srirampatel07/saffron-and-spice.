import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { config } from './config.js';
import { menuRouter } from './routes/menu.js';
import { publicConfigRouter } from './routes/publicConfig.js';
import { ordersRouter } from './routes/orders.js';
import { paymentsRouter } from './routes/payments.js';
import { adminRouter } from './routes/admin.js';
import { razorpayWebhookRouter } from './routes/webhooks.js';

function corsOrigin(origin, callback) {
  if (!origin || origin === config.clientUrl) {
    callback(null, true);
    return;
  }
  const error = new Error('Origin is not allowed by CORS policy.');
  error.status = 403;
  error.code = 'CORS_NOT_ALLOWED';
  callback(error);
}

export function createApp({ db }) {
  const app = express();
  app.disable('x-powered-by');
  app.locals.onlinePaymentsEnabled = config.razorpayTestConfigured;

  if (config.isProduction) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: config.isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
              connectSrc: ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
              frameSrc: ['https://api.razorpay.com', 'https://checkout.razorpay.com'],
              imgSrc: ["'self'", 'data:', 'https:'],
              styleSrc: ["'self'", "'unsafe-inline'"],
              fontSrc: ["'self'", 'data:'],
            },
          }
        : false,
    }),
  );
  app.use(cors({ origin: corsOrigin, methods: ['GET', 'POST', 'PATCH', 'OPTIONS'] }));

  // Razorpay signs the exact raw body, so this route must parse the bytes
  // before the rest of the API accepts JSON.
  app.use(
    '/api/webhooks/razorpay',
    express.raw({ type: 'application/json', limit: '1mb' }),
    razorpayWebhookRouter(db),
  );

  app.use(express.json({ limit: '32kb' }));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 180,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { message: 'Too many requests. Please wait a moment and try again.' } },
  });
  app.use('/api', apiLimiter);

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'saffron-spice-api' });
  });

  app.use('/api/menu', menuRouter(db));
  app.use('/api/config', publicConfigRouter());
  app.use('/api/orders', ordersRouter(db));
  app.use('/api/payments', paymentsRouter(db));
  app.use('/api/admin', adminRouter(db));

  app.use('/api', (req, res) => {
    res.status(404).json({ error: { message: 'API route not found.', code: 'NOT_FOUND' } });
  });

  // Central error handler: client-safe messages only, no secrets, no request bodies.
  app.use((error, req, res, _next) => {
    const status = Number.isInteger(error.status) && error.status >= 400 ? error.status : 500;
    if (status >= 500) {
      console.error(`[api] ${req.method} ${req.path} failed:`, error.message);
      if (!config.isProduction && error.stack) console.error(error.stack);
    }
    if (res.headersSent) return;
    res.status(status).json({
      error: {
        message: status === 500 ? 'Something went wrong. Please try again.' : error.message,
        code: error.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
  });

  return app;
}
