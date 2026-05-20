'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BRAND_NAME,
  NAV_CREATE_ACCOUNT,
  NAV_LOADING,
  NAV_RISK_ADVISOR,
  NAV_SIGN_IN,
  NAV_SIGN_OUT,
} from '@/lib/strings';

/**
 * @param {{ className?: string }} props
 */
export default function SiteNav({ className = '' }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setUser(d.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
    <nav className={`app-nav${className ? ` ${className}` : ''}`} aria-label="Κύρια πλοήγηση">
      <Link href="/" className="app-nav__brand">
        {BRAND_NAME}
      </Link>
      <Link href="/advisor" className="app-nav__link">
        {NAV_RISK_ADVISOR}
      </Link>
      {loading ? (
        <span className="app-nav__meta">{NAV_LOADING}</span>
      ) : user ? (
        <>
          <span className="app-nav__meta">{user.email}</span>
          <button type="button" onClick={logout} className="app-nav__btn">
            {NAV_SIGN_OUT}
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="app-nav__link">
            {NAV_SIGN_IN}
          </Link>
          <Link href="/register" className="app-nav__link">
            {NAV_CREATE_ACCOUNT}
          </Link>
        </>
      )}
    </nav>
  );
}
