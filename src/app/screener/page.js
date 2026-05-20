'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import {
  PGSI_QUESTIONS,
  PGSI_ANSWER_OPTIONS,
  PGSI_DISCLAIMER,
  scorePgsi,
} from '@/lib/pgsi';
import {
  BACK_HOME,
  GENERIC_ERROR,
  PGSI_INTRO,
  PGSI_PERIOD_HINT,
  PGSI_SUBMIT,
  PGSI_SUBMITTING,
  PGSI_TITLE,
  PGSI_TOTAL_SCORE,
  PGSI_YOUR_CATEGORY,
  PGSI_RESOURCES_TITLE,
  PGSI_RETAKE,
  PGSI_GO_ADVISOR,
  TOAST_VALIDATION_HINT,
} from '@/lib/strings';

const INITIAL_ANSWERS = Array(PGSI_QUESTIONS.length).fill(null);

export default function ScreenerPage() {
  const toast = useToast();
  const [answers, setAnswers] = useState(INITIAL_ANSWERS);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [result, setResult] = useState(null);

  const setAnswer = (index, value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const validate = () => {
    const next = {};
    answers.forEach((v, i) => {
      if (v === null || v === '') next[i] = 'Επίλεξε απάντηση.';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) {
      toast.error(TOAST_VALIDATION_HINT);
      return;
    }

    const numeric = answers.map((v) => Number(v));
    const local = scorePgsi(numeric);
    setLoading(true);

    try {
      const res = await fetch('/api/screener', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: numeric }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (data && data.error) || GENERIC_ERROR;
        setApiError(msg);
        toast.error(msg);
        setResult(local);
        return;
      }
      setResult(data);
    } catch {
      setApiError(GENERIC_ERROR);
      toast.error(GENERIC_ERROR);
      setResult(local);
    } finally {
      setLoading(false);
    }
  };

  const tierClass =
    result?.categoryKey === 'problem'
      ? 'pgsi-tier--problem'
      : result?.categoryKey === 'moderate_risk'
        ? 'pgsi-tier--moderate'
        : result?.categoryKey === 'low_risk'
          ? 'pgsi-tier--low'
          : 'pgsi-tier--none';

  return (
    <main id="main-content" className="app-shell app-shell--centered">
      <div className="app-card">
        <p style={{ marginBottom: '1rem' }}>
          <Link href="/" className="app-link app-link--subtle">
            {BACK_HOME}
          </Link>
          {' · '}
          <Link href="/advisor" className="app-link app-link--subtle">
            {PGSI_GO_ADVISOR}
          </Link>
        </p>

        <header style={{ marginBottom: '1.25rem' }}>
          <h1 className="app-title">{PGSI_TITLE}</h1>
          <p className="app-subtitle" style={{ maxWidth: 640 }}>
            {PGSI_INTRO}
          </p>
        </header>

        <p className="callout callout--muted pgsi-disclaimer" role="note">
          {PGSI_DISCLAIMER}
        </p>

        {!result ? (
          <form onSubmit={handleSubmit} className="panel pgsi-form" noValidate>
            <p className="pgsi-period-hint">{PGSI_PERIOD_HINT}</p>
            {Object.keys(errors).length > 0 ? (
              <p className="callout callout--warn" role="alert" aria-live="assertive">
                Συμπλήρωσε όλες τις ερωτήσεις πριν την υποβολή.
              </p>
            ) : null}

            <ol className="pgsi-questions">
              {PGSI_QUESTIONS.map((q, i) => (
                <li key={i} className="pgsi-question">
                  <fieldset>
                    <legend className="pgsi-question__text">
                      <span className="pgsi-question__num">{i + 1}.</span> {q}
                    </legend>
                    <div className="pgsi-options">
                      {PGSI_ANSWER_OPTIONS.map((opt) => (
                        <label key={opt.value} className="pgsi-option">
                          <input
                            type="radio"
                            name={`pgsi-q${i}`}
                            value={opt.value}
                            checked={answers[i] === opt.value}
                            onChange={() => setAnswer(i, opt.value)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {errors[i] ? (
                      <p className="field-error" role="alert">
                        {errors[i]}
                      </p>
                    ) : null}
                  </fieldset>
                </li>
              ))}
            </ol>

            <button type="submit" className="btn btn-primary btn-pill" disabled={loading}>
              {loading ? PGSI_SUBMITTING : PGSI_SUBMIT}
            </button>
            {apiError ? <p className="callout callout--danger">{apiError}</p> : null}
          </form>
        ) : (
          <section className="pgsi-results" aria-live="polite">
            <div className={`pgsi-tier-badge ${tierClass}`}>
              <span className="pgsi-tier-badge__category-text">
                {PGSI_YOUR_CATEGORY}: {result.category}
              </span>
              <span className="pgsi-tier-badge__score">{result.totalScore}</span>
              <span className="pgsi-tier-badge__meta">
                / 27 — {PGSI_YOUR_CATEGORY}: <strong>{result.category}</strong>
                {result.range ? ` (${result.range})` : null}
              </span>
            </div>

            <p className="pgsi-score-label">
              {PGSI_TOTAL_SCORE}: <strong>{result.totalScore}</strong> / 27
            </p>

            <p className="pgsi-explanation">{result.explanation}</p>

            <p className="callout callout--muted pgsi-disclaimer">{PGSI_DISCLAIMER}</p>

            {result.needsResources ? (
              <div className="callout callout--danger pgsi-resources">
                <h2 className="app-section-title" style={{ fontSize: '1rem', marginTop: 0 }}>
                  {PGSI_RESOURCES_TITLE}
                </h2>
                <ul>
                  <li>
                    <strong>ΚΕΘΕΑ-ΑΛΦΑ:</strong>{' '}
                    <a href="tel:2109215776" className="app-link">
                      210 9215776
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.kethea.gr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="app-link"
                    >
                      https://www.kethea.gr
                    </a>
                  </li>
                  <li>Γραμμή βοήθειας ψυχικής υγείας: <strong>1018</strong></li>
                </ul>
              </div>
            ) : null}

            <div className="pgsi-actions">
              <button
                type="button"
                className="btn btn-secondary btn-pill"
                onClick={() => {
                  setResult(null);
                  setAnswers(INITIAL_ANSWERS);
                  setErrors({});
                  setApiError(null);
                }}
              >
                {PGSI_RETAKE}
              </button>
              <Link href="/advisor" className="btn btn-primary btn-pill" style={{ textDecoration: 'none' }}>
                {PGSI_GO_ADVISOR}
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
