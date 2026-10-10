import { createClient, type Client, type InValue } from '@libsql/client';

let client: Client | undefined;
export function getClient() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error('StudyTrack database is not configured.');
  if (process.env.VERCEL && (!url.startsWith('libsql://') || !process.env.TURSO_AUTH_TOKEN)) {
    throw new Error('Vercel requires a remote Turso database and authentication token.');
  }
  return client ??= createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
}

// Preserve the planner's parameterized SQLite queries and result shapes.
// All batches run inside one write transaction, including payment approval.
class Statement {
  constructor(readonly sql: string, readonly args: InValue[] = []) {}
  bind(...args: InValue[]) { return new Statement(this.sql, args); }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const result = await getClient().execute({ sql: this.sql, args: this.args });
    return result.rows[0] ? { ...result.rows[0] } as T : null;
  }
  async all<T = Record<string, unknown>>() {
    const result = await getClient().execute({ sql: this.sql, args: this.args });
    return { results: result.rows.map(row => ({ ...row }) as T) };
  }
  async run() {
    const result = await getClient().execute({ sql: this.sql, args: this.args });
    return { meta: { changes: result.rowsAffected } };
  }
}
export const database = {
  prepare(sql: string) { return new Statement(sql); },
  async batch(statements: Statement[]) {
    const results = await getClient().batch(statements.map(({ sql, args }) => ({ sql, args })), 'write');
    return results.map(result => ({ meta: { changes: result.rowsAffected } }));
  },
};
