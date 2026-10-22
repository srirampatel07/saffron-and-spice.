import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, seedMenu } from '../src/db.js';
import {
  createOrder,
  getOrderByNumber,
  lookupOrder,
  quoteOrder,
  updateOrderStatus,
} from '../src/services/orders.js';

function makeDb() {
  const db = openDatabase(':memory:');
  seedMenu(db);
  return db;
}

const customer = {
  name: 'Demo Guest',
  phone: '+91 98765 43210',
  address: '14 Lavelle Road, Ashok Nagar, Bengaluru 560001',
  notes: 'Ring the bell twice.',
};

test('quotes use database prices, never client-provided money', () => {
  const db = makeDb();
  const quote = quoteOrder(db, [{ menuItemId: 1, quantity: 2, pricePaise: 1 }]);
  assert.equal(quote.items[0].pricePaise, 38500);
  assert.equal(quote.items[0].lineTotalPaise, 77000);
  db.close();
});

test('orders reject unavailable dishes', () => {
  const db = makeDb();
  assert.throws(
    () => quoteOrder(db, [{ menuItemId: 11, quantity: 1 }]),
    (error) => error.status === 409 && error.code === 'ITEMS_UNAVAILABLE',
  );
  db.close();
});

test('order creation is idempotent and lookup requires the matching phone', () => {
  const db = makeDb();
  const idempotencyKey = 'checkout-test-key-123';
  const request = {
    items: [{ menuItemId: 1, quantity: 1 }],
    customer,
    paymentMethod: 'cod',
    idempotencyKey,
  };

  const first = createOrder(db, request);
  assert.equal(first.replayed, false);
  assert.equal(first.order.paymentStatus, 'cod_pending');
  assert.equal(first.order.status, 'pending');
  assert.equal(first.order.totals.totalPaise, 45325);

  const replay = createOrder(db, request);
  assert.equal(replay.replayed, true);
  assert.equal(replay.order.orderNumber, first.order.orderNumber);

  assert.throws(
    () => createOrder(db, { ...request, customer: { ...customer, phone: '9123456780' } }),
    (error) => error.status === 409 && error.code === 'IDEMPOTENCY_CONFLICT',
  );

  assert.equal(lookupOrder(db, { orderNumber: first.order.orderNumber, phone: '9876543210' }).status, 'pending');
  assert.equal(lookupOrder(db, { orderNumber: first.order.orderNumber, phone: '9123456780' }), null);

  const delivered = updateOrderStatus(db, first.order.orderNumber, 'delivered');
  assert.equal(delivered.status, 'delivered');
  assert.equal(delivered.paymentStatus, 'paid');
  assert.equal(getOrderByNumber(db, first.order.orderNumber).status, 'delivered');
  db.close();
});

test('order creation validates quantities and duplicate lines', () => {
  const db = makeDb();
  const base = { customer, paymentMethod: 'cod', idempotencyKey: 'checkout-test-key-456' };

  assert.throws(
    () => createOrder(db, { ...base, items: [{ menuItemId: 1, quantity: 0 }] }),
    (error) => error.status === 400 && error.code === 'INVALID_QUANTITY',
  );
  assert.throws(
    () =>
      createOrder(db, {
        ...base,
        items: [
          { menuItemId: 1, quantity: 1 },
          { menuItemId: 1, quantity: 2 },
        ],
      }),
    (error) => error.status === 400 && error.code === 'DUPLICATE_ITEM',
  );
  db.close();
});
