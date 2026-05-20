'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getResolvedTheme, toggleTheme } from '@/lib/theme';
import { THEME_TOGGLE_ARIA_DARK, THEME_TOGGLE_ARIA_LIGHT } from '@/lib/strings';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(getResolvedTheme() === 'dark');
    const obs = new MutationObserver(() => {
      setDark(getResolvedTheme() === 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const label = dark ? THEME_TOGGLE_ARIA_LIGHT : THEME_TOGGLE_ARIA_DARK;

  return (
    <button
      type="button"
      className={`theme-toggle${mounted && dark ? ' theme-toggle--dark' : ''}`}
      onClick={() => {
        const next = toggleTheme();
        setDark(next === 'dark');
      }}
      aria-label={mounted ? label : THEME_TOGGLE_ARIA_DARK}
      title={mounted ? label : undefined}
      disabled={!mounted}
    >
      <Sun className="theme-toggle__icon theme-toggle__icon--sun" size={20} strokeWidth={2} aria-hidden />
      <Moon className="theme-toggle__icon theme-toggle__icon--moon" size={20} strokeWidth={2} aria-hidden />
    </button>
  );
}
