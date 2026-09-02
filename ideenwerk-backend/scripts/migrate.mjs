import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const SQL_DIR = process.env.SQL_DIR || './sql';
const LOCK_KEY = 91720260903;

const client = await pool.connect();
try {
  await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY,
    sha256 char(64) NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);

  const files = (await readdir(SQL_DIR))
    .filter(f => /^\d{3}_.+\.sql$/.test(f))
    .sort();

  for (const filename of files) {
    const sql = await readFile(path.join(SQL_DIR, filename), 'utf8');
    const sha256 = createHash('sha256').update(sql).digest('hex');
    const old = await client.query('SELECT sha256 FROM schema_migrations WHERE filename=$1', [filename]);
    if (old.rowCount) {
      if (old.rows[0].sha256 !== sha256) {
        throw new Error(`Migration ${filename} wurde nachträglich verändert. Erwartet ${old.rows[0].sha256}, gefunden ${sha256}.`);
      }
      console.log(`[migrate] skip ${filename}`);
      continue;
    }

    console.log(`[migrate] apply ${filename}`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename,sha256) VALUES($1,$2)', [filename, sha256]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  }

  const done = await client.query('SELECT filename,sha256,applied_at FROM schema_migrations ORDER BY filename');
  console.log(JSON.stringify({ migrations_applied: done.rowCount, migrations: done.rows }, null, 2));
} finally {
  try { await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]); } catch {}
  client.release();
  await pool.end();
}
