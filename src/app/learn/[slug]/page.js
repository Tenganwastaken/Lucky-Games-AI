import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteNav from '@/components/SiteNav';
import { CHAPTERS, EDUCATION_DISCLAIMER, getChapterBySlug } from '@/data/educationGreek';

export function generateStaticParams() {
  return CHAPTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const ch = getChapterBySlug(slug);
  if (!ch) return { title: 'Άγνωστο κεφάλαιο' };
  return {
    title: `${ch.title} | Lucky Games`,
    description: ch.summary,
  };
}

export default async function LearnChapterPage({ params }) {
  const { slug } = await params;
  const ch = getChapterBySlug(slug);
  if (!ch) notFound();

  return (
    <main className="app-shell">
      <article className="app-card app-card--article prose-learn">
        <SiteNav />

        <p style={{ margin: '0 0 0.5rem' }}>
          <Link href="/learn" className="app-link app-link--subtle">
            ← Όλα τα κεφάλαια
          </Link>
        </p>

        <header style={{ marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <p className="learn-chapter-card__num" style={{ marginBottom: '0.35rem' }}>
            Κεφάλαιο {ch.number}
          </p>
          <h1 className="app-title" style={{ fontSize: '1.65rem', marginBottom: 0 }}>
            {ch.title}
          </h1>
          <p className="app-subtitle" style={{ marginTop: '0.75rem', maxWidth: 'none' }}>
            {ch.summary}
          </p>
        </header>

        {ch.sections.map((sec) => (
          <section key={sec.title}>
            <h2>{sec.title}</h2>
            {sec.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ))}

        <footer
          style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            lineHeight: 1.55,
          }}
        >
          {EDUCATION_DISCLAIMER}
        </footer>
      </article>
    </main>
  );
}
