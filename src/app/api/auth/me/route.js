import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionUserByToken, SESSION_COOKIE } from '@/lib/auth-session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const data = await getSessionUserByToken(token);
    if (!data) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({
      user: { id: data.user.id, email: data.user.email },
    });
  } catch (err) {
    console.error('me error', err);
    return NextResponse.json({ user: null });
  }
}
