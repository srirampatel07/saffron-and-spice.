import { useCart } from '../context/cart';
import { useToast } from '../context/toast';
import { formatMoney } from '../lib/format';
import Badge from './Badge';
import Button from './Button';
import { Flame, Plus } from './Icons';
import QuantityControl from './QuantityControl';
import SafeImage from './SafeImage';
import VegBadge from './VegBadge';

const SPICE_LABELS = ['', 'Mild', 'Medium', 'Fiery'];

export default function DishCard({ dish, compact = false }) {
  const cart = useCart();
  const { push } = useToast();
  const line = cart.lines.find((entry) => entry.id === dish.id);
  const quantity = line?.quantity || 0;

  const handleAdd = () => {
    if (!dish.isAvailable) return;
    const added = cart.addItem(dish);
    if (added) push(`${dish.name} added to your order.`);
  };

  const increase = () => {
    if (quantity >= cart.maxQuantity) {
      push(`You can add up to ${cart.maxQuantity} of one dish.`, { tone: 'error' });
      return;
    }
    cart.updateQuantity(dish.id, quantity + 1);
  };

  const decrease = () => {
    if (quantity <= 1) return;
    cart.updateQuantity(dish.id, quantity - 1);
  };

  return (
    <article className={`dish-card${compact ? ' dish-card--compact' : ''}${!dish.isAvailable ? ' dish-card--soldout' : ''}`}>
      <div className="dish-card__media">
        <SafeImage
          src={dish.image}
          alt={dish.name}
          width="800"
          height="600"
          loading="lazy"
          decoding="async"
        />
        <div className="dish-card__badges">
          {!dish.isAvailable ? (
            <Badge tone="maroon">Sold out</Badge>
          ) : dish.isFeatured ? (
            <Badge tone="saffron">Chef&rsquo;s pick</Badge>
          ) : null}
        </div>
      </div>
      <div className="dish-card__body">
        <div className="dish-card__meta">
          <VegBadge isVeg={dish.isVeg} />
          <span className="dish-card__separator" aria-hidden="true">
            ·
          </span>
          <span className="dish-card__category">{dish.categoryName}</span>
          {dish.spiceLevel > 0 ? (
            <span
              className="dish-card__spice"
              aria-label={`Spice level: ${SPICE_LABELS[dish.spiceLevel]}`}
            >
              <Flame size={12} aria-hidden="true" />
              {SPICE_LABELS[dish.spiceLevel]}
            </span>
          ) : null}
        </div>
        <h3 className="dish-card__title">{dish.name}</h3>
        {!compact ? <p className="dish-card__description">{dish.description}</p> : null}
        <div className="dish-card__footer">
          <span className="dish-card__price">{formatMoney(dish.pricePaise)}</span>
          {!dish.isAvailable ? (
            <Button size="sm" variant="secondary" disabled>
              Unavailable
            </Button>
          ) : quantity > 0 ? (
            <QuantityControl
              value={quantity}
              onDecrease={decrease}
              onIncrease={increase}
              max={cart.maxQuantity}
              size="sm"
              label={`Quantity for ${dish.name}`}
            />
          ) : (
            <Button size="sm" onClick={handleAdd} aria-label={`Add ${dish.name} to cart`}>
              <Plus size={15} />
              Add
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
