'use client';

import { forwardRef, useLayoutEffect, useRef, useState } from 'react';

const VARIANTS = {
  primary: 'ui-btn--primary',
  secondary: 'ui-btn--secondary',
  ghost: 'ui-btn--ghost',
  danger: 'ui-btn--danger',
};

const SIZES = {
  sm: 'ui-btn--sm',
  md: 'ui-btn--md',
  lg: 'ui-btn--lg',
};

/**
 * @param {{
 *   variant?: keyof typeof VARIANTS,
 *   size?: keyof typeof SIZES,
 *   pill?: boolean,
 *   loading?: boolean,
 *   leftIcon?: import('react').ReactNode,
 *   rightIcon?: import('react').ReactNode,
 *   className?: string,
 *   children?: import('react').ReactNode,
 * }} props
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    pill = false,
    loading = false,
    leftIcon,
    rightIcon,
    className = '',
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const labelRef = useRef(null);
  const [minWidth, setMinWidth] = useState(undefined);

  useLayoutEffect(() => {
    if (!loading && labelRef.current) {
      setMinWidth(labelRef.current.offsetWidth);
    }
  }, [children, loading, leftIcon, rightIcon]);

  const classes = [
    'ui-btn',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    pill ? 'ui-btn--pill' : '',
    loading ? 'ui-btn--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      style={minWidth != null ? { minWidth } : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <span className="ui-btn__spinner" aria-hidden />
          <span className="ui-btn__label ui-btn__label--hidden" ref={labelRef} aria-hidden>
            {leftIcon}
            {children != null && children !== '' ? <span>{children}</span> : null}
            {rightIcon}
          </span>
          <span className="sr-only">{children}</span>
        </>
      ) : (
        <span className="ui-btn__label" ref={labelRef}>
          {leftIcon}
          {children != null && children !== '' ? <span>{children}</span> : null}
          {rightIcon}
        </span>
      )}
    </button>
  );
});

export default Button;
