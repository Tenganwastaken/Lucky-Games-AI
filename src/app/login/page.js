'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError((data && data.error) || `Request failed (${res.status})`);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        padding: '2rem 1rem',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        background:
          'radial-gradient(circle at top left, #1d4ed8 0, #0f172a 40%, #020617 100%)',
        color: '#0b1120',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: '1.5rem',
          padding: '2rem',
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          boxShadow:
            '0 24px 60px rgba(15,23,42,0.35), 0 0 0 1px rgba(148,163,184,0.2)',
        }}
      >
        <p style={{ marginBottom: '0.75rem' }}>
          <Link
            href="/"
            style={{ color: '#2563eb', fontSize: '0.9rem', textDecoration: 'none' }}
          >
            ← Back to advisor
          </Link>
        </p>
        <h1
          style={{
            fontSize: '1.75rem',
            marginBottom: '0.35rem',
            color: '#0f172a',
            letterSpacing: '-0.03em',
          }}
        >
          Sign in
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Your session is stored in the database and survives server restarts.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem' }}>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #d4d4d8' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem' }}>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #d4d4d8' }}
            />
          </label>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '0.9rem', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.25rem',
              padding: '0.8rem 1.1rem',
              borderRadius: '999px',
              border: 'none',
              background: loading
                ? 'linear-gradient(to right, #9ca3af, #6b7280)'
                : 'linear-gradient(to right, #2563eb, #4f46e5)',
              color: 'white',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              boxShadow: loading ? 'none' : '0 12px 24px rgba(37,99,235,0.35)',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: '#64748b' }}>
          No account?{' '}
          <Link href="/register" style={{ color: '#2563eb', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
