import { Link } from 'react-router-dom';

export default function VegBadge({ isVeg }) {
  return (
    <span className="diet" aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}>
      <span className={`diet-mark${isVeg ? '' : ' diet-mark--nonveg'}`} aria-hidden="true" />
      {isVeg ? 'Veg' : 'Non-veg'}
    </span>
  );
}

export function DietOnly({ isVeg }) {
  return (
    <span className={`diet-mark${isVeg ? '' : ' diet-mark--nonveg'}`} title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}>
      <span className="sr-only">{isVeg ? 'Vegetarian' : 'Non-vegetarian'}</span>
    </span>
  );
}

export function LinkButton({ to, children, ...props }) {
  return (
    <Link to={to} {...props}>
      {children}
    </Link>
  );
}
