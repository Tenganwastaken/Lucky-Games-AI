'use client';

/**
 * Full-screen dismiss control for modals/drawers (keyboard + screen reader friendly).
 * @param {{ onClose: () => void, className?: string, label?: string, open?: boolean }} props
 */
export default function ModalBackdrop({
  onClose,
  className = '',
  label = 'Κλείσιμο',
  open = true,
}) {
  if (!open) return null;
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={onClose}
      tabIndex={-1}
    />
  );
}
