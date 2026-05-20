import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, getSessionUserByToken } from '@/lib/auth-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIMIT = 40;

function serializeRiskRow(row) {
  let riskAssessment = null;
  let riskFactors = [];
  try {
    const parsed = JSON.parse(row.riskFactorsJson || '[]');
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.breakdown)) {
      riskAssessment = parsed;
      riskFactors = parsed.breakdown;
    } else if (Array.isArray(parsed)) {
      riskFactors = parsed;
    }
  } catch {
    riskFactors = [];
  }
  return {
    id: row.id,
    kind: 'risk',
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    primaryGameType: row.primaryGameType,
    gameType: row.primaryGameType,
    daysPerMonth: row.daysPerMonth,
    avgWagerEuro: row.avgWagerEuro,
    riskScore: row.riskScore,
    riskTier: riskAssessment?.tier ?? null,
    advice: row.advice ?? '',
    winChanceEstimate: row.winChanceEstimate,
    lossChanceEstimate: row.lossChanceEstimate,
    expectedWeeklySpend: Number(row.expectedWeeklySpend),
    riskAssessment,
    riskFactors,
    formSnapshot: {
      ageRange: row.ageRange,
      gender: row.gender,
      primaryGameType: row.primaryGameType,
      gameTypesCount: row.gameTypesCount,
      daysPerMonth: row.daysPerMonth,
      avgSessionMinutes: row.avgSessionMinutes,
      nightPlayPercent: row.nightPlayPercent,
      avgWagerEuro: row.avgWagerEuro,
      weeklyTotalEuro: row.weeklyTotalEuro,
      wagerVariability: row.wagerVariability,
      depositsPerSession: row.depositsPerSession,
      chasingFrequency: row.chasingFrequency,
      cancelWithdrawalCount: row.cancelWithdrawalCount,
      limitsSet: row.limitsSet,
      failedStopAttempts: row.failedStopAttempts,
      relationshipConflict: row.relationshipConflict,
      riskAwareness: row.riskAwareness,
    },
  };
}

function serializeLegacyRow(row) {
  return {
    id: row.id,
    kind: 'legacy',
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    gameType: row.gameType,
    primaryGameType: row.gameType,
    betSize: row.betSize,
    frequencyPerWeek: row.frequencyPerWeek,
    riskTolerance: row.riskTolerance,
    advice: row.advice ?? '',
    riskScore: row.riskScore,
    winChanceEstimate: row.winChanceEstimate,
    lossChanceEstimate: row.lossChanceEstimate,
    expectedWeeklySpend: Number(row.expectedWeeklySpend),
    formSnapshot: {
      gameType: row.gameType,
      betSize: row.betSize,
      frequencyPerWeek: row.frequencyPerWeek,
      riskTolerance: row.riskTolerance,
    },
  };
}

async function findManyWithBusyRetry(userId) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const [riskRows, legacyRows] = await Promise.all([
        prisma.riskAssessment.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: LIMIT,
        }),
        prisma.advisorUsage.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: LIMIT,
        }),
      ]);
      return { riskRows, legacyRows };
    } catch (err) {
      const msg = String(err?.message || err);
      if (msg.includes('SQLITE_BUSY') && attempt < 3) {
        await new Promise((r) => setTimeout(r, 40 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Advisor history: retry loop exhausted');
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const session = token ? await getSessionUserByToken(token) : null;
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { riskRows, legacyRows } = await findManyWithBusyRetry(session.user.id);
    const riskItems = riskRows.map(serializeRiskRow);
    const riskTimes = new Set(
      riskRows.map((r) => Math.floor(new Date(r.createdAt).getTime() / 60000)),
    );

    const legacyOnly = legacyRows
      .filter((r) => !riskTimes.has(Math.floor(new Date(r.createdAt).getTime() / 60000)))
      .map(serializeLegacyRow);

    const merged = [...riskItems, ...legacyOnly]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, LIMIT);

    return NextResponse.json({ items: merged });
  } catch (err) {
    console.error('advisor/history', err);
    const devHint = process.env.NODE_ENV === 'development' ? err?.message : undefined;
    return NextResponse.json(
      { error: 'Failed to load history', ...(devHint ? { details: devHint } : {}) },
      { status: 500 },
    );
  }
}
