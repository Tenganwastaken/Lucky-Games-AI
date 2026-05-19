'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { gameTypeLabel } from '@/lib/advisor-labels';
import PrintSummaryButton from '@/components/PrintSummaryButton';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const IS_DEV = process.env.NODE_ENV === 'development';

export default function AdvisorPage() {
  const [form, setForm] = useState({
    gameType: 'lottery',
    betSize: 5,
    frequencyPerWeek: 1,
    riskTolerance: 'medium',
  });
  /** Dev-only: force ISO2 country on the map (localhost IP has no geo). Stripped in production builds. */
  const [devCountryCode, setDevCountryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [usageId, setUsageId] = useState(null);
  const [error, setError] = useState(null);
  const [savedHistory, setSavedHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  /** 'unauthorized' | 'failed' | null — empty list with no error means truly no rows */
  const [historyError, setHistoryError] = useState(null);
  const [historyErrorDetail, setHistoryErrorDetail] = useState('');
  const [copyHint, setCopyHint] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setAuthUser(data.user ?? null);
      } catch {
        if (!cancelled) setAuthUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      fetch('/api/auth/me', { credentials: 'include' })
        .then((r) => r.json().catch(() => ({})))
        .then((data) => setAuthUser(data.user ?? null))
        .catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const fetchSavedHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    setHistoryErrorDetail('');
    try {
      const res = await fetch('/api/advisor/history', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.status === 401 || res.status === 403) {
        setSavedHistory([]);
        setHistoryError('unauthorized');
        return;
      }
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const detail =
          (errBody && (errBody.details || errBody.error || errBody.message)) || `HTTP ${res.status}`;
        setSavedHistory([]);
        setHistoryError('failed');
        setHistoryErrorDetail(typeof detail === 'string' ? detail : 'Request failed');
        return;
      }
      const data = await res.json().catch(() => null);
      if (!data || !Array.isArray(data.items)) {
        setSavedHistory([]);
        setHistoryError('failed');
        setHistoryErrorDetail('Invalid response from server');
        return;
      }
      setSavedHistory(data.items);
    } catch (e) {
      setSavedHistory([]);
      setHistoryError('failed');
      setHistoryErrorDetail(
        e instanceof TypeError && e.message === 'Failed to fetch'
          ? 'Network error — is the dev server running? Check the URL (use the same host as when you signed in).'
          : 'Could not reach the server.',
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUser) fetchSavedHistory();
    else {
      setSavedHistory([]);
      setHistoryError(null);
      setHistoryErrorDetail('');
    }
  }, [authUser, fetchSavedHistory]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
    setAuthUser(null);
  };

  const loadSavedAnalysis = (row) => {
    setForm({
      gameType: row.gameType,
      betSize: row.betSize,
      frequencyPerWeek: row.frequencyPerWeek,
      riskTolerance: row.riskTolerance,
    });
    setResult({
      advice: row.advice,
      riskScore: row.riskScore,
      winChanceEstimate: row.winChanceEstimate,
      lossChanceEstimate: row.lossChanceEstimate,
      expectedWeeklySpend: row.expectedWeeklySpend,
    });
    setUsageId(row.id);
    setChatMessages([]);
    setError(null);
  };

  const copySummaryLink = async () => {
    if (!usageId || typeof window === 'undefined') return;
    const url = `${window.location.origin}/advisor/share/${usageId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyHint('Link copied');
      setTimeout(() => setCopyHint(''), 2500);
    } catch {
      setCopyHint('Could not copy');
      setTimeout(() => setCopyHint(''), 2500);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setUsageId(null);

    try {
      const payload = {
        ...form,
        betSize: Number(form.betSize),
        frequencyPerWeek: Number(form.frequencyPerWeek),
      };
      if (IS_DEV && /^[a-zA-Z]{2}$/.test((devCountryCode || '').trim())) {
        payload.debugCountryCode = devCountryCode.trim().toUpperCase();
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          (data && (data.error || data.message)) ||
          `Request failed with status ${res.status}`;
        console.error('API error:', message, 'details:', data);
        setError(message);
        return;
      }

      const { usageId: newUsageId, ...rest } = data;
      setResult(rest);
      const idStr =
        newUsageId != null && String(newUsageId).trim() !== '' ? String(newUsageId) : null;
      setUsageId(idStr);
      setChatMessages([]);
      await fetchSavedHistory();
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    result &&
    ({
      labels: ['Win chance', 'Loss chance', 'Risk score'],
      datasets: [
        {
          label: '% / score',
          data: [
            result.winChanceEstimate ?? 0,
            result.lossChanceEstimate ?? 0,
            result.riskScore ?? 0,
          ],
          backgroundColor: ['#57534e', '#78716c', '#292524'],
        },
      ],
    });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#57534e' } },
      title: {
        display: true,
        text: 'Risk & Probabilities',
        color: '#1c1917',
      },
    },
    scales: {
      x: { ticks: { color: '#78716c' }, grid: { color: '#e7e5e4' } },
      y: { ticks: { color: '#78716c' }, grid: { color: '#e7e5e4' } },
    },
  };

  const spendChartData =
    result &&
    ({
      labels: ['Weekly spend', 'Monthly spend (approx)'],
      datasets: [
        {
          label: 'Amount',
          data: [
            result.expectedWeeklySpend ?? 0,
            (result.expectedWeeklySpend ?? 0) * 4,
          ],
          backgroundColor: ['#57534e', '#a8a29e'],
        },
      ],
    });

  const spendChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#57534e' } },
      title: {
        display: true,
        text: 'Spending projection',
        color: '#1c1917',
      },
    },
    scales: {
      x: { ticks: { color: '#78716c' }, grid: { color: '#e7e5e4' } },
      y: { ticks: { color: '#78716c' }, grid: { color: '#e7e5e4' } },
    },
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !result) return;

    const userMessage = { role: 'user', content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: chatMessages,
          context: {
            input: form,
            analysis: result,
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          (data && (data.error || data.message)) ||
          `Chat request failed with status ${res.status}`;
        console.error('Chat API error:', message, 'details:', data);
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Sorry, I had an error: ${message}` },
        ]);
        return;
      }

      if (data && data.reply) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply },
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main className="app-shell app-shell--centered">
      <div className="app-card">
        <p style={{ marginBottom: '1rem' }}>
          <Link href="/" className="app-link app-link--subtle">
            ← Lucky Games home
          </Link>
        </p>
        <header className="app-header-row">
          <div>
            <h1 className="app-title">Risk advisor</h1>
            <p className="app-subtitle" style={{ maxWidth: 520 }}>
              Enter how you play and get an AI-assisted risk overview, spending projection,
              and follow-up advice.
            </p>
          </div>
          <div className="app-header-actions">
            {authLoading ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>Checking session…</span>
            ) : authUser ? (
              <div className="app-header-actions--stack">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  Signed in as <strong style={{ color: 'var(--text)' }}>{authUser.email}</strong>
                </span>
                <button type="button" onClick={handleLogout} className="app-nav__btn">
                  Log out
                </button>
              </div>
            ) : (
              <div className="app-header-actions--stack" style={{ gap: '0.35rem' }}>
                <Link href="/login" className="app-link">
                  Sign in →
                </Link>
                <Link href="/register" className="app-link">
                  Create account →
                </Link>
              </div>
            )}
            <div className="badge-soft">
              <span className="badge-soft__dot" aria-hidden />
              AI-powered insights (Gemini free tier)
            </div>
          </div>
        </header>

        <div className="advisor-layout">
          <div className="advisor-stack">
          <form
            onSubmit={handleSubmit}
            className="panel advisor-form"
          >
            <h2
              className="app-section-title"
              style={{ marginBottom: '0.25rem' }}
            >
              Your playing pattern
            </h2>
            <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Adjust the fields and click Analyze to update the charts and advice. Each run is saved for the
              live map on the home page (country from your account or IP; dev override below).
            </p>
            {IS_DEV && (
              <label
                className="callout callout--warn"
                style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}
              >
                <span>
                  Dev only — map country (ISO2, e.g. US, GR). Use to test multiple regions on localhost.
                </span>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="e.g. GR"
                  value={devCountryCode}
                  onChange={(e) => setDevCountryCode(e.target.value.toUpperCase())}
                  className="input"
                  style={{ maxWidth: 120 }}
                />
              </label>
            )}
        <label className="field-inline">
          <span>Game type</span>
          <select
            name="gameType"
            value={form.gameType}
            onChange={handleChange}
            className="select-input"
          >
            <option value="lottery">Lottery</option>
            <option value="slots">Slots</option>
            <option value="sports_bet">Sports bet</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="field-inline">
          <span>Average bet size</span>
          <input
            type="number"
            name="betSize"
            min="1"
            value={form.betSize}
            onChange={handleChange}
            className="number-input"
          />
        </label>

        <label className="field-inline">
          <span>Plays per week</span>
          <input
            type="number"
            name="frequencyPerWeek"
            min="1"
            value={form.frequencyPerWeek}
            onChange={handleChange}
            className="number-input"
          />
        </label>

        <label className="field-inline">
          <span>Risk tolerance</span>
          <select
            name="riskTolerance"
            value={form.riskTolerance}
            onChange={handleChange}
            className="select-input"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-pill"
          style={{ marginTop: '0.5rem' }}
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
        {error && (
          <p className="callout callout--danger" style={{ marginTop: '0.75rem' }}>
            {error}
          </p>
        )}
      </form>

          {authUser ? (
            <div className="advisor-results">
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <h3 className="app-section-title" style={{ margin: 0 }}>
                  Your advisor history
                </h3>
                <button
                  type="button"
                  onClick={() => fetchSavedHistory()}
                  disabled={historyLoading}
                  className="btn btn-secondary btn-pill"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  {historyLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Signed-in runs are saved when you click Analyze (session cookie is sent). Open a past result below or
                use Summary for a printable page.
              </p>
              {historyError === 'unauthorized' && (
                <p className="callout callout--warn" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  Could not load history (not signed in or session expired).{' '}
                  <Link href="/login" className="app-link">
                    Sign in
                  </Link>{' '}
                  and refresh.
                </p>
              )}
              {historyError === 'failed' && (
                <div className="callout callout--warn" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 0.35rem' }}>
                    History could not be loaded. Check your connection and tap <strong>Refresh</strong>.
                  </p>
                  {historyErrorDetail ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: 'var(--warn-text)',
                        fontFamily: 'var(--font-mono)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {historyErrorDetail}
                    </p>
                  ) : null}
                </div>
              )}
              {historyLoading ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>Loading…</p>
              ) : savedHistory.length === 0 && !historyError ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>
                  No saved runs for this account yet — click <strong>Analyze</strong> while signed in to add one.
                  (Runs done before signing in are not linked to your account.)
                </p>
              ) : savedHistory.length === 0 ? null : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem', maxHeight: 280, overflowY: 'auto' }}>
                  {savedHistory.map((row) => (
                    <li
                      key={row.id}
                      className="history-item"
                    >
                      <span style={{ color: 'var(--text-secondary)', flex: '1 1 140px' }}>
                        {new Date(row.createdAt).toLocaleString()}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{gameTypeLabel(row.gameType)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>risk {row.riskScore}</span>
                      <button
                        type="button"
                        onClick={() => loadSavedAnalysis(row)}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.8rem', padding: 0, textDecoration: 'underline' }}
                      >
                        View
                      </button>
                      <Link
                        href={`/advisor/share/${row.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="app-link"
                        style={{ fontSize: '0.8rem' }}
                      >
                        Summary ↗
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>
              <Link href="/login" className="app-link">
                Sign in
              </Link>{' '}
              to keep a history of your analyses and open a one-page printable summary for each run.
            </p>
          )}
          </div>

      <section className="advisor-results">
        {result ? (
          <>
            <h2 className="app-section-title" style={{ fontSize: '1.25rem' }}>
              Analysis & charts
            </h2>
            {result.advice && (
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                {result.advice}
              </p>
            )}

            {authUser && (
              <div className="export-strip">
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                  Export PDF / summary
                </span>
                {usageId ? (
                  <>
                    <Link
                      href={`/advisor/share/${usageId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-pill"
                      style={{ fontSize: '0.85rem', textDecoration: 'none' }}
                    >
                      Open summary (print → Save as PDF)
                    </Link>
                    <button
                      type="button"
                      onClick={copySummaryLink}
                      className="btn btn-secondary btn-pill"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Copy summary link
                    </button>
                    {copyHint ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success-text)' }}>{copyHint}</span>
                    ) : null}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: '1 1 220px' }}>
                      On the summary page use <strong>Print / Save as PDF</strong>. The link only works while you are
                      signed in.
                    </span>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', flex: '1 1 240px' }}>
                      This run was not stored (or the server could not save it). You can still print this screen, or
                      try <strong>Analyze</strong> again after signing in.
                    </p>
                    <PrintSummaryButton label="Print this page → Save as PDF" />
                  </>
                )}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr)',
                gap: '1.25rem',
              }}
            >
              {chartData && (
                <div style={{ height: 260 }}>
                  <Bar data={chartData} options={chartOptions} />
                </div>
              )}

              {typeof result.expectedWeeklySpend === 'number' && spendChartData && (
                <div style={{ height: 260 }}>
                  <Bar data={spendChartData} options={spendChartOptions} />
                </div>
              )}
            </div>

            {/* Simple chatbot section */}
            <section style={{ marginTop: '2rem' }}>
              <h3 className="app-section-title" style={{ fontSize: '1.1rem' }}>
                Ask follow-up questions
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                Ask about your risk, safer habits, limits, or how to interpret the numbers.
              </p>

              <div ref={chatContainerRef} className="advisor-chat-box">
                {chatMessages.length === 0 && (
                  <p style={{ color: 'var(--text-faint)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    No messages yet. Try asking “How can I make this less risky?” or
                    “Is my weekly spend too high?”.
                  </p>
                )}
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`advisor-msg-row ${msg.role === 'user' ? 'advisor-msg-row--user' : ''}`}
                  >
                    <span
                      className={`advisor-bubble ${msg.role === 'user' ? 'advisor-bubble--user' : 'advisor-bubble--assistant'}`}
                    >
                      {msg.content}
                    </span>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleChatSubmit}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a follow-up question..."
                  className="input"
                  style={{ flex: 1, borderRadius: '999px' }}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="btn btn-primary btn-pill"
                >
                  {chatLoading ? 'Sending…' : 'Send'}
                </button>
              </form>
            </section>
          </>
        ) : (
          <div className="advisor-empty">
            Run an analysis to see charts, risk score, and start chatting.
          </div>
        )}
      </section>
        </div>
      </div>
    </main>
  );
}