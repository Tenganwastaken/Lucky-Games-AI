import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = (process.env.DATABASE_URL || 'file:./dev.db').trim();
const rest = raw.startsWith('file:') ? raw.slice('file:'.length) : raw;
const relative = rest.replace(/^\.\//, '');
const dbPath = /^[A-Za-z]:[\\/]/.test(rest)
  ? path.normalize(rest)
  : path.resolve(root, relative);

try {
  if (fs.existsSync(dbPath)) {
    const { size } = fs.statSync(dbPath);
    if (size === 0) {
      console.log(`Removing empty database: ${path.relative(root, dbPath)}`);
      fs.unlinkSync(dbPath);
    }
  }
} catch (err) {
  console.error('Could not fix the database file. Stop `npm run dev` and try again.');
  console.error(err.message);
  process.exit(1);
}

console.log('Applying migrations…');
execSync('npx prisma migrate deploy', { cwd: root, stdio: 'inherit' });
console.log(`Database ready at ${path.relative(root, dbPath)}`);
