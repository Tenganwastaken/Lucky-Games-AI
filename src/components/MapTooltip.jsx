'use client';

import { useEffect, useRef, useState } from 'react';

const OFFSET = 14;
const MARGIN = 12;

/**
 * @param {{
 *   open: boolean,
 *   clientX: number,
 *   clientY: number,
 *   flag: string,
 *   countryName: string,
 *   valueLabel: string,
 *   valueText: string,
 *   sparkline?: number[],
 * }} props
 */
export default function MapTooltip({
  open,
  clientX,
  clientY,
  flag,
  countryName,
  valueLabel,
  valueText,
  sparkline,
}) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!open || !ref.current) return;
    const el = ref.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let x = clientX + OFFSET;
    let y = clientY + OFFSET;
    if (x + w > window.innerWidth - MARGIN) x = clientX - w - OFFSET;
    if (y + h > window.innerHeight - MARGIN) y = clientY - h - OFFSET;
    x = Math.max(MARGIN, Math.min(x, window.innerWidth - w - MARGIN));
    y = Math.max(MARGIN, Math.min(y, window.innerHeight - h - MARGIN));
    setPos({ x, y });
  }, [open, clientX, clientY, countryName, valueText, sparkline]);

  if (!open) return null;

  const maxSpark = sparkline?.length ? Math.max(...sparkline, 1) : 1;

  return (
    <div
      ref={ref}
      className="map-tooltip"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
      }}
      role="status"
      aria-live="polite"
    >
      <div className="map-tooltip__head">
        <span className="map-tooltip__flag" aria-hidden>
          {flag}
        </span>
        <strong className="map-tooltip__name">{countryName}</strong>
      </div>
      <p className="map-tooltip__value">
        <span className="map-tooltip__value-label">{valueLabel}</span>
        <span className="map-tooltip__value-num tabular">{valueText}</span>
      </p>
      {sparkline && sparkline.some((v) => v > 0) ? (
        <div className="map-tooltip__spark" aria-hidden>
          {sparkline.map((v, i) => (
            <span
              key={i}
              className="map-tooltip__spark-bar"
              style={{ height: `${Math.max(8, (v / maxSpark) * 100)}%` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
