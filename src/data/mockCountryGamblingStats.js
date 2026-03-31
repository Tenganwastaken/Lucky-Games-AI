/**
 * Demo-only “anonymous” percentages: estimated share of adults who gambled on each category
 * in the last year (illustrative — replace with real research data for production).
 * Keys: ISO 3166-1 alpha-2.
 */
export const MOCK_STATS = {
  US: { lottery: 14, slots: 22, sports_bet: 18, other: 9 },
  CA: { lottery: 18, slots: 16, sports_bet: 12, other: 7 },
  GB: { lottery: 12, slots: 20, sports_bet: 28, other: 6 },
  IE: { lottery: 10, slots: 18, sports_bet: 24, other: 5 },
  FR: { lottery: 16, slots: 14, sports_bet: 20, other: 8 },
  DE: { lottery: 11, slots: 19, sports_bet: 22, other: 7 },
  ES: { lottery: 20, slots: 17, sports_bet: 19, other: 10 },
  IT: { lottery: 15, slots: 21, sports_bet: 25, other: 9 },
  GR: { lottery: 22, slots: 12, sports_bet: 26, other: 8 },
  CY: { lottery: 18, slots: 14, sports_bet: 20, other: 11 },
  AU: { lottery: 14, slots: 24, sports_bet: 30, other: 8 },
  NZ: { lottery: 13, slots: 19, sports_bet: 21, other: 7 },
  BR: { lottery: 25, slots: 11, sports_bet: 32, other: 12 },
  AR: { lottery: 19, slots: 9, sports_bet: 35, other: 10 },
  MX: { lottery: 28, slots: 13, sports_bet: 18, other: 14 },
  IN: { lottery: 8, slots: 6, sports_bet: 14, other: 5 },
  CN: { lottery: 6, slots: 8, sports_bet: 5, other: 4 },
  JP: { lottery: 9, slots: 12, sports_bet: 8, other: 5 },
  KR: { lottery: 7, slots: 10, sports_bet: 12, other: 6 },
  ZA: { lottery: 17, slots: 15, sports_bet: 19, other: 9 },
  NG: { lottery: 21, slots: 5, sports_bet: 24, other: 8 },
  EG: { lottery: 12, slots: 6, sports_bet: 16, other: 7 },
  RU: { lottery: 10, slots: 14, sports_bet: 18, other: 9 },
  PL: { lottery: 14, slots: 18, sports_bet: 21, other: 8 },
  SE: { lottery: 11, slots: 16, sports_bet: 19, other: 6 },
  NO: { lottery: 13, slots: 14, sports_bet: 17, other: 7 },
  FI: { lottery: 12, slots: 15, sports_bet: 16, other: 6 },
  NL: { lottery: 10, slots: 17, sports_bet: 23, other: 7 },
  PT: { lottery: 19, slots: 16, sports_bet: 21, other: 9 },
};

export const GAME_LABELS = {
  all: 'All game types',
  lottery: 'Lottery',
  slots: 'Slots / casino-style',
  sports_bet: 'Sports betting',
  other: 'Other / mixed',
};

export const LAYER_LABELS = {
  advisor: 'Live advisor activity (saved analyses)',
  anonymous: 'Anonymous global index (demo %)',
  accounts: 'Registered accounts on this app (count)',
};
