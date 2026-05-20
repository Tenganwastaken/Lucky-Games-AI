'use client';

/**
 * Reusable shimmer placeholder.
 * @param {'map' | 'form' | 'chart-bar' | 'chart-line'} [variant]
 */
export default function Skeleton({
  width,
  height,
  variant,
  className = '',
  style = {},
  'aria-hidden': ariaHidden = true,
  ...rest
}) {
  if (variant === 'map') {
    return (
      <div
        className={`skeleton skeleton--map ${className}`.trim()}
        style={style}
        aria-hidden={ariaHidden}
        {...rest}
      />
    );
  }

  if (variant === 'form') {
    return (
      <div className={`skeleton-form ${className}`.trim()} aria-hidden={ariaHidden} {...rest}>
        <div className="skeleton skeleton--bar skeleton-form__progress" />
        <div className="skeleton-form__steps">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton skeleton--pill skeleton-form__step" />
          ))}
        </div>
        <div className="skeleton-form__fields">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton-form__field">
              <div className="skeleton skeleton--label" />
              <div className="skeleton skeleton--input" />
            </div>
          ))}
        </div>
        <div className="skeleton-form__actions">
          <div className="skeleton skeleton--btn skeleton--btn-ghost" />
          <div className="skeleton skeleton--btn skeleton--btn-primary" />
        </div>
      </div>
    );
  }

  if (variant === 'chart-bar' || variant === 'chart-line') {
    const h = height ?? 260;
    return (
      <div
        className={`skeleton-chart skeleton-chart--${variant === 'chart-line' ? 'line' : 'bar'} ${className}`.trim()}
        style={{ height: h, ...style }}
        aria-hidden={ariaHidden}
        {...rest}
      >
        <div className="skeleton skeleton--chart-title" />
        <div className="skeleton-chart__plot">
          {variant === 'chart-line' ? (
            <div className="skeleton skeleton--chart-line-path" />
          ) : (
            <div className="skeleton-chart__bars">
              {[72, 48, 88, 56, 64, 40].map((pct, i) => (
                <div
                  key={i}
                  className="skeleton skeleton--chart-bar-col"
                  style={{ height: `${pct}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const inlineStyle = {
    width: width ?? '100%',
    height: height ?? '1rem',
    ...style,
  };

  return (
    <div
      className={`skeleton ${className}`.trim()}
      style={inlineStyle}
      aria-hidden={ariaHidden}
      {...rest}
    />
  );
}
