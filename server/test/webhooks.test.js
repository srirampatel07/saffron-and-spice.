import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, seedMenu } from '../src/db.js';
import {
  attachRazorpayOrder,
  createOrder,
  findOrderRowByNumber,
  getOrderByNumber,
  updateOrderStatus,
} from '../src/services/orders.js';
import { processWebhookEvent } from '../src/services/webhooks.js';

function makeRazorpayOrder(db) {
  const created = createOrder(db, {
    items: [{ menuItemId: 1, quantity: 1 }],
    customer: {
      name: 'Webhook Guest',
      phone: '9876501234',
      address: '14 Lavelle Road, Ashok Nagar, Bengaluru 560001',
      notes: '',
    },
    paymentMethod: 'razorpay',
    idempotencyKey: 'webhook-test-key-123',
  });
  attachRazorpayOrder(db, created.order.orderNumber, 'order_RZP123');
  return created.order;
}

function paymentCapturedPayload(order) {
  return {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_RZP123',
          order_id: 'order_RZP123',
          amount: order.totals.totalPaise,
          currency: 'INR',
          notes: { orderNumber: order.orderNumber },
        },
      },
    },
  };
}

test('webhook event IDs are idempotent and mark an order paid once', () => {
  const db = openDatabase(':memory:');
  seedMenu(db);
  const order = makeRazorpayOrder(db);

  const first = processWebhookEvent(db, {
    eventId: 'evt_unique_123',
    eventType: 'payment.captured',
    payload: paymentCapturedPayload(order),
  });
  assert.deepEqual(first, { duplicate: false, handled: true, orderNumber: order.orderNumber });

  const paid = getOrderByNumber(db, order.orderNumber);
  assert.equal(paid.paymentStatus, 'paid');
  assert.equal(paid.status, 'confirmed');
  assert.equal(findOrderRowByNumber(db, order.orderNumber).razorpay_payment_id, 'pay_RZP123');

  updateOrderStatus(db, order.orderNumber, 'preparing');
  const replay = processWebhookEvent(db, {
    eventId: 'evt_unique_123',
    eventType: 'payment.captured',
    payload: paymentCapturedPayload(order),
  });
  assert.equal(replay.duplicate, true);
  assert.equal(getOrderByNumber(db, order.orderNumber).status, 'preparing');

  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM webhook_events').get().count, 1);
  db.close();
});

test('payment.failed webhook records failure without cancelling the order', () => {
  const db = openDatabase(':memory:');
  seedMenu(db);
  const order = makeRazorpayOrder(db);

  const result = processWebhookEvent(db, {
    eventId: 'evt_failed_123',
    eventType: 'payment.failed',
    payload: {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_failed',
            order_id: 'order_RZP123',
            amount: order.totals.totalPaise,
            currency: 'INR',
          },
        },
      },
    },
  });

  assert.equal(result.handled, true);
  const after = getOrderByNumber(db, order.orderNumber);
  assert.equal(after.paymentStatus, 'failed');
  assert.equal(after.status, 'pending');
  db.close();
});

test('webhook ignores a paid event whose amount does not match the order total', () => {
  const db = openDatabase(':memory:');
  seedMenu(db);
  const order = makeRazorpayOrder(db);
  const payload = paymentCapturedPayload(order);
  payload.payload.payment.entity.amount = order.totals.totalPaise - 1;

  const result = processWebhookEvent(db, {
    eventId: 'evt_wrong_amount',
    eventType: 'payment.captured',
    payload,
  });

  assert.deepEqual(result, { duplicate: false, handled: false, orderNumber: null });
  assert.equal(getOrderByNumber(db, order.orderNumber).paymentStatus, 'unpaid');
  db.close();
});

test('webhook ignores a paid event signed by the provider for a different order', () => {
  const db = openDatabase(':memory:');
  seedMenu(db);
  const order = makeRazorpayOrder(db);
  const payload = paymentCapturedPayload(order);
  payload.payload.payment.entity.order_id = 'order_OTHER999';

  const result = processWebhookEvent(db, {
    eventId: 'evt_wrong_order',
    eventType: 'payment.captured',
    payload,
  });

  assert.equal(result.handled, false);
  assert.equal(getOrderByNumber(db, order.orderNumber).paymentStatus, 'unpaid');
  db.close();
});

test('one Razorpay payment ID cannot settle two local orders', () => {
  const db = openDatabase(':memory:');
  seedMenu(db);
  const first = makeRazorpayOrder(db);
  processWebhookEvent(db, {
    eventId: 'evt_first_paid',
    eventType: 'payment.captured',
    payload: paymentCapturedPayload(first),
  });

  const second = createOrder(db, {
    items: [{ menuItemId: 2, quantity: 1 }],
    customer: {
      name: 'Second Guest',
      phone: '9876509999',
      address: '14 Lavelle Road, Ashok Nagar, Bengaluru 560001',
      notes: '',
    },
    paymentMethod: 'razorpay',
    idempotencyKey: 'webhook-test-key-456',
  });
  attachRazorpayOrder(db, second.order.orderNumber, 'order_RZP456');

  const secondPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_RZP123',
          order_id: 'order_RZP456',
          amount: second.order.totals.totalPaise,
          currency: 'INR',
        },
      },
    },
  };

  const result = processWebhookEvent(db, {
    eventId: 'evt_reused_payment',
    eventType: 'payment.captured',
    payload: secondPayload,
  });

  assert.equal(result.handled, false);
  assert.equal(getOrderByNumber(db, second.order.orderNumber).paymentStatus, 'unpaid');
  assert.equal(getOrderByNumber(db, first.orderNumber).paymentStatus, 'paid');
  db.close();
});
