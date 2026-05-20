/** @typedef {'prefer_not' | string} FieldValue */

export const STORAGE_KEY = 'lucky-games-risk-assessment-draft';

export const PREFER_NOT = 'prefer_not';

export const DEFAULT_FORM_DATA = {
  ageRange: '',
  gender: '',
  primaryGameType: '',
  gameTypesCount: 1,
  daysPerMonth: 0,
  avgSessionMinutes: 30,
  nightPlayPercent: 0,
  avgWagerEuro: '',
  weeklyTotalEuro: '',
  wagerVariability: '',
  depositsPerSession: 0,
  chasingFrequency: '',
  cancelWithdrawalCount: '',
  limitsSet: '',
  failedStopAttempts: '',
  relationshipConflict: '',
  riskAwareness: '',
};

/** Fields that cannot use «Δεν θέλω να απαντήσω» */
export const NO_PREFER_NOT_FIELDS = new Set([
  'primaryGameType',
  'daysPerMonth',
  'avgWagerEuro',
]);

export const SECTION_COUNT = 6;

export const AGE_RANGE_OPTIONS = [
  { value: '18_24', label: '18–24' },
  { value: '25_34', label: '25–34' },
  { value: '35_44', label: '35–44' },
  { value: '45_54', label: '45–54' },
  { value: '55_plus', label: '55+' },
  { value: PREFER_NOT, label: 'Προτιμώ να μην απαντήσω' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Άνδρας' },
  { value: 'female', label: 'Γυναίκα' },
  { value: 'other', label: 'Άλλο' },
  { value: PREFER_NOT, label: 'Προτιμώ να μην απαντήσω' },
];

export const PRIMARY_GAME_TYPE_OPTIONS = [
  { value: 'lottery', label: 'Λοταρία' },
  { value: 'sports_bet', label: 'Αθλητικό στοίχημα' },
  { value: 'online_slots', label: 'Online κουλοχέρηδες' },
  { value: 'live_casino', label: 'Live καζίνο (ρουλέτα/blackjack)' },
  { value: 'poker', label: 'Πόκερ' },
  { value: 'other', label: 'Άλλο' },
];

export const WAGER_VARIABILITY_OPTIONS = [
  { value: 'very_stable', label: 'Πολύ σταθερό' },
  { value: 'moderate', label: 'Μέτρια μεταβλητό' },
  { value: 'very_variable', label: 'Πολύ μεταβλητό' },
];

export const CHASING_FREQUENCY_OPTIONS = [
  { value: 'never', label: 'Ποτέ' },
  { value: 'rarely', label: 'Σπάνια' },
  { value: 'sometimes', label: 'Μερικές φορές' },
  { value: 'often', label: 'Συχνά' },
  { value: 'very_often', label: 'Πολύ συχνά' },
];

export const CANCEL_WITHDRAWAL_OPTIONS = [
  { value: 'never', label: 'Ποτέ' },
  { value: '1_2', label: '1–2 φορές' },
  { value: '3_5', label: '3–5 φορές' },
  { value: 'often', label: 'Συχνά' },
];

export const LIMITS_SET_OPTIONS = [
  { value: 'none', label: 'Δεν έχω βάλει όρια' },
  { value: 'set_respected', label: 'Έχω βάλει και τα σέβομαι' },
  { value: 'set_violated', label: 'Έχω βάλει αλλά τα παραβιάζω' },
];

export const FAILED_STOP_OPTIONS = [
  { value: 'none', label: 'Καμία' },
  { value: 'once', label: '1 φορά' },
  { value: '2_3', label: '2–3 φορές' },
  { value: 'many', label: 'Πολλές φορές' },
];

export const RELATIONSHIP_CONFLICT_OPTIONS = [
  { value: 'never', label: 'Ποτέ' },
  { value: 'rarely', label: 'Σπάνια' },
  { value: 'sometimes', label: 'Μερικές φορές' },
  { value: 'often', label: 'Συχνά' },
];

export const RISK_AWARENESS_OPTIONS = [
  { value: 'fully', label: 'Ναι πλήρως' },
  { value: 'partially', label: 'Μερικώς' },
  { value: 'no', label: 'Όχι' },
];

export const SECTIONS = [
  {
    id: 1,
    title: 'Δημογραφικά',
    subtitle: 'Προαιρετικά',
    tooltip: {
      title: 'Γιατί αυτή η ενότητα;',
      body: 'Η ηλικία και το φύλο χρησιμοποιούνται στη διεθνή έρευνα για στατιστική κανονικοποίηση ώστε να συγκρίνονται δείκτες κινδύνου ανά ομάδα πληθυσμού, χωρίς κλινική ταξινόμηση.',
      source: 'Young et al., 2023',
    },
  },
  {
    id: 2,
    title: 'Τύπος & εύρος παιχνιδιού',
    subtitle: null,
    tooltip: {
      title: 'Γιατί αυτή η ενότητα;',
      body: 'Ο κύριος τύπος τυχερού παιχνιδιού και η συμμετοχή σε πολλαπλούς τύπους συσχετίζονται με διαφορετικό house edge και με αυξημένο κίνδυνο πρόβληματος.',
      source: 'Abbott et al., 2018',
    },
  },
  {
    id: 3,
    title: 'Συχνότητα & χρόνος',
    subtitle: null,
    tooltip: {
      title: 'Γιατί αυτή η ενότητα;',
      body: 'Η συχνότητα παιχνιδιού, η διάρκεια συνεδρίας και το νυχτερινό παιχνίδι αποτελούν συμπεριφορικούς δείκτες εθισμού και απώλειας ελέγχου.',
      source: 'Griffiths, 2005· Auer et al., 2024',
    },
  },
  {
    id: 4,
    title: 'Οικονομικά',
    subtitle: null,
    tooltip: {
      title: 'Γιατί αυτή η ενότητα;',
      body: 'Το μέσο στοίχημα, το εβδομαδιαίο ποσό και η μεταβλητότητα πονταρίσματος προβλέπουν οικονομική βλάβη και χρέη.',
      source: 'Markham et al., 2016· Auer et al., 2024',
    },
  },
  {
    id: 5,
    title: 'Καταθέσεις & chasing',
    subtitle: null,
    tooltip: {
      title: 'Γιατί αυτή η ενότητα;',
      body: 'Αυτή η ομάδα ερωτήσεων μετράει τους δύο πιο ισχυρούς συμπεριφορικούς δείκτες κινδύνου σύμφωνα με τη βιβλιογραφία: το chasing losses και τη συμπεριφορά καταθέσεων.',
      source: 'Hopfgartner et al., 2025· Auer & Griffiths, 2022',
    },
  },
  {
    id: 6,
    title: 'Έλεγχος & επίγνωση',
    subtitle: null,
    tooltip: {
      title: 'Γιατί αυτή η ενότητα;',
      body: 'Αποτυχημένες προσπάθειες διακοπής, σύγκρουση στις σχέσεις και χαμηλή επίγνωση house edge συσχετίζονται με κλινικά επίπεδα πρόβληματος τζόγου.',
      source: 'Currie et al., 2013· APA, 2013',
    },
  },
];

/** Map expanded game type → legacy map filter key */
export function primaryGameTypeToLegacy(gameType) {
  switch (gameType) {
    case 'lottery':
      return 'lottery';
    case 'sports_bet':
      return 'sports_bet';
    case 'online_slots':
      return 'slots';
    case 'live_casino':
    case 'poker':
    case 'other':
    default:
      return 'other';
  }
}

export function loadDraftFromStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      formData: { ...DEFAULT_FORM_DATA, ...parsed.formData },
      activeSection: parsed.activeSection ?? 1,
    };
  } catch {
    return null;
  }
}

export function saveDraftToStorage(formData, activeSection) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ formData, activeSection, savedAt: new Date().toISOString() }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearDraftStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
