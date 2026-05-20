'use client';

import { useEffect, useState } from 'react';
import { getResolvedTheme } from '@/lib/theme';

/** Re-render when `data-theme` on <html> changes. */
export function useTheme() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setTheme(getResolvedTheme());
    const obs = new MutationObserver(() => {
      setTheme(getResolvedTheme());
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, []);

  return theme;
}
