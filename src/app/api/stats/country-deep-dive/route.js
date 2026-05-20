import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const MIN_SAMPLE = 10;

/**
 * GET /api/stats/country-deep-dive?iso=GR
 * Aggregates RiskAssessment rows for a country (demo analytics).
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const iso = (searchParams.get('iso') || '').trim().toUpperCase();
    if (!iso || iso.length !== 2) {
      return NextResponse.json({ error: 'Απαιτείται έγκυρος κωδικός χώρας (ISO2).' }, { status: 400 });
    }

    const rows = await prisma.riskAssessment.findMany({
      where: { countryCode: iso },
      select: { riskScore: true, riskFactorsJson: true },
    });

    const sampleSize = rows.length;
    if (sampleSize < MIN_SAMPLE) {
      return NextResponse.json({
        iso,
        sampleSize,
        insufficient: true,
        meanRiskScore: null,
        topIndicators: [],
      });
    }

    let scoreSum = 0;
    const indicatorAgg = {};

    for (const row of rows) {
      scoreSum += row.riskScore ?? 0;
      if (!row.riskFactorsJson) continue;
      try {
        const parsed = JSON.parse(row.riskFactorsJson);
        const breakdown = parsed?.breakdown;
        if (!Array.isArray(breakdown)) continue;
        for (const b of breakdown) {
          const key = b.indicator || b.label;
          if (!key) continue;
          if (!indicatorAgg[key]) {
            indicatorAgg[key] = { label: b.label || key, sum: 0, count: 0 };
          }
          indicatorAgg[key].sum += Number(b.contribution) || 0;
          indicatorAgg[key].count += 1;
        }
      } catch {
        /* skip malformed */
      }
    }

    const topIndicators = Object.entries(indicatorAgg)
      .map(([indicator, { label, sum, count }]) => ({
        indicator,
        label,
        meanContribution: count > 0 ? sum / count : 0,
      }))
      .sort((a, b) => b.meanContribution - a.meanContribution)
      .slice(0, 3);

    return NextResponse.json({
      iso,
      sampleSize,
      insufficient: false,
      meanRiskScore: Math.round((scoreSum / sampleSize) * 10) / 10,
      topIndicators,
    });
  } catch (err) {
    console.error('country-deep-dive', err);
    return NextResponse.json({ error: 'aggregate_failed' }, { status: 500 });
  }
}
