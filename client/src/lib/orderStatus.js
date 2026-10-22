export const ORDER_FLOW = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

export const ORDER_STATUS_META = {
  pending: {
    label: 'Order received',
    shortLabel: 'Pending',
    description: 'We have your order and are confirming it with the kitchen.',
    tone: 'warning',
  },
  confirmed: {
    label: 'Order confirmed',
    shortLabel: 'Confirmed',
    description: 'The kitchen has accepted your order and is getting ready to cook.',
    tone: 'success',
  },
  preparing: {
    label: 'In the kitchen',
    shortLabel: 'Preparing',
    description: 'Tandoors are lit and your dishes are being cooked fresh.',
    tone: 'saffron',
  },
  out_for_delivery: {
    label: 'On its way',
    shortLabel: 'Out for delivery',
    description: 'Your order has left the pass and is on its way to you.',
    tone: 'saffron',
  },
  delivered: {
    label: 'Delivered',
    shortLabel: 'Delivered',
    description: 'Delivered. We hope every bite was worth the wait.',
    tone: 'success',
  },
  cancelled: {
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    description: 'This order was cancelled. Call us if you need a hand.',
    tone: 'danger',
  },
};

export const PAYMENT_STATUS_META = {
  unpaid: { label: 'Payment pending', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  failed: { label: 'Payment failed', tone: 'danger' },
  cod_pending: { label: 'Pay on delivery', tone: 'saffron' },
};

export const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on delivery',
  razorpay: 'Online payment',
};

export function paymentIsPending(order) {
  return order?.paymentMethod === 'razorpay' && order?.paymentStatus !== 'paid';
}

export function statusIndex(status) {
  return ORDER_FLOW.indexOf(status);
}

export function timelineSteps(order) {
  const currentIndex = statusIndex(order.status);
  return ORDER_FLOW.map((status, index) => {
    const meta = ORDER_STATUS_META[status];
    let state = 'upcoming';
    if (order.status === 'cancelled') state = 'upcoming';
    else if (index < currentIndex) state = 'complete';
    else if (index === currentIndex) state = 'current';
    return {
      status,
      label: meta.label,
      description: meta.description,
      state,
    };
  });
}

export function progressPercent(status) {
  const index = statusIndex(status);
  if (index < 0) return 0;
  return Math.round((index / (ORDER_FLOW.length - 1)) * 100);
}
