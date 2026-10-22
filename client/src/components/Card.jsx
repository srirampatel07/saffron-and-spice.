import { cn } from '../lib/cn';

export default function Card({ as: Tag = 'div', variant = 'default', padding = false, className = '', children, ...props }) {
  return (
    <Tag
      className={cn(
        'card',
        variant !== 'default' && `card--${variant}`,
        padding && 'card--pad',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
