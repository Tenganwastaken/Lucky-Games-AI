export const GAME_TYPE_LABELS = {
  lottery: 'Lottery',
  slots: 'Slots / casino-style',
  sports_bet: 'Sports betting',
  other: 'Other / mixed',
};

export function gameTypeLabel(code) {
  return GAME_TYPE_LABELS[code] || code;
}

export function riskToleranceLabel(code) {
  if (code === 'low') return 'Low';
  if (code === 'high') return 'High';
  return 'Medium';
}
