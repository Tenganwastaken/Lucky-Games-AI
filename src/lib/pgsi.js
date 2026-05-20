/**
 * Problem Gambling Severity Index (PGSI) — Ferris & Wynne, 2001.
 * Public-domain screening instrument (Canadian Centre on Substance Abuse).
 */

export const PGSI_ANSWER_OPTIONS = [
  { value: 0, label: 'Ποτέ' },
  { value: 1, label: 'Μερικές φορές' },
  { value: 2, label: 'Τις περισσότερες φορές' },
  { value: 3, label: 'Σχεδόν πάντα' },
];

export const PGSI_QUESTIONS = [
  'Έχεις στοιχηματίσει περισσότερα χρήματα από όσα μπορούσες πραγματικά να αντέξεις να χάσεις;',
  'Είχες ανάγκη να στοιχηματίζεις μεγαλύτερα ποσά για να νιώσεις την ίδια ένταση;',
  'Όταν έπαιζες, επέστρεψες κάποια άλλη μέρα για να ξανακερδίσεις τα χαμένα;',
  'Δανείστηκες χρήματα ή πούλησες κάτι για να αποκτήσεις χρήματα για παιχνίδι;',
  'Ένιωσες ότι ίσως έχεις πρόβλημα με τον τζόγο;',
  'Σου έχει προκαλέσει ο τζόγος προβλήματα υγείας, συμπεριλαμβανομένου άγχους ή στρες;',
  'Σε επέκριναν άλλοι για τη συμπεριφορά σου σχετικά με τον τζόγο ή σου είπαν ότι έχεις πρόβλημα, ανεξάρτητα από το αν πίστευες εσύ ότι όντως είχες;',
  'Σου έχει προκαλέσει ο τζόγος οικονομικά προβλήματα σε εσένα ή στο νοικοκυριό σου;',
  'Ένιωσες ποτέ ένοχος/η για τον τρόπο που παίζεις ή για τις συνέπειες του παιχνιδιού;',
];

export const PGSI_DISCLAIMER =
  'Η κλίμακα PGSI είναι ψυχομετρικά εγκυροποιημένο εργαλείο διαλογής γενικού πληθυσμού (Ferris & Wynne, 2001), όχι κλινική διάγνωση. Για επίσημη αξιολόγηση απαιτείται εξέταση από ψυχίατρο ή κλινικό ψυχολόγο.';

export const PGSI_CATEGORIES = {
  non_problem: {
    key: 'non_problem',
    label: 'Μη προβληματικός',
    range: '0',
    explanation:
      'Το σκορ σου υποδηλώνει ότι, τους τελευταίους 12 μήνες, δεν εμφανίζονται σημαντικά πρότυπα προβληματικού τζόγου σύμφωνα με το PGSI. Συνέχισε να παρακολουθείς τη συμπεριφορά σου και να θέτεις όρια όπου χρειάζεται.',
  },
  low_risk: {
    key: 'low_risk',
    label: 'Χαμηλού κινδύνου',
    range: '1–2',
    explanation:
      'Το σκορ σου ανήκει στην κατηγορία χαμηλού κινδύνου. Μερικές συμπεριφορές μπορεί να αξίζουν προσοχής· είναι καλή στιγμή να ορίσεις προϋπολογισμό και χρονικά όρια πριν αυξηθεί η συχνότητα ή τα ποσά.',
  },
  moderate_risk: {
    key: 'moderate_risk',
    label: 'Μέτριου κινδύνου',
    range: '3–7',
    explanation:
      'Το σκορ σου ανήκει στην κατηγορία μέτριου κινδύνου. Στη βιβλιογραφία, τέτοια επίπεδα συσχετίζονται με αυξημένη πιθανότητα βλάβης. Σκέψου εθελοντικά όρια, διάλειμμα από το παιχνίδι και συζήτηση με κάποιον που εμπιστεύεσαι ή με εξειδικευμένη υπηρεσία.',
  },
  problem: {
    key: 'problem',
    label: 'Προβληματικός παίκτης',
    range: '8–27',
    explanation:
      'Το σκορ σου ανήκει στην κατηγορία προβληματικού παίκτη σύμφωνα με το PGSI. Αυτό δεν είναι κλινική διάγνωση, αλλά υποδεικνύει ότι αξίζει σοβαρή προσοχή και επαγγελματική υποστήριξη. Συνιστάται επικοινωνία με εξειδικευμένη υπηρεσία το συντομότερο δυνατό.',
  },
};

/**
 * @param {number[]} answers Nine values 0–3
 */
export function scorePgsi(answers) {
  if (!Array.isArray(answers) || answers.length !== PGSI_QUESTIONS.length) {
    throw new Error('PGSI requires exactly 9 answers');
  }
  for (const v of answers) {
    if (!Number.isInteger(v) || v < 0 || v > 3) {
      throw new Error('Each PGSI answer must be 0–3');
    }
  }

  const totalScore = answers.reduce((sum, v) => sum + v, 0);

  let categoryKey;
  if (totalScore === 0) categoryKey = 'non_problem';
  else if (totalScore <= 2) categoryKey = 'low_risk';
  else if (totalScore <= 7) categoryKey = 'moderate_risk';
  else categoryKey = 'problem';

  const cat = PGSI_CATEGORIES[categoryKey];

  return {
    totalScore,
    categoryKey,
    category: cat.label,
    range: cat.range,
    explanation: cat.explanation,
    needsResources: totalScore >= 8,
  };
}
