const STORAGE_KEY = 'lucky-games-biases-v1';

export function loadBiasesState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveBiasesState(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function clearBiasesState() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export const INITIAL_BIASES_STATE = {
  fallacy: {
    guess: '',
    result: null,
  },
  nearMiss: {
    phase: 'clean',
    spinIndex: 0,
    cleanScores: [],
    nearScores: [],
    currentEngagement: 5,
    lastReels: null,
    completed: false,
  },
  control: {
    pickedNumbers: [],
    computerPick: [],
    guess: null,
    result: null,
  },
};
