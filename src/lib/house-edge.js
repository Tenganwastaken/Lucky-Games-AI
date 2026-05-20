/** House edge benchmarks (Williams et al., 2012) — midpoints for projections */

export const HOUSE_EDGE_GAMES = [
  {
    id: 'lottery',
    label: 'Λοταρία (κρατικές)',
    edgeMin: 0.45,
    edgeMax: 0.5,
    edgeMid: 0.475,
    edgeLabel: '45–50%',
    source: 'Williams et al., 2012',
  },
  {
    id: 'sports',
    label: 'Sports betting (φαβορί)',
    edgeMin: 0.045,
    edgeMax: 0.07,
    edgeMid: 0.0575,
    edgeLabel: '4,5–7%',
    source: 'Williams et al., 2012',
  },
  {
    id: 'slots',
    label: 'Online slots',
    edgeMin: 0.04,
    edgeMax: 0.1,
    edgeMid: 0.07,
    edgeLabel: '4–10%',
    source: 'Williams et al., 2012',
  },
  {
    id: 'roulette_eu',
    label: 'Ρουλέτα ευρωπαϊκή',
    edgeMin: 0.027,
    edgeMax: 0.027,
    edgeMid: 0.027,
    edgeLabel: '2,7%',
    source: 'Williams et al., 2012',
  },
  {
    id: 'roulette_us',
    label: 'Ρουλέτα αμερικάνικη',
    edgeMin: 0.053,
    edgeMax: 0.053,
    edgeMid: 0.053,
    edgeLabel: '5,3%',
    source: 'Williams et al., 2012',
  },
  {
    id: 'blackjack',
    label: 'Blackjack (βασική στρατηγική)',
    edgeMin: 0.005,
    edgeMax: 0.01,
    edgeMid: 0.0075,
    edgeLabel: '0,5–1%',
    source: 'Williams et al., 2012',
  },
];

export const HOUSE_EDGE_HORIZONS = [
  { id: '1m', months: 1, label: '1 μήνας' },
  { id: '6m', months: 6, label: '6 μήνες' },
  { id: '1y', months: 12, label: '1 έτος' },
  { id: '5y', months: 60, label: '5 έτη' },
];

/** @param {typeof HOUSE_EDGE_GAMES[number]} game */
export function getGameById(id) {
  return HOUSE_EDGE_GAMES.find((g) => g.id === id) ?? HOUSE_EDGE_GAMES[1];
}

/**
 * Expected net outcome for player (negative = loss).
 * @param {number} betPerWager
 * @param {number} betsPerMonth
 * @param {number} months
 * @param {number} edgeFraction 0–1
 */
export function expectedNetOutcome(betPerWager, betsPerMonth, months, edgeFraction) {
  const totalWagered = betPerWager * betsPerMonth * months;
  return -totalWagered * edgeFraction;
}

/**
 * Expected loss amount for display (positive euros).
 */
export function expectedLossAmount(betPerWager, betsPerMonth, months, edgeFraction) {
  return -expectedNetOutcome(betPerWager, betsPerMonth, months, edgeFraction);
}

/**
 * Loss per reference stake (e.g. per €100 wagered).
 * @param {number} edgeFraction
 * @param {number} referenceStake default 100
 */
export function lossPerReferenceStake(edgeFraction, referenceStake = 100) {
  return referenceStake * edgeFraction;
}
