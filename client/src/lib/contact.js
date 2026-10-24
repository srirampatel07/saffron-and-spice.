import { restaurant } from '../config.js';

const ORDER_NUMBER_PATTERN = /^SS-\d{6}-[A-F0-9]{6}$/i;
const HIDDEN_FLOATING_ROUTES = ['/admin', '/checkout', '/order', '/track'];

export function getTelHref() {
  return `tel:${restaurant.phoneHref}`;
}

export function normalizeVisibleOrderNumber(orderNumber) {
  const value = String(orderNumber || '').trim().toUpperCase();
  return ORDER_NUMBER_PATTERN.test(value) ? value : null;
}

export function getWhatsAppHref({ orderNumber = null } = {}) {
  const visibleOrderNumber = normalizeVisibleOrderNumber(orderNumber);
  const message = visibleOrderNumber
    ? `Hi ${restaurant.name}! I'd like to enquire about order ${visibleOrderNumber}.`
    : restaurant.whatsapp.defaultMessage;
  const phone = restaurant.phoneHref.replace(/\D/g, '');

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function shouldShowFloatingContact(pathname = '/', { cartOpen = false } = {}) {
  if (cartOpen) return false;

  const path = String(pathname || '/').replace(/\/+$/, '') || '/';
  return !HIDDEN_FLOATING_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}
