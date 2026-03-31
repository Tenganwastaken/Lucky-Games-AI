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

  const linkStyle = {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#1d4ed8',
    textDecoration: 'none',
  };

  return (
    <nav
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.75rem 1.25rem',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <Link href="/" style={{ ...linkStyle, fontWeight: 700 }}>
        Lucky Games
      </Link>
      <Link href="/advisor" style={linkStyle}>
        Risk advisor
      </Link>
      {loading ? (
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>…</span>
      ) : user ? (
        <>
          <span style={{ fontSize: '0.85rem', color: '#475569' }}>
            {user.email}
          </span>
          <button
            type="button"
            onClick={logout}
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#b91c1c',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" style={linkStyle}>
            Sign in
          </Link>
          <Link href="/register" style={linkStyle}>
            Create account
          </Link>
        </>
      )}
    </nav>
  );
}
