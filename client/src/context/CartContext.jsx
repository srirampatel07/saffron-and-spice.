import { useCallback, useEffect, useMemo, useState } from 'react';
import { restaurant } from '../config';
import { CartContext } from './cart';
import { useMenu } from './menu';

const STORAGE_KEY = 'saffron-spice.cart.v1';
const MAX_QUANTITY = 20;

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set();
    return parsed
      .filter((entry) => {
        const id = Number(entry?.id);
        return Number.isInteger(id) && id > 0 && id < 100000000 && !seen.has(id) && seen.add(id);
      })
      .slice(0, 50)
      .map((entry) => ({
        id: Number(entry.id),
        quantity: Math.min(MAX_QUANTITY, Math.max(1, Math.floor(Number(entry.quantity) || 1))),
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { items: menuItems } = useMenu();
  const [entries, setEntries] = useState(readCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Storage can be unavailable in private browsing; the cart still works for this session.
    }
  }, [entries]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) setEntries(readCart());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const lines = useMemo(() => {
    const byId = new Map(menuItems.map((item) => [item.id, item]));
    return entries
      .map((entry) => {
        const item = byId.get(entry.id);
        return item ? { ...item, quantity: entry.quantity } : null;
      })
      .filter(Boolean);
  }, [entries, menuItems]);

  const totals = useMemo(() => {
    const subtotalPaise = lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0);
    const freeThreshold = restaurant.freeDeliveryThreshold * 100;
    const deliveryFeePaise = subtotalPaise === 0 || subtotalPaise >= freeThreshold ? 0 : restaurant.deliveryFee * 100;
    const taxPaise = Math.round(subtotalPaise * restaurant.taxRate);
    return {
      subtotalPaise,
      deliveryFeePaise,
      taxPaise,
      totalPaise: subtotalPaise + deliveryFeePaise + taxPaise,
      freeThresholdPaise: freeThreshold,
      amountToFreeDeliveryPaise: Math.max(0, freeThreshold - subtotalPaise),
    };
  }, [lines]);

  const addItem = useCallback((item, quantity = 1) => {
    if (!item?.isAvailable) return false;
    setEntries((current) => {
      const existing = current.find((entry) => entry.id === item.id);
      if (existing) {
        return current.map((entry) =>
          entry.id === item.id
            ? { ...entry, quantity: Math.min(MAX_QUANTITY, entry.quantity + quantity) }
            : entry,
        );
      }
      return [...current, { id: item.id, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) }];
    });
    return true;
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    const next = Math.max(1, Math.min(MAX_QUANTITY, Math.floor(Number(quantity) || 1)));
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, quantity: next } : entry)));
  }, []);

  const removeItem = useCallback((id) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const clearCart = useCallback(() => setEntries([]), []);

  const value = useMemo(
    () => ({
      entries,
      lines,
      ...totals,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      hasUnavailable: lines.some((line) => !line.isAvailable),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      maxQuantity: MAX_QUANTITY,
    }),
    [entries, lines, totals, addItem, updateQuantity, removeItem, clearCart, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
