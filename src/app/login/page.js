'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import {
  BACK_HOME,
  EMAIL,
  GENERIC_ERROR,
  LOGIN_SUBMIT,
  LOGIN_SUBMITTING,
  LOGIN_SUBTITLE,
  LOGIN_TITLE,
  NO_ACCOUNT,
  PASSWORD,
  NAV_CREATE_ACCOUNT,
} from '@/lib/strings';

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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = (data && data.error) || `Request failed (${res.status})`;
        setError(msg);
        toast.error(msg);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError(GENERIC_ERROR);
      toast.error(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" className="app-shell app-shell--centered">
      <div className="app-card app-card--narrow">
        <p style={{ marginBottom: '0.75rem' }}>
          <Link href="/" className="app-link app-link--subtle">
            {BACK_HOME}
          </Link>
        </p>
        <h1 className="app-title" style={{ fontSize: '1.75rem' }}>
          {LOGIN_TITLE}
        </h1>
        <p className="app-subtitle" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {LOGIN_SUBTITLE}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <label className="field">
            <span>{EMAIL}</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </label>

          <label className="field">
            <span>{PASSWORD}</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>

          {error ? (
            <p className="callout callout--danger" style={{ margin: 0 }} role="alert" aria-live="assertive">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={loading} className="btn btn-primary btn-pill" style={{ marginTop: '0.25rem' }}>
            {loading ? LOGIN_SUBMITTING : LOGIN_SUBMIT}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {NO_ACCOUNT}{' '}
          <Link href="/register" className="app-link">
            {NAV_CREATE_ACCOUNT}
          </Link>
        </p>
      </div>
    </main>
  );
}
