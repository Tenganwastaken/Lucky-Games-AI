'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import SiteNav from '@/components/SiteNav';
import AccessibleChart from '@/components/AccessibleChart';
import {
  getGameById,
  HOUSE_EDGE_GAMES,
  HOUSE_EDGE_HORIZONS,
  expectedLossAmount,
  expectedNetOutcome,
  lossPerReferenceStake,
} from '@/lib/house-edge';
import { withLineEntryAnimation } from '@/lib/chart-animations';
import { chartBaseOptions, getChartTheme } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';
import {
  BACK_HOME,
  formatCurrency,
  HOUSE_EDGE_BET_LABEL,
  HOUSE_EDGE_BETS_LABEL,
  HOUSE_EDGE_CHART_TITLE,
  HOUSE_EDGE_DISCLAIMER,
  HOUSE_EDGE_GAME_LABEL,
  HOUSE_EDGE_HORIZON_LOSS,
  HOUSE_EDGE_INTRO,
  HOUSE_EDGE_RATIO,
  HOUSE_EDGE_SOURCE_NOTE,
  HOUSE_EDGE_TITLE,
} from '@/lib/strings';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const DEFAULT_GAME = 'sports';
const DEFAULT_BET = 10;
const DEFAULT_BETS = 30;
const REFERENCE_STAKE = 100;

export default function HouseEdgePage() {
  const themeKey = useTheme();
  const [gameId, setGameId] = useState(DEFAULT_GAME);
  const [betPerWager, setBetPerWager] = useState(DEFAULT_BET);
  const [betsPerMonth, setBetsPerMonth] = useState(DEFAULT_BETS);

  const game = useMemo(() => getGameById(gameId), [gameId]);
  const edge = game.edgeMid;

  const projections = useMemo(
    () =>
      HOUSE_EDGE_HORIZONS.map((h) => ({
        ...h,
        net: expectedNetOutcome(betPerWager, betsPerMonth, h.months, edge),
        loss: expectedLossAmount(betPerWager, betsPerMonth, h.months, edge),
      })),
    [betPerWager, betsPerMonth, edge],
  );

  const lossPer100 = lossPerReferenceStake(edge, REFERENCE_STAKE);

  const ratioText = HOUSE_EDGE_RATIO.replace('{loss}', formatCurrency(lossPer100)).replace(
    '{stake}',
    formatCurrency(REFERENCE_STAKE),
  );

  const chartData = useMemo(() => {
    const t = getChartTheme();
    return {
      labels: projections.map((p) => p.label),
      datasets: [
        {
          label: 'Αναμενόμενη απώλεια (€)',
          data: projections.map((p) => p.loss),
          borderColor: t.accent,
          backgroundColor: `${t.accent}33`,
          pointBackgroundColor: t.accent,
          pointBorderColor: t.surface,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          tension: 0.25,
        },
      ],
    };
  }, [projections, themeKey]);

  const chartOptions = useMemo(() => {
    const t = getChartTheme();
    const base = chartBaseOptions(t, HOUSE_EDGE_CHART_TITLE);
    return withLineEntryAnimation({
      ...base,
      maintainAspectRatio: false,
      plugins: {
        ...base.plugins,
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${formatCurrency(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: { ticks: { color: t.textMuted }, grid: { color: t.border } },
        y: {
          beginAtZero: true,
          ticks: {
            color: t.textMuted,
            callback: (v) => formatCurrency(Number(v)),
          },
          grid: { color: t.border },
          title: {
            display: true,
            text: 'Αναμενόμενη απώλεια',
            color: t.textSecondary,
            font: { size: 12 },
          },
        },
      },
    });
  }, [themeKey]);

  return (
    <main id="main-content" className="app-shell app-shell--centered">
      <div className="app-card app-card--article house-edge-page">
        <SiteNav />
        <p style={{ marginBottom: '1rem' }}>
          <Link href="/" className="app-link app-link--subtle">
            {BACK_HOME}
          </Link>
        </p>

        <header style={{ marginBottom: '1.25rem' }}>
          <h1 className="app-title">{HOUSE_EDGE_TITLE}</h1>
          <p className="app-subtitle" style={{ maxWidth: 640 }}>
            {HOUSE_EDGE_INTRO}
          </p>
        </header>

        <div className="house-edge-layout">
          <section className="panel house-edge-controls" aria-labelledby="house-edge-inputs-title">
            <h2 id="house-edge-inputs-title" className="app-section-title" style={{ fontSize: '1.05rem' }}>
              Παράμετροι
            </h2>

            <label className="field-inline house-edge-field">
              <span>{HOUSE_EDGE_GAME_LABEL}</span>
              <select
                className="select-input"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
              >
                {HOUSE_EDGE_GAMES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label} (house edge {g.edgeLabel})
                  </option>
                ))}
              </select>
              <p className="house-edge-meta">
                Μέση τιμή για υπολογισμό: <strong>{(edge * 100).toLocaleString('el-GR', { maximumFractionDigits: 2 })}%</strong>
                {' · '}
                {game.source}
              </p>
            </label>

            <div className="advisor-slider-field house-edge-slider">
              <label htmlFor="house-edge-bet" className="advisor-slider-head">
                <span>{HOUSE_EDGE_BET_LABEL}</span>
                <strong>{formatCurrency(betPerWager)}</strong>
              </label>
              <input
                id="house-edge-bet"
                type="range"
                className="advisor-range"
                min={1}
                max={500}
                step={1}
                value={betPerWager}
                onChange={(e) => setBetPerWager(Number(e.target.value))}
              />
            </div>

            <div className="advisor-slider-field house-edge-slider">
              <label htmlFor="house-edge-bets" className="advisor-slider-head">
                <span>{HOUSE_EDGE_BETS_LABEL}</span>
                <strong>{betsPerMonth}</strong>
              </label>
              <input
                id="house-edge-bets"
                type="range"
                className="advisor-range"
                min={1}
                max={300}
                step={1}
                value={betsPerMonth}
                onChange={(e) => setBetsPerMonth(Number(e.target.value))}
              />
            </div>

            <p className="callout callout--muted house-edge-disclaimer">{HOUSE_EDGE_DISCLAIMER}</p>
          </section>

          <section className="panel house-edge-results" aria-labelledby="house-edge-results-title">
            <h2 id="house-edge-results-title" className="app-section-title" style={{ fontSize: '1.05rem' }}>
              Προβολή στο χρόνο
            </h2>

            <p className="house-edge-ratio">{ratioText}</p>

            <AccessibleChart title={HOUSE_EDGE_CHART_TITLE} chartData={chartData} valueSuffix=" €" height={280}>
              <Line data={chartData} options={chartOptions} />
            </AccessibleChart>

            <ul className="house-edge-horizons">
              {projections.map((p) => (
                <li key={p.id} className="house-edge-horizon-card">
                  <span className="house-edge-horizon-card__label">{p.label}</span>
                  <span className="house-edge-horizon-card__loss">
                    {HOUSE_EDGE_HORIZON_LOSS.replace('{amount}', formatCurrency(p.loss))}
                  </span>
                  <span className="house-edge-horizon-card__net">
                    Καθαρό: {formatCurrency(p.net)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="house-edge-source">{HOUSE_EDGE_SOURCE_NOTE}</p>
      </div>
    </main>
  );
}
