import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, getSessionUserByToken } from '@/lib/auth-session';

export const runtime = 'nodejs';

export async function PUT(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const session = token ? await getSessionUserByToken(token) : null;
    if (!session?.user) {
      return NextResponse.json({ error: 'Απαιτείται σύνδεση.' }, { status: 401 });
    }

    const body = await req.json();
    const raw = body?.weeklyLossLimit ?? body?.limit;
    const limit = Number(raw);

    if (!Number.isFinite(limit) || limit <= 0) {
      return NextResponse.json(
        { error: 'Εισήγαγε έγκυρο θετικό ποσό σε ευρώ.' },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { weeklyLossLimit: limit },
      select: { id: true, weeklyLossLimit: true },
    });

    return NextResponse.json({ weeklyLossLimit: user.weeklyLossLimit });
  } catch (err) {
    console.error('loss-limit PUT', err);
    return NextResponse.json({ error: 'Αποτυχία αποθήκευσης ορίου.' }, { status: 500 });
  }
}
