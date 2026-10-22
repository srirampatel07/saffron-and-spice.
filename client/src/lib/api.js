const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('We could not reach the kitchen. Please check your connection and try again.', {
      code: 'NETWORK_ERROR',
    });
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      (response.status === 429
        ? 'Too many attempts. Please wait a moment and try again.'
        : 'Something went wrong. Please try again.');
    throw new ApiError(message, {
      status: response.status,
      code: data?.error?.code || 'REQUEST_FAILED',
      details: data?.error?.details,
    });
  }

  return data;
}

export const api = {
  getMenu: ({ signal } = {}) => request('/api/menu', { signal }),

  getConfig: ({ signal } = {}) => request('/api/config', { signal }),

  quoteOrder: (items, { signal } = {}) =>
    request('/api/orders/quote', { method: 'POST', body: { items }, signal }),

  createOrder: (payload, idempotencyKey) =>
    request('/api/orders', {
      method: 'POST',
      body: payload,
      headers: { 'X-Idempotency-Key': idempotencyKey },
    }),

  lookupOrder: (payload, { signal } = {}) =>
    request('/api/orders/lookup', { method: 'POST', body: payload, signal }),

  createRazorpayOrder: (payload) => request('/api/payments/razorpay/order', { method: 'POST', body: payload }),

  verifyRazorpayPayment: (payload) => request('/api/payments/razorpay/verify', { method: 'POST', body: payload }),

  adminLogin: (password) => request('/api/admin/login', { method: 'POST', body: { password } }),

  adminOrders: (token, { status, signal } = {}) => {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/admin/orders${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
  },

  adminUpdateStatus: (token, orderNumber, status) =>
    request(`/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: 'PATCH',
      body: { status },
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export { request };
