import { cn } from '../lib/cn';

export default function Badge({ tone = 'default', className = '', children, ...props }) {
  return (
    <span className={cn('badge', tone !== 'default' && `badge--${tone}`, className)} {...props}>
      {children}
    </span>
  );
}
