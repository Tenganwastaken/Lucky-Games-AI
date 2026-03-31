'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';

const GlobalGamblingMap = dynamic(() => import('@/components/GlobalGamblingMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        padding: '3rem',
        textAlign: 'center',
        color: '#64748b',
        borderRadius: '1rem',
        border: '1px dashed #cbd5e1',
        background: '#f8fafc',
      }}
    >
      Loading interactive map…
    </div>
  ),
});

export default function HomePageClient() {
  return (
    <main
      style={{
        minHeight: '100vh',
        margin: 0,
        padding: '2rem 1rem 3rem',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        background:
          'radial-gradient(circle at 20% 0%, #1d4ed8 0, #0f172a 45%, #020617 100%)',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          borderRadius: '1.5rem',
          padding: '2rem',
          background: 'linear-gradient(165deg, rgba(255,255,255,0.98), rgba(248,250,252,0.99))',
          boxShadow: '0 24px 60px rgba(15,23,42,0.35), 0 0 0 1px rgba(148,163,184,0.2)',
        }}
      >
        <SiteNav />

        <header style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '2.25rem',
              letterSpacing: '-0.03em',
              marginBottom: '0.5rem',
              color: '#0f172a',
            }}
          >
            Lucky Games — global picture
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#475569', maxWidth: 720, lineHeight: 1.6 }}>
            <strong>Placeholder copy (edit anytime):</strong> Lucky games include lotteries, sports betting,
            casino-style games, and other chance-based products. Rules, risks, and participation rates differ
            widely by country. This hub gives you a short overview and an interactive map mixing{' '}
            <em>illustrative anonymous statistics</em> with <em>optional counts from registered visitors</em>{' '}
            (country guessed from IP when you sign up or log in — approximate only).
          </p>
          <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: 720, lineHeight: 1.6, marginTop: '0.75rem' }}>
            For personalized AI-assisted risk notes and charts, open the{' '}
            <Link href="/advisor" style={{ color: '#2563eb', fontWeight: 600 }}>
              Risk advisor
            </Link>
            .
          </p>
        </header>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', color: '#0f172a' }}>
            Quick facts (sample text)
          </h2>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              color: '#334155',
              lineHeight: 1.7,
              fontSize: '0.95rem',
            }}
          >
            <li>Many jurisdictions require minimum age and licensed operators — always check local law.</li>
            <li>House edge and odds vary by game; long-run losses are statistically normal for chance games.</li>
            <li>Maps below use <strong>demo percentages</strong> you can replace with citations from real studies.</li>
          </ul>
        </section>

        <section>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem', color: '#0f172a' }}>
            Interactive world map
          </h2>
          <GlobalGamblingMap />
        </section>
      </div>
    </main>
  );
}
