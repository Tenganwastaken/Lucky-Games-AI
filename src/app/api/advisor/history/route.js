import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, getSessionUserByToken } from '@/lib/auth-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIMIT = 40;

function serializeRow(row) {
  return {
    id: row.id,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    gameType: row.gameType,
    betSize: row.betSize,
    frequencyPerWeek: row.frequencyPerWeek,
    riskTolerance: row.riskTolerance,
    advice: row.advice ?? '',
    riskScore: row.riskScore,
    winChanceEstimate: row.winChanceEstimate,
    lossChanceEstimate: row.lossChanceEstimate,
    expectedWeeklySpend: Number(row.expectedWeeklySpend),
  };
}

async function findManyWithBusyRetry(userId) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await prisma.advisorUsage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: LIMIT,
        select: {
          id: true,
          createdAt: true,
          gameType: true,
          betSize: true,
          frequencyPerWeek: true,
          riskTolerance: true,
          advice: true,
          riskScore: true,
          winChanceEstimate: true,
          lossChanceEstimate: true,
          expectedWeeklySpend: true,
        },
      });
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

    const rows = await findManyWithBusyRetry(session.user.id);
    return NextResponse.json({ items: rows.map(serializeRow) });
  } catch (err) {
    console.error('advisor/history', err);
    const devHint = process.env.NODE_ENV === 'development' ? err?.message : undefined;
    return NextResponse.json(
      {
        error: 'Failed to load history',
        ...(devHint ? { details: devHint } : {}),
      },
      { status: 500 },
    );
  }
}
