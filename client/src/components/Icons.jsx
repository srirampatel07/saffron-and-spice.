const baseProps = (size, props) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
  ...props,
});

export function ArrowRight({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowLeft({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M20 12H4M10 6l-6 6 6 6" />
    </svg>
  );
}

export function ArrowUpRight({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function Bag({ size = 20, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M5.5 8.5h13l-1 11.5h-11l-1-11.5Z" />
      <path d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5" />
    </svg>
  );
}

export function Check({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </svg>
  );
}

export function CheckCircle({ size = 20, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.2 12.2 2.6 2.6 5-5.4" />
    </svg>
  );
}

export function ChevronDown({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronRight({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function Close({ size = 20, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function Clock({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </svg>
  );
}

export function CreditCard({ size = 20, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 9.5h18M7 15h3" />
    </svg>
  );
}

export function Banknote({ size = 20, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9.5v.01M18 14.5v.01" />
    </svg>
  );
}

export function Flame({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M12 3c1 3.4-2.4 4.3-2.4 7.4A3.4 3.4 0 0 0 13 13c1.2-1.5 1.4-2.7 1.4-3.5 2 1.6 3.6 3.7 3.6 6.3a6 6 0 1 1-12 0C6 11.6 9.2 6.7 12 3Z" />
    </svg>
  );
}

export function Instagram({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.2 6.8v.01" />
    </svg>
  );
}

export function Leaf({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M20 4c-7 .3-12.5 3.5-13.9 9.2C4.9 18 8.8 20 11.8 18.8 17 16.8 19.2 10.5 20 4Z" />
      <path d="M5.5 20c1.2-5.1 4.1-9 9-12" />
    </svg>
  );
}

export function AlertCircle({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16.5v.01" />
    </svg>
  );
}

export function Mail({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function MapPin({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M20 10.2c0 5.2-8 11.3-8 11.3S4 15.4 4 10.2a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function MenuIcon({ size = 20, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

export function Minus({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function Phone({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M20.5 16.9v2.5a1.8 1.8 0 0 1-2 1.8A17.6 17.6 0 0 1 3.8 6.5a1.8 1.8 0 0 1 1.8-2h2.5a1.8 1.8 0 0 1 1.8 1.5c.1 1.1.4 2.2.8 3.2a1.8 1.8 0 0 1-.4 1.9L9.1 12.3a14.5 14.5 0 0 0 5.6 5.6l1.2-1.2a1.8 1.8 0 0 1 1.9-.4c1 .4 2.1.7 3.2.8a1.8 1.8 0 0 1 1.5 1.8Z" />
    </svg>
  );
}

export function WhatsApp({ size = 20, ...props }) {
  return (
    <svg {...baseProps(size, props)} fill="currentColor" stroke="none">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.89-9.89 9.89m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.17-1.24-6.16-3.48-8.41z" />
    </svg>
  );
}

export function Plus({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function RefreshCw({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6.1 8.3a7 7 0 0 1 11.6-1.6L20 12M4 12l2.3 5.3a7 7 0 0 0 11.6-1.6" />
    </svg>
  );
}

export function Search({ size = 20, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </svg>
  );
}

export function ShieldCheck({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M12 3 4.5 6v5.3c0 4.6 3.2 8 7.5 9.7 4.3-1.7 7.5-5.1 7.5-9.7V6L12 3Z" />
      <path d="m8.8 11.8 2.2 2.2 4.2-4.3" />
    </svg>
  );
}

export function Sparkles({ size = 16, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" />
      <path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2ZM5 14l.7 1.8 1.8.7-1.8.7L5 19l-.7-1.8-1.8-.7 1.8-.7L5 14Z" />
    </svg>
  );
}

export function Trash({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M4 7h16M9.5 7V5h5v2M6.5 7l.8 12h9.4l.8-12M10 11v4.5M14 11v4.5" />
    </svg>
  );
}

export function Truck({ size = 20, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M3 6.5h11v9H3zM14 9.5h3.7l3.3 3.2v2.8h-7" />
      <circle cx="7" cy="17.5" r="1.7" />
      <circle cx="17.5" cy="17.5" r="1.7" />
    </svg>
  );
}

export function Utensils({ size = 20, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M6.5 3v7.5M4 3v4.2a2.5 2.5 0 0 0 5 0V3M6.5 10.5V21M17.5 3c-1.7 1.5-2.5 3.4-2.5 6 0 2 .8 3.4 2.5 3.6V21M17.5 3v9.6" />
    </svg>
  );
}

export function LogOut({ size = 18, ...props }) {
  return (
    <svg {...baseProps(size, props)}>
      <path d="M14 8V5.5A1.5 1.5 0 0 0 12.5 4h-7A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h7a1.5 1.5 0 0 0 1.5-1.5V16" />
      <path d="M9 12h11M17 8.5l3.5 3.5-3.5 3.5" />
    </svg>
  );
}
