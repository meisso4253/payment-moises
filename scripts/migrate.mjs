import { createClient } from '@libsql/client';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

if (process.env.NODE_ENV !== 'test' && existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!process.env.TURSO_DATABASE_URL) {
  if (process.argv.includes('--if-configured')) {
    console.log('Database not configured yet. Building the setup/sign-in screen.');
    process.exit(0);
  }
  throw new Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN first.');
}
if (process.env.VERCEL && (!process.env.TURSO_DATABASE_URL.startsWith('libsql://') || !process.env.TURSO_AUTH_TOKEN)) {
  throw new Error('Vercel requires a remote Turso database and token.');
}
const client = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
try {
  await client.execute('CREATE TABLE IF NOT EXISTS studytrack_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at INTEGER NOT NULL)');
  for (const name of readdirSync('drizzle').filter(name => /^\d+.*\.sql$/.test(name)).sort()) {
    const sql = readFileSync(`drizzle/${name}`, 'utf8').replaceAll('\r\n', '\n');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const tx = await client.transaction('write');
    try {
      const applied = await tx.execute({ sql: 'SELECT checksum FROM studytrack_migrations WHERE name=?', args: [name] });
      if (applied.rows.length) {
        if (applied.rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
      } else {
        for (const statement of sql.split('--> statement-breakpoint').map(sql => sql.trim()).filter(Boolean)) await tx.execute(statement);
        await tx.execute({ sql: 'INSERT INTO studytrack_migrations VALUES (?,?,?)', args: [name, checksum, Date.now()] });
        console.log(`Applied ${name}`);
      }
      await tx.commit();
    } catch (error) { await tx.rollback(); throw error; }
    finally { tx.close(); }
  }
} finally { client.close(); }
