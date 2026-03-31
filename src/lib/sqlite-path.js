import path from 'node:path';

/** Resolves Prisma SQLite `DATABASE_URL` (e.g. file:./dev.db) to an absolute path. */
export function resolveSqliteFilePath(cwd = process.cwd()) {
  const raw = (process.env.DATABASE_URL || 'file:./dev.db').trim();
  if (!raw.startsWith('file:')) {
    throw new Error('DATABASE_URL must use the file: protocol for this SQLite setup.');
  }
  const rest = raw.slice('file:'.length);
  if (/^[A-Za-z]:[\\/]/.test(rest)) {
    return path.normalize(rest);
  }
  if (rest.startsWith('/') && /^\/[A-Za-z]:/.test(rest)) {
    return path.normalize(rest.slice(1));
  }
  const relative = rest.replace(/^\.\//, '');
  return path.resolve(cwd, relative);
}
