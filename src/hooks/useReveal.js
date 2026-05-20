'use client';

import { useEffect, useRef } from 'react';

/**
 * Adds `.revealed` when the element enters the viewport (once).
 * @param {{ threshold?: number, rootMargin?: string }} [opts]
 */
export function useReveal(opts = {}) {
  const ref = useRef(null);
  const { threshold = 0.15, rootMargin = '0px 0px -50px 0px' } = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin },
    );

    el.classList.add('reveal');
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}
