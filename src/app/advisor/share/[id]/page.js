import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, getSessionUserByToken } from '@/lib/auth-session';
import {
  gameTypeLabel,
  riskToleranceLabel,
  primaryGameTypeLabel,
  ageRangeLabel,
  genderLabel,
  wagerVariabilityLabel,
  chasingFrequencyLabel,
  cancelWithdrawalLabel,
  limitsSetLabel,
  failedStopLabel,
  relationshipConflictLabel,
  riskAwarenessLabel,
} from '@/lib/advisor-labels';
import PrintSummaryButton from '@/components/PrintSummaryButton';
import {
  AI_ADVICE,
  BACK_TO_ADVISOR,
  BRAND_NAME,
  ESTIMATES_ILLUSTRATIVE,
  EXPECTED_WEEKLY_SPEND,
  EXPECTED_WEEKLY_SPEND_NOTE,
  INPUTS,
  LOSS_CHANCE_ESTIMATE,
  RISK_ADVISOR,
  RISK_SCORE,
  SHARE_FOOTER,
  SHARE_PAGE_TITLE,
  WIN_CHANCE_ESTIMATE,
  YOUR_ANALYSIS_SUMMARY,
  ADVISOR_DISCLAIMER,
  formatCurrency,
  formatDateTime,
} from '@/lib/strings';

export const metadata = {
  title: SHARE_PAGE_TITLE,
};

function Row({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <tr>
      <td>{label}</td>
      <td style={{ fontWeight: 500 }}>{value}</td>
    </tr>
  );
}

export default async function AdvisorSharePage({ params }) {
  const { id } = await params;
  if (!id || typeof id !== 'string') notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? await getSessionUserByToken(token) : null;
  if (!session?.user) notFound();

  const risk = await prisma.riskAssessment.findFirst({
    where: { id, userId: session.user.id },
  });

  const legacy = !risk
    ? await prisma.advisorUsage.findFirst({
        where: { id, userId: session.user.id },
      })
    : null;

  const row = risk ?? legacy;
  if (!row) notFound();

  const when = formatDateTime(row.createdAt);
  const isRisk = Boolean(risk);

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
            {BACK_TO_ADVISOR}
          </Link>
        </div>

        <article className="app-card app-card--article">
          <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <p className="app-eyebrow" style={{ marginBottom: '0.35rem' }}>
              {BRAND_NAME} — {RISK_ADVISOR}
            </p>
            <h1 className="app-title" style={{ fontSize: '1.5rem' }}>
              {YOUR_ANALYSIS_SUMMARY}
            </h1>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{when}</p>
            <p className="callout callout--warn" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              {ADVISOR_DISCLAIMER}
            </p>
          </header>

          <section style={{ marginBottom: '1.25rem' }}>
            <h2 className="app-eyebrow" style={{ marginBottom: '0.5rem' }}>
              {INPUTS}
            </h2>
            <table className="share-table">
              <tbody>
                {isRisk ? (
                  <>
                    <Row label="Ηλικιακή ομάδα" value={ageRangeLabel(risk.ageRange)} />
                    <Row label="Φύλο" value={genderLabel(risk.gender)} />
                    <Row label="Κύριος τύπος" value={primaryGameTypeLabel(risk.primaryGameType)} />
                    <Row label="Τύποι παιχνιδιών" value={risk.gameTypesCount != null ? String(risk.gameTypesCount) : null} />
                    <Row label="Ημέρες/μήνα" value={String(risk.daysPerMonth)} />
                    <Row label="Μέση συνεδρία (λεπτά)" value={String(risk.avgSessionMinutes)} />
                    <Row label="Νυχτερινό %" value={`${risk.nightPlayPercent}%`} />
                    <Row label="Μέσο στοίχημα" value={formatCurrency(risk.avgWagerEuro)} />
                    <Row
                      label="Εβδομαδιαίο ποσό"
                      value={risk.weeklyTotalEuro != null ? formatCurrency(risk.weeklyTotalEuro) : null}
                    />
                    <Row label="Μεταβλητότητα" value={wagerVariabilityLabel(risk.wagerVariability)} />
                    <Row
                      label="Καταθέσεις/συνεδρία"
                      value={risk.depositsPerSession != null ? String(risk.depositsPerSession) : null}
                    />
                    <Row label="Chasing" value={chasingFrequencyLabel(risk.chasingFrequency)} />
                    <Row label="Ακύρωση ανάληψης" value={cancelWithdrawalLabel(risk.cancelWithdrawalCount)} />
                    <Row label="Όρια" value={limitsSetLabel(risk.limitsSet)} />
                    <Row label="Αποτυχημένη διακοπή" value={failedStopLabel(risk.failedStopAttempts)} />
                    <Row label="Εντάσεις" value={relationshipConflictLabel(risk.relationshipConflict)} />
                    <Row label="Επίγνωση house edge" value={riskAwarenessLabel(risk.riskAwareness)} />
                  </>
                ) : (
                  <>
                    <Row label="Τύπος παιχνιδιού" value={gameTypeLabel(legacy.gameType)} />
                    <Row label="Μέσο στοίχημα" value={formatCurrency(legacy.betSize)} />
                    <Row label="Συχνότητα/εβδομάδα" value={String(legacy.frequencyPerWeek)} />
                    <Row label="Ανοχή κινδύνου" value={riskToleranceLabel(legacy.riskTolerance)} />
                  </>
                )}
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: '1.25rem' }}>
            <h2 className="app-eyebrow" style={{ marginBottom: '0.5rem' }}>
              {ESTIMATES_ILLUSTRATIVE}
            </h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
              <li>
                {RISK_SCORE}: <strong>{row.riskScore}</strong> / 100
              </li>
              <li>
                {WIN_CHANCE_ESTIMATE}: <strong>{row.winChanceEstimate}%</strong>
              </li>
              <li>
                {LOSS_CHANCE_ESTIMATE}: <strong>{row.lossChanceEstimate}%</strong>
              </li>
              <li>
                {EXPECTED_WEEKLY_SPEND}: <strong>{formatCurrency(row.expectedWeeklySpend)}</strong>{' '}
                {EXPECTED_WEEKLY_SPEND_NOTE}
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 className="app-eyebrow" style={{ marginBottom: '0.5rem' }}>
              {AI_ADVICE}
            </h2>
            <p style={{ margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
              {row.advice || '—'}
            </p>
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
            {SHARE_FOOTER}
          </footer>

          <div className="no-print" style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <PrintSummaryButton />
          </div>
        </article>
      </main>
    </>
  );
}
