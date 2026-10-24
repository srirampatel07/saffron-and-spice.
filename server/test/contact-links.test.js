import assert from 'node:assert/strict';
import test from 'node:test';
import { restaurant } from '../../client/src/config.js';
import {
  getTelHref,
  getWhatsAppHref,
  shouldShowFloatingContact,
} from '../../client/src/lib/contact.js';

test('WhatsApp link uses the configured number and default message', () => {
  const href = getWhatsAppHref();
  const url = new URL(href);

  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/919381074674');
  assert.equal(url.searchParams.get('text'), restaurant.whatsapp.defaultMessage);
  assert.equal(
    restaurant.whatsapp.defaultMessage,
    "Hi Saffron & Spice! I'd like to enquire about your menu and orders.",
  );
  assert.match(href, /%26/);
});

test('order WhatsApp link includes only the visible order number', () => {
  const href = getWhatsAppHref({ orderNumber: 'ss-261022-c7bd1f' });
  const message = new URL(href).searchParams.get('text');

  assert.equal(
    message,
    "Hi Saffron & Spice! I'd like to enquire about order SS-261022-C7BD1F.",
  );
  assert.doesNotMatch(message, /\+91|93810|saffronandspice|address/i);
});

test('order WhatsApp link falls back to the default for invalid numbers', () => {
  const href = getWhatsAppHref({ orderNumber: 'SS-123' });
  const message = new URL(href).searchParams.get('text');

  assert.equal(message, restaurant.whatsapp.defaultMessage);
});

test('call link uses the configured phone number', () => {
  assert.equal(getTelHref(), 'tel:+919381074674');
});

test('floating contact is hidden on private and order-tracking routes, and while the cart is open', () => {
  assert.equal(shouldShowFloatingContact('/'), true);
  assert.equal(shouldShowFloatingContact('/menu'), true);
  assert.equal(shouldShowFloatingContact('/story'), true);
  assert.equal(shouldShowFloatingContact('/track'), false);
  assert.equal(shouldShowFloatingContact('/track/'), false);
  assert.equal(shouldShowFloatingContact('/order/SS-261022-C7BD1F'), false);
  assert.equal(shouldShowFloatingContact('/order/SS-261022-C7BD1F/'), false);
  assert.equal(shouldShowFloatingContact('/admin'), false);
  assert.equal(shouldShowFloatingContact('/admin/'), false);
  assert.equal(shouldShowFloatingContact('/checkout'), false);
  assert.equal(shouldShowFloatingContact('/checkout/'), false);
  assert.equal(shouldShowFloatingContact('/menu', { cartOpen: true }), false);
});
