'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { gameTypeLabel, primaryGameTypeLabel } from '@/lib/advisor-labels';
import { DEFAULT_FORM_DATA } from '@/lib/risk-assessment-form';
import AdvisorRiskForm from '@/components/advisor/AdvisorRiskForm';
import RiskScorePanel from '@/components/advisor/RiskScorePanel';
import PrintSummaryButton from '@/components/PrintSummaryButton';
import LimitSettingDemo from '@/components/LimitSettingDemo';
import Skeleton from '@/components/Skeleton';
import AccessibleChart from '@/components/AccessibleChart';
import EmptyState from '@/components/EmptyState';
import AnalysisEmptyIllustration from '@/components/illustrations/AnalysisEmptyIllustration';
import { useToast } from '@/components/Toast';
import {
  AI_INSIGHTS_GEMINI,
  ANALYSIS_AND_CHARTS,
  ANALYZE,
  ANALYZING,
  ASK_FOLLOW_UP,
  ASK_FOLLOW_UP_HINT,
  AVERAGE_BET_SIZE,
  BACK_HOME_ADVISOR,
  CHART_AMOUNT,
  CHART_LOSS_CHANCE,
  CHART_MONTHLY_SPEND,
  CHART_PERCENT_SCORE,
  CHART_RISK_PROBABILITIES,
  CHART_WEEKLY_SPEND,
  CHART_WIN_CHANCE,
  CHAT_EMPTY,
  CHAT_ERROR_PREFIX,
  CHAT_PLACEHOLDER,
  COPY_SUMMARY_LINK,
  CREATE_ACCOUNT_ARROW,
  DEV_MAP_COUNTRY,
  DEV_MAP_PLACEHOLDER,
  EXPORT_PDF_SUMMARY,
  GAME_TYPE,
  GAME_TYPE_LABELS,
  GENERIC_ERROR,
  HISTORY_EMPTY,
  HISTORY_EMPTY_CTA,
  HISTORY_FAILED,
  HISTORY_HINT,
  HISTORY_UNAUTHORIZED,
  INVALID_SERVER_RESPONSE,
  LINK_COPIED,
  LINK_COPY_FAILED,
  LOADING,
  NETWORK_ERROR_HISTORY,
  OPEN_SUMMARY_PRINT,
  PLAYS_PER_WEEK,
  PRINT_THIS_PAGE,
  REFRESH,
  REFRESHING,
  RISK_ADVISOR_TITLE,
  RISK_LABEL,
  RISK_SCORE,
  RISK_TOLERANCE,
  RISK_TOLERANCE_LABELS,
  RUN_ANALYSIS_EMPTY,
  RUN_NOT_STORED,
  TOAST_ANALYSIS_SUCCESS,
  SEND,
  SENDING,
  SERVER_UNREACHABLE,
  SIGN_IN_ARROW,
  SIGN_IN_FOR_HISTORY,
  SIGNED_IN_AS,
  SPENDING_PROJECTION,
  SUMMARY_LINK,
  SUMMARY_PRINT_HINT,
  VIEW,
  YOUR_ADVISOR_HISTORY,
  YOUR_PLAYING_PATTERN,
  ADVISOR_DISCLAIMER,
  ADVISOR_INTRO,
  ADVISOR_PGSI_CTA,
  BIASES_LINK,
  LIMIT_CHART_LINE_LABEL,
  NAV_SIGN_IN,
  NAV_SIGN_OUT,
  formatCurrency,
  formatDateTime,
} from '@/lib/strings';
import { withBarEntryAnimation } from '@/lib/chart-animations';
import { chartBaseOptions, getChartTheme, readCssVar } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';
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

const weeklyLossLimitLinePlugin = {
  id: 'weeklyLossLimitLine',
  afterDatasetsDraw(chart) {
    const limit = chart.options.plugins?.weeklyLossLimitLine?.limit;
    if (limit == null || !Number.isFinite(limit)) return;
    const { ctx, chartArea, scales } = chart;
    const yScale = scales.y;
    if (!yScale || !chartArea) return;
    const y = yScale.getPixelForValue(limit);
    if (y < chartArea.top || y > chartArea.bottom) return;
    ctx.save();
    ctx.strokeStyle = readCssVar('--error');
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(chartArea.left, y);
    ctx.lineTo(chartArea.right, y);
    ctx.stroke();
    ctx.fillStyle = readCssVar('--error');
    ctx.font = '11px var(--font-sans), sans-serif';
    ctx.fillText(`${LIMIT_CHART_LINE_LABEL}: ${formatCurrency(limit)}`, chartArea.left + 6, y - 6);
    ctx.restore();
  },
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  weeklyLossLimitLinePlugin,
);

const IS_DEV = process.env.NODE_ENV === 'development';

export default function AdvisorPage() {
  const themeKey = useTheme();
  const toast = useToast();
  const [formData, setFormData] = useState({ ...DEFAULT_FORM_DATA });
  const [formKey, setFormKey] = useState(0);
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
  const [weeklyLossLimit, setWeeklyLossLimit] = useState(null);

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
        setHistoryErrorDetail(typeof detail === 'string' ? detail : INVALID_SERVER_RESPONSE);
        return;
      }
      const data = await res.json().catch(() => null);
      if (!data || !Array.isArray(data.items)) {
        setSavedHistory([]);
        setHistoryError('failed');
        setHistoryErrorDetail(INVALID_SERVER_RESPONSE);
        return;
      }
      setSavedHistory(data.items);
    } catch (e) {
      setSavedHistory([]);
      setHistoryError('failed');
      const detail =
        e instanceof TypeError && e.message === 'Failed to fetch'
          ? NETWORK_ERROR_HISTORY
          : SERVER_UNREACHABLE;
      setHistoryErrorDetail(detail);
      toast.error(detail);
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

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
    if (row.kind === 'risk' && row.formSnapshot) {
      setFormData({
        ...DEFAULT_FORM_DATA,
        ...row.formSnapshot,
        avgWagerEuro: row.formSnapshot.avgWagerEuro ?? '',
        weeklyTotalEuro: row.formSnapshot.weeklyTotalEuro ?? '',
      });
    } else if (row.formSnapshot) {
      setFormData({
        ...DEFAULT_FORM_DATA,
        primaryGameType: row.formSnapshot.gameType || 'lottery',
        avgWagerEuro: row.formSnapshot.betSize ?? '',
        daysPerMonth: Math.min(30, Math.round((row.formSnapshot.frequencyPerWeek || 1) * 4)),
      });
    }
    setFormKey((k) => k + 1);
    let riskAssessment = row.riskAssessment ?? null;
    if (!riskAssessment && row.riskFactors?.length && row.riskFactors[0]?.contribution != null) {
      riskAssessment = {
        score: row.riskScore,
        breakdown: row.riskFactors,
        topDrivers: [],
        recommendations: [],
      };
    }
    setResult({
      advice: row.advice,
      riskScore: row.riskScore,
      riskTier: row.riskTier,
      winChanceEstimate: row.winChanceEstimate,
      lossChanceEstimate: row.lossChanceEstimate,
      expectedWeeklySpend: row.expectedWeeklySpend,
      riskAssessment,
      riskFactors: row.riskFactors ?? [],
      input: row.formSnapshot,
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
      setCopyHint(LINK_COPIED);
      toast.success(LINK_COPIED);
      setTimeout(() => setCopyHint(''), 2500);
    } catch {
      setCopyHint(LINK_COPY_FAILED);
      toast.error(LINK_COPY_FAILED);
      setTimeout(() => setCopyHint(''), 2500);
    }
  };

  const handleAnalyze = async (submittedForm) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setUsageId(null);
    setFormData(submittedForm);

    try {
      const payload = { ...submittedForm };
      if (IS_DEV && /^[a-zA-Z]{2}$/.test((devCountryCode || '').trim())) {
        payload.debugCountryCode = devCountryCode.trim().toUpperCase();
      }

      const res = await fetch('/api/advisor/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          (data && (data.errors && Object.values(data.errors)[0]) ||
            data?.error ||
            data?.message) ||
          `Request failed with status ${res.status}`;
        console.error('API error:', message, 'details:', data);
        setError(message);
        toast.error(message);
        return;
      }

      const { assessmentId, usageId: newUsageId, input, ...rest } = data;
      setResult({ ...rest, input });
      toast.success(TOAST_ANALYSIS_SUCCESS);
      const idStr =
        (assessmentId ?? newUsageId) != null && String(assessmentId ?? newUsageId).trim() !== ''
          ? String(assessmentId ?? newUsageId)
          : null;
      setUsageId(idStr);
      setChatMessages([]);
      await fetchSavedHistory();
    } catch (err) {
      console.error(err);
      setError(GENERIC_ERROR);
      toast.error(GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleValidationError = (validationErrors) => {
    const first = Object.values(validationErrors).find(Boolean);
    if (first) toast.error(first);
  };

  const chartData = useMemo(() => {
    if (!result) return null;
    const t = getChartTheme();
    return {
      labels: [CHART_WIN_CHANCE, CHART_LOSS_CHANCE, RISK_SCORE],
      datasets: [
        {
          label: CHART_PERCENT_SCORE,
          data: [
            result.winChanceEstimate ?? 0,
            result.lossChanceEstimate ?? 0,
            result.riskScore ?? 0,
          ],
          backgroundColor: [t.bar1, t.bar2, t.bar3],
        },
      ],
    };
  }, [result, themeKey]);

  const chartOptions = useMemo(() => {
    const t = getChartTheme();
    return withBarEntryAnimation(chartBaseOptions(t, CHART_RISK_PROBABILITIES));
  }, [themeKey]);

  const spendChartData = useMemo(() => {
    if (!result) return null;
    const t = getChartTheme();
    return {
      labels: [CHART_WEEKLY_SPEND, CHART_MONTHLY_SPEND],
      datasets: [
        {
          label: CHART_AMOUNT,
          data: [
            result.expectedWeeklySpend ?? 0,
            (result.expectedWeeklySpend ?? 0) * 4,
          ],
          backgroundColor: [t.bar1, t.barMuted],
        },
      ],
    };
  }, [result, themeKey]);

  const spendChartOptions = useMemo(() => {
    const t = getChartTheme();
    const weekly = result?.expectedWeeklySpend ?? 0;
    const monthly = weekly * 4;
    const yMax =
      weeklyLossLimit != null
        ? Math.max(weekly, monthly, weeklyLossLimit) * 1.15
        : undefined;
    return withBarEntryAnimation({
      ...chartBaseOptions(t, SPENDING_PROJECTION),
      plugins: {
        ...chartBaseOptions(t, SPENDING_PROJECTION).plugins,
        weeklyLossLimitLine: {
          limit: weeklyLossLimit ?? undefined,
        },
      },
      scales: {
        x: { ticks: { color: t.textMuted }, grid: { color: t.border } },
        y: {
          max: yMax,
          ticks: {
            color: t.textMuted,
            callback: (value) => formatCurrency(value),
          },
          grid: { color: t.border },
        },
      },
    });
  }, [result, weeklyLossLimit, themeKey]);

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
            formData: result.input ?? formData,
            input: result.input ?? formData,
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
          { role: 'assistant', content: `${CHAT_ERROR_PREFIX} ${message}` },
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
        { role: 'assistant', content: GENERIC_ERROR },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <main id="main-content" className="app-shell app-shell--centered">
      <div className="app-card">
        <p style={{ marginBottom: '1rem' }}>
          <Link href="/" className="app-link app-link--subtle">
            {BACK_HOME_ADVISOR}
          </Link>
        </p>
        <header className="app-header-row">
          <div>
            <h1 className="app-title">{RISK_ADVISOR_TITLE}</h1>
            <p className="app-subtitle" style={{ maxWidth: 520 }}>
              {ADVISOR_INTRO}
            </p>
          </div>
          <div className="app-header-actions">
            {authLoading ? (
              <Skeleton width={140} height={14} style={{ borderRadius: 999 }} />
            ) : authUser ? (
              <div className="app-header-actions--stack">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {SIGNED_IN_AS} <strong style={{ color: 'var(--text)' }}>{authUser.email}</strong>
                </span>
                <button type="button" onClick={handleLogout} className="app-nav__btn">
                  {NAV_SIGN_OUT}
                </button>
              </div>
            ) : (
              <div className="app-header-actions--stack" style={{ gap: '0.35rem' }}>
                <Link href="/login" className="app-link">
                  {SIGN_IN_ARROW}
                </Link>
                <Link href="/register" className="app-link">
                  {CREATE_ACCOUNT_ARROW}
                </Link>
              </div>
            )}
            <div className="badge-soft">
              <span className="badge-soft__dot" aria-hidden />
              {AI_INSIGHTS_GEMINI}
            </div>
          </div>
        </header>

        <div className="advisor-header-ctas">
          <p className="advisor-pgsi-cta">
            <Link href="/screener" className="advisor-pgsi-cta__link">
              {ADVISOR_PGSI_CTA}
            </Link>
          </p>
          <p className="advisor-pgsi-cta">
            <Link href="/biases" className="advisor-pgsi-cta__link advisor-pgsi-cta__link--biases">
              {BIASES_LINK}
            </Link>
          </p>
        </div>

        <p className="callout callout--warn advisor-disclaimer-banner" role="note">
          {ADVISOR_DISCLAIMER}
        </p>

        <div className="advisor-layout">
          <div className="advisor-stack">

          <LimitSettingDemo
            analysisResult={result}
            onLimitChange={setWeeklyLossLimit}
          />

          {authLoading ? (
            <Skeleton variant="form" />
          ) : (
            <AdvisorRiskForm
              key={formKey}
              onSubmit={handleAnalyze}
              loading={loading}
              error={error}
              devCountryCode={devCountryCode}
              onDevCountryChange={setDevCountryCode}
              onValidationError={handleValidationError}
            />
          )}

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
                <h2 className="app-section-title" style={{ margin: 0 }}>
                  {YOUR_ADVISOR_HISTORY}
                </h2>
                <button
                  type="button"
                  onClick={() => fetchSavedHistory()}
                  disabled={historyLoading}
                  className="btn btn-secondary btn-pill"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  {historyLoading ? REFRESHING : REFRESH}
                </button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {HISTORY_HINT}
              </p>
              {historyError === 'unauthorized' && (
                <p className="callout callout--warn" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  {HISTORY_UNAUTHORIZED}{' '}
                  <Link href="/login" className="app-link">
                    {NAV_SIGN_IN}
                  </Link>{' '}
                  και ανανέωσε.
                </p>
              )}
              {historyError === 'failed' && (
                <div className="callout callout--warn" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 0.35rem' }}>
                    {HISTORY_FAILED} <strong>{REFRESH}</strong>.
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
                <p style={{ fontSize: '0.85rem', color: 'var(--text-faint)' }}>{LOADING}</p>
              ) : savedHistory.length === 0 && !historyError ? (
                <EmptyState
                  className="history-empty"
                  description={HISTORY_EMPTY}
                  action={
                    <Link href="/advisor" className="app-link">
                      {HISTORY_EMPTY_CTA}
                    </Link>
                  }
                />
              ) : savedHistory.length === 0 ? null : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem', maxHeight: 280, overflowY: 'auto' }}>
                  {savedHistory.map((row) => (
                    <li
                      key={row.id}
                      className="history-item"
                    >
                      <span style={{ color: 'var(--text-secondary)', flex: '1 1 140px' }}>
                        {formatDateTime(row.createdAt)}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {row.primaryGameType
                          ? primaryGameTypeLabel(row.primaryGameType)
                          : gameTypeLabel(row.gameType)}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {RISK_LABEL} {row.riskScore}
                      </span>
                      <button
                        type="button"
                        onClick={() => loadSavedAnalysis(row)}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.8rem', padding: 0, textDecoration: 'underline' }}
                      >
                        {VIEW}
                      </button>
                      <Link
                        href={`/advisor/share/${row.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="app-link"
                        style={{ fontSize: '0.8rem' }}
                      >
                        {SUMMARY_LINK}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>
              <Link href="/login" className="app-link">
                {NAV_SIGN_IN}
              </Link>{' '}
              {SIGN_IN_FOR_HISTORY}
            </p>
          )}
          </div>

      <section className="advisor-results" aria-live="polite">
        {loading ? (
          <div role="status" aria-live="polite" aria-busy="true">
            <Skeleton width="45%" height={22} style={{ marginBottom: '1rem' }} />
            <Skeleton variant="chart-bar" />
            <Skeleton variant="chart-bar" />
          </div>
        ) : result ? (
          <>
            <h2 className="app-section-title" style={{ fontSize: '1.25rem' }}>
              {ANALYSIS_AND_CHARTS}
            </h2>
            {result.advice && (
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                {result.advice}
              </p>
            )}

            {result.riskAssessment && <RiskScorePanel riskAssessment={result.riskAssessment} />}

            {authUser && (
              <div className="export-strip">
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                  {EXPORT_PDF_SUMMARY}
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
                      {OPEN_SUMMARY_PRINT}
                    </Link>
                    <button
                      type="button"
                      onClick={copySummaryLink}
                      className="btn btn-secondary btn-pill"
                      style={{ fontSize: '0.85rem' }}
                    >
                      {COPY_SUMMARY_LINK}
                    </button>
                    {copyHint ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success-text)' }}>{copyHint}</span>
                    ) : null}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: '1 1 220px' }}>
                      {SUMMARY_PRINT_HINT}
                    </span>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', flex: '1 1 240px' }}>
                      {RUN_NOT_STORED}
                    </p>
                    <PrintSummaryButton label={PRINT_THIS_PAGE} />
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
                <AccessibleChart
                  title={CHART_RISK_PROBABILITIES}
                  chartData={chartData}
                  valueSuffix="%"
                >
                  <Bar data={chartData} options={chartOptions} />
                </AccessibleChart>
              )}

              {typeof result.expectedWeeklySpend === 'number' && spendChartData && (
                <AccessibleChart title={SPENDING_PROJECTION} chartData={spendChartData} valueSuffix=" €">
                  <Bar data={spendChartData} options={spendChartOptions} />
                </AccessibleChart>
              )}
            </div>

            {/* Simple chatbot section */}
            <section style={{ marginTop: '2rem' }}>
              <h3 className="app-section-title" style={{ fontSize: '1.1rem' }}>
                {ASK_FOLLOW_UP}
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                {ASK_FOLLOW_UP_HINT}
              </p>

              <div
                ref={chatContainerRef}
                className="advisor-chat-box"
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-label="Συνομιλία με σύμβουλο"
              >
                {chatMessages.length === 0 && (
                  <p style={{ color: 'var(--text-faint)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    {CHAT_EMPTY}
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
                  placeholder={CHAT_PLACEHOLDER}
                  className="input"
                  style={{ flex: 1, borderRadius: '999px' }}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="btn btn-primary btn-pill"
                >
                  {chatLoading ? SENDING : SEND}
                </button>
              </form>
            </section>
          </>
        ) : (
          <div className="advisor-empty">
            <EmptyState
              illustration={<AnalysisEmptyIllustration />}
              description={RUN_ANALYSIS_EMPTY}
            />
          </div>
        )}
      </section>
        </div>
      </div>
    </main>
  );
}