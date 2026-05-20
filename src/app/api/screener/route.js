import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, getSessionUserByToken } from '@/lib/auth-session';
import { PGSI_QUESTIONS, scorePgsi } from '@/lib/pgsi';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const body = await req.json();
    const { answers } = body;

    if (!Array.isArray(answers) || answers.length !== PGSI_QUESTIONS.length) {
      return NextResponse.json(
        { error: 'Απαιτούνται 9 απαντήσεις (0–3).' },
        { status: 400 },
      );
    }

    const numeric = answers.map((v) => Number(v));
    let result;
    try {
      result = scorePgsi(numeric);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const session = token ? await getSessionUserByToken(token) : null;
    const userId = session?.user?.id ?? null;

    let id = null;
    try {
      const row = await prisma.pgsiResult.create({
        data: {
          userId,
          totalScore: result.totalScore,
          category: result.categoryKey,
          answersJson: JSON.stringify(numeric),
        },
      });
      id = row.id;
    } catch (persistErr) {
      console.error('PgsiResult persist failed:', persistErr);
    }

    return NextResponse.json({
      id,
      totalScore: result.totalScore,
      category: result.category,
      categoryKey: result.categoryKey,
      range: result.range,
      explanation: result.explanation,
      needsResources: result.needsResources,
    });
  } catch (err) {
    console.error('screener POST', err);
    return NextResponse.json(
      { error: 'Failed to save PGSI result', message: err?.message },
      { status: 500 },
    );
  }
}
