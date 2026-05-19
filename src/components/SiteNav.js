'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SiteNav() {
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
    <nav className="app-nav">
      <Link href="/" className="app-nav__brand">
        Lucky Games
      </Link>
      <Link href="/learn" className="app-nav__link">
        Θεωρία
      </Link>
      <Link href="/advisor" className="app-nav__link">
        Risk advisor
      </Link>
      {loading ? (
        <span className="app-nav__meta">…</span>
      ) : user ? (
        <>
          <span className="app-nav__meta">{user.email}</span>
          <button type="button" onClick={logout} className="app-nav__btn">
            Log out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="app-nav__link">
            Sign in
          </Link>
          <Link href="/register" className="app-nav__link">
            Create account
          </Link>
        </>
      )}
    </nav>
  );
}
