import { forwardRef } from 'react';
import { cn } from '../lib/cn';

const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    loading = false,
    disabled = false,
    type,
    ...props
  },
  ref,
) {
  const isButton = Tag === 'button';

  return (
    <Tag
      ref={ref}
      {...(isButton ? { type: type || 'button', disabled: disabled || loading } : { 'aria-disabled': disabled || loading })}
      className={cn('btn', `btn--${variant}`, size !== 'md' && `btn--${size}`, loading && 'is-loading', className)}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </Tag>
  );
});

export default Button;
