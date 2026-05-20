import { MOCK_STATS } from '@/data/mockCountryGamblingStats';

/** Demo: διάδοση τυχερών παιχνιδιών (% ενηλίκων, 0–80). */
export function prevalencePercent(iso) {
  const row = MOCK_STATS[iso];
  if (!row) return null;
  const avg = (row.lottery + row.slots + row.sports_bet + row.other) / 4;
  return Math.round(Math.min(80, avg * 2.2) * 10) / 10;
}

function hashIso(iso) {
  let h = 0;
  for (let i = 0; i < iso.length; i += 1) h = (h * 31 + iso.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Demo: επιπολασμός προβληματικού τζόγου (% 0–100). */
export function problemGamblingPercent(iso) {
  const base = prevalencePercent(iso);
  if (base == null) return null;
  const jitter = (hashIso(iso) % 12) - 4;
  return Math.round(Math.min(100, Math.max(0, base * 0.42 + jitter)) * 10) / 10;
}
