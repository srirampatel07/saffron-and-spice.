import crypto from 'node:crypto';
import { orderRules } from '../config.js';
import { createHttpError } from '../lib/errors.js';
import { normalizeIndianPhone } from '../lib/phone.js';
import { calculateOrderTotals } from '../lib/pricing.js';

export const ORDER_STATUSES = Object.freeze([
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);

export const PAYMENT_STATUSES = Object.freeze(['unpaid', 'paid', 'failed', 'cod_pending']);
export const ORDER_NUMBER_PATTERN = /^SS-\d{6}-[A-F0-9]{6}$/;

const FIND_ITEM = `
  SELECT
    mi.id, mi.name, mi.price_paise, mi.is_available, mi.is_veg, mi.image,
    c.name AS category_name
  FROM menu_items mi
  JOIN categories c ON c.id = mi.category_id
  WHERE mi.id = ?
`;

function serializeItem(item) {
  return {
    menuItemId: item.menu_item_id,
    name: item.name,
    pricePaise: item.price_paise,
    quantity: item.quantity,
    lineTotalPaise: item.line_total_paise,
    isVeg: Boolean(item.is_veg),
    image: item.image,
    categoryName: item.category_name,
  };
}

export function serializeOrder(order, itemRows = []) {
  return {
    orderNumber: order.order_number,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    customer: {
      name: order.customer_name,
      phone: order.customer_phone,
      address: order.delivery_address,
      notes: order.notes,
    },
    totals: {
      subtotalPaise: order.subtotal_paise,
      deliveryFeePaise: order.delivery_fee_paise,
      taxPaise: order.tax_paise,
      totalPaise: order.total_paise,
    },
    items: itemRows.map(serializeItem),
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}

export function getOrderItems(db, orderId) {
  return db
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id')
    .all(orderId);
}

export function getOrderByNumber(db, orderNumber) {
  const row = db
    .prepare('SELECT * FROM orders WHERE order_number = ?')
    .get(String(orderNumber || '').trim().toUpperCase());
  if (!row) return null;
  return serializeOrder(row, getOrderItems(db, row.id));
}

export function findOrderRowByNumber(db, orderNumber) {
  return (
    db
      .prepare('SELECT * FROM orders WHERE order_number = ?')
      .get(String(orderNumber || '').trim().toUpperCase()) || null
  );
}

export function priceOrderItems(db, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, 'Add at least one dish before continuing.', 'EMPTY_ORDER');
  }
  if (items.length > orderRules.maxDistinctItems) {
    throw createHttpError(400, 'This order has too many different dishes.', 'TOO_MANY_ITEMS');
  }

  const seen = new Set();
  const unavailable = [];
  const lines = [];
  const findItem = db.prepare(FIND_ITEM);

  for (const requested of items) {
    const menuItemId = Number(requested?.menuItemId);
    const quantity = Number(requested?.quantity);

    if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
      throw createHttpError(400, 'A dish in your order is invalid.', 'INVALID_ITEM');
    }
    if (seen.has(menuItemId)) {
      throw createHttpError(400, 'The same dish appears twice in your order.', 'DUPLICATE_ITEM');
    }
    seen.add(menuItemId);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > orderRules.maxQuantityPerItem) {
      throw createHttpError(
        400,
        `Quantities must be between 1 and ${orderRules.maxQuantityPerItem}.`,
        'INVALID_QUANTITY',
      );
    }

    const item = findItem.get(menuItemId);
    if (!item || !item.is_available) {
      unavailable.push({ menuItemId, name: item?.name || 'A dish' });
      continue;
    }

    lines.push({
      menuItemId: item.id,
      name: item.name,
      pricePaise: item.price_paise,
      quantity,
      lineTotalPaise: item.price_paise * quantity,
      isVeg: Boolean(item.is_veg),
      image: item.image,
      categoryName: item.category_name,
    });
  }

  if (unavailable.length > 0) {
    throw createHttpError(
      409,
      unavailable.length === 1
        ? `${unavailable[0].name} is no longer available. Please remove it to continue.`
        : 'Some dishes are no longer available. Please review your order.',
      'ITEMS_UNAVAILABLE',
      { items: unavailable },
    );
  }

  const subtotalPaise = lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);
  return { lines, subtotalPaise };
}

export function quoteOrder(db, items) {
  const { lines, subtotalPaise } = priceOrderItems(db, items);
  return {
    items: lines,
    totals: calculateOrderTotals(subtotalPaise),
  };
}

function generateOrderNumber(db) {
  const dateStamp = new Date().toISOString().slice(2, 10).replaceAll('-', '');
  const exists = db.prepare('SELECT 1 FROM orders WHERE order_number = ?');
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `SS-${dateStamp}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    if (!exists.get(candidate)) return candidate;
  }
  throw createHttpError(500, 'We could not create an order number. Please try again.', 'ORDER_NUMBER_FAILED');
}

function replayOrder(db, existing, phone) {
  if (existing.customer_phone !== phone) {
    throw createHttpError(
      409,
      'This checkout attempt has already been used with different details.',
      'IDEMPOTENCY_CONFLICT',
    );
  }
  return {
    order: serializeOrder(existing, getOrderItems(db, existing.id)),
    replayed: true,
  };
}

export function createOrder(
  db,
  { items, customer, paymentMethod = 'cod', idempotencyKey },
) {
  const phone = normalizeIndianPhone(customer?.phone);
  if (!phone) {
    throw createHttpError(400, 'Enter a valid 10-digit Indian mobile number.', 'INVALID_PHONE');
  }
  if (!idempotencyKey) {
    throw createHttpError(400, 'A checkout key is required.', 'MISSING_IDEMPOTENCY_KEY');
  }

  const existing = db
    .prepare('SELECT * FROM orders WHERE idempotency_key = ?')
    .get(idempotencyKey);
  if (existing) return replayOrder(db, existing, phone);

  const { lines, subtotalPaise } = priceOrderItems(db, items);
  const totals = calculateOrderTotals(subtotalPaise);
  const now = new Date().toISOString();
  const orderNumber = generateOrderNumber(db);
  const paymentStatus = paymentMethod === 'cod' ? 'cod_pending' : 'unpaid';

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_number, idempotency_key, customer_name, customer_phone, delivery_address, notes,
      subtotal_paise, delivery_fee_paise, tax_paise, total_paise,
      payment_method, payment_status, status, created_at, updated_at
    ) VALUES (
      @orderNumber, @idempotencyKey, @customerName, @customerPhone, @deliveryAddress, @notes,
      @subtotalPaise, @deliveryFeePaise, @taxPaise, @totalPaise,
      @paymentMethod, @paymentStatus, 'pending', @now, @now
    )
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (
      order_id, menu_item_id, name, price_paise, quantity, line_total_paise, is_veg, image, category_name
    ) VALUES (
      @orderId, @menuItemId, @name, @pricePaise, @quantity, @lineTotalPaise, @isVeg, @image, @categoryName
    )
  `);

  const write = db.transaction(() => {
    const result = insertOrder.run({
      orderNumber,
      idempotencyKey,
      customerName: customer.name,
      customerPhone: phone,
      deliveryAddress: customer.address,
      notes: customer.notes || '',
      subtotalPaise: totals.subtotalPaise,
      deliveryFeePaise: totals.deliveryFeePaise,
      taxPaise: totals.taxPaise,
      totalPaise: totals.totalPaise,
      paymentMethod,
      paymentStatus,
      now,
    });
    const orderId = Number(result.lastInsertRowid);

    for (const line of lines) {
      insertItem.run({
        orderId,
        menuItemId: line.menuItemId,
        name: line.name,
        pricePaise: line.pricePaise,
        quantity: line.quantity,
        lineTotalPaise: line.lineTotalPaise,
        isVeg: line.isVeg ? 1 : 0,
        image: line.image,
        categoryName: line.categoryName,
      });
    }

    return orderId;
  });

  try {
    const orderId = write();
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    return { order: serializeOrder(row, getOrderItems(db, orderId)), replayed: false };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' && String(error.message).includes('idempotency_key')) {
      const raced = db.prepare('SELECT * FROM orders WHERE idempotency_key = ?').get(idempotencyKey);
      if (raced) return replayOrder(db, raced, phone);
    }
    throw error;
  }
}

export function lookupOrder(db, { orderNumber, phone }) {
  const normalizedPhone = normalizeIndianPhone(phone);
  if (!normalizedPhone) {
    throw createHttpError(400, 'Enter the mobile number used for the order.', 'INVALID_PHONE');
  }

  const row = db
    .prepare('SELECT * FROM orders WHERE order_number = ? AND customer_phone = ?')
    .get(String(orderNumber || '').trim().toUpperCase(), normalizedPhone);

  if (!row) return null;
  return serializeOrder(row, getOrderItems(db, row.id));
}

export function attachRazorpayOrder(db, orderNumber, razorpayOrderId) {
  const now = new Date().toISOString();
  const result = db
    .prepare(`
      UPDATE orders
      SET razorpay_order_id = ?, updated_at = ?
      WHERE order_number = ? AND payment_status <> 'paid'
    `)
    .run(razorpayOrderId, now, String(orderNumber).trim().toUpperCase());
  return result.changes > 0;
}

export function markOrderPaid(db, { orderNumber, razorpayPaymentId = null }) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE orders
    SET
      payment_status = 'paid',
      razorpay_payment_id = COALESCE(?, razorpay_payment_id),
      status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
      updated_at = ?
    WHERE order_number = ?
  `).run(razorpayPaymentId, now, String(orderNumber).trim().toUpperCase());

  return getOrderByNumber(db, orderNumber);
}

export function markPaymentFailed(db, orderNumber) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE orders
    SET payment_status = 'failed', updated_at = ?
    WHERE order_number = ? AND payment_status <> 'paid'
  `).run(now, String(orderNumber).trim().toUpperCase());
}

export function updateOrderStatus(db, orderNumber, status) {
  if (!ORDER_STATUSES.includes(status)) {
    throw createHttpError(400, 'That order status is not valid.', 'INVALID_STATUS');
  }

  const row = findOrderRowByNumber(db, orderNumber);
  if (!row) {
    throw createHttpError(404, 'Order not found.', 'ORDER_NOT_FOUND');
  }

  const now = new Date().toISOString();
  const settleCod =
    status === 'delivered' && row.payment_method === 'cod' && row.payment_status === 'cod_pending';

  db.prepare(`
    UPDATE orders
    SET status = ?, payment_status = ?, updated_at = ?
    WHERE id = ?
  `).run(status, settleCod ? 'paid' : row.payment_status, now, row.id);

  return getOrderByNumber(db, orderNumber);
}

export function listOrders(db, { status } = {}) {
  const orderRows = status
    ? db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT 300').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 300').all();

  const itemsByOrder = new Map();
  if (orderRows.length > 0) {
    const placeholders = orderRows.map(() => '?').join(', ');
    const items = db
      .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`)
      .all(...orderRows.map((row) => row.id));
    for (const item of items) {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id).push(item);
    }
  }

  const counts = Object.fromEntries(ORDER_STATUSES.map((value) => [value, 0]));
  for (const row of db.prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status').all()) {
    counts[row.status] = row.count;
  }

  return {
    orders: orderRows.map((row) => serializeOrder(row, itemsByOrder.get(row.id) || [])),
    counts,
    total: Object.values(counts).reduce((sum, count) => sum + count, 0),
  };
}
