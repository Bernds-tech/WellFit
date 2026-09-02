import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import pg from 'pg';

const { Pool } = pg;
const source = process.env.DATABASE_URL;
const target = process.env.RESTORE_DATABASE_URL;
const backupFile = process.env.BACKUP_FILE;
const confirm = process.env.RESTORE_CONFIRM;

if (!source) throw new Error('DATABASE_URL fehlt.');
if (!target) throw new Error('RESTORE_DATABASE_URL fehlt.');
if (!backupFile) throw new Error('BACKUP_FILE fehlt.');
if (confirm !== 'I_UNDERSTAND_TEST_RESTORE') {
  throw new Error('RESTORE_CONFIRM muss I_UNDERSTAND_TEST_RESTORE sein.');
}

const src = new URL(source);
const dst = new URL(target);
const srcDb = src.pathname.replace(/^\//, '');
const dstDb = dst.pathname.replace(/^\//, '');
if (!dstDb) throw new Error('RESTORE_DATABASE_URL enthält keinen Datenbanknamen.');
if (src.hostname === dst.hostname && (src.port || '5432') === (dst.port || '5432') && srcDb === dstDb) {
  throw new Error('Restore-Ziel darf nicht dieselbe Datenbank wie DATABASE_URL sein.');
}

const dump = await readFile(backupFile);
const sha256 = createHash('sha256').update(dump).digest('hex');

const args = [
  '--clean',
  '--if-exists',
  '--no-owner',
  '--no-privileges',
  '--host', dst.hostname,
  '--port', dst.port || '5432',
  '--username', decodeURIComponent(dst.username),
  '--dbname', dstDb,
  backupFile
];

await new Promise((resolve, reject) => {
  const p = spawn('pg_restore', args, {
    stdio: 'inherit',
    env: { ...process.env, PGPASSWORD: decodeURIComponent(dst.password) }
  });
  p.on('error', reject);
  p.on('exit', code => code === 0 ? resolve() : reject(new Error(`pg_restore exit ${code}`)));
});

const pool = new Pool({ connectionString: target });
const requiredTables = [
  'submissions','status_access','structured_proposals','clusters','cluster_members',
  'processing_jobs','audit_events','abuse_signals','moderation_reports','privacy_requests',
  'operator_review_tasks','retention_runs'
];
try {
  const q = await pool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename = ANY($1::text[])`,
    [requiredTables]
  );
  const found = new Set(q.rows.map(r => r.tablename));
  const missing = requiredTables.filter(t => !found.has(t));
  if (missing.length) throw new Error(`Restore-Verifikation: fehlende Tabellen: ${missing.join(', ')}`);

  const counts = {};
  for (const table of ['submissions','clusters','audit_events','processing_jobs']) {
    const c = await pool.query(`SELECT count(*)::bigint AS n FROM ${table}`);
    counts[table] = Number(c.rows[0].n);
  }
  console.log(JSON.stringify({
    restore_verified: true,
    target_database: dstDb,
    backup_sha256: sha256,
    required_tables: requiredTables.length,
    counts
  }, null, 2));
} finally {
  await pool.end();
}
