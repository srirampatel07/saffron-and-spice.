import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';
import Button from '../components/Button';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  ShieldCheck,
  Truck,
} from '../components/Icons';
import SafeImage from '../components/SafeImage';
import VegBadge from '../components/VegBadge';
import { restaurant } from '../config';
import { useCart } from '../context/cart';
import { useMenu } from '../context/menu';
import { useToast } from '../context/toast';
import { api } from '../lib/api';
import { formatMoney, pluralize } from '../lib/format';
import { rememberOrder } from '../lib/orderMemory';
import { payForOrder } from '../lib/razorpay';
import usePublicConfig from '../lib/usePublicConfig';
import { validateCheckout } from '../lib/validation';

const EMPTY_FORM = { name: '', phone: '', address: '', notes: '' };

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function CheckoutPage() {
  const cart = useCart();
  const menu = useMenu();
  const navigate = useNavigate();
  const { push } = useToast();
  const { data: publicConfig, isLoading: configLoading, onlinePaymentEnabled, error: configError } =
    usePublicConfig();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [quoteStatus, setQuoteStatus] = useState('idle');
  const [quoteError, setQuoteError] = useState(null);
  const formRef = useRef(null);
  const idempotencyRef = useRef(null);

  if (!idempotencyRef.current) idempotencyRef.current = createIdempotencyKey();

  const quoteItems = useMemo(
    () => cart.lines.map((line) => ({ menuItemId: line.id, quantity: line.quantity })),
    [cart.lines],
  );

  useEffect(() => {
    if (quoteItems.length === 0) {
      setQuote(null);
      setQuoteStatus('idle');
      setQuoteError(null);
      return undefined;
    }

    const controller = new AbortController();
    setQuoteStatus('loading');
    setQuoteError(null);

    api
      .quoteOrder(quoteItems, { signal: controller.signal })
      .then((data) => {
        setQuote(data);
        setQuoteStatus('ready');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setQuote(null);
        setQuoteStatus('error');
        setQuoteError(error);
      });

    return () => controller.abort();
  }, [quoteItems]);

  useEffect(() => {
    if (!configLoading && !onlinePaymentEnabled && paymentMethod === 'razorpay') {
      setPaymentMethod('cod');
    }
  }, [configLoading, onlinePaymentEnabled, paymentMethod]);

  const totals = quote?.totals || {
    subtotalPaise: cart.subtotalPaise,
    deliveryFeePaise: cart.deliveryFeePaise,
    taxPaise: cart.taxPaise,
    totalPaise: cart.totalPaise,
  };
  const freeThreshold = publicConfig?.orderRules?.freeDeliveryThresholdPaise || cart.freeThresholdPaise;
  const amountToFree = Math.max(0, freeThreshold - totals.subtotalPaise);
  const freeDeliveryPercent =
    freeThreshold > 0 ? Math.min(100, Math.round((totals.subtotalPaise / freeThreshold) * 100)) : 0;
  const unavailable = cart.hasUnavailable || quoteError?.code === 'ITEMS_UNAVAILABLE';
  const priceCheckFailed = quoteStatus === 'error' && !unavailable;
  const isMenuLoading = menu.isLoading;

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    if (touched[field]) {
      const nextErrors = validateCheckout({ ...form, [field]: value });
      setErrors((current) => ({ ...current, [field]: nextErrors[field] }));
    }
  };

  const touchField = (field) => () => {
    setTouched((current) => ({ ...current, [field]: true }));
    const nextErrors = validateCheckout(form);
    setErrors((current) => ({ ...current, [field]: nextErrors[field] }));
  };

  const focusFirstError = () => {
    window.requestAnimationFrame(() => {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError(null);

    if (cart.lines.length === 0) {
      setServerError('Your cart is empty. Add a dish before checking out.');
      return;
    }
    if (unavailable) {
      setServerError('One or more dishes are unavailable. Please review your cart to continue.');
      cart.openCart();
      return;
    }

    const nextErrors = validateCheckout(form);
    setTouched({ name: true, phone: true, address: true, notes: true });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError();
      return;
    }

    setSubmitting(true);
    let placedOrder = null;

    try {
      const { order } = await api.createOrder(
        {
          items: quoteItems,
          customer: {
            name: form.name,
            phone: form.phone,
            address: form.address,
            notes: form.notes,
          },
          paymentMethod,
        },
        idempotencyRef.current,
      );

      placedOrder = order;
      rememberOrder(order);

      if (paymentMethod === 'cod') {
        cart.clearCart();
        push('Order placed. The kitchen is on it.');
        navigate(`/order/${order.orderNumber}`, { state: { order, justPlaced: true } });
        return;
      }

      const payment = await payForOrder(order);
      if (payment.status === 'success') {
        cart.clearCart();
        rememberOrder(payment.order);
        push('Payment received. Your order is confirmed.');
        navigate(`/order/${order.orderNumber}`, {
          state: { order: payment.order, justPlaced: true },
        });
        return;
      }

      cart.clearCart();
      const message =
        payment.status === 'dismissed'
          ? 'Your order is saved. Complete the payment whenever you are ready.'
          : payment.message || 'The payment did not go through. You can try again from your order page.';
      navigate(`/order/${order.orderNumber}`, {
        state: { order, justPlaced: true, paymentMessage: message },
      });
    } catch (error) {
      if (error.name === 'AbortError') return;

      if (placedOrder) {
        cart.clearCart();
        navigate(`/order/${placedOrder.orderNumber}`, {
          state: {
            order: placedOrder,
            justPlaced: true,
            paymentMessage: error.message || 'Online payment could not be completed.',
          },
        });
        return;
      }

      setServerError(error.message || 'We could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isMenuLoading) {
    return (
      <section className="container checkout-page section">
        <div className="checkout-loading" role="status">
          <span className="btn__spinner" aria-hidden="true" />
          Setting your table…
        </div>
      </section>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <section className="container section">
        <div className="empty-state checkout-empty">
          <span className="empty-state__icon" aria-hidden="true">
            <Banknote size={25} />
          </span>
          <p className="eyebrow eyebrow--plain">Checkout</p>
          <h1 className="display-sm mt-2">Your cart is empty.</h1>
          <p>Add a dish or two, then we&rsquo;ll get your table ready.</p>
          <Button as={Link} to="/menu" size="lg">
            Explore the menu
            <ArrowRight size={17} />
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container checkout-page section">
      <header className="checkout-head">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1 className="checkout-head__title">Almost at the table.</h1>
          <p className="lede">
            Tell us where to bring the feast. The kitchen will confirm your order before cooking begins.
          </p>
        </div>
        <ol className="checkout-steps" aria-label="Checkout progress">
          <li className="checkout-steps__item checkout-steps__item--complete">
            <span aria-hidden="true">
              <Check size={12} />
            </span>
            Menu
          </li>
          <li className="checkout-steps__item checkout-steps__item--current" aria-current="step">
            <span aria-hidden="true">2</span>
            Details
          </li>
          <li className="checkout-steps__item">
            <span aria-hidden="true">3</span>
            Confirmation
          </li>
        </ol>
      </header>

      <div className="checkout-grid">
        <form ref={formRef} className="checkout-form" onSubmit={handleSubmit} noValidate>
          {unavailable ? (
            <div className="notice notice--warning" role="status">
              <AlertCircle size={18} aria-hidden="true" />
              <div>
                <strong>A dish in your cart is no longer available.</strong>
                <p>{quoteError?.message || 'Please remove it from your cart before checking out.'}</p>
                <button type="button" className="text-button mt-1" onClick={cart.openCart}>
                  Review your cart
                </button>
              </div>
            </div>
          ) : null}

          {priceCheckFailed ? (
            <div className="notice notice--warning" role="status">
              <AlertCircle size={18} aria-hidden="true" />
              <div>
                <strong>We couldn&rsquo;t re-check prices with the kitchen.</strong>
                <p>You can still place the order; the kitchen will confirm the final total before cooking.</p>
              </div>
            </div>
          ) : null}

          <section className="checkout-card" aria-labelledby="checkout-delivery-heading">
            <header className="checkout-card__head">
              <span className="checkout-card__index" aria-hidden="true">
                01
              </span>
              <div>
                <h2 id="checkout-delivery-heading">Contact &amp; delivery</h2>
                <p>We&rsquo;ll only use these details for this order.</p>
              </div>
            </header>

            <div className="form-row">
              <div className="field">
                <label className="field__label" htmlFor="checkout-name">
                  Full name
                </label>
                <input
                  id="checkout-name"
                  className="input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={updateField('name')}
                  onBlur={touchField('name')}
                  autoComplete="name"
                  placeholder="Ananya Rao"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'checkout-name-error' : undefined}
                  disabled={submitting}
                />
                {errors.name ? (
                  <p className="field__error" id="checkout-name-error">
                    <AlertCircle size={13} aria-hidden="true" />
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="checkout-phone">
                  Mobile number
                </label>
                <input
                  id="checkout-phone"
                  className="input"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={updateField('phone')}
                  onBlur={touchField('phone')}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="98765 43210"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'checkout-phone-error' : 'checkout-phone-hint'}
                  disabled={submitting}
                />
                {errors.phone ? (
                  <p className="field__error" id="checkout-phone-error">
                    <AlertCircle size={13} aria-hidden="true" />
                    {errors.phone}
                  </p>
                ) : (
                  <p className="field__hint" id="checkout-phone-hint">
                    10 digits, starting 6–9. +91 is optional.
                  </p>
                )}
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="checkout-address">
                Delivery address
              </label>
              <textarea
                id="checkout-address"
                className="textarea"
                name="address"
                rows="3"
                value={form.address}
                onChange={updateField('address')}
                onBlur={touchField('address')}
                autoComplete="street-address"
                placeholder="Flat, building, street, area, Bengaluru, pincode"
                aria-invalid={Boolean(errors.address)}
                aria-describedby={errors.address ? 'checkout-address-error' : 'checkout-address-hint'}
                disabled={submitting}
              />
              {errors.address ? (
                <p className="field__error" id="checkout-address-error">
                  <AlertCircle size={13} aria-hidden="true" />
                  {errors.address}
                </p>
              ) : (
                <p className="field__hint" id="checkout-address-hint">
                  Include a flat or building number so the rider can find you.
                </p>
              )}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="checkout-notes">
                Kitchen notes <span>(optional)</span>
              </label>
              <textarea
                id="checkout-notes"
                className="textarea textarea--short"
                name="notes"
                rows="2"
                maxLength="300"
                value={form.notes}
                onChange={updateField('notes')}
                onBlur={touchField('notes')}
                placeholder="Allergies, spice level, or a note for the rider."
                aria-invalid={Boolean(errors.notes)}
                aria-describedby={errors.notes ? 'checkout-notes-error' : 'checkout-notes-hint'}
                disabled={submitting}
              />
              {errors.notes ? (
                <p className="field__error" id="checkout-notes-error">
                  <AlertCircle size={13} aria-hidden="true" />
                  {errors.notes}
                </p>
              ) : (
                <p className="field__hint" id="checkout-notes-hint">
                  Our kitchen handles nuts, dairy and gluten — tell us about allergies.
                </p>
              )}
            </div>
          </section>

          <section className="checkout-card" aria-labelledby="checkout-payment-heading">
            <header className="checkout-card__head">
              <span className="checkout-card__index" aria-hidden="true">
                02
              </span>
              <div>
                <h2 id="checkout-payment-heading">Payment</h2>
                <p>Choose how you&rsquo;d like to settle the bill.</p>
              </div>
            </header>

            <fieldset className="payment-options">
              <legend className="sr-only">Payment method</legend>

              <label
                className={`payment-option${paymentMethod === 'cod' ? ' payment-option--active' : ''}`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  disabled={submitting}
                />
                <span className="payment-option__icon" aria-hidden="true">
                  <Banknote size={20} />
                </span>
                <span className="payment-option__copy">
                  <strong>Cash on delivery</strong>
                  <span>Pay the rider when your food arrives.</span>
                </span>
                <span className="payment-option__check" aria-hidden="true">
                  <span />
                </span>
              </label>

              <label
                className={`payment-option${paymentMethod === 'razorpay' ? ' payment-option--active' : ''}${
                  !onlinePaymentEnabled ? ' payment-option--disabled' : ''
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  disabled={submitting || configLoading || !onlinePaymentEnabled}
                />
                <span className="payment-option__icon" aria-hidden="true">
                  <CreditCard size={20} />
                </span>
                <span className="payment-option__copy">
                  <span className="payment-option__title">
                    <strong>Pay online</strong>
                    {onlinePaymentEnabled ? <Badge tone="saffron">Test mode</Badge> : null}
                  </span>
                  <span>
                    {onlinePaymentEnabled
                      ? 'UPI, cards and netbanking through Razorpay.'
                      : configLoading
                        ? 'Checking online payment availability…'
                        : 'Online payment is not configured. Cash on delivery is available.'}
                  </span>
                </span>
                <span className="payment-option__check" aria-hidden="true">
                  <span />
                </span>
              </label>
            </fieldset>

            {configError ? (
              <p className="checkout-payment__note">
                Payment options could not be fully checked, but cash on delivery is still available.
              </p>
            ) : null}

            <div className="checkout-secure">
              <ShieldCheck size={17} aria-hidden="true" />
              <p>
                {onlinePaymentEnabled
                  ? 'Payments are handled by Razorpay in test mode. Card details never touch this site.'
                  : 'Cash is collected at the door. No card details are collected on this site.'}
              </p>
            </div>
          </section>

          {serverError ? (
            <div className="notice notice--danger checkout-error" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          ) : null}

          <div className="checkout-actions">
            <Button
              type="submit"
              size="lg"
              className="btn--block"
              loading={submitting}
              disabled={unavailable}
            >
              {paymentMethod === 'razorpay' ? `Pay ${formatMoney(totals.totalPaise)}` : 'Place order'}
              {paymentMethod === 'razorpay' ? <ShieldCheck size={17} /> : <ArrowRight size={17} />}
            </Button>
            <p className="checkout-actions__note">
              {paymentMethod === 'razorpay'
                ? 'You’ll be taken to Razorpay’s secure test checkout.'
                : 'The kitchen confirms your order before cooking begins.'}
            </p>
            <Link className="checkout-back" to="/menu">
              <ArrowLeft size={15} />
              Keep browsing the menu
            </Link>
          </div>
        </form>

        <aside className="checkout-summary" aria-label="Order summary">
          <div className="checkout-summary__card">
            <header className="checkout-summary__head">
              <h2>Your order</h2>
              <span>{pluralize(cart.count, 'item')}</span>
            </header>

            <ul className="checkout-summary__items">
              {cart.lines.map((line) => (
                <li key={line.id} className="checkout-summary__item">
                  <div className="checkout-summary__image">
                    <SafeImage src={line.image} alt="" width="56" height="56" decoding="async" />
                    <span aria-hidden="true">{line.quantity}</span>
                  </div>
                  <div className="checkout-summary__item-copy">
                    <VegBadge isVeg={line.isVeg} />
                    <strong>{line.name}</strong>
                    <span>{formatMoney(line.pricePaise)} each</span>
                  </div>
                  <span className="checkout-summary__line-total">
                    {formatMoney(line.pricePaise * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className={`checkout-summary__delivery${amountToFree === 0 ? ' is-unlocked' : ''}`}>
              <div>
                {amountToFree === 0 ? (
                  <>
                    <Check size={15} aria-hidden="true" />
                    <span>Free delivery unlocked</span>
                  </>
                ) : (
                  <>
                    <Truck size={16} aria-hidden="true" />
                    <span>
                      Add <strong>{formatMoney(amountToFree)}</strong> for free delivery
                    </span>
                  </>
                )}
              </div>
              <div
                className="checkout-summary__progress"
                role="progressbar"
                aria-label="Progress toward free delivery"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={freeDeliveryPercent}
              >
                <span style={{ width: `${freeDeliveryPercent}%` }} />
              </div>
            </div>

            <dl className="cart-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatMoney(totals.subtotalPaise)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>
                  {totals.deliveryFeePaise === 0
                    ? 'Complimentary'
                    : formatMoney(totals.deliveryFeePaise)}
                </dd>
              </div>
              <div>
                <dt>GST (5%)</dt>
                <dd>{formatMoney(totals.taxPaise)}</dd>
              </div>
            </dl>

            <div className="checkout-summary__total">
              <span>Total</span>
              <strong>{formatMoney(totals.totalPaise)}</strong>
            </div>

            <p className="checkout-summary__note">
              Inclusive of 5% GST. Prices are confirmed by the kitchen before cooking.
            </p>

            <p className="checkout-summary__price-status" aria-live="polite">
              {quoteStatus === 'loading' ? 'Checking prices with the kitchen…' : null}
              {quoteStatus === 'ready' ? 'Prices confirmed by the kitchen.' : null}
              {priceCheckFailed ? 'Showing cart estimate — prices will be confirmed.' : null}
            </p>

            <div className="checkout-summary__help">
              <span>Need a hand?</span>
              <a href={`tel:${restaurant.phoneHref}`}>{restaurant.phone}</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
