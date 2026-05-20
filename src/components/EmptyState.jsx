'use client';

/**
 * @param {{ illustration?: import('react').ReactNode, title?: string, description: string, action?: import('react').ReactNode, className?: string }} props
 */
export default function EmptyState({
  illustration,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      {illustration ? <div className="empty-state__illustration">{illustration}</div> : null}
      {title ? <h3 className="empty-state__title">{title}</h3> : null}
      <p className="empty-state__description">{description}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
