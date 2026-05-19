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
        credentials: 'include',
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
    <main className="app-shell app-shell--centered">
      <div className="app-card app-card--narrow">
        <p style={{ marginBottom: '0.75rem' }}>
          <Link href="/" className="app-link app-link--subtle">
            ← Αρχική
          </Link>
        </p>
        <h1 className="app-title" style={{ fontSize: '1.75rem' }}>
          Σύνδεση
        </h1>
        <p className="app-subtitle" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Η συνεδρία αποθηκεύεται στη βάση και επιβιώνει από επανεκκινήσεις διακομιστή.
        </p>

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
            <span>Κωδικός</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>

          {error && <p className="callout callout--danger" style={{ margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-pill" style={{ marginTop: '0.25rem' }}>
            {loading ? 'Σύνδεση…' : 'Σύνδεση'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Δεν έχεις λογαριασμό;{' '}
          <Link href="/register" className="app-link">
            Δημιουργία λογαριασμού
          </Link>
        </p>
      </div>
    </main>
  );
}
