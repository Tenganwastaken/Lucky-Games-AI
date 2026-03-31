import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession, SESSION_COOKIE } from '@/lib/auth-session';
import { getClientIpFromRequest, lookupCountryFromIp } from '@/lib/geo-ip';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const geo = await lookupCountryFromIp(getClientIpFromRequest(request));
    if (geo?.countryCode) {
      await prisma.user.update({
        where: { id: user.id },
        data: { countryCode: geo.countryCode },
      });
    }

    const { token, maxAgeSec } = await createSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSec,
    });

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('login error', err);
    return NextResponse.json({ error: 'Could not sign in. Please try again.' }, { status: 500 });
  }
}
