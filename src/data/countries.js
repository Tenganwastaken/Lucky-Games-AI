/**
 * Static country profiles for map deep-dive (demo / education).
 * Extend COUNTRIES or use getCountryProfile() fallback for new ISO2 codes.
 */

import lookup from 'country-code-lookup';
import { MOCK_STATS } from '@/data/mockCountryGamblingStats';

/** @param {string} iso ISO 3166-1 alpha-2 */
export function flagEmoji(iso) {
  if (!iso || iso.length !== 2) return '🏳️';
  const u = iso.toUpperCase();
  return String.fromCodePoint(
    ...[...u].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)),
  );
}

function avgParticipation(iso) {
  const row = MOCK_STATS[iso];
  if (!row) return null;
  return Math.round((row.lottery + row.slots + row.sports_bet + row.other) / 4);
}

/** @type {Record<string, object>} */
export const COUNTRIES = {
  GR: {
    iso2: 'GR',
    name: 'Ελλάδα',
    population: 10_400_000,
    gamblingParticipationPct: avgParticipation('GR') ?? 17,
    overview:
      'Στην Ελλάδα η συμμετοχή σε τυχερά παιχνίδια είναι από τις υψηλότερες στην ΕΕ, με έντονη παρουσία αθλητικού στοιχήματος και λοταριών. Το ρυθμιστικό πλαίσιο έχει ενισχυθεί με την ΕΕΕΠ και τις Αρχές Υπεύθυνου Παιχνιδιού, ενώ η ψηφιακή πρόσβαση αυξάνει την έκθεση σε διαδικτυακές πλατφόρμες.',
    regulatory: {
      kind: 'greece',
    },
    helpResources: [
      { name: 'ΚΕΘΕΑ-ΑΛΦΑ', detail: '210 9215776', href: 'tel:2109215776' },
      { name: 'ΚΕΘΕΑ ΑΠΟΧΗ', detail: '1114 (24ωρη)', href: 'tel:1114' },
      { name: 'Γραμμή Ψυχικής Υγείας', detail: '1018', href: 'tel:1018' },
      { name: 'ΕΕΕΠ', detail: 'gamingcommission.gov.gr', href: 'https://www.gamingcommission.gov.gr' },
      { name: 'ΚΕΘΕΑ', detail: 'kethea.gr', href: 'https://www.kethea.gr' },
    ],
  },
  US: {
    iso2: 'US',
    name: 'Ηνωμένες Πολιτείες',
    population: 334_000_000,
    gamblingParticipationPct: avgParticipation('US') ?? 16,
    overview:
      'Στις ΗΠΑ το τζόγο ρυθμίζεται κυρίως σε επίπεδο πολιτείας· online sports betting επεκτάθηκε ταχέως μετά το 2018. Τα ποσοστά συμμετοχής διαφέρουν ανά πολιτεία και κατηγορία παιχνιδιού.',
    regulatory: {
      kind: 'demo',
      authority: 'Πολιτειακές Gaming Commissions & NGCB (Nevada) κ.λπ.',
      ageLimit: '21+ (συχνά) ή 18+ ανά πολιτεία',
      summary:
        'Δεν υπάρχει ενιαίος ομοσπονδιακός ρυθμιστής· κάθε πολιτεία εκδίδει άδειες. Οι πάροχοι χωρίς τοπική άδεια θεωρούνται μη νόμιμοι στην αντίστοιχη δικαιοδοσία.',
      sources: ['https://www.ncpgambling.org'],
    },
    helpResources: [
      { name: 'National Council on Problem Gambling', detail: '1-800-522-4700', href: 'https://www.ncpgambling.org' },
    ],
  },
  GB: {
    iso2: 'GB',
    name: 'Ηνωμένο Βασίλειο',
    population: 67_000_000,
    gamblingParticipationPct: avgParticipation('GB') ?? 17,
    overview:
      'Το ΗΒ διαθέτει ώριμο online αγορά στοιχήματος με αυστηρότερη ρύθμιση διαφήμισης και υπεύθυνου παιχνιδιού μετά το 2005. Υψηλή συμμετοχή σε αθλητικό στοίχημα.',
    regulatory: {
      kind: 'demo',
      authority: 'UK Gambling Commission (UKGC)',
      ageLimit: '18 έτη',
      summary:
        'Όλοι οι εξουσιοδοτημένοι πάροχοι πρέπει να κατέχουν άδεια UKGC. Αυστηρά μέτρα KYC, self-exclusion (GAMSTOP) και διαφήμισης.',
      sources: ['https://www.gamblingcommission.gov.uk'],
    },
    helpResources: [
      { name: 'GamCare', detail: '0808 8020 133', href: 'https://www.gamcare.org.uk' },
      { name: 'GAMSTOP', detail: 'Εθνική αυτο-αποκλεισμός', href: 'https://www.gamstop.co.uk' },
    ],
  },
  DE: {
    iso2: 'DE',
    name: 'Γερμανία',
    population: 84_000_000,
    gamblingParticipationPct: avgParticipation('DE') ?? 15,
    overview:
      'Η γερμανική αγορά συνδυάζει κρατικές λοταρίες, online καζίνο με άδεια και αθλητικό στοίχημα υπό τον GlüStV 2021.',
    regulatory: {
      kind: 'demo',
      authority: 'Gemeinsame Glücksspielbehörde der Länder (GGL)',
      ageLimit: '18 έτη',
      summary: 'Ομοσπονδιακή ρύθμιση μέσω GGL· περιορισμοί σε slots (π.χ. €1 max stake) και deposit limits.',
      sources: ['https://www.gluecksspiel-behoerde.de'],
    },
    helpResources: [
      { name: 'BZgA', detail: 'Συμβουλευτική τζόγου', href: 'https://www.bzga.de' },
    ],
  },
  FR: {
    iso2: 'FR',
    name: 'Γαλλία',
    population: 68_000_000,
    gamblingParticipationPct: avgParticipation('FR') ?? 15,
    overview:
      'Η Γαλλία ελέγχει αυστηρά online καζίνο (κυρίως PMU/FDJ μονοπώλια) ενώ επιτρέπει στοίχημα και πόκερ με άδεια ANJ.',
    regulatory: {
      kind: 'demo',
      authority: 'Autorité Nationale des Jeux (ANJ)',
      ageLimit: '18 έτη',
      summary: 'Άδεια ANJ για online πάροχους· απαγόρευση μη αδειοδοτημένων ιστότοπων.',
      sources: ['https://www.anj.fr'],
    },
    helpResources: [
      { name: 'Joueurs Info Service', detail: '09 74 75 13 13', href: 'https://www.joueurs-info-service.fr' },
    ],
  },
  ES: {
    iso2: 'ES',
    name: 'Ισπανία',
    population: 47_000_000,
    gamblingParticipationPct: avgParticipation('ES') ?? 17,
    overview:
      'Ισχυρή παράδοση λοταριών και στοιχήματος· η DGOJ ρυθμίζει online και χερσαίο παιχνίδι με έμφαση στην προστασία ανηλίκων.',
    regulatory: {
      kind: 'demo',
      authority: 'Dirección General de Ordenación del Juego (DGOJ)',
      ageLimit: '18 έτη',
      summary: 'Άδειες DGOJ για online πάροχους· self-exclusion register διαθέσιμο.',
      sources: ['https://www.ordenacionjuego.es'],
    },
    helpResources: [
      { name: 'FEJAR', detail: 'fejar.org', href: 'https://www.fejar.org' },
    ],
  },
  IT: {
    iso2: 'IT',
    name: 'Ιταλία',
    population: 59_000_000,
    gamblingParticipationPct: avgParticipation('IT') ?? 18,
    overview:
      'Μεγάλη αγορά online στοιχήματος και slots υπό ADM· υψηλή διαφήμιση αθλητικών συμβάντων.',
    regulatory: {
      kind: 'demo',
      authority: 'Agenzia delle Dogane e dei Monopoli (ADM)',
      ageLimit: '18 έτη',
      summary: 'Κεντρική άδεια ADM· αυστηρές κυρώσεις σε μαύρες αγορές.',
      sources: ['https://www.adm.gov.it'],
    },
    helpResources: [
      { name: 'TVNGA', detail: 'tvnga.it', href: 'https://www.tvnga.it' },
    ],
  },
  AU: {
    iso2: 'AU',
    name: 'Αυστραλία',
    population: 26_000_000,
    gamblingParticipationPct: avgParticipation('AU') ?? 19,
    overview:
      'Υψηλή διείσδυση sports betting (ιδίως pre-match/in-play). Online καζίνο απαγορεύεται για κατοίκους από ομοσπονδιακή νομοθεσία.',
    regulatory: {
      kind: 'demo',
      authority: 'ACMA & πολιτειακές αρχές',
      ageLimit: '18 έτη',
      summary: 'Απαγόρευση «online casino» προς Αυστραλούς· επιτρεπόμενο στοίχημα μέσω αδειοδοτημένων παρόχων.',
      sources: ['https://www.acma.gov.au'],
    },
    helpResources: [
      { name: 'Gambling Help Online', detail: '1800 858 858', href: 'https://www.gamblinghelponline.org.au' },
    ],
  },
};

/**
 * @param {string} iso
 */
export function getCountryProfile(iso) {
  const code = (iso || '').toUpperCase();
  if (COUNTRIES[code]) return COUNTRIES[code];

  const participation = avgParticipation(code);
  let name = code;
  try {
    const hit = lookup.byIso(code);
    if (hit?.country) name = hit.country;
  } catch {
    /* optional */
  }

  return {
    iso2: code,
    name,
    population: null,
    gamblingParticipationPct: participation,
    overview:
      'Δεν υπάρχει ακόμα πλήρες προφίλ για αυτή τη χώρα στο dataset. Τα ποσοστά συμμετοχής (όπου διαθέσιμα) προέρχονται από ενδεικτικά demo στατιστικά — επέκτεινε το αρχείο `src/data/countries.js` για πλήρες ρυθμιστικό και πλαίσιο βοήθειας.',
    regulatory: {
      kind: 'demo',
      authority: 'Τοπική ρυθμιστική αρχή (δείτε επίσημες πηγές)',
      ageLimit: 'Συνήθως 18–21 έτη (ανά δικαιοδοσία)',
      summary:
        'Προσθέστε στο `COUNTRIES` αντικείμενο με κωδικό ISO2 για να εμφανίζεται πλήρες κείμενο ρύθμισης.',
      sources: [],
    },
    helpResources: [
      {
        name: 'BeGambleAware',
        detail: 'Διεθνής πληροφόρηση',
        href: 'https://www.begambleaware.org',
      },
    ],
  };
}

export const GREECE_REGULATORY_TEXT = `Η αρμόδια ρυθμιστική αρχή είναι η **Επιτροπή Εποπτείας και Ελέγχου Παιγνίων (ΕΕΕΠ)**, που συστάθηκε με τον Ν. 4002/2011 και έχει αναβαθμίσει τις αρμοδιότητές της με τον Ν. 4635/2019 και τον Ν. 4002/2011, αρ. 25 για τις Αρχές Υπεύθυνου Παιχνιδιού. Όριο ηλικίας: 21 έτη. Δικτυακοί τόποι παρόχων χωρίς άδεια ΕΕΕΠ είναι παράνομοι.

Επίσημες πηγές: ΕΕΕΠ (https://www.gamingcommission.gov.gr), ΦΕΚ Α' 180/2011, ΦΕΚ Α' 167/2019.`;
