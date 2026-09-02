import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const runId = process.env.SYNTHETIC_RUN_ID || process.argv[2] || null;
const intervalMs = Math.max(500, Number(process.env.BENCHMARK_INTERVAL_MS || 2000));
const maxSeconds = Math.max(10, Number(process.env.BENCHMARK_MAX_SECONDS || 900));

if (!runId) {
  console.error('Usage: SYNTHETIC_RUN_ID=<run> node scripts/benchmark-queue.mjs');
  process.exit(2);
}

async function stats() {
  const q = await pool.query(
    `WITH load_submissions AS (
       SELECT public_id,current_status FROM submissions WHERE idempotency_key LIKE $1
     ), jobs AS (
       SELECT status,count(*)::int n FROM processing_jobs
       WHERE subject_id IN (SELECT public_id FROM load_submissions)
       GROUP BY status
     ), statuses AS (
       SELECT current_status,count(*)::int n FROM load_submissions GROUP BY current_status
     )
     SELECT
       (SELECT count(*)::int FROM load_submissions) AS submissions,
       COALESCE((SELECT jsonb_object_agg(status,n) FROM jobs),'{}'::jsonb) AS jobs,
       COALESCE((SELECT jsonb_object_agg(current_status,n) FROM statuses),'{}'::jsonb) AS statuses`,
    [`load:${runId}:%`]
  );
  return q.rows[0];
}

const started = Date.now();
let previousDone = 0;
let previousAt = started;
while (true) {
  const s = await stats();
  const now = Date.now();
  const done = Number(s.jobs?.done || 0);
  const rate = (done-previousDone)/Math.max((now-previousAt)/1000,0.001);
  console.log(JSON.stringify({
    run_id:runId,
    elapsed_s:Math.round((now-started)/1000),
    submissions:s.submissions,
    jobs:s.jobs,
    statuses:s.statuses,
    completed_jobs_per_second:Number(rate.toFixed(2))
  }));
  previousDone = done;
  previousAt = now;
  const queued = Number(s.jobs?.queued || 0), running = Number(s.jobs?.running || 0);
  if (s.submissions > 0 && queued===0 && running===0) break;
  if ((now-started)/1000 > maxSeconds) {
    console.error(JSON.stringify({ ok:false, reason:'timeout', max_seconds:maxSeconds }));
    process.exitCode=1;
    break;
  }
  await new Promise(r=>setTimeout(r,intervalMs));
}
await pool.end();
