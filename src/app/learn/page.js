import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import { CHAPTERS, EDUCATION_DISCLAIMER } from '@/data/educationGreek';

export const metadata = {
  title: 'Θεωρία — Lucky Games',
  description: 'Εκπαιδευτικές περιλήψεις: ψηφιακός τζόγος, ψυχολογία, σχεδιασμός, δεδομένα και κίνδυνος.',
};

export default function LearnHubPage() {
  return (
    <main className="app-shell">
      <div className="app-card" style={{ maxWidth: 900 }}>
        <SiteNav />

        <header style={{ marginBottom: '2rem' }}>
          <p className="app-eyebrow">Εκπαιδευτική ενότητα</p>
          <h1 className="app-title">Θεωρία τυχερών παιχνιδιών &amp; ανίχνευση κινδύνου</h1>
          <p className="app-subtitle" style={{ maxWidth: 'none' }}>
            Σύντομες περιλήψεις από τη δομή της εργασίας σου (κεφάλαια 1–6): εισαγωγή, ψηφιακό φαινόμενο, ψυχολογία
            εθισμού, σχεδιασμός πλατφορμών και CSR, συμπεριφορικά δεδομένα και ηθικά ζητήματα. Για πλήρες κείμενο,
            βιβλιογραφία και σχήματα χρησιμοποίησε το τελικό Word/PDF της διπλωματικής.
          </p>
        </header>

        <aside className="callout callout--warn" style={{ marginBottom: '1.75rem' }}>
          <strong>Σημείωση:</strong> {EDUCATION_DISCLAIMER}{' '}
          <a
            href="https://www.kethea.gr"
            target="_blank"
            rel="noopener noreferrer"
            className="app-link"
            style={{ fontSize: 'inherit' }}
          >
            ΚΕΘΕΑ
          </a>
          .
        </aside>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1rem' }}>
          {CHAPTERS.map((ch) => (
            <li key={ch.slug}>
              <Link href={`/learn/${ch.slug}`} className="learn-chapter-card">
                <span className="learn-chapter-card__num">Κεφάλαιο {ch.number}</span>
                <h2 className="learn-chapter-card__title">{ch.title}</h2>
                <p className="learn-chapter-card__summary">{ch.summary}</p>
                <span className="learn-chapter-card__cta">Άνοιγμα περιεχομένου →</span>
              </Link>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: '2rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Το{' '}
          <Link href="/advisor" className="app-link">
            Risk advisor
          </Link>{' '}
          του site είναι επίδειξη εργαλείου (όχι κλινική αξιολόγηση)· συνδέεται εννοιολογικά με τα κεφάλαια 1, 5 και 6
          της εργασίας σου.
        </p>
      </div>
    </main>
  );
}
