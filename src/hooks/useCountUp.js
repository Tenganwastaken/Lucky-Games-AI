'use client';

import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animates a number from 0 → `end` when `active` becomes true.
 * @param {number} end
 * @param {{ duration?: number, active?: boolean }} [opts]
 */
export function useCountUp(end, opts = {}) {
  const { duration = 800, active = true } = opts;
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active || end == null || Number.isNaN(end)) {
      setValue(end ?? 0);
      return undefined;
    }

    if (prefersReducedMotion()) {
      setValue(end);
      return undefined;
    }

    const start = performance.now();
    const from = 0;
    const target = Number(end);

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round((from + (target - from) * eased) * 10) / 10);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    setValue(0);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, active]);

  return value;
}
