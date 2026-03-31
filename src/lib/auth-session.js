import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'lg_session';
const TOKEN_BYTES = 32;
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export function hashSessionToken(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export async function createSession(userId) {
  const token = randomBytes(TOKEN_BYTES).toString('hex');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + MAX_AGE_MS);
  await prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });
  return { token, maxAgeSec: Math.floor(MAX_AGE_MS / 1000) };
}

export async function getSessionUserByToken(token) {
  if (!token || typeof token !== 'string') return null;
  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return { sessionId: session.id, user: session.user };
}

export async function deleteSessionByToken(token) {
  if (!token || typeof token !== 'string') return;
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}
