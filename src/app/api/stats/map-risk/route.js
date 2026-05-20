import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SPARKLINE_WEEKS = 8;

function weekKey(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x.toISOString().slice(0, 10);
}

/**
 * GET /api/stats/map-risk
 * Mean risk score per country + 8-week sparkline buckets.
 */
export async function GET() {
  try {
    const rows = await prisma.riskAssessment.findMany({
      where: { countryCode: { not: null } },
      select: { countryCode: true, riskScore: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const byCountry = {};
    const now = new Date();
    const weekStarts = [];
    for (let i = SPARKLINE_WEEKS - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      weekStarts.push(weekKey(d));
    }

    for (const row of rows) {
      const iso = row.countryCode;
      if (!iso) continue;
      if (!byCountry[iso]) {
        byCountry[iso] = {
          sum: 0,
          count: 0,
          weeks: Object.fromEntries(weekStarts.map((w) => [w, { sum: 0, count: 0 }])),
        };
      }
      const entry = byCountry[iso];
      entry.sum += row.riskScore ?? 0;
      entry.count += 1;
      const wk = weekKey(row.createdAt);
      if (entry.weeks[wk]) {
        entry.weeks[wk].sum += row.riskScore ?? 0;
        entry.weeks[wk].count += 1;
      }
    }

    const out = {};
    for (const [iso, entry] of Object.entries(byCountry)) {
      const sparkline = weekStarts.map((w) => {
        const b = entry.weeks[w];
        return b.count > 0 ? Math.round((b.sum / b.count) * 10) / 10 : 0;
      });
      out[iso] = {
        meanRisk: entry.count > 0 ? Math.round((entry.sum / entry.count) * 10) / 10 : null,
        sampleSize: entry.count,
        sparkline,
      };
    }

    return NextResponse.json({
      byCountry: out,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('map-risk', err);
    return NextResponse.json({ byCountry: {}, error: 'aggregate_failed' }, { status: 500 });
  }
}
