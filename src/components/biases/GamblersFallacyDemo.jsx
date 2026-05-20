'use client';

import { useState } from 'react';

const HISTORY = Array(8).fill('tails');
const SIM_RUNS = 10_000;

function runSimulation() {
  let heads = 0;
  for (let i = 0; i < SIM_RUNS; i += 1) {
    if (Math.random() < 0.5) heads += 1;
  }
  return {
    heads,
    tails: SIM_RUNS - heads,
    headsPct: (heads / SIM_RUNS) * 100,
  };
}

export default function GamblersFallacyDemo({ state, onChange }) {
  const [guess, setGuess] = useState(state.guess ?? '');
  const [result, setResult] = useState(state.result);
  const [running, setRunning] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setRunning(true);
    requestAnimationFrame(() => {
      const sim = runSimulation();
      const next = { guess, result: sim };
      setResult(sim);
      onChange(next);
      setRunning(false);
    });
  };

  const reset = () => {
    setGuess('');
    setResult(null);
    onChange({ guess: '', result: null });
  };

  return (
    <section className="bias-demo" aria-labelledby="bias-fallacy-title">
      <h2 id="bias-fallacy-title" className="bias-demo__title">
        1. Πλάνη του παίκτη (Gambler&apos;s Fallacy)
      </h2>
      <p className="bias-demo__lead">
        Ρίξε νόμισμα 8 φορές — όλες «Γράμματα». Τι πιστεύεις ότι έπεται;
      </p>

      <div className="bias-coin-panel">
        <p className="bias-coin-label">Ιστορικό ρίψεων</p>
        <ul className="bias-coin-history" aria-label="8 διαδοχικά Γράμματα">
          {HISTORY.map((side, i) => (
            <li key={i} className={`bias-coin bias-coin--${side}`} title="Γράμματα">
              Γ
            </li>
          ))}
          <li className="bias-coin bias-coin--next" aria-hidden>
            ?
          </li>
        </ul>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="bias-form">
          <label className="field-inline">
            <span>Ποια η πιθανότητα το επόμενο να είναι Κορώνα; (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              className="number-input"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="π.χ. 65"
              required
            />
          </label>
          <button type="submit" className="btn btn-primary btn-pill" disabled={running}>
            {running ? 'Προσομοίωση 10.000 ρίψεων…' : 'Έλεγχος με προσομοίωση'}
          </button>
        </form>
      ) : (
        <div className="bias-result">
          <p className="bias-result__guess">
            Η εκτίμησή σου: <strong>{guess}%</strong> Κορώνα στο επόμενο ρίψιμο.
          </p>
          <div className="bias-sim-bars">
            <div className="bias-sim-bar">
              <span className="bias-sim-bar__label">Κορώνα</span>
              <div className="bias-sim-bar__track">
                <div
                  className="bias-sim-bar__fill bias-sim-bar__fill--heads"
                  style={{ width: `${result.headsPct}%` }}
                />
              </div>
              <span className="bias-sim-bar__value">
                {result.heads.toLocaleString('el-GR')} / {SIM_RUNS.toLocaleString('el-GR')} (
                {result.headsPct.toFixed(1)}%)
              </span>
            </div>
            <div className="bias-sim-bar">
              <span className="bias-sim-bar__label">Γράμματα</span>
              <div className="bias-sim-bar__track">
                <div
                  className="bias-sim-bar__fill bias-sim-bar__fill--tails"
                  style={{ width: `${100 - result.headsPct}%` }}
                />
              </div>
              <span className="bias-sim-bar__value">
                {result.tails.toLocaleString('el-GR')} ({(100 - result.headsPct).toFixed(1)}%)
              </span>
            </div>
          </div>
          <p className="bias-result__highlight">
            Μετά από 8 Γράμματα, σε {SIM_RUNS.toLocaleString('el-GR')} ανεξάρτητες ρίψεις η Κορώνα
            εμφανίστηκε ~50% — το νόμισμα δεν έχει «μνήμη».
          </p>
          <button type="button" className="btn btn-secondary btn-pill" onClick={reset}>
            Ξανά από την αρχή
          </button>
        </div>
      )}

      <p className="bias-explanation">
        Αυτό λέγεται Gambler&apos;s Fallacy (πλάνη του παίκτη). Τα ανεξάρτητα τυχαία γεγονότα ΔΕΝ έχουν
        «μνήμη». Η εσφαλμένη αυτή πεποίθηση οδηγεί σε αυξημένο στοιχηματισμό μετά από απώλειες (Goodie
        &amp; Fortune, 2013).
      </p>
    </section>
  );
}
