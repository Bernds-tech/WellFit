import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const runId = process.env.SYNTHETIC_RUN_ID || process.argv[2];
if (!runId) {
  console.error('Usage: SYNTHETIC_RUN_ID=<run> node scripts/cleanup-synthetic.mjs');
  process.exit(2);
}

const client = await pool.connect();
try {
  await client.query('BEGIN');
  const ids = await client.query('SELECT public_id FROM submissions WHERE idempotency_key LIKE $1',[`load:${runId}:%`]);
  const publicIds = ids.rows.map(x=>x.public_id);
  if (publicIds.length) {
    await client.query('DELETE FROM processing_jobs WHERE subject_id = ANY($1::text[])',[publicIds]);
    await client.query("DELETE FROM audit_events WHERE subject_type='submission' AND subject_id = ANY($1::text[])",[publicIds]);
  }
  const del = await client.query('DELETE FROM submissions WHERE idempotency_key LIKE $1',[`load:${runId}:%`]);
  await client.query('COMMIT');
  console.log(JSON.stringify({ ok:true, run_id:runId, deleted_submissions:del.rowCount, deleted_job_subjects:publicIds.length }));
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
  await pool.end();
}
