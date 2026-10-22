import { api } from './api';
import { restaurant } from '../config';

let scriptPromise = null;

function loadRazorpayScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Online payment is only available in the browser.'));
  }
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('The secure payment window could not load. Check your connection and try again.'));
    };
    const timeout = window.setTimeout(() => {
      scriptPromise = null;
      reject(new Error('The secure payment window took too long to load. Please try again.'));
    }, 15000);
    script.addEventListener('load', () => window.clearTimeout(timeout), { once: true });
    script.addEventListener('error', () => window.clearTimeout(timeout), { once: true });
    document.body.appendChild(script);
  });

  return scriptPromise;
}

function openRazorpayModal(payment) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const checkout = new window.Razorpay({
      key: payment.keyId,
      amount: payment.amountPaise,
      currency: payment.currency || 'INR',
      name: restaurant.name,
      description: `Order ${payment.orderNumber}`,
      order_id: payment.razorpayOrderId,
      prefill: payment.prefill,
      notes: { orderNumber: payment.orderNumber },
      theme: { color: '#5d1b20' },
      handler: (response) => finish({ status: 'success', response }),
      modal: {
        escape: true,
        backdropclose: false,
        ondismiss: () => finish({ status: 'dismissed' }),
      },
    });

    checkout.on('payment.failed', (response) => {
      finish({
        status: 'failed',
        message: response?.error?.description || 'The payment did not go through. Please try again.',
      });
    });

    checkout.open();
  });
}

/**
 * Creates a Razorpay order on our server, opens Razorpay Checkout, then sends
 * the signed result back to the server for HMAC verification. Card details
 * never touch this app.
 */
export async function payForOrder(order) {
  const payment = await api.createRazorpayOrder({
    orderNumber: order.orderNumber,
    phone: order.customer.phone,
  });

  await loadRazorpayScript();
  const result = await openRazorpayModal(payment);
  if (result.status !== 'success') return result;

  const verified = await api.verifyRazorpayPayment({
    orderNumber: order.orderNumber,
    razorpayOrderId: result.response.razorpay_order_id,
    razorpayPaymentId: result.response.razorpay_payment_id,
    razorpaySignature: result.response.razorpay_signature,
  });

  return { status: 'success', order: verified.order };
}
