import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Anonymous aggregate: counts of registered accounts by country (no emails). */
export async function GET() {
  try {
    const rows = await prisma.user.groupBy({
      by: ['countryCode'],
      where: { countryCode: { not: null } },
      _count: { _all: true },
    });
    const byCountry = {};
    let total = 0;
    for (const row of rows) {
      if (row.countryCode) {
        byCountry[row.countryCode] = row._count._all;
        total += row._count._all;
      }
    }
    return NextResponse.json({ byCountry, total });
  } catch (err) {
    console.error('map-accounts', err);
    return NextResponse.json({ byCountry: {}, total: 0 });
  }
}
