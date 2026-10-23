import { findOrderRowByNumber, markOrderPaid, markPaymentFailed } from './orders.js';

function getPaymentEntity(payload) {
  return payload?.payload?.payment?.entity || null;
}

function getOrderEntity(payload) {
  return payload?.payload?.order?.entity || null;
}

function getEventEntity(payload) {
  return getPaymentEntity(payload) || getOrderEntity(payload);
}

/**
 * A signed event is only applied to the local order it actually belongs to.
 * The provider order ID must match, the currency must be INR, and the paid
 * amount must equal the server-calculated order total.
 */
function eventMatchesOrder(orderRow, entity) {
  if (!orderRow || orderRow.payment_method !== 'razorpay') return false;
  if (!orderRow.razorpay_order_id || !entity) return false;

  const providerOrderId = entity.order_id || entity.id;
  if (!providerOrderId || providerOrderId !== orderRow.razorpay_order_id) return false;

  if (entity.currency && String(entity.currency).toUpperCase() !== 'INR') return false;

  const amount = Number(entity.amount_paid ?? entity.amount);
  return Number.isInteger(amount) && amount === orderRow.total_paise;
}

function findOrderRow(db, razorpayOrderId, notesOrderNumber) {
  if (razorpayOrderId) {
    const row = db
      .prepare('SELECT * FROM orders WHERE razorpay_order_id = ?')
      .get(String(razorpayOrderId));
    if (row) return row;
  }
  if (notesOrderNumber) {
    return findOrderRowByNumber(db, notesOrderNumber);
  }
  return null;
}

/**
 * Webhook delivery is at-least-once, so the event ID is persisted before any
 * side effects. Replays hit the UNIQUE constraint and become no-ops.
 */
export function processWebhookEvent(db, { eventId, eventType, payload }) {
  const now = new Date().toISOString();

  const run = db.transaction(() => {
    const insert = db
      .prepare('INSERT OR IGNORE INTO webhook_events (event_id, event_type, processed_at) VALUES (?, ?, ?)')
      .run(eventId, eventType, now);

    if (insert.changes === 0) {
      return { duplicate: true, handled: false, orderNumber: null };
    }

    const payment = getPaymentEntity(payload);
    const order = getOrderEntity(payload);
    const entity = getEventEntity(payload);
    const razorpayOrderId = entity?.order_id || entity?.id || null;
    const notesOrderNumber = payment?.notes?.orderNumber || order?.notes?.orderNumber || null;
    const candidate = findOrderRow(db, razorpayOrderId, notesOrderNumber);
    const orderRow = eventMatchesOrder(candidate, entity) ? candidate : null;
    let handled = false;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (orderRow) {
        const paid = markOrderPaid(db, {
          orderNumber: orderRow.order_number,
          razorpayPaymentId: payment?.id || null,
        });
        handled = Boolean(paid);
      }
    } else if (eventType === 'payment.failed') {
      if (orderRow) {
        markPaymentFailed(db, orderRow.order_number);
        handled = true;
      }
    }

    if (orderRow) {
      db.prepare('UPDATE webhook_events SET order_number = ? WHERE event_id = ?').run(
        orderRow.order_number,
        eventId,
      );
    }

    return {
      duplicate: false,
      handled,
      orderNumber: orderRow?.order_number || null,
    };
  });

  return run();
}
