'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, dateOfBirth }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError((data && data.error) || `Request failed (${res.status})`);
        return;
      }

      setSuccess(true);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDateOfBirth('');
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
        <p style={{ marginBottom: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{ color: '#2563eb', fontSize: '0.9rem', textDecoration: 'none' }}
          >
            ← Back to advisor
          </Link>
          <Link href="/login" style={{ color: '#2563eb', fontSize: '0.9rem', textDecoration: 'none' }}>
            Already have an account? Sign in
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
          Create account
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Email, password, and date of birth (must be 18+). Your password is stored hashed on the
          server, not in plain text.
        </p>

        {success && (
          <p
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.35)',
              color: '#166534',
              marginBottom: '1rem',
              fontSize: '0.95rem',
            }}
          >
            Account created. You can return to the advisor — login can be added next.
          </p>
        )}

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
            <span>Password (min. 8 characters)</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #d4d4d8' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem' }}>
            <span>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ padding: '0.55rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #d4d4d8' }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.95rem' }}>
            <span>Date of birth</span>
            <input
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </main>
  );
}
