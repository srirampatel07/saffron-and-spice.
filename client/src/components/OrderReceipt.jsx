import { formatMoney, formatPhone } from '../lib/format';
import SafeImage from './SafeImage';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_META } from '../lib/orderStatus';

export default function OrderReceipt({ order }) {
  return (
    <div className="order-receipt">
      <ul className="order-receipt__items">
        {order.items.map((item) => (
          <li key={`${item.menuItemId}-${item.name}`} className="order-receipt__item">
            <SafeImage src={item.image} alt="" width="56" height="56" loading="lazy" decoding="async" />
            <div>
              <strong>{item.name}</strong>
              <span>
                {item.quantity} × {formatMoney(item.pricePaise)}
              </span>
            </div>
            <span className="order-receipt__line-total">{formatMoney(item.lineTotalPaise)}</span>
          </li>
        ))}
      </ul>

      <dl className="cart-totals order-receipt__totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatMoney(order.totals.subtotalPaise)}</dd>
        </div>
        <div>
          <dt>Delivery</dt>
          <dd>
            {order.totals.deliveryFeePaise === 0
              ? 'Complimentary'
              : formatMoney(order.totals.deliveryFeePaise)}
          </dd>
        </div>
        <div>
          <dt>GST (5%)</dt>
          <dd>{formatMoney(order.totals.taxPaise)}</dd>
        </div>
        <div className="order-receipt__grand-total">
          <dt>Total</dt>
          <dd>{formatMoney(order.totals.totalPaise)}</dd>
        </div>
      </dl>

      <div className="order-receipt__details">
        <div>
          <h3>Delivery</h3>
          <p>
            {order.customer.name}
            <br />
            {order.customer.address}
            <br />
            <a href={`tel:+91${order.customer.phone}`}>{formatPhone(order.customer.phone)}</a>
          </p>
        </div>
        <div>
          <h3>Payment</h3>
          <p>
            {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
            <br />
            {PAYMENT_STATUS_META[order.paymentStatus]?.label || order.paymentStatus}
          </p>
        </div>
      </div>

      {order.customer.notes ? (
        <div className="order-receipt__notes">
          <h3>Kitchen notes</h3>
          <p>{order.customer.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
