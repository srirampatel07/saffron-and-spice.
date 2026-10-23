import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../components/Badge';
import Button from '../components/Button';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Truck,
} from '../components/Icons';
import OrderReceipt from '../components/OrderReceipt';
import OrderTimeline from '../components/OrderTimeline';
import SafeImage from '../components/SafeImage';
import { restaurant } from '../config';
import { useToast } from '../context/toast';
import { api } from '../lib/api';
import { formatDateTime, formatMoney, formatPhone, pluralize } from '../lib/format';
import { readRememberedOrder, rememberOrder } from '../lib/orderMemory';
import {
  ORDER_STATUS_META,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
  paymentIsPending,
} from '../lib/orderStatus';
import { payForOrder } from '../lib/razorpay';
import { normalizeIndianPhone } from '../lib/validation';

const ORDER_NUMBER_HINT = 'SS-261022-C7BD1F';

function validateLookup(values) {
  const errors = {};
  const orderNumber = String(values.orderNumber || '').trim();

  if (!/^SS-\d{6}-[A-F0-9]{6}$/i.test(orderNumber)) {
    errors.orderNumber = 'Enter the order number from your confirmation, like SS-261022-C7BD1F.';
  }
  if (!normalizeIndianPhone(values.phone)) {
    errors.phone = 'Enter the 10-digit mobile number used at checkout.';
  }
  return errors;
}

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const { push } = useToast();
  const remembered = useRef(readRememberedOrder());
  const queryOrder = String(searchParams.get('order') || '').trim().toUpperCase();
  const memory = remembered.current;
  const initialOrderNumber = queryOrder || memory?.orderNumber || '';
  const initialPhone =
    memory && (!queryOrder || memory.orderNumber === queryOrder) ? memory.phone || '' : '';

  const [form, setForm] = useState({ orderNumber: initialOrderNumber, phone: initialPhone });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const formRef = useRef(null);

  const performLookup = useCallback(async (values, { signal } = {}) => {
    const orderNumber = String(values.orderNumber || '').trim().toUpperCase();
    const phone = normalizeIndianPhone(values.phone) || String(values.phone || '').trim();
    setStatus('loading');
    setError(null);
    setOrder(null);
    setPayError(null);

    try {
      const { order: found } = await api.lookupOrder({ orderNumber, phone }, { signal });
      setOrder(found);
      setStatus('ready');
      rememberOrder(found);
      return found;
    } catch (lookupError) {
      if (lookupError.name === 'AbortError') return null;
      setStatus('error');
      setError(lookupError);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!initialOrderNumber || !initialPhone) return undefined;
    if (Object.keys(validateLookup({ orderNumber: initialOrderNumber, phone: initialPhone })).length) {
      return undefined;
    }
    const controller = new AbortController();
    performLookup({ orderNumber: initialOrderNumber, phone: initialPhone }, { signal: controller.signal });
    return () => controller.abort();
  }, [initialOrderNumber, initialPhone, performLookup]);

  const refreshOrder = useCallback(async () => {
    if (!order) return;
    setRefreshing(true);
    try {
      const { order: found } = await api.lookupOrder({
        orderNumber: order.orderNumber,
        phone: order.customer.phone,
      });
      setOrder(found);
      rememberOrder(found);
    } catch {
      // A quiet refresh should never replace a valid order with an error screen.
    } finally {
      setRefreshing(false);
    }
  }, [order]);

  useEffect(() => {
    if (!order || order.status === 'delivered' || order.status === 'cancelled') return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !paying) refreshOrder();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [order, paying, refreshOrder]);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      const nextErrors = validateLookup({ ...form, [field]: value });
      setErrors((current) => ({ ...current, [field]: nextErrors[field] }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateLookup(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.requestAnimationFrame(() => {
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    setForm((current) => ({ ...current, orderNumber: current.orderNumber.trim().toUpperCase() }));
    performLookup(form);
  };

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    setPayError(null);
    try {
      const result = await payForOrder(order);
      if (result.status === 'success') {
        setOrder(result.order);
        rememberOrder(result.order);
        push('Payment received. Your order is confirmed.');
      } else if (result.status === 'failed') {
        setPayError(result.message || 'The payment did not go through. Please try again.');
      } else {
        setPayError('Payment window closed. You can pay whenever you are ready.');
      }
    } catch (payFailure) {
      setPayError(payFailure.message || 'We could not start the payment. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const statusMeta = order ? ORDER_STATUS_META[order.status] : null;
  const paymentPending = order ? order.status !== 'cancelled' && paymentIsPending(order) : false;

  return (
    <div className="track-page">
      <header className="track-hero">
        <div className="container track-hero__inner">
          <div className="track-hero__copy">
            <p className="eyebrow eyebrow--plain">Order tracking</p>
            <h1 className="track-hero__title">Follow your feast.</h1>
            <p className="lede">
              From the tandoor to your door. Enter your order number and the phone number you used at
              checkout to see where things stand.
            </p>
            <ul className="track-hero__notes">
              <li>
                <Clock size={15} aria-hidden="true" />
                Live kitchen updates
              </li>
              <li>
                <Truck size={15} aria-hidden="true" />
                Rider progress
              </li>
              <li>
                <Phone size={15} aria-hidden="true" />
                Private to your number
              </li>
            </ul>
          </div>
          <div className="track-hero__art" aria-hidden="true">
            <div className="track-hero__ring" />
            <SafeImage
              src="/images/story-spice.webp"
              alt=""
              width="900"
              height="1100"
              loading="lazy"
              decoding="async"
            />
            <span className="track-hero__stamp">Cooked fresh · Sent warm</span>
          </div>
        </div>
      </header>

      <div className="container track-body">
        <form ref={formRef} className="track-form" onSubmit={handleSubmit} noValidate>
          <div className="track-form__head">
            <span className="track-form__icon" aria-hidden="true">
              <Search size={20} />
            </span>
            <div>
              <h2>Find your order</h2>
              <p>Both details must match the order for your privacy.</p>
            </div>
          </div>

          <div className="track-form__fields">
            <div className="field">
              <label className="field__label" htmlFor="track-order-number">
                Order number
              </label>
              <input
                id="track-order-number"
                className="input"
                type="text"
                name="orderNumber"
                value={form.orderNumber}
                onChange={updateField('orderNumber')}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck="false"
                placeholder={ORDER_NUMBER_HINT}
                aria-invalid={Boolean(errors.orderNumber)}
                aria-describedby={errors.orderNumber ? 'track-order-error' : 'track-order-hint'}
                disabled={status === 'loading'}
              />
              {errors.orderNumber ? (
                <p className="field__error" id="track-order-error">
                  <AlertCircle size={13} aria-hidden="true" />
                  {errors.orderNumber}
                </p>
              ) : (
                <p className="field__hint" id="track-order-hint">
                  You&rsquo;ll find it on your confirmation and receipt.
                </p>
              )}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="track-phone">
                Mobile number
              </label>
              <input
                id="track-phone"
                className="input"
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={updateField('phone')}
                placeholder="98765 43210"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'track-phone-error' : 'track-phone-hint'}
                disabled={status === 'loading'}
              />
              {errors.phone ? (
                <p className="field__error" id="track-phone-error">
                  <AlertCircle size={13} aria-hidden="true" />
                  {errors.phone}
                </p>
              ) : (
                <p className="field__hint" id="track-phone-hint">
                  10 digits, starting 6–9. +91 is optional.
                </p>
              )}
            </div>
          </div>

          <div className="track-form__actions">
            <Button type="submit" size="lg" loading={status === 'loading'}>
              {status === 'loading' ? 'Finding your order' : 'Track my order'}
              {status !== 'loading' ? <ArrowRight size={17} /> : null}
            </Button>
            <p>We never show order details without both details.</p>
          </div>
        </form>

        {status === 'error' && error ? (
          <div className="notice notice--danger track-error" role="alert">
            <AlertCircle size={19} aria-hidden="true" />
            <div>
              <strong>We couldn&rsquo;t find that order.</strong>
              <p>{error.message}</p>
              {error.code === 'ORDER_NOT_FOUND' ? (
                <p>
                  Check for a typo in the order number, or call the kitchen on{' '}
                  <a href={`tel:${restaurant.phoneHref}`}>{restaurant.phone}</a>.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {status === 'loading' ? (
          <div className="track-loading" role="status">
            <span className="btn__spinner" aria-hidden="true" />
            Checking with the kitchen…
          </div>
        ) : null}

        {order ? (
          <div className="track-result" aria-live="polite">
            <div className="track-result__head">
              <div>
                <p className="eyebrow">Live order</p>
                <h2>Order {order.orderNumber}</h2>
                <p className="track-result__placed">Placed {formatDateTime(order.createdAt)}</p>
              </div>
              <div className="track-result__actions">
                <Badge tone={statusMeta?.tone || 'saffron'}>{statusMeta?.label || order.status}</Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={refreshOrder}
                  loading={refreshing}
                  aria-label="Refresh order status"
                >
                  <RefreshCw size={15} />
                  Refresh
                </Button>
              </div>
            </div>

            <div className={`track-status track-status--${order.status}`}>
              <span className="track-status__mark" aria-hidden="true">
                {order.status === 'delivered' ? <CheckCircle size={22} /> : <Clock size={20} />}
              </span>
              <div>
                <strong>{statusMeta?.description}</strong>
                <span>Last updated {formatDateTime(order.updatedAt)}</span>
              </div>
            </div>

            {paymentPending ? (
              <div className="notice notice--warning track-payment" role="status">
                <CreditCard size={19} aria-hidden="true" />
                <div>
                  <strong>Payment is still pending.</strong>
                  <p>
                    Your order is saved. Complete the online payment to send it to the kitchen, or call
                    us if you need to switch to cash.
                  </p>
                  {payError ? <p className="track-payment__error">{payError}</p> : null}
                  <Button onClick={handlePay} loading={paying} className="mt-2">
                    Pay {formatMoney(order.totals.totalPaise)}
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="confirmation-grid">
              <div className="confirmation-main">
                <section className="confirmation-card" aria-labelledby="track-progress-heading">
                  <div className="confirmation-card__head">
                    <div>
                      <p className="eyebrow">Order progress</p>
                      <h2 id="track-progress-heading">
                        {order.status === 'delivered'
                          ? 'Delivered with care.'
                          : 'From our kitchen to you.'}
                      </h2>
                    </div>
                  </div>
                  <OrderTimeline order={order} />
                  {order.status !== 'cancelled' ? (
                    <div className="confirmation-eta">
                      <Clock size={17} aria-hidden="true" />
                      <p>
                        <strong>Most orders arrive in 35–45 minutes.</strong>
                        <span>This page refreshes automatically as the kitchen updates your order.</span>
                      </p>
                    </div>
                  ) : null}
                </section>

                <section className="confirmation-card" aria-labelledby="track-receipt-heading">
                  <div className="confirmation-card__head">
                    <div>
                      <p className="eyebrow">Receipt</p>
                      <h2 id="track-receipt-heading">What&rsquo;s coming.</h2>
                    </div>
                  </div>
                  <OrderReceipt order={order} />
                </section>
              </div>

              <aside className="confirmation-side">
                <section
                  className="confirmation-card confirmation-card--warm"
                  aria-labelledby="track-delivery-heading"
                >
                  <h2 id="track-delivery-heading">Coming to</h2>
                  <div className="confirmation-detail">
                    <MapPin size={18} aria-hidden="true" />
                    <p>
                      <strong>{order.customer.name}</strong>
                      <span>{order.customer.address}</span>
                    </p>
                  </div>
                  <div className="confirmation-detail">
                    <Phone size={18} aria-hidden="true" />
                    <p>
                      <strong>{formatPhone(order.customer.phone)}</strong>
                      <span>We&rsquo;ll call if the rider needs directions.</span>
                    </p>
                  </div>
                  <div className="confirmation-summary">
                    <div>
                      <span>Payment</span>
                      <strong>{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <Badge tone={PAYMENT_STATUS_META[order.paymentStatus]?.tone || 'saffron'}>
                        {PAYMENT_STATUS_META[order.paymentStatus]?.label || order.paymentStatus}
                      </Badge>
                    </div>
                    <div>
                      <span>{pluralize(order.items.length, 'dish', 'dishes')}</span>
                      <strong>{formatMoney(order.totals.totalPaise)}</strong>
                    </div>
                  </div>
                  {order.customer.notes ? (
                    <div className="confirmation-note">
                      <span>Kitchen notes</span>
                      <p>{order.customer.notes}</p>
                    </div>
                  ) : null}
                </section>

                <div className="confirmation-actions">
                  <Button as={Link} to="/menu" variant="secondary" className="btn--block">
                    Order something else
                  </Button>
                </div>

                <div className="confirmation-help">
                  <Phone size={17} aria-hidden="true" />
                  <p>
                    Need to change something? Call the kitchen.
                    <a href={`tel:${restaurant.phoneHref}`}> {restaurant.phone}</a>
                  </p>
                </div>
              </aside>
            </div>
          </div>
        ) : null}

        {!order && status !== 'loading' ? (
          <div className="track-help">
            <div className="track-help__card">
              <span aria-hidden="true">
                <Search size={20} />
              </span>
              <h3>Where&rsquo;s my order number?</h3>
              <p>
                It starts with <strong>SS-</strong> and appears on your confirmation screen and receipt —
                for example {ORDER_NUMBER_HINT}.
              </p>
            </div>
            <div className="track-help__card">
              <span aria-hidden="true">
                <Phone size={20} />
              </span>
              <h3>Using a different phone?</h3>
              <p>
                For privacy, tracking needs the same number used at checkout. If you can&rsquo;t access it,
                call us on{' '}
                <a href={`tel:${restaurant.phoneHref}`}>{restaurant.phone}</a>.
              </p>
            </div>
            <div className="track-help__card">
              <span aria-hidden="true">
                <Clock size={20} />
              </span>
              <h3>Kitchen hours</h3>
              <p>
                {restaurant.hours[0].time} and {restaurant.hours[1].time}, Tuesday to Sunday.{' '}
                {restaurant.closedNote}.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
