'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import AccessibleChart from '@/components/AccessibleChart';
import { useCountUp } from '@/hooks/useCountUp';
import { withBarEntryAnimation } from '@/lib/chart-animations';
import { riskTierTextLabel } from '@/lib/chart-a11y';
import { chartBaseOptions, getChartTheme } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

function DriverWhyButton({ source, highThreshold }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="risk-driver-why">
      <button
        type="button"
        className="risk-driver-why__btn"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Γιατί αυτός ο δείκτης;
      </button>
      {open ? (
        <span className="risk-driver-why__popover" role="tooltip">
          <strong>Κατώφλι «υψηλού»:</strong> {highThreshold}
          <br />
          <strong>Πηγή:</strong> {source}
        </span>
      ) : null}
    </span>
  );
}

export default function RiskScorePanel({ riskAssessment }) {
  const themeKey = useTheme();
  const breakdown = riskAssessment?.breakdown ?? [];
  const [animate, setAnimate] = useState(false);

  const scoreTarget = riskAssessment?.score ?? 0;
  const displayScore = useCountUp(scoreTarget, { duration: 800, active: animate });

  useEffect(() => {
    if (!riskAssessment?.breakdown?.length) return undefined;
    setAnimate(false);
    const t = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(t);
  }, [riskAssessment?.score, riskAssessment?.tier]);

  const maxContribution = useMemo(
    () => Math.max(1, ...breakdown.map((b) => b.contribution)),
    [breakdown],
  );

  const chartData = useMemo(() => {
    if (!breakdown.length) return null;
    return {
      labels: breakdown.map((b) => b.label),
      datasets: [
        {
          label: 'Συμβολή στο score (%)',
          data: breakdown.map((b) => b.contribution),
          backgroundColor: getChartTheme().bar1,
        },
      ],
    };
  }, [breakdown, themeKey]);

  const chartOptions = useMemo(() => {
    if (!breakdown.length) return null;
    const t = getChartTheme();
    const base = chartBaseOptions(t, 'Συμβολή ανά δείκτη');
    return withBarEntryAnimation({
      ...base,
      indexAxis: 'y',
      maintainAspectRatio: false,
      scales: {
        x: {
          max: Math.max(15, ...breakdown.map((b) => b.weight)) + 2,
          ticks: { color: t.textMuted },
          grid: { color: t.border },
        },
        y: { ticks: { color: t.textSecondary, font: { size: 11 } }, grid: { display: false } },
      },
    });
  }, [breakdown, themeKey]);

  if (!riskAssessment?.breakdown?.length) return null;

  const { tier, tierColor, topDrivers, recommendations, resources } = riskAssessment;

  const driverRows = breakdown
    .filter((b) => topDrivers.includes(b.label))
    .sort((a, b) => b.contribution - a.contribution);

  return (
    <section
      className={`risk-score-panel${animate ? ' risk-score-panel--animate' : ''}`}
      aria-labelledby="risk-score-heading"
    >
      <h3 id="risk-score-heading" className="app-section-title" style={{ fontSize: '1.1rem' }}>
        Αξιολόγηση κινδύνου (rule-based)
      </h3>

      <p className="callout callout--muted risk-score-disclaimer">
        Αυτή η αξιολόγηση είναι εκπαιδευτική. Για κλινική διάγνωση απαιτείται εξέταση από επαγγελματία
        ψυχικής υγείας. Δεν λαμβάνεται αυτοματοποιημένη απόφαση — μόνο πληροφορία για εσένα (GDPR
        άρθρο 22).
      </p>

      <div className={`risk-tier-badge risk-tier-badge--${tierColor || 'yellow'}`}>
        <span className="risk-tier-badge__tier-text">{riskTierTextLabel(tierColor)}</span>
        <span className="risk-tier-badge__score num">{Math.round(displayScore)}</span>
        <span className="risk-tier-badge__meta">
          / 100 — <strong>{tier}</strong> κίνδυνος
        </span>
      </div>

      <ul className="risk-breakdown-bars" aria-hidden={breakdown.length > 0 ? undefined : true}>
        {breakdown.map((row, i) => (
          <li key={row.indicator} className="risk-breakdown-bars__row">
            <div className="risk-breakdown-bars__head">
              <span>{row.label}</span>
              <span className="risk-breakdown-bars__value num">+{row.contribution}</span>
            </div>
            <span className="risk-breakdown-bars__track">
              <span
                className="risk-breakdown-bars__fill"
                style={{
                  '--bar-pct': `${(row.contribution / maxContribution) * 100}%`,
                  '--bar-delay': `${i * 50}ms`,
                }}
              />
            </span>
          </li>
        ))}
      </ul>

      <AccessibleChart
        title="Συμβολή ανά δείκτη στον δείκτη κινδύνου"
        chartData={chartData}
        valueSuffix="%"
        height={Math.min(420, 36 + breakdown.length * 28)}
      >
        <Bar data={chartData} options={chartOptions} />
      </AccessibleChart>

      {driverRows.length > 0 && (
        <div className="risk-top-drivers">
          <h4 className="app-eyebrow">Κύρια αποτελέσματα (top 3)</h4>
          <ul className="risk-top-drivers__list">
            {driverRows.map((row) => (
              <li key={row.indicator}>
                <span className="risk-top-drivers__label">
                  {row.label}{' '}
                  <strong className="num">(+{row.contribution})</strong>
                </span>
                <p className="risk-top-drivers__reason">{row.reason}</p>
                <DriverWhyButton source={row.source} highThreshold={row.highThreshold} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendations?.length > 0 && (
        <div className="risk-recommendations">
          <h4 className="app-eyebrow">Προτάσεις</h4>
          <ul>
            {recommendations.map((text) => (
              <li key={text.slice(0, 48)}>{text}</li>
            ))}
          </ul>
        </div>
      )}

      {resources?.length > 0 && (
        <div className="callout callout--danger risk-resources">
          <h4 className="app-eyebrow" style={{ marginTop: 0 }}>
            Πόροι υποστήριξης
          </h4>
          <ul>
            {resources.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
