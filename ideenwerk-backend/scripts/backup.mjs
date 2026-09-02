import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const source = process.env.DATABASE_URL;
if (!source) throw new Error('DATABASE_URL fehlt.');
const backupDir = process.env.BACKUP_DIR || './backups';
const u = new URL(source);
const db = u.pathname.replace(/^\//, '');
if (!db) throw new Error('DATABASE_URL enthält keinen Datenbanknamen.');
await mkdir(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const file = path.join(backupDir, `ideenwerk-${stamp}.dump`);
const manifestFile = `${file}.json`;
const args = [
  '--format=custom',
  '--no-owner',
  '--no-privileges',
  '--host', u.hostname,
  '--port', u.port || '5432',
  '--username', decodeURIComponent(u.username),
  '--file', file,
  db
];

await new Promise((resolve, reject) => {
  const p = spawn('pg_dump', args, {
    stdio: 'inherit',
    env: { ...process.env, PGPASSWORD: decodeURIComponent(u.password) }
  });
  p.on('error', reject);
  p.on('exit', code => code === 0 ? resolve() : reject(new Error(`pg_dump exit ${code}`)));
});

const buf = await readFile(file);
const sha256 = createHash('sha256').update(buf).digest('hex');
const manifest = {
  type: 'IDEENWERK_POSTGRES_BACKUP',
  created_at: new Date().toISOString(),
  database: db,
  host: u.hostname,
  format: 'pg_dump_custom',
  bytes: buf.length,
  sha256,
  contains_secrets: false,
  note: 'Manifest enthält keine Zugangsdaten. Backup-Datei ist als vertraulich zu behandeln.'
};
await writeFile(manifestFile, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ backup: file, manifest: manifestFile, bytes: buf.length, sha256 }, null, 2));
