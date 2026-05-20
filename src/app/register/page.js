'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import {
  ALREADY_HAVE_ACCOUNT,
  BACK_HOME,
  CONFIRM_PASSWORD,
  DATE_OF_BIRTH,
  EMAIL,
  GENERIC_ERROR,
  NAV_SIGN_IN,
  PASSWORD_MIN,
  PASSWORDS_MISMATCH,
  REGISTER_SUBMIT,
  REGISTER_SUBMITTING,
  REGISTER_SUBTITLE,
  REGISTER_SUCCESS,
  REGISTER_TITLE,
} from '@/lib/strings';

export default function RegisterPage() {
  const toast = useToast();
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
      setError(PASSWORDS_MISMATCH);
      toast.error(PASSWORDS_MISMATCH);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, dateOfBirth }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = (data && data.error) || `Request failed (${res.status})`;
        setError(msg);
        toast.error(msg);
        return;
      }

      setSuccess(true);
      toast.success(REGISTER_SUCCESS);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDateOfBirth('');
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
        <p style={{ marginBottom: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/" className="app-link app-link--subtle">
            {BACK_HOME}
          </Link>
          <Link href="/login" className="app-link app-link--subtle">
            {ALREADY_HAVE_ACCOUNT}
          </Link>
        </p>
        <h1 className="app-title" style={{ fontSize: '1.75rem' }}>
          {REGISTER_TITLE}
        </h1>
        <p className="app-subtitle" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {REGISTER_SUBTITLE}
        </p>

        {success && (
          <p className="callout callout--success" style={{ marginBottom: '1rem' }}>
            {REGISTER_SUCCESS}
          </p>
        )}

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
            <span>{PASSWORD_MIN}</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>

          <label className="field">
            <span>{CONFIRM_PASSWORD}</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
            />
          </label>

          <label className="field">
            <span>{DATE_OF_BIRTH}</span>
            <input
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="input"
            />
          </label>

          {error ? (
            <p className="callout callout--danger" style={{ margin: 0 }} role="alert" aria-live="assertive">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={loading} className="btn btn-primary btn-pill" style={{ marginTop: '0.25rem' }}>
            {loading ? REGISTER_SUBMITTING : REGISTER_SUBMIT}
          </button>
        </form>
      </div>
    </main>
  );
}
