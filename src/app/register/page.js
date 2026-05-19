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
        credentials: 'include',
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
    <main className="app-shell app-shell--centered">
      <div className="app-card app-card--narrow">
        <p style={{ marginBottom: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/" className="app-link app-link--subtle">
            ← Αρχική
          </Link>
          <Link href="/login" className="app-link app-link--subtle">
            Έχεις ήδη λογαριασμό; Σύνδεση
          </Link>
        </p>
        <h1 className="app-title" style={{ fontSize: '1.75rem' }}>
          Δημιουργία λογαριασμού
        </h1>
        <p className="app-subtitle" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Email, κωδικός και ημερομηνία γέννησης (18+). Ο κωδικός αποθηκεύεται hashed στον διακομιστή, όχι σε απλό
          κείμενο.
        </p>

        {success && (
          <p className="callout callout--success" style={{ marginBottom: '1rem' }}>
            Ο λογαριασμός δημιουργήθηκε. Μπορείς να επιστρέψεις στην αρχική ή να συνδεθείς.
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <label className="field">
            <span>Email</span>
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
            <span>Κωδικός (τουλάχιστον 8 χαρακτήρες)</span>
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
            <span>Επιβεβαίωση κωδικού</span>
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
            <span>Ημερομηνία γέννησης</span>
            <input
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="input"
            />
          </label>

          {error && <p className="callout callout--danger" style={{ margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-pill" style={{ marginTop: '0.25rem' }}>
            {loading ? 'Δημιουργία…' : 'Δημιουργία λογαριασμού'}
          </button>
        </form>
      </div>
    </main>
  );
}
