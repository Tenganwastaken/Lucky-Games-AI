import { NextResponse } from 'next/server';
import { getClientIpFromRequest, lookupCountryFromIp } from '@/lib/geo-ip';

export async function GET(request) {
  const ip = getClientIpFromRequest(request);
  const geo = await lookupCountryFromIp(ip);
  return NextResponse.json({
    ipUsed: process.env.NODE_ENV === 'development' ? ip : undefined,
    countryCode: geo?.countryCode ?? null,
    countryName: geo?.country ?? null,
    source: geo ? 'ip' : 'none',
  });
}
