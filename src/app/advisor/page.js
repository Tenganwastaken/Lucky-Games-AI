'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
    setAuthUser(null);
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

      setResult(data);
      setHistory((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          input: { ...form },
          output: data,
        },
      ]);
      setChatMessages([]);
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
          backgroundColor: ['#16a34a', '#dc2626', '#2563eb'],
        },
      ],
    });

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Risk & Probabilities',
      },
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
          backgroundColor: ['#0ea5e9', '#6366f1'],
        },
      ],
    });

  const spendChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Spending projection',
      },
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
          maxWidth: 1100,
          borderRadius: '1.5rem',
          padding: '2rem',
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98))',
          boxShadow:
            '0 24px 60px rgba(15,23,42,0.35), 0 0 0 1px rgba(148,163,184,0.2)',
        }}
      >
        <p style={{ marginBottom: '1rem' }}>
          <Link
            href="/"
            style={{ color: '#2563eb', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}
          >
            ← Lucky Games home
          </Link>
        </p>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '2.1rem',
                marginBottom: '0.25rem',
                color: '#0f172a',
                letterSpacing: '-0.03em',
              }}
            >
              Risk advisor
            </h1>
            <p style={{ color: '#64748b', maxWidth: 520 }}>
              Enter how you play and get an AI-assisted risk overview, spending projection,
              and follow-up advice.
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.65rem',
            }}
          >
            {authLoading ? (
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Checking session…</span>
            ) : authUser ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.85rem', color: '#475569', textAlign: 'right' }}>
                  Signed in as <strong style={{ color: '#0f172a' }}>{authUser.email}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#b91c1c',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Log out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                <Link
                  href="/login"
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1d4ed8',
                    textDecoration: 'none',
                  }}
                >
                  Sign in →
                </Link>
                <Link
                  href="/register"
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1d4ed8',
                    textDecoration: 'none',
                  }}
                >
                  Create account →
                </Link>
              </div>
            )}
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '999px',
                background: 'rgba(37,99,235,0.06)',
                border: '1px solid rgba(129,140,248,0.35)',
                color: '#1d4ed8',
                fontSize: '0.85rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '999px',
                  background: '#22c55e',
                  boxShadow: '0 0 0 4px rgba(34,197,94,0.25)',
                }}
              />
              AI-powered insights (Gemini free tier)
            </div>
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.4fr)',
            gap: '1.75rem',
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'grid',
              gap: '1rem',
              padding: '1.5rem',
              borderRadius: '1rem',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
            }}
          >
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '0.25rem',
              }}
            >
              Your playing pattern
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Adjust the fields and click Analyze to update the charts and advice. Each run is saved for the
              live map on the home page (country from your account or IP; dev override below).
            </p>
            {IS_DEV && (
              <label
                style={{
                  display: 'grid',
                  gap: '0.25rem',
                  fontSize: '0.85rem',
                  marginBottom: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: '#fffbeb',
                  border: '1px solid #fcd34d',
                  color: '#92400e',
                }}
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
                  style={{ padding: '0.4rem', borderRadius: '0.35rem', border: '1px solid #d97706', maxWidth: 120 }}
                />
              </label>
            )}
        <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.95rem' }}>
          <span>Game type</span>
          <select
            name="gameType"
            value={form.gameType}
            onChange={handleChange}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d4d4d8' }}
          >
            <option value="lottery">Lottery</option>
            <option value="slots">Slots</option>
            <option value="sports_bet">Sports bet</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.95rem' }}>
          <span>Average bet size</span>
          <input
            type="number"
            name="betSize"
            min="1"
            value={form.betSize}
            onChange={handleChange}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d4d4d8' }}
          />
        </label>

        <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.95rem' }}>
          <span>Plays per week</span>
          <input
            type="number"
            name="frequencyPerWeek"
            min="1"
            value={form.frequencyPerWeek}
            onChange={handleChange}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d4d4d8' }}
          />
        </label>

        <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.95rem' }}>
          <span>Risk tolerance</span>
          <select
            name="riskTolerance"
            value={form.riskTolerance}
            onChange={handleChange}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #d4d4d8' }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '0.5rem',
            padding: '0.8rem 1.1rem',
            borderRadius: '999px',
            border: 'none',
            background: loading
              ? 'linear-gradient(to right, #9ca3af, #6b7280)'
              : 'linear-gradient(to right, #2563eb, #4f46e5)',
            color: 'white',
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            boxShadow: loading
              ? 'none'
              : '0 12px 24px rgba(37,99,235,0.35)',
            transition: 'transform 0.08s ease, box-shadow 0.08s ease',
          }}
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
        {error && (
          <p style={{ color: '#dc2626', marginTop: '0.75rem', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}
      </form>

      <section
        style={{
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
        }}
      >
        {result ? (
          <>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#0f172a' }}>
              Analysis & charts
            </h2>
            {result.advice && (
              <p style={{ marginBottom: '1rem', color: '#1e293b' }}>
                {result.advice}
              </p>
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
              <h3
                style={{
                  fontSize: '1.1rem',
                  marginBottom: '0.4rem',
                  color: '#0f172a',
                }}
              >
                Ask follow-up questions
              </h3>
              <p style={{ color: '#64748b', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                Ask about your risk, safer habits, limits, or how to interpret the numbers.
              </p>

              <div
                ref={chatContainerRef}
                style={{
                  padding: '0.85rem',
                  borderRadius: '0.9rem',
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  marginBottom: '0.75rem',
                }}
              >
                {chatMessages.length === 0 && (
                  <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    No messages yet. Try asking “How can I make this less risky?” or
                    “Is my weekly spend too high?”.
                  </p>
                )}
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: '0.5rem',
                      textAlign: msg.role === 'user' ? 'right' : 'left',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.85rem',
                        background:
                          msg.role === 'user'
                            ? 'linear-gradient(to right, #2563eb, #4f46e5)'
                            : '#e5e7eb',
                        color: msg.role === 'user' ? '#ffffff' : '#111827',
                        maxWidth: '80%',
                        fontSize: '0.9rem',
                      }}
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
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.85rem',
                    borderRadius: '999px',
                    border: '1px solid #d4d4d8',
                    fontSize: '0.95rem',
                  }}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  style={{
                    padding: '0.55rem 0.95rem',
                    borderRadius: '999px',
                    border: 'none',
                    background: chatLoading
                      ? '#9ca3af'
                      : 'linear-gradient(to right, #16a34a, #22c55e)',
                    color: 'white',
                    fontWeight: 600,
                    cursor: chatLoading ? 'default' : 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '0.95rem',
                  }}
                >
                  {chatLoading ? 'Sending…' : 'Send'}
                </button>
              </form>
            </section>
          </>
        ) : (
          <div
            style={{
              height: '100%',
              minHeight: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.9rem',
              border: '1px dashed #e2e8f0',
              background: '#f8fafc',
              color: '#94a3b8',
              fontSize: '0.95rem',
              textAlign: 'center',
              padding: '1.5rem',
            }}
          >
            Run an analysis to see charts, risk score, and start chatting.
          </div>
        )}
      </section>
        </div>
      </div>
    </main>
  );
}