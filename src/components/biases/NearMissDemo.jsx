'use client';

import { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import AccessibleChart from '@/components/AccessibleChart';
import { withBarEntryAnimation } from '@/lib/chart-animations';
import { chartBaseOptions, getChartTheme } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';
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

const SYMBOLS = ['🍒', '🍋', '⭐', '7️⃣', '🔔', '💎'];
const SPINS_PER_MODE = 30;

function pickDistinct(count) {
  const pool = [...SYMBOLS];
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function spinReels(mode) {
  if (Math.random() < 0.12) {
    const s = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    return { reels: [s, s, s], type: 'win' };
  }

  if (mode === 'near' && Math.random() < 0.7) {
    const pair = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    let third;
    do {
      third = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    } while (third === pair);
    const pos = Math.floor(Math.random() * 3);
    const reels = [pair, pair, pair];
    reels[pos] = third;
    return { reels, type: 'near-miss' };
  }

  return { reels: pickDistinct(3), type: 'loss' };
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export default function NearMissDemo({ state, onChange }) {
  const themeKey = useTheme();
  const [phase, setPhase] = useState(state.phase ?? 'clean');
  const [spinIndex, setSpinIndex] = useState(state.spinIndex ?? 0);
  const [cleanScores, setCleanScores] = useState(state.cleanScores ?? []);
  const [nearScores, setNearScores] = useState(state.nearScores ?? []);
  const [engagement, setEngagement] = useState(state.currentEngagement ?? 5);
  const [lastReels, setLastReels] = useState(state.lastReels);
  const [pendingSpin, setPendingSpin] = useState(null);
  const [completed, setCompleted] = useState(state.completed ?? false);

  const persist = (patch) => {
    const next = {
      phase: patch.phase ?? phase,
      spinIndex: patch.spinIndex ?? spinIndex,
      cleanScores: patch.cleanScores ?? cleanScores,
      nearScores: patch.nearScores ?? nearScores,
      currentEngagement: patch.currentEngagement ?? engagement,
      lastReels: patch.lastReels ?? lastReels,
      completed: patch.completed ?? completed,
    };
    onChange(next);
  };

  const modeLabel = phase === 'clean' ? 'Καθαρές απώλειες' : 'Near-misses';
  const scores = phase === 'clean' ? cleanScores : nearScores;

  const doSpin = () => {
    const outcome = spinReels(phase);
    setLastReels(outcome);
    setPendingSpin(outcome);
    persist({ lastReels: outcome });
  };

  const submitEngagement = () => {
    if (!pendingSpin) return;
    const score = Number(engagement);
    const nextClean = phase === 'clean' ? [...cleanScores, score] : cleanScores;
    const nextNear = phase === 'near' ? [...nearScores, score] : nearScores;
    const nextIndex = spinIndex + 1;

    setPendingSpin(null);

    if (nextIndex >= SPINS_PER_MODE) {
      if (phase === 'clean') {
        setCleanScores(nextClean);
        setPhase('near');
        setSpinIndex(0);
        setEngagement(5);
        persist({
          cleanScores: nextClean,
          phase: 'near',
          spinIndex: 0,
          currentEngagement: 5,
          lastReels: null,
        });
        setLastReels(null);
        return;
      }

      setNearScores(nextNear);
      setCompleted(true);
      persist({
        nearScores: nextNear,
        cleanScores: nextClean,
        completed: true,
        spinIndex: nextIndex,
      });
      setSpinIndex(nextIndex);
      return;
    }

    if (phase === 'clean') setCleanScores(nextClean);
    else setNearScores(nextNear);
    setSpinIndex(nextIndex);
    setEngagement(5);
    persist({
      cleanScores: nextClean,
      nearScores: nextNear,
      spinIndex: nextIndex,
      currentEngagement: 5,
      lastReels: null,
    });
    setLastReels(null);
  };

  const reset = () => {
    setPhase('clean');
    setSpinIndex(0);
    setCleanScores([]);
    setNearScores([]);
    setEngagement(5);
    setLastReels(null);
    setPendingSpin(null);
    setCompleted(false);
    onChange({
      phase: 'clean',
      spinIndex: 0,
      cleanScores: [],
      nearScores: [],
      currentEngagement: 5,
      lastReels: null,
      completed: false,
    });
  };

  const chartData = useMemo(() => {
    const t = getChartTheme();
    const cleanMean = mean(cleanScores);
    const nearMean = mean(nearScores);
    return {
      labels: ['Καθαρές απώλειες', 'Near-misses (70%)'],
      datasets: [
        {
          label: 'Μέσο «θέλω να παίξω άλλη φορά» (1–10)',
          data: [cleanMean, nearMean],
          backgroundColor: [t.bar2, t.accent],
        },
      ],
    };
  }, [cleanScores, nearScores, themeKey]);

  const chartOptions = useMemo(() => {
    const t = getChartTheme();
    const base = chartBaseOptions(t, 'Σύγκριση engagement score (μέσος όρος 30 spins)');
    return withBarEntryAnimation({
      ...base,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { stepSize: 1, color: t.textMuted },
          grid: { color: t.border },
        },
        x: { ticks: { color: t.textSecondary }, grid: { display: false } },
      },
    });
  }, [themeKey]);

  return (
    <section className="bias-demo" aria-labelledby="bias-nearmiss-title">
      <h2 id="bias-nearmiss-title" className="bias-demo__title">
        2. Near-miss effect
      </h2>
      <p className="bias-demo__lead">
        Mini κουλοχέρης 3 κυλίνδρων. Πρώτα 30 spins με καθαρές απώλειες, μετά 30 με near-misses. Μετά
        από κάθε spin δήλωσε πόσο θέλεις να συνεχίσεις (1–10).
      </p>

      {!completed ? (
        <div className="bias-slot-panel">
          <p className="bias-slot-mode">
            <strong>Λειτουργία:</strong> {modeLabel} — spin {Math.min(spinIndex + 1, SPINS_PER_MODE)} /{' '}
            {SPINS_PER_MODE}
          </p>

          <div className="bias-slot-machine" aria-live="polite">
            {(lastReels?.reels ?? ['?', '?', '?']).map((sym, i) => (
              <div
                key={i}
                className={`bias-slot-reel${lastReels?.type === 'win' ? ' bias-slot-reel--win' : ''}`}
              >
                {sym}
              </div>
            ))}
          </div>

          {pendingSpin ? (
            <div className="bias-slot-engage">
              <label className="field-inline bias-slot-slider">
                <span>Θέλω να παίξω άλλη μια φορά (1 = καθόλου, 10 = πολύ)</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={engagement}
                  onChange={(e) => setEngagement(Number(e.target.value))}
                />
                <output className="bias-slot-slider__value">{engagement}</output>
              </label>
              <button type="button" className="btn btn-primary btn-pill" onClick={submitEngagement}>
                Καταχώρηση &amp; επόμενο
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-pill"
              onClick={doSpin}
              disabled={spinIndex >= SPINS_PER_MODE}
            >
              Spin
            </button>
          )}

          {scores.length > 0 ? (
            <p className="bias-slot-progress">
              Μέσος όρος μέχρι τώρα ({modeLabel}): <strong>{mean(scores).toFixed(1)}</strong> / 10
            </p>
          ) : null}
        </div>
      ) : (
        <div className="bias-result">
          <p className="bias-result__highlight">
            Ολοκλήρωσες και τις δύο συνθήκες. Μέσος engagement — καθαρές απώλειες:{' '}
            <strong>{mean(cleanScores).toFixed(1)}</strong>, near-misses:{' '}
            <strong>{mean(nearScores).toFixed(1)}</strong>.
          </p>
          <AccessibleChart
            title="Σύγκριση engagement: καθαρές απώλειες vs near-misses"
            chartData={chartData}
            height={280}
          >
            <Bar data={chartData} options={chartOptions} />
          </AccessibleChart>
          <button type="button" className="btn btn-secondary btn-pill" onClick={reset}>
            Ξανά από την αρχή
          </button>
        </div>
      )}

      <p className="bias-explanation">
        Τα near-misses ενεργοποιούν εγκεφαλικά δίκτυα ανταμοιβής όπως τα πραγματικά κέρδη, ενισχύοντας
        την επιμονή στη συμπεριφορά (Clark, 2010). Στους κουλοχέρηδες σχεδιάζονται σκόπιμα να εμφανίζονται
        συχνότερα από τη στατιστική τους πιθανότητα — δομικό χαρακτηριστικό του παιχνιδιού.
      </p>
    </section>
  );
}
