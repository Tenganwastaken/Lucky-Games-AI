'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';

const GlobalGamblingMap = dynamic(() => import('@/components/GlobalGamblingMap'), {
  ssr: false,
  loading: () => (
    <div className="skeleton-block">Φόρτωση διαδραστικού χάρτη…</div>
  ),
});

export default function HomePageClient() {
  return (
    <main className="app-shell">
      <div className="app-card">
        <SiteNav />

        <header style={{ marginBottom: '2rem' }}>
          <h1 className="app-title">Lucky Games — παγκόσμια εικόνα</h1>
          <p className="app-subtitle">
            Τα τυχερά παιχνίδια (λοταρίες, στοίχημα, καζίνο κ.λπ.) έχουν αλλάξει με την ψηφιοποίηση: συνεχής πρόσβαση,
            ταχύτητα συναλλαγών και εξατομίκευση συνδέονται με υψηλότερα ρίσκα προβληματικής συμπεριφοράς. Στο ελληνικό
            πλαίσιο η ΕΕΕΠ καταγράφει υψηλή διάδοση συμμετοχής και ρυθμιστικό πλαίσιο (Ν. 4002/2011, Ν. 4635/2019, Αρχές
            Υπεύθυνου Παιχνιδιού). Αυτό το hub συνδυάζει <strong>εκπαιδευτικές περιλήψεις</strong> (βλ.{' '}
            <Link href="/learn" className="app-link">
              Θεωρία
            </Link>
            ), <em>ενδεικτικά στατιστικά στον χάρτη</em> και <em>προαιρετικά δεδομένα επισκεπτών</em> (χώρα κατά προσέγγιση
            από IP κατά την εγγραφή/σύνδεση).
          </p>
          <p className="app-subtitle" style={{ marginTop: '0.75rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Για εξατομικευμένη επίδειξη αξιολόγησης ρίσκου (εκπαιδευτικό demo, όχι κλινικό εργαλείο), άνοιξε τον{' '}
            <Link href="/advisor" className="app-link">
              Risk advisor
            </Link>
            .
          </p>
        </header>

        <section style={{ marginBottom: '2rem' }}>
          <h2 className="app-section-title">Σύντομα σημεία</h2>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              fontSize: '0.95rem',
            }}
          >
            <li>Ο νόμος και το ελάχιστο ηλικίας διαφέρουν ανά χώρα — έλεγξε την τοπική νομοθεσία.</li>
            <li>Στα παιχνίδια τύχης το μακροπρόθεσμο αναμενόμενο αποτέλεσμα συνήθως ευνοεί τον οργανωτή (house edge).</li>
            <li>Ο χάρτης συνδυάζει demo επίπεδα με πραγματικές μετρήσεις χρήσης του advisor όπου υπάρχουν δεδομένα.</li>
          </ul>
        </section>

        <section>
          <h2 className="app-section-title" style={{ marginBottom: '1rem' }}>
            Διαδραστικός παγκόσμιος χάρτης
          </h2>
          <GlobalGamblingMap />
        </section>
      </div>
    </main>
  );
}
