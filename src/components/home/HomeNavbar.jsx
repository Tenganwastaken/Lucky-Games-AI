'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import {
  BRAND_NAME,
  HOME_NAV_ADVISOR,
  HOME_NAV_BIASES,
  HOME_NAV_HOUSE_EDGE,
  HOME_NAV_PGSI,
  NAV_SIGN_IN,
  NAV_SIGN_OUT,
  NAV_SIGN_UP,
} from '@/lib/strings';

export default function HomeNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setUser(d.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  return (
    <nav
      className={`navbar${scrolled ? ' scrolled' : ''}`}
      aria-label="Κύρια πλοήγηση"
    >
      <Link href="/" className="navbar__logo">
        {BRAND_NAME}
      </Link>

      <div className="navbar__links">
        <Link href="/advisor">{HOME_NAV_ADVISOR}</Link>
        <Link href="/screener">{HOME_NAV_PGSI}</Link>
        <Link href="/biases">{HOME_NAV_BIASES}</Link>
        <Link href="/house-edge">{HOME_NAV_HOUSE_EDGE}</Link>
      </div>

      <div className="navbar__actions">
        <ThemeToggle />
        {user ? (
          <>
            <span className="navbar__user" title={user.email}>
              {user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              {NAV_SIGN_OUT}
            </Button>
          </>
        ) : (
          <>
            <Link href="/login" className="ui-btn ui-btn--ghost ui-btn--sm">
              {NAV_SIGN_IN}
            </Link>
            <Link href="/register" className="ui-btn ui-btn--primary ui-btn--sm">
              {NAV_SIGN_UP}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
