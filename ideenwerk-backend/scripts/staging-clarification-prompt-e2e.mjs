import crypto from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;

const base = String(process.env.WERK_STAGING_EDGE_URL || '').replace(/\/$/, '');
const databaseUrl = process.env.DATABASE_URL;
const timeoutMs = Math.max(10_000, Number(process.env.STAGING_E2E_TIMEOUT_MS || 90_000));
const intervalMs = Math.max(250, Number(process.env.STAGING_E2E_INTERVAL_MS || 1_500));

if (!base || !/^https:\/\//.test(base)) {
  console.error('[prompt-http-e2e] WERK_STAGING_EDGE_URL must be an https URL to the deployed werk-ideenwerk-api function');
  process.exit(2);
}
if (!databaseUrl) {
  console.error('[prompt-http-e2e] DATABASE_URL is required for reversible staging fixture setup and cleanup');
  process.exit(2);
}

const suffix = crypto.randomBytes(8).toString('hex');
const publicId = `IDEA-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
const idempotencyKey = `prompt-http-e2e-${suffix}`;
const token = `werk-prompt-http-e2e-${crypto.randomBytes(24).toString('base64url')}`;
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
const operatorHash = crypto.createHash('sha256').update(`operator:${idempotencyKey}`).digest('hex');
const taskId = `TASK-${crypto.randomBytes(10).toString('hex').toUpperCase()}`;
const decisionId = `DEC-${crypto.randomBytes(10).toString('hex').toUpperCase()}`;
const answerKey = `prompt-answer-${suffix}`;
const originalText = 'Synthetischer WERK-Staging-Prompt-HTTP-E2E: Verwaltungsabläufe sollen transparent, nachvollziehbar und ohne personenbezogene Daten verbessert werden.';
const question = 'Welche standardisierten Verwaltungsabläufe sollen konkret verbessert werden, ohne personenbezogene Daten zu verwenden?';
const answer = 'Die Rückfrage betrifft standardisierte Antrags- und Statusabläufe; personenbezogene Daten sollen nicht verarbeitet oder veröffentlicht werden.';
const pool = new Pool({ connectionString: databaseUrl });

function assert(condition, message, detail) {
  if (!condition) {
    const error = new Error(message);
    error.detail = detail;
    throw error;
  }
}

async function jsonResponse(response) {
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { response, data };
}

async function fetchStatus(authToken = token) {
  return jsonResponse(await fetch(`${base}/status/${publicId}`, {
    headers: { authorization: `Bearer ${authToken}` }
  }));
}

async function fetchExport(authToken = token) {
  return jsonResponse(await fetch(`${base}/privacy/export/${publicId}`, {
    headers: { authorization: `Bearer ${authToken}` }
  }));
}

async function submitAnswer(authToken = token) {
  return jsonResponse(await fetch(`${base}/status/${publicId}/clarification`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
      'idempotency-key': answerKey
    },
    body: JSON.stringify({ text: answer })
  }));
}

async function setupFixture() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const submission = await client.query(
      `INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
       VALUES($1,$2,$3,'Niederösterreich','Verwaltung','structured')
       RETURNING id`,
      [publicId, idempotencyKey, originalText]
    );
    const submissionId = submission.rows[0].id;
    await client.query(
      'INSERT INTO status_access(submission_id,token_hash) VALUES($1,$2)',
      [submissionId, tokenHash]
    );
    const operator = await client.query(
      `INSERT INTO operators(external_subject_hash,display_name)
       VALUES($1,'WERK staging prompt HTTP E2E') RETURNING id`,
      [operatorHash]
    );
    const operatorId = operator.rows[0].id;
    await client.query(
      "INSERT INTO operator_roles(operator_id,role) VALUES($1,'moderator')",
      [operatorId]
    );
    const task = await client.query(
      `INSERT INTO review_tasks(
         task_id,subject_type,subject_id,review_type,required_role,status,priority,assigned_operator_id,assigned_at
       ) VALUES($1,'submission',$2,'clarification_request','moderator','assigned',60,$3,now())
       RETURNING id`,
      [taskId, publicId, operatorId]
    );
    await client.query(
      `INSERT INTO review_decisions(decision_id,task_id,operator_id,action,reason_code,rationale,payload)
       VALUES($1,$2,$3,'request_clarification','NEEDS_CLARIFICATION',
              'Synthetischer Staging-E2E-Nachweis für die Bürger-Rückfrage.',
              jsonb_build_object('question',$4::text))`,
      [decisionId, task.rows[0].id, operatorId, question]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function pollUntilProcessed() {
  const deadline = Date.now() + timeoutMs;
  let state = null;
  while (Date.now() < deadline) {
    const result = await pool.query(
      `SELECT s.current_status,
              COALESCE((SELECT bool_and(j.status='done')
                          FROM processing_jobs j
                         WHERE j.subject_type='submission'
                           AND j.subject_id=s.public_id
                           AND j.job_type='semantic_cluster_review'),false) AS semantic_done,
              (SELECT count(*)::int FROM processing_jobs j
                WHERE j.subject_type='submission' AND j.subject_id=s.public_id AND j.status='dead') AS dead_jobs
         FROM submissions s WHERE s.public_id=$1`,
      [publicId]
    );
    state = result.rows[0];
    assert(state, 'synthetic prompt E2E submission disappeared before worker verification', { publicId });
    assert(state.dead_jobs === 0, 'dead job found while waiting for clarification continuation', state);
    if (state.semantic_done && state.current_status !== 'cluster_review') return state;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  throw Object.assign(new Error('staging worker did not finish clarification continuation before timeout'), { detail: state });
}

async function cleanup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const target = await client.query(
      'SELECT id,cluster_id FROM submissions WHERE public_id=$1 AND idempotency_key=$2 FOR UPDATE',
      [publicId, idempotencyKey]
    );
    const submissionId = target.rows[0]?.id || null;
    const clusterId = target.rows[0]?.cluster_id || null;

    if (submissionId) {
      const candidates = await client.query(
        `SELECT id::text AS id FROM cluster_candidates
          WHERE submission_id=$1 OR candidate_submission_id=$1`,
        [submissionId]
      );
      const candidateIds = candidates.rows.map(row => row.id);
      if (candidateIds.length) {
        await client.query(
          "DELETE FROM review_tasks WHERE subject_type='cluster_candidate' AND subject_id = ANY($1::text[])",
          [candidateIds]
        );
      }
      await client.query("DELETE FROM processing_jobs WHERE subject_type='submission' AND subject_id=$1", [publicId]);
      await client.query("DELETE FROM audit_events WHERE subject_type='submission' AND subject_id=$1", [publicId]);
      await client.query('DELETE FROM submissions WHERE id=$1', [submissionId]);
    }

    await client.query("DELETE FROM review_tasks WHERE subject_type='submission' AND subject_id=$1 AND task_id=$2", [publicId, taskId]);
    await client.query('DELETE FROM operators WHERE external_subject_hash=$1', [operatorHash]);

    if (clusterId) {
      await client.query(
        `DELETE FROM clusters c WHERE c.id=$1
          AND NOT EXISTS (SELECT 1 FROM cluster_members cm WHERE cm.cluster_id=c.id)
          AND NOT EXISTS (SELECT 1 FROM cluster_variants cv WHERE cv.cluster_id=c.id)`,
        [clusterId]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function assertNoResidue() {
  const result = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM submissions WHERE public_id=$1 OR idempotency_key=$2) AS submissions,
       (SELECT count(*)::int FROM processing_jobs WHERE subject_id=$1) AS jobs,
       (SELECT count(*)::int FROM audit_events WHERE subject_type='submission' AND subject_id=$1) AS audit,
       (SELECT count(*)::int FROM review_tasks WHERE subject_type='submission' AND subject_id=$1) AS review_tasks,
       (SELECT count(*)::int FROM operators WHERE external_subject_hash=$3) AS operators`,
    [publicId, idempotencyKey, operatorHash]
  );
  const row = result.rows[0];
  assert(Object.values(row).every(value => value === 0), 'synthetic prompt HTTP E2E residue remains after cleanup', row);
  return row;
}

try {
  await setupFixture();

  const status = await fetchStatus();
  assert(status.response.status === 200, 'protected status must return the stored clarification prompt', status.data);
  assert(status.data?.current_status === 'clarification', 'review decision must move the synthetic case to clarification', status.data);
  assert(status.data?.clarification_prompt?.question === question, 'protected status question mismatch', status.data);
  assert(status.data?.clarification_prompt?.reason_code === 'NEEDS_CLARIFICATION', 'protected status reason code mismatch', status.data);
  assert(status.data?.clarification_prompt?.status === 'open', 'protected status must expose the prompt as open before answer', status.data);
  assert(!JSON.stringify(status.data).includes('external_subject_hash'), 'protected status must not expose operator identity data', status.data);

  const denied = await fetchStatus('definitely-wrong-token');
  assert(denied.response.status === 403 && denied.data?.code === 'STATUS_ACCESS_DENIED', 'wrong token must not reveal the clarification prompt', denied.data);

  const beforeExport = await fetchExport();
  assert(beforeExport.response.status === 200, 'privacy export before answer failed', beforeExport.data);
  assert(Array.isArray(beforeExport.data?.clarification_prompts) && beforeExport.data.clarification_prompts.length === 1, 'privacy export must contain the stored prompt', beforeExport.data);
  assert(beforeExport.data.clarification_prompts[0]?.status === 'open', 'privacy export must show the prompt as open before answer', beforeExport.data);

  const answered = await submitAnswer();
  assert(answered.response.status === 201, 'new clarification answer must return 201', answered.data);
  assert(answered.data?.accepted === true && answered.data?.replayed === false && answered.data?.clarification_id, 'clarification answer contract failed', answered.data);
  const clarificationId = answered.data.clarification_id;

  const replay = await submitAnswer();
  assert(replay.response.status === 200, 'clarification answer replay must return 200', replay.data);
  assert(replay.data?.replayed === true && replay.data?.clarification_id === clarificationId, 'clarification replay must reuse the same clarification id', replay.data);

  const linked = await pool.query(
    `SELECT p.prompt_id,p.status AS prompt_status,p.answered_at,c.clarification_id,
            (c.clarification_prompt_id=p.id) AS linked,s.original_text
       FROM submissions s
       JOIN citizen_clarification_prompts p ON p.submission_id=s.id
       JOIN citizen_clarifications c ON c.submission_id=s.id
      WHERE s.public_id=$1`,
    [publicId]
  );
  assert(linked.rowCount === 1, 'expected exactly one prompt/answer pair', linked.rows);
  assert(linked.rows[0].prompt_status === 'answered' && linked.rows[0].linked === true, 'answer must close and link the stored prompt', linked.rows[0]);
  assert(linked.rows[0].clarification_id === clarificationId, 'database clarification id mismatch', linked.rows[0]);
  assert(linked.rows[0].original_text === originalText, 'clarification flow must preserve immutable original_text', linked.rows[0]);

  const worker = await pollUntilProcessed();
  const finalStatus = await fetchStatus();
  assert(finalStatus.response.status === 200, 'final protected status failed', finalStatus.data);
  assert(finalStatus.data?.clarification_prompt == null, 'answered prompt must no longer appear as the current open prompt', finalStatus.data);
  assert(Array.isArray(finalStatus.data?.clarifications) && finalStatus.data.clarifications.length === 1, 'final status must expose exactly one private citizen clarification', finalStatus.data);
  assert(finalStatus.data?.review_path?.depth === 'STANDARD', 'neutral clarified case must return to STANDARD procedural review', finalStatus.data);

  const afterExport = await fetchExport();
  assert(afterExport.response.status === 200, 'privacy export after answer failed', afterExport.data);
  assert(afterExport.data?.clarification_prompts?.[0]?.status === 'answered', 'privacy export must retain the answered prompt history', afterExport.data);
  assert(afterExport.data?.citizen_clarifications?.[0]?.clarification_id === clarificationId, 'privacy export must retain the linked citizen answer', afterExport.data);

  await cleanup();
  const residue = await assertNoResidue();

  console.log(JSON.stringify({
    ok: true,
    public_id: publicId,
    wrong_token_denied: true,
    prompt_visible_before_answer: true,
    prompt_answered_and_linked: true,
    replay_deduplicated: true,
    original_text_immutable: true,
    worker_continued: worker.current_status,
    review_depth: finalStatus.data?.review_path?.depth,
    cleanup: residue
  }));
} catch (error) {
  console.error('[prompt-http-e2e] FAIL', error.message, error.detail || '');
  try { await cleanup(); } catch (cleanupError) { console.error('[prompt-http-e2e] cleanup failed', cleanupError.message); }
  process.exitCode = 1;
} finally {
  await pool.end();
}
