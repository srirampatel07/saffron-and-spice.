import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { ArrowRight, CheckCircle, Clock, CreditCard, MapPin, Phone } from '../components/Icons';
import OrderReceipt from '../components/OrderReceipt';
import OrderTimeline from '../components/OrderTimeline';
import { restaurant } from '../config';
import { useToast } from '../context/toast';
import { api } from '../lib/api';
import { formatDateTime, formatMoney, formatPhone } from '../lib/format';
import { rememberOrder, readRememberedOrder } from '../lib/orderMemory';
import { PAYMENT_STATUS_META, paymentIsPending } from '../lib/orderStatus';
import { payForOrder } from '../lib/razorpay';

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const { push } = useToast();
  const routedOrder =
    location.state?.order?.orderNumber === orderNumber ? location.state.order : null;
  const [order, setOrder] = useState(routedOrder);
  const [paymentMessage, setPaymentMessage] = useState(location.state?.paymentMessage || null);
  const [loading, setLoading] = useState(!routedOrder);
  const [lookupError, setLookupError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    if (order) return undefined;

    const remembered = readRememberedOrder();
    if (!remembered || remembered.orderNumber !== orderNumber || !remembered.phone) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    api
      .lookupOrder(
        { orderNumber, phone: remembered.phone },
        { signal: controller.signal },
      )
      .then(({ order: found }) => {
        setOrder(found);
        setPaymentMessage(null);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setLookupError(error.message || 'We could not load this order.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [order, orderNumber]);

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    setPayError(null);
    try {
      const result = await payForOrder(order);
      if (result.status === 'success') {
        setOrder(result.order);
        setPaymentMessage(null);
        rememberOrder(result.order);
        push('Payment received. Your order is confirmed.');
      } else if (result.status === 'failed') {
        setPayError(result.message || 'The payment did not go through. Please try again.');
      } else {
        setPaymentMessage('Payment window closed. Your order is saved — you can pay whenever you are ready.');
      }
    } catch (error) {
      setPayError(error.message || 'We could not start the payment. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <section className="container order-page section">
        <div className="checkout-loading" role="status">
          <span className="btn__spinner" aria-hidden="true" />
          Finding your order…
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="container section">
        <div className="empty-state order-empty">
          <span className="empty-state__icon" aria-hidden="true">
            <Clock size={25} />
          </span>
          <p className="eyebrow eyebrow--plain">Order details</p>
          <h1 className="display-sm mt-2">This order isn&rsquo;t in this session.</h1>
          <p>
            {lookupError ||
              'For your privacy, order details need the phone number used at checkout. You can look it up on the tracking page.'}
          </p>
          <div className="order-empty__actions">
            <Button as={Link} to={`/track?order=${encodeURIComponent(orderNumber || '')}`}>
              Track this order
              <ArrowRight size={16} />
            </Button>
            <Button as={Link} to="/menu" variant="secondary">
              Back to menu
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const paymentMeta = PAYMENT_STATUS_META[order.paymentStatus] || PAYMENT_STATUS_META.unpaid;
  const isCancelled = order.status === 'cancelled';
  const paymentPending = !isCancelled && paymentIsPending(order);
  const firstName = order.customer.name.split(' ')[0];
  const heading = isCancelled
    ? 'This order was cancelled.'
    : paymentPending
      ? 'One last step.'
      : order.status === 'delivered'
        ? 'Delivered with care.'
        : order.status === 'out_for_delivery'
          ? 'On its way to you.'
          : order.status === 'preparing'
            ? 'In the tandoor.'
            : order.status === 'confirmed'
              ? 'The kitchen has it.'
              : 'Order received.';
  const copy = isCancelled
    ? 'If this wasn’t expected, call us and the kitchen will help straight away.'
    : paymentPending
      ? 'Your order is saved, but the payment is still pending. Complete it to send the order to the kitchen.'
      : order.status === 'delivered'
        ? `Thank you, ${firstName}. We hope every bite was worth the wait.`
        : order.status === 'out_for_delivery'
          ? `Thank you, ${firstName}. Your order has left the pass and is on its way. Please keep your phone nearby.`
          : order.status === 'preparing'
            ? `Thank you, ${firstName}. The tandoors are lit and your dishes are being cooked fresh.`
            : order.status === 'confirmed'
              ? `Thank you, ${firstName}. The kitchen has accepted your order and is getting ready to cook.`
              : order.paymentMethod === 'cod'
                ? `Thank you, ${firstName}. We have your order — have the cash ready at the door.`
                : `Thank you, ${firstName}. We have your order and are confirming it with the kitchen.`;

  return (
    <section className="container order-page order-confirmation section">
      <div className="confirmation-hero">
        <span
          className={`confirmation-hero__mark${
            paymentPending ? ' confirmation-hero__mark--pending' : ''
          }`}
          aria-hidden="true"
        >
          {paymentPending ? <CreditCard size={26} /> : <CheckCircle size={30} />}
        </span>
        <p className="eyebrow eyebrow--plain">Order {order.orderNumber}</p>
        <h1 className="confirmation-hero__title">{heading}</h1>
        <p className="lede">{copy}</p>
        <div className="confirmation-hero__meta">
          <Badge tone={PAYMENT_STATUS_META[order.paymentStatus]?.tone || 'saffron'}>{paymentMeta.label}</Badge>
          <span>Placed {formatDateTime(order.createdAt)}</span>
        </div>
      </div>

      {paymentPending ? (
        <div className="notice notice--warning confirmation-payment" role="status">
          <CreditCard size={19} aria-hidden="true" />
          <div>
            <strong>Payment pending</strong>
            <p>
              {paymentMessage ||
                'Complete the payment to confirm your order. If money was already deducted, wait a moment and refresh this page.'}
            </p>
            {payError ? <p className="confirmation-payment__error">{payError}</p> : null}
            <Button onClick={handlePay} loading={paying} className="mt-2">
              Pay {formatMoney(order.totals.totalPaise)}
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="confirmation-grid">
        <div className="confirmation-main">
          <section className="confirmation-card" aria-labelledby="confirmation-progress-heading">
            <div className="confirmation-card__head">
              <div>
                <p className="eyebrow">Order progress</p>
                <h2 id="confirmation-progress-heading">
                  {order.status === 'delivered' ? 'Delivered with care.' : 'From our kitchen to you.'}
                </h2>
              </div>
              <span className="confirmation-card__stamp">Updated {formatDateTime(order.updatedAt)}</span>
            </div>
            <OrderTimeline order={order} />
            {!isCancelled ? (
              <div className="confirmation-eta">
                <Clock size={17} aria-hidden="true" />
                <p>
                  <strong>Most orders arrive in 35–45 minutes.</strong>
                  <span>The kitchen updates this page as your order moves along.</span>
                </p>
              </div>
            ) : null}
          </section>

          <section className="confirmation-card" aria-labelledby="confirmation-receipt-heading">
            <div className="confirmation-card__head">
              <div>
                <p className="eyebrow">Receipt</p>
                <h2 id="confirmation-receipt-heading">What&rsquo;s coming.</h2>
              </div>
            </div>
            <OrderReceipt order={order} />
          </section>
        </div>

        <aside className="confirmation-side">
          <section className="confirmation-card confirmation-card--warm" aria-labelledby="confirmation-delivery-heading">
            <h2 id="confirmation-delivery-heading">Coming to</h2>
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
            {order.customer.notes ? (
              <div className="confirmation-note">
                <span>Kitchen notes</span>
                <p>{order.customer.notes}</p>
              </div>
            ) : null}
          </section>

          <div className="confirmation-actions">
            <Button as={Link} to={`/track?order=${encodeURIComponent(order.orderNumber)}`} size="lg" className="btn--block">
              Track your order
              <ArrowRight size={17} />
            </Button>
            <Button as={Link} to="/menu" variant="secondary" className="btn--block">
              Back to the menu
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
    </section>
  );
}
