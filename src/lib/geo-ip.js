/**
 * Best-effort client IP from reverse proxies (Vercel, nginx, etc.).
 * Not spoof-proof; sufficient for approximate country on a student project.
 */
export function getClientIpFromRequest(request) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get('x-real-ip');
  if (real?.trim()) return real.trim();
  return null;
}

function isNonPublicIp(ip) {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) return true;
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // IPv6 ULA
  return false;
}

/**
 * Free tier: ip-api.com (HTTP, rate-limited). Returns { country, countryCode } or null.
 */
export async function lookupCountryFromIp(ip) {
  if (isNonPublicIp(ip)) return null;
  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'success' || !data.countryCode) return null;
    return { country: data.country, countryCode: data.countryCode };
  } catch {
    return null;
  }
}
