import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getClientIpFromRequest, lookupCountryFromIp } from '@/lib/geo-ip';

const MIN_PASSWORD_LENGTH = 8;
const MIN_AGE = 18;

function ageFromDateOfBirth(isoDate) {
  const birth = new Date(isoDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const dateOfBirth = typeof body.dateOfBirth === 'string' ? body.dateOfBirth : '';

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 },
      );
    }

    if (!dateOfBirth) {
      return NextResponse.json({ error: 'Date of birth is required.' }, { status: 400 });
    }

    const age = ageFromDateOfBirth(dateOfBirth);
    if (age === null) {
      return NextResponse.json({ error: 'Invalid date of birth.' }, { status: 400 });
    }
    if (age < MIN_AGE) {
      return NextResponse.json(
        { error: `You must be at least ${MIN_AGE} years old to create an account.` },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const dob = new Date(dateOfBirth);
    const geo = await lookupCountryFromIp(getClientIpFromRequest(request));

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        dateOfBirth: dob,
        countryCode: geo?.countryCode ?? null,
      },
    });

    return NextResponse.json({ ok: true, message: 'Account created.' });
  } catch (err) {
    console.error('register error', err);
    const hint =
      process.env.NODE_ENV === 'development' && err?.message?.includes('prisma/dev.db')
        ? ' Stop the server and run: npm run db:repair'
        : '';
    return NextResponse.json(
      { error: `Could not create account. Please try again.${hint}` },
      { status: 500 },
    );
  }
}
