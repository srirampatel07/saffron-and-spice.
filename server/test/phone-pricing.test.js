import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIndianPhone } from '../src/lib/phone.js';
import { calculateOrderTotals } from '../src/lib/pricing.js';

test('Indian phone numbers normalize with optional +91 and separators', () => {
  assert.equal(normalizeIndianPhone('+91 98765 43210'), '9876543210');
  assert.equal(normalizeIndianPhone('91-98765-43210'), '9876543210');
  assert.equal(normalizeIndianPhone('9876543210'), '9876543210');
  assert.equal(normalizeIndianPhone('09876543210'), '9876543210');
  assert.equal(normalizeIndianPhone('+91 68765 43210'), '6876543210');
});

test('Indian phone validation rejects malformed or non-mobile numbers', () => {
  assert.equal(normalizeIndianPhone('1234567890'), null);
  assert.equal(normalizeIndianPhone('5876543210'), null);
  assert.equal(normalizeIndianPhone('98765 4321'), null);
  assert.equal(normalizeIndianPhone('98765432101'), null);
  assert.equal(normalizeIndianPhone('+1 98765 43210'), null);
  assert.equal(normalizeIndianPhone(''), null);
  assert.equal(normalizeIndianPhone(null), null);
});

test('totals include delivery below the free-delivery threshold', () => {
  assert.deepEqual(calculateOrderTotals(38500), {
    subtotalPaise: 38500,
    deliveryFeePaise: 4900,
    taxPaise: 1925,
    totalPaise: 45325,
  });
});

test('totals waive delivery at exactly the threshold', () => {
  assert.deepEqual(calculateOrderTotals(99900), {
    subtotalPaise: 99900,
    deliveryFeePaise: 0,
    taxPaise: 4995,
    totalPaise: 104895,
  });
});

test('GST rounds half-up to whole paise', () => {
  assert.equal(calculateOrderTotals(33333).taxPaise, 1667);
  assert.equal(calculateOrderTotals(1).taxPaise, 0);
});

test('totals reject invalid subtotals', () => {
  assert.throws(() => calculateOrderTotals(-1), TypeError);
  assert.throws(() => calculateOrderTotals(12.5), TypeError);
});
