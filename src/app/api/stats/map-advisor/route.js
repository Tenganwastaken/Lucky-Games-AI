import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ALLOWED = new Set(['lottery', 'slots', 'sports_bet', 'other']);

/**
 * Per country: distinct registered users + guest-only runs (same game filter).
 * ?gameType=all | lottery | slots | sports_bet | other
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('gameType') || 'all';
    const gameType = raw === 'all' || !ALLOWED.has(raw) ? null : raw;

    const rows = gameType
      ? await prisma.$queryRaw`
          SELECT
            "countryCode" AS "countryCode",
            CAST(COUNT(*) AS INTEGER) AS "totalRuns",
            CAST(COALESCE(SUM(CASE WHEN "userId" IS NULL THEN 1 ELSE 0 END), 0) AS INTEGER) AS "guestRuns",
            CAST(COALESCE(COUNT(DISTINCT "userId"), 0) AS INTEGER) AS "distinctUsers"
          FROM "AdvisorUsage"
          WHERE "countryCode" IS NOT NULL AND "gameType" = ${gameType}
          GROUP BY "countryCode"
        `
      : await prisma.$queryRaw`
          SELECT
            "countryCode" AS "countryCode",
            CAST(COUNT(*) AS INTEGER) AS "totalRuns",
            CAST(COALESCE(SUM(CASE WHEN "userId" IS NULL THEN 1 ELSE 0 END), 0) AS INTEGER) AS "guestRuns",
            CAST(COALESCE(COUNT(DISTINCT "userId"), 0) AS INTEGER) AS "distinctUsers"
          FROM "AdvisorUsage"
          WHERE "countryCode" IS NOT NULL
          GROUP BY "countryCode"
        `;

    const byCountry = {};
    let total = 0;
    for (const row of rows) {
      if (!row.countryCode) continue;
      const totalRuns = Number(row.totalRuns) || 0;
      const guestRuns = Number(row.guestRuns) || 0;
      let distinctUsers = Number(row.distinctUsers) || 0;
      // SQLite: COUNT(DISTINCT userId) can be 1 when only NULLs in some edge builds — clamp
      if (guestRuns === totalRuns) distinctUsers = 0;
      byCountry[row.countryCode] = {
        totalRuns,
        guestRuns,
        distinctUsers,
      };
      total += totalRuns;
    }

    return NextResponse.json({
      byCountry,
      total,
      gameType: gameType ?? 'all',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('map-advisor', err);
    return NextResponse.json(
      { byCountry: {}, total: 0, gameType: 'all', error: 'aggregate_failed' },
      { status: 500 },
    );
  }
}
