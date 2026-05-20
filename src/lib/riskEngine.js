/**
 * Rule-based risk scoring engine.
 *
 * **Design principles**
 * - *Transparency:* each indicator has an explicit weight (%) and 0–10 sub-score with documented thresholds.
 * - *Interpretability:* output includes a per-indicator breakdown (contribution + reason).
 * - *GDPR Art. 22:* meaningful information about the logic involved — no automated decision; information only.
 * - *Ethical bias:* prefer false-positives over false-negatives (protective stance; thesis Ch. 5.5).
 *   Missing / «prefer not» answers use a conservative mid sub-score (5/10) on behavioural indicators.
 *
 * **Methodological choice:** rule-based over ML (Auer et al., 2024).
 * **Justification:** interpretability and GDPR Article 22 compliance
 * (Wachter et al., 2017; Selbst & Powles, 2017).
 *
 * **Indicators based on:**
 * - Hopfgartner et al. (2025): chasing behavior, net balance trend
 * - Auer et al. (2024): deposits/session, daily wager, session duration, casino participation
 * - Tani et al. (2024): frequency, variability, night-time play, breadth
 * - Auer & Griffiths (2022): deposit velocity, cancel-withdrawal events
 * - APA (2013) DSM-5: failed stop attempts, relationship conflict
 *
 * ## Default weights and high-risk thresholds
 *
 * | Indicator | Weight | High threshold |
 * |---|---:|---|
 * | chasingFrequency | 15% | «Συχνά» ή «Πολύ συχνά» |
 * | cancelWithdrawalCount | 12% | ≥ «3–5 φορές» |
 * | failedStopAttempts | 12% | ≥ «2–3 φορές» |
 * | relationshipConflict | 10% | ≥ «Μερικές φορές» |
 * | nightPlayPercent | 8% | ≥ 30% |
 * | weeklyTotalEuro | 8% | ≥ 200€ |
 * | daysPerMonth | 8% | ≥ 15 ημέρες |
 * | avgSessionMinutes | 6% | ≥ 120 λεπτά |
 * | depositsPerSession | 6% | ≥ 3 |
 * | wagerVariability | 5% | «Πολύ μεταβλητό» |
 * | gameTypesCount | 4% | ≥ 4 τύποι |
 * | limitsSet | 4% | «Έχω βάλει αλλά τα παραβιάζω» |
 * | riskAwareness | 2% | «Όχι» |
 * | **Σύνολο** | **100%** | |
 *
 * **Tier mapping (final score 0–100):**
 * - 0–24: Χαμηλός (πράσινο)
 * - 25–49: Μέτριος (κίτρινο)
 * - 50–74: Αυξημένος (πορτοκαλί)
 * - 75–100: Υψηλός (κόκκινο)
 *
 * @module riskEngine
 */

const PREFER_NOT = 'prefer_not';
const CONSERVATIVE_SUBSCORE = 5;

/** @typedef {'Χαμηλός' | 'Μέτριος' | 'Αυξημένος' | 'Υψηλός'} RiskTier */
/** @typedef {'green' | 'yellow' | 'orange' | 'red'} TierColor */

/**
 * @typedef {Object} IndicatorDef
 * @property {string} name
 * @property {string} label
 * @property {number} weight Percent of total (sums to 100)
 * @property {string} highThreshold Human-readable high-risk threshold
 * @property {string} source Citation / rationale for UI tooltip
 * @property {(value: unknown, data: Record<string, unknown>) => number} scorer Returns 0–10
 * @property {(value: unknown, data: Record<string, unknown>) => string} reason Greek explanation
 */

/** @param {unknown} v */
function isMissing(v) {
  return v == null || v === '' || v === PREFER_NOT;
}

/** @param {unknown} v @param {number} fallback */
function num(v, fallback = 0) {
  if (isMissing(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** @param {unknown} v @param {number} [conservative] */
function subscoreOrConservative(v, conservative = CONSERVATIVE_SUBSCORE) {
  return isMissing(v) ? conservative : null;
}

export const INDICATORS = {
  chasingFrequency: {
    name: 'chasingFrequency',
    label: 'Chasing απωλειών',
    weight: 15,
    highThreshold: '«Συχνά» ή «Πολύ συχνά»',
    source: 'Hopfgartner et al. (2025) — chasing losses among strongest behavioural predictors.',
    scorer(v) {
      if (subscoreOrConservative(v) != null) return subscoreOrConservative(v);
      const map = { never: 0, rarely: 2, sometimes: 5, often: 8, very_often: 10 };
      return map[v] ?? CONSERVATIVE_SUBSCORE;
    },
    reason(v) {
      const labels = {
        never: 'Δεν αναφέρεται chasing.',
        rarely: 'Σπάνιο chasing.',
        sometimes: 'Μερικές φορές αύξηση μετά από απώλεια.',
        often: 'Συχνό chasing — υψηλός δείκτης κινδύνου.',
        very_often: 'Πολύ συχνό chasing — κορυφαίος προγνωστικός δείκτης.',
      };
      return labels[v] ?? 'Δεν δόθηκε απάντηση· χρησιμοποιήθηκε συντηρητική εκτίμηση.';
    },
  },
  cancelWithdrawalCount: {
    name: 'cancelWithdrawalCount',
    label: 'Ακύρωση αναλήψεων',
    weight: 12,
    highThreshold: '≥ «3–5 φορές»',
    source: 'Auer & Griffiths (2022) — cancel-withdrawal events and deposit velocity.',
    scorer(v) {
      if (subscoreOrConservative(v) != null) return subscoreOrConservative(v);
      const map = { never: 0, '1_2': 4, '3_5': 8, often: 10 };
      return map[v] ?? CONSERVATIVE_SUBSCORE;
    },
    reason(v) {
      const labels = {
        never: 'Ποτέ ακύρωση ανάληψης.',
        '1_2': '1–2 ακυρώσεις — ήπια ένδειξη.',
        '3_5': '3–5 ακυρώσεις — αυξημένος κίνδυνος.',
        often: 'Συχνές ακυρώσεις — ισχυρός δείκτης.',
      };
      return labels[v] ?? 'Δεν δόθηκε απάντηση· συντηρητική εκτίμηση.';
    },
  },
  failedStopAttempts: {
    name: 'failedStopAttempts',
    label: 'Αποτυχημένη διακοπή',
    weight: 12,
    highThreshold: '≥ «2–3 φορές»',
    source: 'APA (2013) DSM-5 — repeated unsuccessful efforts to cut down or stop.',
    scorer(v) {
      if (subscoreOrConservative(v) != null) return subscoreOrConservative(v);
      const map = { none: 0, once: 3, '2_3': 8, many: 10 };
      return map[v] ?? CONSERVATIVE_SUBSCORE;
    },
    reason(v) {
      const labels = {
        none: 'Καμία αποτυχημένη προσπάθεια.',
        once: 'Μία προσπάθεια χωρίς επιτυχία.',
        '2_3': '2–3 προσπάθειες — κριτήριο DSM-5.',
        many: 'Πολλές αποτυχημένες προσπάθειες.',
      };
      return labels[v] ?? 'Δεν δόθηκε απάντηση· συντηρητική εκτίμηση.';
    },
  },
  relationshipConflict: {
    name: 'relationshipConflict',
    label: 'Εντάσεις σχέσεων/εργασίας',
    weight: 10,
    highThreshold: '≥ «Μερικές φορές»',
    source: 'APA (2013) DSM-5 / ICD-11 — interpersonal harm from gambling.',
    scorer(v) {
      if (subscoreOrConservative(v) != null) return subscoreOrConservative(v);
      const map = { never: 0, rarely: 2, sometimes: 7, often: 10 };
      return map[v] ?? CONSERVATIVE_SUBSCORE;
    },
    reason(v) {
      const labels = {
        never: 'Καμία ένταση από το παιχνίδι.',
        rarely: 'Σπάνιες εντάσεις.',
        sometimes: 'Μερικές φορές εντάσεις — αυξημένος κίνδυνος.',
        often: 'Συχνές εντάσεις — σημαντικός δείκτης βλάβης.',
      };
      return labels[v] ?? 'Δεν δόθηκε απάντηση· συντηρητική εκτίμηση.';
    },
  },
  nightPlayPercent: {
    name: 'nightPlayPercent',
    label: 'Νυχτερινό παιχνίδι',
    weight: 8,
    highThreshold: '≥ 30%',
    source: 'Tani et al. (2024) — night-time play as behavioural risk marker.',
    scorer(v, data) {
      const n = num(v, num(data.nightPlayPercent, 0));
      if (n == null) return CONSERVATIVE_SUBSCORE;
      if (n < 10) return 0;
      if (n < 30) return 5;
      return 10;
    },
    reason(v, data) {
      const n = num(v, num(data.nightPlayPercent, 0)) ?? 0;
      if (n < 10) return `Χαμηλό νυχτερινό ποσοστό (${n}%).`;
      if (n < 30) return `Μέτριο νυχτερινό ποσοστό (${n}%).`;
      return `Υψηλό νυχτερινό ποσοστό (${n}%) — δείκτης απώλειας ελέγχου.`;
    },
  },
  weeklyTotalEuro: {
    name: 'weeklyTotalEuro',
    label: 'Εβδομαδιαίο ποσό',
    weight: 8,
    highThreshold: '≥ 200€',
    source: 'Auer et al. (2024) — expenditure scale (simplified; no income normalization).',
    scorer(v) {
      const n = num(v);
      if (n == null) return CONSERVATIVE_SUBSCORE;
      if (n < 50) return 0;
      if (n < 100) return 3;
      if (n < 200) return 6;
      return 10;
    },
    reason(v) {
      const n = num(v);
      if (n == null) return 'Δεν δόθηκε ποσό· συντηρητική εκτίμηση.';
      if (n < 50) return `Χαμηλό εβδομαδιαίο ποσό (${n}€).`;
      if (n < 200) return `Μέτριο εβδομαδιαίο ποσό (${n}€).`;
      return `Υψηλό εβδομαδιαίο ποσό (${n}€) — οικονομική έκθεση.`;
    },
  },
  daysPerMonth: {
    name: 'daysPerMonth',
    label: 'Ημέρες παιχνιδιού/μήνα',
    weight: 8,
    highThreshold: '≥ 15 ημέρες',
    source: 'Tani et al. (2024) — play frequency.',
    scorer(v) {
      const n = num(v, 0);
      if (n == null) return CONSERVATIVE_SUBSCORE;
      if (n < 4) return 0;
      if (n < 8) return 3;
      if (n < 15) return 6;
      return 10;
    },
    reason(v) {
      const n = num(v, 0) ?? 0;
      if (n < 15) return `${n} ημέρες/μήνα — κάτω από το κατώφλι «υψηλού».`;
      return `${n} ημέρες/μήνα — υψηλή συχνότητα.`;
    },
  },
  avgSessionMinutes: {
    name: 'avgSessionMinutes',
    label: 'Διάρκεια συνεδρίας',
    weight: 6,
    highThreshold: '≥ 120 λεπτά',
    source: 'Auer et al. (2024) — session duration.',
    scorer(v) {
      const n = num(v, 30);
      if (n == null) return CONSERVATIVE_SUBSCORE;
      if (n < 30) return 0;
      if (n < 60) return 3;
      if (n < 120) return 6;
      return 10;
    },
    reason(v) {
      const n = num(v, 30) ?? 30;
      if (n < 120) return `Μέση συνεδρία ${n} λεπτά.`;
      return `Μεγάλη μέση διάρκεια (${n} λεπτά).`;
    },
  },
  depositsPerSession: {
    name: 'depositsPerSession',
    label: 'Καταθέσεις/συνεδρία',
    weight: 6,
    highThreshold: '≥ 3',
    source: 'Auer et al. (2024) — deposits per session.',
    scorer(v) {
      const n = num(v, 0);
      if (n == null) return CONSERVATIVE_SUBSCORE;
      if (n <= 1) return 0;
      if (n === 2) return 5;
      return 10;
    },
    reason(v) {
      const n = num(v, 0) ?? 0;
      if (n < 3) return `${n} καταθέσεις/συνεδρία — κάτω από κατώφλι.`;
      return `${n}+ καταθέσεις/συνεδρία — αυξημένη ταχύτητα κατάθεσης.`;
    },
  },
  wagerVariability: {
    name: 'wagerVariability',
    label: 'Μεταβλητότητα πονταρίσματος',
    weight: 5,
    highThreshold: '«Πολύ μεταβλητό»',
    source: 'Tani et al. (2024) — wager variability.',
    scorer(v) {
      if (subscoreOrConservative(v) != null) return subscoreOrConservative(v);
      const map = { very_stable: 0, moderate: 5, very_variable: 10 };
      return map[v] ?? CONSERVATIVE_SUBSCORE;
    },
    reason(v) {
      const labels = {
        very_stable: 'Σταθερό μέγεθος πονταρίσματος.',
        moderate: 'Μέτρια μεταβλητότητα.',
        very_variable: 'Πολύ μεταβλητό ποντάρισμα — αυξημένος κίνδυνος.',
      };
      return labels[v] ?? 'Δεν δόθηκε απάντηση· συντηρητική εκτίμηση.';
    },
  },
  gameTypesCount: {
    name: 'gameTypesCount',
    label: 'Εύρος τύπων παιχνιδιού',
    weight: 4,
    highThreshold: '≥ 4 τύποι',
    source: 'Tani et al. (2024) — product breadth.',
    scorer(v) {
      const n = num(v, 1);
      if (n == null) return CONSERVATIVE_SUBSCORE;
      if (n <= 1) return 0;
      if (n <= 3) return 4;
      return 10;
    },
    reason(v) {
      const n = num(v, 1) ?? 1;
      if (n < 4) return `${n} τύποι — κάτω από κατώφλι ευρύτητας.`;
      return `${n} τύποι — πολυπροϊοντική συμμετοχή.`;
    },
  },
  limitsSet: {
    name: 'limitsSet',
    label: 'Όρια κατάθεσης/απώλειας',
    weight: 4,
    highThreshold: 'Παραβίαση ορίων',
    source: 'Responsible gambling tools — limit-setting and adherence.',
    scorer(v) {
      if (subscoreOrConservative(v) != null) return subscoreOrConservative(v);
      const map = { set_respected: 0, none: 4, set_violated: 10 };
      return map[v] ?? CONSERVATIVE_SUBSCORE;
    },
    reason(v) {
      const labels = {
        set_respected: 'Όρια τίθενται και τηρούνται.',
        none: 'Χωρίς όρια — αυξημένη έκθεση.',
        set_violated: 'Όρια παραβιάζονται — ισχυρός δείκτης απώλειας ελέγχου.',
      };
      return labels[v] ?? 'Δεν δόθηκε απάντηση· συντηρητική εκτίμηση.';
    },
  },
  riskAwareness: {
    name: 'riskAwareness',
    label: 'Επίγνωση house edge',
    weight: 2,
    highThreshold: '«Όχι»',
    source: 'Consumer literacy — understanding long-term expected loss.',
    scorer(v) {
      if (subscoreOrConservative(v) != null) return subscoreOrConservative(v);
      const map = { fully: 0, partially: 5, no: 10 };
      return map[v] ?? CONSERVATIVE_SUBSCORE;
    },
    reason(v) {
      const labels = {
        fully: 'Πλήρης επίγνωση μακροπρόθεσμου αποτελέσματος.',
        partially: 'Μερική επίγνωση.',
        no: 'Χαμηλή επίγνωση house edge.',
      };
      return labels[v] ?? 'Δεν δόθηκε απάντηση· συντηρητική εκτίμηση.';
    },
  },
};

const RECOMMENDATIONS = {
  chasingFrequency:
    'Σκέψου να ορίσεις σταθερό ημερήσιο όριο απώλειας πριν ξεκινήσεις και να ΜΗΝ αυξάνεις το στοίχημα μετά από απώλεια. Το chasing είναι ένας από τους ισχυρότερους προγνωστικούς δείκτες προβληματικού τζόγου (Hopfgartner et al., 2025).',
  cancelWithdrawalCount:
    'Αν σκέφτεσαι να ακυρώσεις ανάληψη, κάνε παύση 24 ωρών. Η επαναλαμβανόμενη ακύρωση ανάληψης συσχετίζεται με μεγαλύτερη βλάβη (Auer & Griffiths, 2022).',
  failedStopAttempts:
    'Αν δυσκολεύεσαι να μειώσεις μόνος/η σου, σκέψου επαγγελματική υποστήριξη (ψυχολόγος/1177). Τα επαναλαμβανόμενα αποτυχημένα «σταμάτα» είναι κριτήριο DSM-5.',
  relationshipConflict:
    'Μίλησε σε κάποιον που εμπιστεύεσαι για το παιχνίδι και θέσε όρια χρόνου/χρημάτων. Οι εντάσεις στις σχέσεις είναι σημάδι αυξημένης βλάβης.',
  nightPlayPercent:
    'Δοκίμασε να αποφεύγεις παιχνίδι μετά τα μεσάνυχτα — η κόπωση μειώνει τον έλεγχο (Tani et al., 2024).',
  weeklyTotalEuro:
    'Ορίσε εβδομαδιαίο προϋπολογισμό ψυχαγωγίας που αντέχεις να χάσεις οριστικά, χωρίς δανεισμό.',
  daysPerMonth:
    'Σχεδίασε «ημέρες χωρίς παιχνίδι» και κράτησέ τες — η συχνότητα συσχετίζεται με αυξημένο κίνδυνο.',
  avgSessionMinutes:
    'Βάλε χρονόμετρο/υπενθύμιση λήξης συνεδρίας (π.χ. 60 λεπτά) και σταμάτα όταν χτυπήσει.',
  depositsPerSession:
    'Περιόρισε σε μία κατάθεση ανά συνεδρία ή χρησιμοποίησε προ-φορτωμένο ποσό χωρίς επανακατάθεση.',
  wagerVariability:
    'Αποφυγε απότομες αυξήσεις πονταρίσματος μετά από νίκες/ήττες — κράτησε σταθερό μέγεθος στοιχήματος.',
  gameTypesCount:
    'Μείωσε τους τύπους παιχνιδιών στους οποίους συμμετέχεις — η πολυπροϊοντική συμμετοχή αυξάνει έκθεση.',
  limitsSet:
    'Ενεργοποίησε όρια κατάθεσης/απώλειας στην πλατφόρμα και ζήτησε cooling-off αν τα παραβιάζεις συχνά.',
  riskAwareness:
    'Διάβασε για house edge και μακροπρόθεσμο αναμενόμενο αποτέλεσμα — η καλύτερη «στρατηγική» δεν αλλάζει το μαθηματικό πλεονέκτημα του οίκου.',
};

const HIGH_RISK_RESOURCES = [
  'ΚΕΘΕΑ ΑΠΟΧΗ: 1114 (24ωρη γραμμή)',
  'Γραμμή Ψυχικής Υγείας 10306',
  'EU self-exclusion tools (όπου διαθέσιμα) — ρώτησε τον πάροχο σου',
];

/**
 * @param {number} score
 * @returns {{ tier: RiskTier, tierColor: TierColor }}
 */
export function scoreToTier(score) {
  if (score <= 24) return { tier: 'Χαμηλός', tierColor: 'green' };
  if (score <= 49) return { tier: 'Μέτριος', tierColor: 'yellow' };
  if (score <= 74) return { tier: 'Αυξημένος', tierColor: 'orange' };
  return { tier: 'Υψηλός', tierColor: 'red' };
}

/**
 * Illustrative win/loss estimates for legacy charts (not clinical).
 * @param {Record<string, unknown>} data
 */
export function computeChartEstimates(data) {
  let winChanceEstimate = 10;
  switch (data.primaryGameType) {
    case 'lottery':
      winChanceEstimate = 5;
      break;
    case 'online_slots':
      winChanceEstimate = 12;
      break;
    case 'live_casino':
      winChanceEstimate = 18;
      break;
    case 'sports_bet':
      winChanceEstimate = 22;
      break;
    case 'poker':
      winChanceEstimate = 28;
      break;
    default:
      break;
  }
  let expectedWeeklySpend = num(data.weeklyTotalEuro);
  if (expectedWeeklySpend == null || expectedWeeklySpend <= 0) {
    const sessionsPerWeek = ((num(data.daysPerMonth, 0) ?? 0) / 30) * 7;
    expectedWeeklySpend = Math.round(sessionsPerWeek * (num(data.avgWagerEuro, 0) ?? 0) * 1.2);
  }
  return {
    winChanceEstimate,
    lossChanceEstimate: 100 - winChanceEstimate,
    expectedWeeklySpend: Number(expectedWeeklySpend) || 0,
  };
}

/**
 * Compute risk score (0–100) from form data (raw wizard or normalized API payload).
 *
 * @param {Record<string, unknown>} formData
 * @returns {{
 *   score: number,
 *   tier: RiskTier,
 *   tierColor: TierColor,
 *   breakdown: Array<{
 *     indicator: string,
 *     label: string,
 *     weight: number,
 *     rawScore: number,
 *     contribution: number,
 *     reason: string,
 *     source: string,
 *     highThreshold: string,
 *   }>,
 *   topDrivers: string[],
 *   recommendations: string[],
 *   resources?: string[],
 * }}
 */
export function computeRiskScore(formData) {
  /** @type {import('./riskEngine.js').computeRiskScore extends Function ? never : any} */
  const breakdown = [];

  for (const def of Object.values(INDICATORS)) {
    const value = formData[def.name];
    const rawScore = Math.max(0, Math.min(10, def.scorer(value, formData)));
    const contribution = Math.round(((def.weight * rawScore) / 10) * 10) / 10;
    breakdown.push({
      indicator: def.name,
      label: def.label,
      weight: def.weight,
      rawScore,
      contribution,
      reason: def.reason(value, formData),
      source: def.source,
      highThreshold: def.highThreshold,
    });
  }

  const score = Math.max(
    0,
    Math.min(100, Math.round(breakdown.reduce((sum, row) => sum + row.contribution, 0))),
  );

  const sorted = [...breakdown].sort((a, b) => b.contribution - a.contribution);
  const topDrivers = sorted
    .filter((r) => r.contribution > 0)
    .slice(0, 3)
    .map((r) => r.label);

  const recommendations = [];
  const seen = new Set();
  for (const row of sorted) {
    if (row.contribution <= 0) continue;
    const text = RECOMMENDATIONS[row.indicator];
    if (text && !seen.has(text)) {
      recommendations.push(text);
      seen.add(text);
    }
    if (recommendations.length >= 5) break;
  }
  while (recommendations.length < 2 && sorted.length) {
    recommendations.push(
      'Κράτησε σταθερό προϋπολογισμό ψυχαγωγίας και μην τον ξεπερνάς — η αξιολόγηση είναι εκπαιδευτική, όχι διάγνωση.',
    );
    break;
  }

  const { tier, tierColor } = scoreToTier(score);
  const result = {
    score,
    tier,
    tierColor,
    breakdown,
    topDrivers,
    recommendations,
  };

  if (tier === 'Υψηλός') {
    result.resources = HIGH_RISK_RESOURCES;
  }

  return result;
}
