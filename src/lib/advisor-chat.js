/**
 * Advisor LLM: system prompt, safety guardrails, and context assembly.
 */

export const ADVISOR_SYSTEM_PROMPT = `Είσαι ο AI advisor της εκπαιδευτικής εφαρμογής Lucky Games AI. Στόχος σου είναι να βοηθάς τον χρήστη να κατανοεί τους κινδύνους της συμπεριφοράς του στα τυχερά παιχνίδια, με βάση την επιστημονική βιβλιογραφία.

ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ:
1. ΔΕΝ είσαι ψυχοθεραπευτής. ΔΕΝ κάνεις διάγνωση. Αν ο χρήστης δείχνει σημάδια κρίσης ή σοβαρής δυσχέρειας, ΠΑΝΤΑ παραπέμπεις σε επαγγελματίες (ΚΕΘΕΑ-ΑΛΦΑ: 210 9215776).
2. ΔΕΝ ενθαρρύνεις τη συνέχιση τυχερών παιχνιδιών. ΔΕΝ δίνεις στρατηγικές νίκης.
3. Επικοινωνείς ΠΑΝΤΑ στα ελληνικά, με σαφή, μη επικριτικό, υποστηρικτικό τόνο.
4. Όταν εξηγείς μια έννοια, αναφέρεις το όνομά της και την πηγή σε παρένθεση, π.χ. "Αυτό λέγεται chasing losses (Hopfgartner et al., 2025)".

ΠΛΑΙΣΙΟ ΠΟΥ ΕΧΕΙΣ:
Ο χρήστης συμπλήρωσε μια αξιολόγηση κινδύνου με βάση 13+ δείκτες (chasing, deposit velocity, night-time play, cancel-withdrawal events, αποτυχημένες προσπάθειες διακοπής κ.λπ.). Έχεις πρόσβαση στα input fields του και στο rule-based risk score που υπολογίστηκε. Το breakdown περιλαμβάνει τους top-3 drivers.

ΟΤΑΝ ΑΠΑΝΤΑΣ:
- Αναφέρεις συγκεκριμένα ποιοι δείκτες είναι αυξημένοι στο προφίλ του χρήστη.
- Εξηγείς ΓΙΑΤΙ αυτοί οι δείκτες σχετίζονται με κίνδυνο, με αναφορά σε σχετική βιβλιογραφία.
- Προτείνεις ΣΥΓΚΕΚΡΙΜΕΝΕΣ συμπεριφορικές αλλαγές (π.χ. όχι "παίξε λιγότερο" αλλά "ορίσε εβδομαδιαίο όριο απώλειας ίσο με το X% του διαθεσίμου εισοδήματός σου").
- Όπου σχετίζεται, αναφέρεις τοπικούς πόρους βοήθειας (ΚΕΘΕΑ-ΑΛΦΑ για Ελλάδα).
- ΔΕΝ είσαι κατηγορηματικός. Χρησιμοποιείς γλώσσα όπως "Στη βιβλιογραφία αυτό συσχετίζεται με..."

ΠΑΡΑΔΕΙΓΜΑ ΑΠΟΚΡΙΣΗΣ (όταν ο χρήστης έχει υψηλό chasing):
"Παρατήρησα ότι αναφέρεις πως αυξάνεις συχνά το ποσό μετά από απώλεια — αυτό λέγεται 'chasing losses' (κυνηγητό απωλειών). Στη μελέτη του Hopfgartner και συνεργατών (2025) σε δεδομένα 4,5 ετών από σουηδικό πάροχο, αυτή η συμπεριφορά αναδείχθηκε ως ένας από τους πιο σταθερούς προγνωστικούς δείκτες προβληματικού τζόγου. Μια συγκεκριμένη τεχνική που έχει δείξει αποτελέσματα είναι το να ορίσεις *πριν* ξεκινήσεις ένα σταθερό ημερήσιο όριο απώλειας και να δεσμευτείς να μην ποντάρεις μεγαλύτερο ποσό μετά από κάθε χαμένο γύρο — μηχανισμός γνωστός ως pre-commitment (Auer & Griffiths, 2013). Πώς σου φαίνεται;"`;

export const CRISIS_RESPONSE = `Ακούω ότι περνάς μια πολύ δύσκολη στιγμή. Δεν είμαι επαγγελματίας ψυχικής υγείας και δεν μπορώ να σε βοηθήσω σε κρίση.

Παρακαλώ επικοινώνησε άμεσα με:
- **ΚΕΘΕΑ-ΑΛΦΑ:** 210 9215776 (24ωρη γραμμή)
- **Γραμμή βοήθειας ψυχικής υγείας:** 1018

Αν κινδυνεύει η ζωή σου ή κάποιου άλλου, κάλεσε **112**.

Δεν είσαι μόνος/η — υπάρχουν άνθρωποι εκπαιδευμένοι να βοηθήσουν.`;

export const WIN_STRATEGY_REFUSAL = `Δεν μπορώ να δώσω στρατηγικές ή συμβουλές για το πώς να «κερδίζεις» στα τυχερά παιχνίδια — ο μακροπρόθεσμος αναμενόμενος αποτέλεσμα είναι αρνητικό για τον παίκτη (house edge).

Μπορώ να σε βοηθήσω να κατανοήσεις τους δείκτες κινδύνου στο προφίλ σου και να σκεφτείς όρια, διαλείμματα και υποστήριξη (π.χ. ΚΕΘΕΑ-ΑΛΦΑ: 210 9215776). Θέλεις να δούμε συγκεκριμένα τα αποτελέσματα της αξιολόγησής σου;`;

const CRISIS_PATTERNS = [
  /αυτοκτον/i,
  /δεν\s+θέλω\s+να\s+ζω/i,
  /δεν\s+θελω\s+να\s+ζω/i,
  /θα\s+τα\s+τελειώσω/i,
  /θα\s+τα\s+τελειωσω/i,
  /δεν\s+αξίζει\s+να\s+ζω/i,
  /να\s+πεθάνω/i,
  /να\s+πεθανω/i,
];

const WIN_STRATEGY_PATTERNS = [
  /πώς\s+(να\s+)?κερδί/i,
  /πως\s+(να\s+)?κερδι/i,
  /στρατηγικ[έςά]\s+νίκης/i,
  /στρατηγικ[ες]\s+νικης/i,
  /tips?\s+για\s+νίκη/i,
  /πώς\s+κερδίζω/i,
  /σύστημα\s+(στοιχήματος|παιχνιδιού)/i,
  /μαργαριτάρι|σίγουρο\s+στοίχημα/i,
  /how\s+to\s+win/i,
  /betting\s+system/i,
];

/** @param {string} message */
export function detectCrisisMessage(message) {
  const t = message.trim();
  return CRISIS_PATTERNS.some((re) => re.test(t));
}

/** @param {string} message */
export function detectWinStrategyRequest(message) {
  const t = message.trim();
  return WIN_STRATEGY_PATTERNS.some((re) => re.test(t));
}

const FIELD_LABELS = {
  ageRange: 'Ηλικιακή ομάδα',
  gender: 'Φύλο',
  primaryGameType: 'Κύριος τύπος παιχνιδιού',
  gameTypesCount: 'Αριθμός τύπων παιχνιδιών',
  daysPerMonth: 'Ημέρες παιχνιδιού/μήνα',
  avgSessionMinutes: 'Μέση διάρκεια συνεδρίας (λεπτά)',
  nightPlayPercent: 'Νυχτερινό παιχνίδι (%)',
  avgWagerEuro: 'Μέσο στοίχημα (€)',
  weeklyTotalEuro: 'Εβδομαδιαίο ποσό (€)',
  wagerVariability: 'Μεταβλητότητα πονταρίσματος',
  depositsPerSession: 'Καταθέσεις/συνεδρία',
  chasingFrequency: 'Chasing απωλειών',
  cancelWithdrawalCount: 'Ακύρωση αναλήψεων',
  limitsSet: 'Όρια',
  failedStopAttempts: 'Αποτυχημένη διακοπή',
  relationshipConflict: 'Εντάσεις σχέσεων/εργασίας',
  riskAwareness: 'Επίγνωση house edge',
};

/**
 * @param {Record<string, unknown>} input Normalized or raw form fields
 * @param {Record<string, unknown>} [analysis] Analysis API response
 */
export function buildAdvisorContextBlock(input, analysis) {
  if (!input && !analysis) return '';

  const lines = ['=== ΔΕΔΟΜΕΝΑ ΑΞΙΟΛΟΓΗΣΗΣ ===', ''];

  if (input && typeof input === 'object') {
    lines.push('## Φόρμα αξιολόγησης (formData)');
    for (const [key, value] of Object.entries(input)) {
      if (value == null || value === '') continue;
      const label = FIELD_LABELS[key] ?? key;
      lines.push(`- ${label} (${key}): ${value}`);
    }
    lines.push('');
  }

  const ra = analysis?.riskAssessment;
  if (ra) {
    lines.push('## Rule-based risk engine (Prompt 5)');
    lines.push(`- Συνολικό score: ${ra.score} / 100`);
    lines.push(`- Tier: ${ra.tier}`);
    if (ra.topDrivers?.length) {
      lines.push(`- Top-3 drivers: ${ra.topDrivers.join('; ')}`);
    }
    if (ra.recommendations?.length) {
      lines.push('- Προτάσεις engine:');
      for (const rec of ra.recommendations) {
        lines.push(`  • ${rec}`);
      }
    }
    if (Array.isArray(ra.breakdown) && ra.breakdown.length) {
      lines.push('- Breakdown ανά δείκτη (indicator | συμβολή % | λόγος):');
      const sorted = [...ra.breakdown].sort((a, b) => b.contribution - a.contribution);
      for (const row of sorted) {
        lines.push(
          `  • ${row.label ?? row.indicator}: +${row.contribution} (raw ${row.rawScore}/10, βάρος ${row.weight}%) — ${row.reason}`,
        );
      }
    }
    lines.push('');
  } else if (analysis) {
    lines.push('## Ανάλυση (legacy)');
    lines.push(`- Risk score: ${analysis.riskScore}`);
    if (analysis.riskTier) lines.push(`- Tier: ${analysis.riskTier}`);
    if (analysis.advice) lines.push(`- Σύνοψη συμβουλής: ${analysis.advice}`);
    lines.push('');
  }

  if (analysis?.expectedWeeklySpend != null) {
    lines.push(`- Εκτιμώμενο εβδομαδιαίο ποσό (εικονογράφηση): ${analysis.expectedWeeklySpend}€`);
  }

  return lines.join('\n');
}

/**
 * @param {Array<{ role: string, content: string }>} history
 * @param {string} message
 * @param {string} contextBlock
 */
export function buildUserTurn(history, message, contextBlock) {
  const historyText = history
    .map((m) => `${m.role === 'user' ? 'Χρήστης' : 'Σύμβουλος'}: ${m.content}`)
    .join('\n');

  return `${contextBlock}

=== ΣΥΝΟΜΙΛΙΑ ===
${historyText ? `${historyText}\n` : ''}
Χρήστης: ${message}

Απάντησε στα ελληνικά, ακολουθώντας τους κανόνες του system prompt.`;
}
