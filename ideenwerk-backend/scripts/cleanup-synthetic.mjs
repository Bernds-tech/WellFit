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

  const submissions = await client.query(
    'SELECT id,public_id FROM submissions WHERE idempotency_key LIKE $1',
    [`load:${runId}:%`]
  );
  const submissionIds = submissions.rows.map(x=>x.id);
  const publicIds = submissions.rows.map(x=>x.public_id);

  let deletedReviewTasks = 0;
  let deletedJobs = 0;
  let deletedAudit = 0;

  if (submissionIds.length) {
    const cc = await client.query(
      `SELECT id::text AS id FROM cluster_candidates
        WHERE submission_id = ANY($1::uuid[]) OR candidate_submission_id = ANY($1::uuid[])`,
      [submissionIds]
    );
    const candidateIds = cc.rows.map(x=>x.id);

    if (candidateIds.length) {
      const rt = await client.query(
        `DELETE FROM review_tasks
          WHERE subject_type='cluster_candidate'
            AND subject_id = ANY($1::text[])`,
        [candidateIds]
      );
      deletedReviewTasks = rt.rowCount;
    }
  }

  if (publicIds.length) {
    const jobs = await client.query('DELETE FROM processing_jobs WHERE subject_id = ANY($1::text[])',[publicIds]);
    deletedJobs = jobs.rowCount;
    const audit = await client.query("DELETE FROM audit_events WHERE subject_type='submission' AND subject_id = ANY($1::text[])",[publicIds]);
    deletedAudit = audit.rowCount;
  }

  const del = await client.query('DELETE FROM submissions WHERE idempotency_key LIKE $1',[`load:${runId}:%`]);

  const emptyClusters = await client.query(
    `DELETE FROM clusters c
      WHERE NOT EXISTS (SELECT 1 FROM cluster_members cm WHERE cm.cluster_id=c.id)
        AND NOT EXISTS (SELECT 1 FROM solution_variants sv WHERE sv.cluster_id=c.id)`
  );

  await client.query('COMMIT');
  console.log(JSON.stringify({
    ok:true,
    run_id:runId,
    deleted_submissions:del.rowCount,
    deleted_jobs:deletedJobs,
    deleted_audit_events:deletedAudit,
    deleted_review_tasks:deletedReviewTasks,
    deleted_empty_clusters:emptyClusters.rowCount
  }));
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
  await pool.end();
}
