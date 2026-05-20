'use client';

import { useState } from 'react';

const POOL_SIZE = 49;
const PICK_COUNT = 6;
const SIM_RUNS = 100_000;

function randomPick() {
  const pool = Array.from({ length: POOL_SIZE }, (_, i) => i + 1);
  const picked = [];
  for (let i = 0; i < PICK_COUNT; i += 1) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked.sort((a, b) => a - b);
}

function countMatches(a, b) {
  const setB = new Set(b);
  return a.filter((n) => setB.has(n)).length;
}

function runSimulation(playerA, playerB) {
  let aWins = 0;
  let bWins = 0;
  let ties = 0;
  for (let i = 0; i < SIM_RUNS; i += 1) {
    const winning = randomPick();
    const scoreA = countMatches(playerA, winning);
    const scoreB = countMatches(playerB, winning);
    if (scoreA > scoreB) aWins += 1;
    else if (scoreB > scoreA) bWins += 1;
    else ties += 1;
  }
  return {
    aWins,
    bWins,
    ties,
    aPct: (aWins / SIM_RUNS) * 100,
    bPct: (bWins / SIM_RUNS) * 100,
    tiePct: (ties / SIM_RUNS) * 100,
  };
}

export default function IllusionOfControlDemo({ state, onChange }) {
  const [picked, setPicked] = useState(state.pickedNumbers ?? []);
  const [computerPick, setComputerPick] = useState(
    state.computerPick ?? (state.pickedNumbers?.length === PICK_COUNT ? randomPick() : []),
  );
  const [guess, setGuess] = useState(state.guess);
  const [result, setResult] = useState(state.result);
  const [running, setRunning] = useState(false);

  const toggleNumber = (n) => {
    if (result) return;
    setPicked((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= PICK_COUNT) return prev;
      return [...prev, n].sort((a, b) => a - b);
    });
  };

  const confirmPicks = () => {
    if (picked.length !== PICK_COUNT) return;
    const comp = randomPick();
    setComputerPick(comp);
    onChange({ pickedNumbers: picked, computerPick: comp, guess: null, result: null });
  };

  const handleGuess = (who) => {
    setGuess(who);
    onChange({ pickedNumbers: picked, computerPick, guess: who, result: null });
  };

  const runSim = () => {
    if (guess == null || picked.length !== PICK_COUNT) return;
    setRunning(true);
    requestAnimationFrame(() => {
      const sim = runSimulation(picked, computerPick);
      setResult(sim);
      onChange({ pickedNumbers: picked, computerPick, guess, result: sim });
      setRunning(false);
    });
  };

  const reset = () => {
    setPicked([]);
    setComputerPick([]);
    setGuess(null);
    setResult(null);
    onChange({ pickedNumbers: [], computerPick: [], guess: null, result: null });
  };

  const readyForGuess = picked.length === PICK_COUNT && computerPick.length === PICK_COUNT;

  return (
    <section className="bias-demo" aria-labelledby="bias-control-title">
      <h2 id="bias-control-title" className="bias-demo__title">
        3. Ψευδαίσθηση ελέγχου (Illusion of control)
      </h2>
      <p className="bias-demo__lead">
        Δύο «παίκτες» στη λοταρία (6 από 49). Ο Α επιλέγει μόνος του, ο Β παίρνει τυχαίους αριθμούς.
      </p>

      {!readyForGuess ? (
        <div className="bias-lottery-setup">
          <p>
            Επίλεξε {PICK_COUNT} αριθμούς ({picked.length}/{PICK_COUNT}):
          </p>
          <div className="bias-lottery-grid" role="group" aria-label="Επιλογή αριθμών 1–49">
            {Array.from({ length: POOL_SIZE }, (_, i) => i + 1).map((n) => {
              const selected = picked.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  className={`bias-lottery-num${selected ? ' bias-lottery-num--on' : ''}`}
                  onClick={() => toggleNumber(n)}
                  aria-pressed={selected}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-pill"
            disabled={picked.length !== PICK_COUNT}
            onClick={confirmPicks}
          >
            Επιβεβαίωση επιλογής
          </button>
        </div>
      ) : !result ? (
        <div className="bias-lottery-compare">
          <div className="bias-lottery-player">
            <h3 className="bias-lottery-player__title">Παίκτης Α (εσύ)</h3>
            <p className="bias-lottery-nums">{picked.join(' · ')}</p>
          </div>
          <div className="bias-lottery-player">
            <h3 className="bias-lottery-player__title">Παίκτης Β (υπολογιστής)</h3>
            <p className="bias-lottery-nums">{computerPick.join(' · ')}</p>
          </div>

          {guess == null ? (
            <fieldset className="bias-guess-fieldset">
              <legend>Ποιος πιστεύεις ότι έχει μεγαλύτερη πιθανότητα να κερδίσει;</legend>
              <div className="bias-guess-actions">
                <button type="button" className="btn btn-secondary btn-pill" onClick={() => handleGuess('A')}>
                  Παίκτης Α
                </button>
                <button type="button" className="btn btn-secondary btn-pill" onClick={() => handleGuess('B')}>
                  Παίκτης Β
                </button>
                <button type="button" className="btn btn-secondary btn-pill" onClick={() => handleGuess('equal')}>
                  Ίση πιθανότητα
                </button>
              </div>
            </fieldset>
          ) : (
            <div className="bias-form">
              <p>
                Η εκτίμησή σου:{' '}
                <strong>
                  {guess === 'A' ? 'Παίκτης Α' : guess === 'B' ? 'Παίκτης Β' : 'Ίση πιθανότητα'}
                </strong>
              </p>
              <button type="button" className="btn btn-primary btn-pill" onClick={runSim} disabled={running}>
                {running
                  ? `Προσομοίωση ${SIM_RUNS.toLocaleString('el-GR')} κληρώσεων…`
                  : 'Τρέξε προσομοίωση'}
              </button>
              <button type="button" className="btn btn-ghost btn-pill" onClick={() => setGuess(null)}>
                Άλλαξε εκτίμηση
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bias-result">
          <p className="bias-result__highlight">
            Σε {SIM_RUNS.toLocaleString('el-GR')} κληρώσεις, ποιος είχε περισσότερες επιτυχίες αριθμών:
            Α {result.aPct.toFixed(1)}% · Β {result.bPct.toFixed(1)}% · Ισοπαλία {result.tiePct.toFixed(1)}%
          </p>
          <div className="bias-sim-bars">
            <div className="bias-sim-bar">
              <span className="bias-sim-bar__label">Νίκες παίκτη Α</span>
              <div className="bias-sim-bar__track">
                <div
                  className="bias-sim-bar__fill"
                  style={{ width: `${result.aPct}%` }}
                />
              </div>
              <span className="bias-sim-bar__value">{result.aPct.toFixed(1)}%</span>
            </div>
            <div className="bias-sim-bar">
              <span className="bias-sim-bar__label">Νίκες παίκτη Β</span>
              <div className="bias-sim-bar__track">
                <div className="bias-sim-bar__fill" style={{ width: `${result.bPct}%` }} />
              </div>
              <span className="bias-sim-bar__value">{result.bPct.toFixed(1)}%</span>
            </div>
          </div>
          <p className="bias-result__guess">
            Η επιλογή δικών σου αριθμών δεν αλλάζει την πιθανότητα — το αποτέλεσμα είναι ~50/50.
          </p>
          <button type="button" className="btn btn-secondary btn-pill" onClick={reset}>
            Ξανά από την αρχή
          </button>
        </div>
      )}

      <p className="bias-explanation">
        Η ψευδαίσθηση ελέγχου είναι η πεποίθηση ότι μπορούμε να επηρεάσουμε τυχαία γεγονότα μέσω της
        δικής μας «στρατηγικής». Είναι ιδιαίτερα έντονη όταν παιχνίδια έχουν στοιχείο επιλογής, όπως η
        επιλογή αριθμών στη λοταρία ή ο τρόπος πατήματος του κουμπιού σε κουλοχέρη (Clark, 2010).
      </p>
    </section>
  );
}
