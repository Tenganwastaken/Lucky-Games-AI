'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import GamblersFallacyDemo from '@/components/biases/GamblersFallacyDemo';
import NearMissDemo from '@/components/biases/NearMissDemo';
import IllusionOfControlDemo from '@/components/biases/IllusionOfControlDemo';
import {
  loadBiasesState,
  saveBiasesState,
  clearBiasesState,
  INITIAL_BIASES_STATE,
} from '@/lib/biases-storage';
import {
  BACK_HOME,
  BIASES_CLEAR,
  BIASES_INTRO,
  BIASES_TITLE,
  PGSI_GO_ADVISOR,
} from '@/lib/strings';

export default function BiasesPage() {
  const [state, setState] = useState(INITIAL_BIASES_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const saved = loadBiasesState();
    if (saved) setState({ ...INITIAL_BIASES_STATE, ...saved });
    setHydrated(true);
  }, []);

  const updateSection = useCallback((section, patch) => {
    setState((prev) => {
      const next = {
        ...prev,
        [section]: { ...prev[section], ...patch },
      };
      saveBiasesState(next);
      return next;
    });
  }, []);

  const handleClear = () => {
    clearBiasesState();
    setState({ ...INITIAL_BIASES_STATE });
    setResetKey((k) => k + 1);
  };

  if (!hydrated) {
    return (
      <main id="main-content" className="app-shell app-shell--centered">
        <div className="app-card app-card--article">
          <p className="app-subtitle" role="status" aria-live="polite">
            Φόρτωση…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="app-shell app-shell--centered">
      <div className="app-card app-card--article biases-page">
        <SiteNav />
        <p style={{ marginBottom: '1rem' }}>
          <Link href="/" className="app-link app-link--subtle">
            {BACK_HOME}
          </Link>
          {' · '}
          <Link href="/advisor" className="app-link app-link--subtle">
            {PGSI_GO_ADVISOR}
          </Link>
        </p>

        <header style={{ marginBottom: '1.5rem' }}>
          <h1 className="app-title">{BIASES_TITLE}</h1>
          <p className="app-subtitle">{BIASES_INTRO}</p>
        </header>

        <p className="callout callout--muted biases-persist-hint" role="note">
          Η πρόοδός σου αποθηκεύεται τοπικά στο πρόγραμμα περιήγησης για αυτή τη συνεδρία.
          <button type="button" className="biases-clear-btn" onClick={handleClear}>
            {BIASES_CLEAR}
          </button>
        </p>

        <div className="biases-demos">
          <GamblersFallacyDemo
            key={`fallacy-${resetKey}`}
            state={state.fallacy}
            onChange={(patch) => updateSection('fallacy', patch)}
          />
          <NearMissDemo
            key={`near-${resetKey}`}
            state={state.nearMiss}
            onChange={(patch) => updateSection('nearMiss', patch)}
          />
          <IllusionOfControlDemo
            key={`control-${resetKey}`}
            state={state.control}
            onChange={(patch) => updateSection('control', patch)}
          />
        </div>
      </div>
    </main>
  );
}
