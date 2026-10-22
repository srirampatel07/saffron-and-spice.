import { Minus, Plus } from './Icons';

export default function QuantityControl({
  value,
  onDecrease,
  onIncrease,
  min = 1,
  max = 20,
  size = 'md',
  label = 'Quantity',
}) {
  return (
    <div className={`qty qty--${size}`} role="group" aria-label={label}>
      <button
        type="button"
        className="qty__button"
        onClick={onDecrease}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={15} />
      </button>
      <span className="qty__value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="qty__button"
        onClick={onIncrease}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
