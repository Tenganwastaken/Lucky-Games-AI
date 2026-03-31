import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSessionByToken, SESSION_COOKIE } from '@/lib/auth-session';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) {
      await deleteSessionByToken(token);
    }
    cookieStore.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('logout error', err);
    return NextResponse.json({ error: 'Could not sign out.' }, { status: 500 });
  }
}
