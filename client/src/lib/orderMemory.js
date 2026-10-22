const STORAGE_KEY = 'saffron-spice.lastOrder.v1';

export function rememberOrder(order) {
  try {
    if (!order?.orderNumber) return;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        orderNumber: order.orderNumber,
        phone: order.customer?.phone || '',
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Session storage may be unavailable; the confirmation page still uses router state.
  }
}

export function readRememberedOrder() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.orderNumber) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearRememberedOrder() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
