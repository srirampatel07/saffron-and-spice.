import { AlertCircle, Check } from './Icons';
import { ORDER_STATUS_META, timelineSteps } from '../lib/orderStatus';

export default function OrderTimeline({ order, compact = false }) {
  if (order.status === 'cancelled') {
    return (
      <div className="notice notice--danger" role="status">
        <AlertCircle size={18} aria-hidden="true" />
        <div>
          <strong>This order was cancelled.</strong>
          <p>If this wasn&rsquo;t expected, call us and we&rsquo;ll help straight away.</p>
        </div>
      </div>
    );
  }

  const steps = timelineSteps(order);

  return (
    <ol className={`order-timeline${compact ? ' order-timeline--compact' : ''}`} aria-label="Order progress">
      {steps.map((step) => {
        const meta = ORDER_STATUS_META[step.status];
        return (
          <li
            key={step.status}
            className={`order-timeline__step order-timeline__step--${step.state}`}
            aria-current={step.state === 'current' ? 'step' : undefined}
          >
            <span className="order-timeline__marker" aria-hidden="true">
              {step.state === 'complete' ? <Check size={13} /> : <span />}
            </span>
            <div className="order-timeline__copy">
              <strong>{meta.label}</strong>
              {!compact ? <p>{meta.description}</p> : null}
            </div>
            {step.state === 'current' ? <span className="order-timeline__now">Now</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
