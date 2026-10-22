import { orderRules } from '../config.js';

/**
 * The server is the only source of truth for order money. Amounts are kept
 * in integer paise so GST rounding is deterministic and never uses floats.
 */
export function calculateOrderTotals(subtotalPaise, rules = orderRules) {
  if (!Number.isInteger(subtotalPaise) || subtotalPaise < 0) {
    throw new TypeError('Subtotal must be a non-negative integer in paise.');
  }

  const deliveryFeePaise =
    subtotalPaise === 0 || subtotalPaise >= rules.freeDeliveryThresholdPaise ? 0 : rules.deliveryFeePaise;
  const taxPaise = Math.round((subtotalPaise * rules.taxRateBps) / 10_000);

  return {
    subtotalPaise,
    deliveryFeePaise,
    taxPaise,
    totalPaise: subtotalPaise + deliveryFeePaise + taxPaise,
  };
}
