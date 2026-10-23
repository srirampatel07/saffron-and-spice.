import { Link } from 'react-router-dom';
import { useCart } from '../context/cart';
import { formatMoney, pluralize } from '../lib/format';
import Badge from './Badge';
import Button from './Button';
import Drawer from './Drawer';
import { ArrowRight, Check, Trash, Truck } from './Icons';
import QuantityControl from './QuantityControl';
import SafeImage from './SafeImage';
import VegBadge from './VegBadge';

export default function CartDrawer() {
  const cart = useCart();
  const freeDeliveryPercent =
    cart.freeThresholdPaise > 0
      ? Math.min(100, Math.round((cart.subtotalPaise / cart.freeThresholdPaise) * 100))
      : 0;

  return (
    <Drawer
      open={cart.isOpen}
      onClose={cart.closeCart}
      title="Your order"
      footer={
        cart.lines.length > 0 ? (
          <div className="cart-footer">
            <div className="cart-footer__row">
              <span>Total</span>
              <strong>{formatMoney(cart.totalPaise)}</strong>
            </div>
            <p className="cart-footer__note">Inclusive of 5% GST. Final amount is confirmed by the kitchen.</p>
            <Button
              as={Link}
              to="/checkout"
              onClick={cart.closeCart}
              size="lg"
              className="btn--block"
              aria-disabled={cart.hasUnavailable || undefined}
              onClickCapture={(event) => {
                if (cart.hasUnavailable) event.preventDefault();
              }}
            >
              Proceed to checkout
              <ArrowRight size={17} />
            </Button>
            <button type="button" className="cart-footer__continue" onClick={cart.closeCart}>
              Continue browsing
            </button>
          </div>
        ) : null
      }
    >
      {cart.lines.length === 0 ? (
        <div className="cart-empty">
          <span className="cart-empty__icon" aria-hidden="true">
            <Truck size={26} />
          </span>
          <h3>Your table is waiting.</h3>
          <p>Add a dish or two and we&rsquo;ll get the tandoor going.</p>
          <Button as={Link} to="/menu" onClick={cart.closeCart}>
            Explore the menu
          </Button>
        </div>
      ) : (
        <div className="cart">
          <div className="cart__topline">
            <span>{pluralize(cart.count, 'item')}</span>
            <button type="button" className="cart__clear" onClick={cart.clearCart}>
              Clear
            </button>
          </div>

          <div className={`cart__delivery${cart.deliveryFeePaise === 0 ? ' cart__delivery--unlocked' : ''}`}>
            <div className="cart__delivery-copy">
              {cart.deliveryFeePaise === 0 ? (
                <>
                  <Check size={15} aria-hidden="true" />
                  <span>Free delivery unlocked</span>
                </>
              ) : (
                <>
                  <Truck size={16} aria-hidden="true" />
                  <span>
                    Add <strong>{formatMoney(cart.amountToFreeDeliveryPaise)}</strong> more for free delivery
                  </span>
                </>
              )}
            </div>
            <div
              className="cart__progress"
              role="progressbar"
              aria-label="Progress toward free delivery"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={freeDeliveryPercent}
            >
              <span style={{ width: `${freeDeliveryPercent}%` }} />
            </div>
          </div>

          {cart.hasUnavailable ? (
            <div className="notice notice--warning cart__notice" role="status">
              One or more dishes are no longer available. Remove them to continue.
            </div>
          ) : null}

          <ul className="cart__lines">
            {cart.lines.map((line) => (
              <li key={line.id} className={`cart-line${!line.isAvailable ? ' cart-line--soldout' : ''}`}>
                <SafeImage
                  className="cart-line__image"
                  src={line.image}
                  alt=""
                  width="78"
                  height="78"
                  decoding="async"
                />
                <div className="cart-line__content">
                  <div className="cart-line__heading">
                    <div>
                      <div className="cart-line__meta">
                        <VegBadge isVeg={line.isVeg} />
                        {!line.isAvailable ? <Badge tone="danger">Sold out</Badge> : null}
                      </div>
                      <h3 className="cart-line__name">{line.name}</h3>
                    </div>
                    <button
                      type="button"
                      className="cart-line__remove"
                      onClick={() => cart.removeItem(line.id)}
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                  <div className="cart-line__footer">
                    <QuantityControl
                      value={line.quantity}
                      onDecrease={() => cart.updateQuantity(line.id, line.quantity - 1)}
                      onIncrease={() => cart.updateQuantity(line.id, line.quantity + 1)}
                      max={cart.maxQuantity}
                      size="sm"
                      label={`Quantity for ${line.name}`}
                    />
                    <span className="cart-line__price">{formatMoney(line.pricePaise * line.quantity)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <dl className="cart-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMoney(cart.subtotalPaise)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{cart.deliveryFeePaise === 0 ? 'Complimentary' : formatMoney(cart.deliveryFeePaise)}</dd>
            </div>
            <div>
              <dt>GST (5%)</dt>
              <dd>{formatMoney(cart.taxPaise)}</dd>
            </div>
          </dl>
        </div>
      )}
    </Drawer>
  );
}
