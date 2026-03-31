import fs from 'node:fs';
import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@/generated/prisma/client';
import { resolveSqliteFilePath } from '@/lib/sqlite-path';

const globalForPrisma = globalThis;

function assertDbFileUsable(dbPath) {
  if (!fs.existsSync(dbPath)) return;
  const { size } = fs.statSync(dbPath);
  if (size === 0) {
    throw new Error(
      `Database file ${path.relative(process.cwd(), dbPath) || dbPath} is empty (0 bytes). Stop the dev server, then run: npm run db:repair`,
    );
  }
}

function createClient() {
  const url = resolveSqliteFilePath();
  assertDbFileUsable(url);
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
