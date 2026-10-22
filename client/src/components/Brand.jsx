import { Link } from 'react-router-dom';
import { restaurant } from '../config';

export function LogoMark({ inverted = false, className = '' }) {
  const background = inverted ? 'var(--color-cream-100)' : 'var(--color-maroon-800)';
  const line = inverted ? 'var(--color-maroon-800)' : 'var(--color-saffron-200)';

  return (
    <svg
      className={`brand__mark ${className}`.trim()}
      viewBox="0 0 48 48"
      role="img"
      aria-label={`${restaurant.name} emblem`}
    >
      <rect x="1" y="1" width="46" height="46" rx="15" fill={background} />
      <path
        d="M13.5 34V23.4c0-6.2 4.7-11.4 10.5-11.4s10.5 5.2 10.5 11.4V34"
        fill="none"
        stroke={line}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M10 34h28" stroke={line} strokeWidth="1.4" strokeLinecap="round" opacity=".65" />
      <circle cx="24" cy="23.5" r="2.3" fill="var(--color-saffron-400)" />
      <path d="M24 28.5v3.2" stroke="var(--color-saffron-300)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Brand({ inverted = false, compact = false }) {
  return (
    <Link to="/" className="brand" aria-label={`${restaurant.name} — home`}>
      <LogoMark inverted={inverted} />
      <span className="brand__text">
        <span className="brand__name">{restaurant.name}</span>
        {!compact && <span className="brand__sub">{restaurant.tagline}</span>}
      </span>
    </Link>
  );
}
