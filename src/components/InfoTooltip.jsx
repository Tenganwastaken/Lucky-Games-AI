'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * Accessible info tooltip: hover on desktop, tap on touch devices.
 *
 * @param {{ title: string, body: string, source?: string, className?: string }} props
 */
export default function InfoTooltip({ title, body, source, className = '' }) {
  const [open, setOpen] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const tooltipId = useId();

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)');
    const sync = () => setIsCoarsePointer(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };

    const onPointerDown = (e) => {
      const t = e.target;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !panelRef.current) return undefined;

    const panel = panelRef.current;
    const focusables = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const trapTab = (e) => {
      if (e.key !== 'Tab' || focusables.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    panel.addEventListener('keydown', trapTab);
    return () => panel.removeEventListener('keydown', trapTab);
  }, [open]);

  const openFromHover = () => {
    if (!isCoarsePointer) setOpen(true);
  };

  const closeFromHover = () => {
    if (!isCoarsePointer) setOpen(false);
  };

  return (
    <span className={`info-tooltip ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className="info-tooltip__trigger"
        aria-label={`Πληροφορίες: ${title}`}
        aria-expanded={open}
        aria-controls={tooltipId}
        onMouseEnter={openFromHover}
        onMouseLeave={closeFromHover}
        onFocus={openFromHover}
        onBlur={(e) => {
          if (!panelRef.current?.contains(e.relatedTarget)) closeFromHover();
        }}
        onClick={(e) => {
          if (isCoarsePointer) {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <span aria-hidden="true">(i)</span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={tooltipId}
          role="tooltip"
          className="info-tooltip__card"
        >
          <div className="info-tooltip__card-head">
            <strong className="info-tooltip__title">{title}</strong>
            <button
              type="button"
              className="info-tooltip__close"
              aria-label="Κλείσιμο"
              onClick={() => {
                close();
                triggerRef.current?.focus();
              }}
            >
              ×
            </button>
          </div>
          <p className="info-tooltip__body">{body}</p>
          {source ? (
            <p className="info-tooltip__source">
              <span className="info-tooltip__source-label">Πηγή:</span> {source}
            </p>
          ) : null}
        </div>
      ) : null}
    </span>
  );
}
