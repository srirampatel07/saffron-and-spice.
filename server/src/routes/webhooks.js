import express from 'express';
import { config } from '../config.js';
import { verifyHmacSha256 } from '../lib/signature.js';
import { processWebhookEvent } from '../services/webhooks.js';

export function razorpayWebhookRouter(db) {
  const router = express.Router();

  router.post('/', (req, res) => {
    if (!config.razorpayWebhookConfigured) {
      res.status(503).json({
        error: { message: 'Webhook processing is not configured.', code: 'WEBHOOK_NOT_CONFIGURED' },
      });
      return;
    }

    const signature = req.get('x-razorpay-signature');
    const eventId = String(req.get('x-razorpay-event-id') || '').trim();
    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      res.status(400).json({ error: { message: 'A raw JSON body is required.', code: 'INVALID_WEBHOOK' } });
      return;
    }
    if (!eventId || eventId.length > 200) {
      res.status(400).json({
        error: { message: 'The X-Razorpay-Event-Id header is required.', code: 'MISSING_EVENT_ID' },
      });
      return;
    }
    if (!verifyHmacSha256(rawBody, signature, config.razorpayWebhookSecret)) {
      res.status(400).json({
        error: { message: 'Invalid webhook signature.', code: 'INVALID_WEBHOOK_SIGNATURE' },
      });
      return;
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      res.status(400).json({ error: { message: 'Invalid webhook JSON.', code: 'INVALID_WEBHOOK_JSON' } });
      return;
    }

    const eventType = typeof payload?.event === 'string' ? payload.event : 'unknown';
    const result = processWebhookEvent(db, { eventId, eventType, payload });
    res.json({ received: true, ...result });
  });

  return router;
}
