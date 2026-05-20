import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, getSessionUserByToken } from '@/lib/auth-session';
import { getClientIpFromRequest, lookupCountryFromIp } from '@/lib/geo-ip';
import { runRiskAnalysis } from '@/lib/analyze-service';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const body = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const sessionData = token ? await getSessionUserByToken(token) : null;

    let userId = null;
    let countryCode = null;
    if (sessionData?.user) {
      userId = sessionData.user.id;
      countryCode = sessionData.user.countryCode ?? null;
    }
    if (!countryCode) {
      const geo = await lookupCountryFromIp(getClientIpFromRequest(req));
      countryCode = geo?.countryCode ?? null;
    }

    if (process.env.NODE_ENV === 'development') {
      const dbg = body.debugCountryCode;
      if (typeof dbg === 'string' && /^[a-zA-Z]{2}$/.test(dbg.trim())) {
        countryCode = dbg.trim().toUpperCase();
      }
    }

    const result = await runRiskAnalysis(body, { userId, countryCode });

    if (!result.ok) {
      if (result.errors) {
        return NextResponse.json({ error: 'Validation failed', errors: result.errors }, { status: 400 });
      }
      return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error('advisor/analyze', err);
    return NextResponse.json(
      { error: 'Failed to analyze', message: err?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
