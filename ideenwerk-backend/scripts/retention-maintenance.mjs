import { randomBytes } from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const POLICY_VERSION = process.env.RETENTION_POLICY_VERSION || '2026-09-03-v1';
const DONE_JOB_DAYS = Number(process.env.RETENTION_DONE_JOB_DAYS || 14);
const DEAD_JOB_DAYS = Number(process.env.RETENTION_DEAD_JOB_DAYS || 90);
const STATUS_ACCESS_GRACE_DAYS = Number(process.env.RETENTION_STATUS_ACCESS_GRACE_DAYS || 30);
const MODERATION_DETAILS_DAYS = Number(process.env.RETENTION_MODERATION_DETAILS_DAYS || 180);
const DRY_RUN = process.env.RETENTION_DRY_RUN !== 'false';

function intervalDays(n) {
  return `${Math.max(0, Math.floor(n))} days`;
}

function runId() {
  return `RET-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

const queries = [
  {
    key: 'expired_abuse_signals',
    count: `SELECT count(*)::int AS n
      FROM abuse_signals a
      LEFT JOIN submissions s ON s.id=a.submission_id
      WHERE a.expires_at IS NOT NULL AND a.expires_at < now()
        AND COALESCE(s.current_status,'') NOT IN ('privacy_hold','quarantine')`,
    cleanup: `DELETE FROM abuse_signals a
      USING submissions s
      WHERE a.submission_id=s.id
        AND a.expires_at IS NOT NULL AND a.expires_at < now()
        AND s.current_status NOT IN ('privacy_hold','quarantine')`
  },
  {
    key: 'expired_rate_limit_buckets',
    count: `SELECT count(*)::int AS n FROM rate_limit_buckets WHERE expires_at < now()`,
    cleanup: `DELETE FROM rate_limit_buckets WHERE expires_at < now()`
  },
  {
    key: 'done_jobs',
    count: `SELECT count(*)::int AS n FROM processing_jobs
      WHERE status='done' AND updated_at < now()-$1::interval`,
    cleanup: `DELETE FROM processing_jobs
      WHERE status='done' AND updated_at < now()-$1::interval`,
    params: [intervalDays(DONE_JOB_DAYS)]
  },
  {
    key: 'dead_jobs',
    count: `SELECT count(*)::int AS n FROM processing_jobs
      WHERE status='dead' AND updated_at < now()-$1::interval`,
    cleanup: `DELETE FROM processing_jobs
      WHERE status='dead' AND updated_at < now()-$1::interval`,
    params: [intervalDays(DEAD_JOB_DAYS)]
  },
  {
    key: 'expired_or_revoked_status_access',
    count: `SELECT count(*)::int AS n
      FROM status_access a
      WHERE (
          (a.expires_at IS NOT NULL AND a.expires_at < now()-$1::interval)
          OR (a.revoked_at IS NOT NULL AND a.revoked_at < now()-$1::interval)
        )
        AND NOT EXISTS (
          SELECT 1 FROM privacy_requests p
          WHERE p.submission_id=a.submission_id AND p.status IN ('received','reviewing')
        )`,
    cleanup: `DELETE FROM status_access a
      WHERE (
          (a.expires_at IS NOT NULL AND a.expires_at < now()-$1::interval)
          OR (a.revoked_at IS NOT NULL AND a.revoked_at < now()-$1::interval)
        )
        AND NOT EXISTS (
          SELECT 1 FROM privacy_requests p
          WHERE p.submission_id=a.submission_id AND p.status IN ('received','reviewing')
        )`,
    params: [intervalDays(STATUS_ACCESS_GRACE_DAYS)]
  },
  {
    key: 'moderation_details_to_minimize',
    count: `SELECT count(*)::int AS n FROM moderation_reports
      WHERE resolved_at IS NOT NULL
        AND resolved_at < now()-$1::interval
        AND details IS NOT NULL`,
    cleanup: `UPDATE moderation_reports
      SET details=NULL
      WHERE resolved_at IS NOT NULL
        AND resolved_at < now()-$1::interval
        AND details IS NOT NULL`,
    params: [intervalDays(MODERATION_DETAILS_DAYS)]
  }
];

const id = runId();
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(
    `INSERT INTO retention_runs(run_id,mode,policy_version,result)
     VALUES($1,$2,$3,'{}'::jsonb)`,
    [id, DRY_RUN ? 'dry-run' : 'apply', POLICY_VERSION]
  );

  const result = {};
  for (const q of queries) {
    const params = q.params || [];
    const before = await client.query(q.count, params);
    const eligible = Number(before.rows[0]?.n || 0);
    let affected = 0;
    if (!DRY_RUN && eligible > 0) {
      const out = await client.query(q.cleanup, params);
      affected = Number(out.rowCount || 0);
    }
    result[q.key] = { eligible, affected, mode: DRY_RUN ? 'dry-run' : 'apply' };
  }

  await client.query(
    `UPDATE retention_runs
        SET result=$2::jsonb, finished_at=now()
      WHERE run_id=$1`,
    [id, JSON.stringify(result)]
  );
  await client.query('COMMIT');
  console.log(JSON.stringify({ run_id: id, policy_version: POLICY_VERSION, dry_run: DRY_RUN, result }, null, 2));
} catch (e) {
  await client.query('ROLLBACK');
  console.error('[retention] failed', e);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
