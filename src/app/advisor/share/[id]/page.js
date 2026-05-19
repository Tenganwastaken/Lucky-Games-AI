import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, getSessionUserByToken } from '@/lib/auth-session';
import { gameTypeLabel, riskToleranceLabel } from '@/lib/advisor-labels';
import PrintSummaryButton from '@/components/PrintSummaryButton';

export const metadata = {
  title: 'Advisor summary | Lucky Games',
};

export default async function AdvisorSharePage({ params }) {
  const { id } = await params;
  if (!id || typeof id !== 'string') notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? await getSessionUserByToken(token) : null;
  if (!session?.user) notFound();

  const row = await prisma.advisorUsage.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!row) notFound();

  const when = new Date(row.createdAt).toLocaleString();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      <main className="app-shell">
        <div className="no-print" style={{ maxWidth: 720, margin: '0 auto 1.5rem' }}>
          <Link href="/advisor" className="app-link app-link--subtle">
            ← Back to advisor
          </Link>
        </div>

        <article className="app-card app-card--article">
          <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <p className="app-eyebrow" style={{ marginBottom: '0.35rem' }}>
              Lucky Games — Risk advisor
            </p>
            <h1 className="app-title" style={{ fontSize: '1.5rem' }}>
              Your analysis summary
            </h1>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{when}</p>
          </header>

          <section style={{ marginBottom: '1.25rem' }}>
            <h2 className="app-eyebrow" style={{ marginBottom: '0.5rem' }}>
              Inputs
            </h2>
            <table className="share-table">
              <tbody>
                {[
                  ['Game type', gameTypeLabel(row.gameType)],
                  ['Average bet size', String(row.betSize)],
                  ['Plays per week', String(row.frequencyPerWeek)],
                  ['Risk tolerance', riskToleranceLabel(row.riskTolerance)],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td style={{ fontWeight: 500 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: '1.25rem' }}>
            <h2 className="app-eyebrow" style={{ marginBottom: '0.5rem' }}>
              Estimates (illustrative)
            </h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              <li>Risk score: <strong>{row.riskScore}</strong> / 100</li>
              <li>Win chance (model estimate): <strong>{row.winChanceEstimate}%</strong></li>
              <li>Loss chance (model estimate): <strong>{row.lossChanceEstimate}%</strong></li>
              <li>Expected weekly spend: <strong>{row.expectedWeeklySpend}</strong> (bet × plays/week)</li>
            </ul>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 className="app-eyebrow" style={{ marginBottom: '0.5rem' }}>
              AI advice
            </h2>
            <p style={{ margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{row.advice || '—'}</p>
          </section>

          <footer
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border)',
              paddingTop: '1rem',
              lineHeight: 1.5,
            }}
          >
            This summary is for personal reflection only. It is not financial, legal, or medical advice. Gambling
            carries risk; seek help if play stops being fun.
          </footer>

          <div className="no-print" style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <PrintSummaryButton />
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', flex: '1 1 200px', alignSelf: 'center' }}>
              Use your browser&apos;s print dialog → choose &quot;Save as PDF&quot; to share a copy.
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
