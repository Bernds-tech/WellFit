import pg from 'pg';
import crypto from 'node:crypto';

const { Pool } = pg;

const base = String(process.env.WERK_STAGING_EDGE_URL || '').replace(/\/$/, '');
const databaseUrl = process.env.DATABASE_URL;
const timeoutMs = Math.max(10_000, Number(process.env.STAGING_E2E_TIMEOUT_MS || 90_000));
const intervalMs = Math.max(250, Number(process.env.STAGING_E2E_INTERVAL_MS || 1_500));

if (!base || !/^https:\/\//.test(base)) {
  console.error('[competence-review-http-e2e] WERK_STAGING_EDGE_URL must be an https URL to the deployed werk-ideenwerk-api function');
  process.exit(2);
}
if (!databaseUrl) {
  console.error('[competence-review-http-e2e] DATABASE_URL is required for staging assertions and cleanup');
  process.exit(2);
}

const runId = `COMPETENCE-REVIEW-HTTP-E2E-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${crypto.randomBytes(4).toString('hex')}`;
const idempotencyKey = `competence-review-http-e2e:${runId}`;
const operatorHash = crypto.createHash('sha256').update(`operator:${runId}`).digest('hex');
const decisionId = `DEC-${crypto.randomBytes(10).toString('hex').toUpperCase()}`;
const payload = {
  text: 'Synthetischer Kompetenz-Review-HTTP-E2E: Mehr öffentliche Trinkbrunnen sollen an stark frequentierten Orten im Sommer verfügbar sein.',
  region: 'Österreich',
  topic: 'Lebensqualität',
  consent_public_anonymous: false
};
const expectedResolution = {
  resolution_code: 'COMPETENCE_CLASSIFIED',
  resolved_level: 'gemeinde',
  resolved_class: 'gemeinde',
  source_ids: ['BVG-118'],
  legal_change_required: false
};

const pool = new Pool({ connectionString: databaseUrl });
let publicId = null;
let token = null;
let operatorId = null;

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

function assertResolution(actual, label) {
  assert(actual && typeof actual === 'object', `${label} must expose competence_review`, actual);
  assert(actual.resolution_code === expectedResolution.resolution_code, `${label} resolution_code mismatch`, actual);
  assert(actual.resolved_level === expectedResolution.resolved_level, `${label} resolved_level mismatch`, actual);
  assert(actual.resolved_class === expectedResolution.resolved_class, `${label} resolved_class mismatch`, actual);
  assert(
    Array.isArray(actual.source_ids) &&
      actual.source_ids.length === expectedResolution.source_ids.length &&
      expectedResolution.source_ids.every(source => actual.source_ids.includes(source)),
    `${label} source_ids mismatch`,
    actual
  );
  assert(actual.legal_change_required === expectedResolution.legal_change_required, `${label} legal_change_required mismatch`, actual);
  assert(typeof actual.resolved_at === 'string' && actual.resolved_at.length > 10, `${label} resolved_at missing`, actual);
  assert(typeof actual.boundary === 'string' && actual.boundary.includes('keine Annahme oder Ablehnung'), `${label} citizen boundary mismatch`, actual);
  assert(!Object.hasOwn(actual, 'operator_id') && !Object.hasOwn(actual, 'rationale'), `${label} must not expose operator identity or rationale`, actual);
}

async function pollUntilReviewRequired(startData) {
  const deadline = Date.now() + timeoutMs;
  let current = startData;
  let lastDb = null;
  while (Date.now() < deadline) {
    const db = await pool.query(
      `SELECT cp.result_code,cp.signal_key,t.id AS task_uuid,t.task_id,t.status AS task_status,t.required_role,
              (SELECT count(*)::int FROM processing_jobs j WHERE j.subject_type='submission' AND j.subject_id=$1 AND j.status='dead') AS dead_jobs
         FROM submissions s
         LEFT JOIN ideenwerk_competence_prechecks cp ON cp.submission_id=s.id
         LEFT JOIN review_tasks t ON t.subject_type='submission' AND t.subject_id=s.public_id AND t.review_type='competence_precheck'
        WHERE s.public_id=$1`,
      [publicId]
    );
    lastDb = db.rows[0] || null;
    assert((lastDb?.dead_jobs ?? 0) === 0, 'dead job found while waiting for competence review', lastDb);
    if (
      current?.current_status === 'precheck' &&
      current?.competence_precheck?.result_code === 'unclassified' &&
      lastDb?.result_code === 'unclassified' &&
      lastDb?.task_uuid &&
      ['open', 'assigned'].includes(lastDb?.task_status) &&
      lastDb?.required_role === 'legal_reviewer'
    ) return { status: current, task: lastDb };

    await new Promise(resolve => setTimeout(resolve, intervalMs));
    const polled = await fetchStatus();
    assert(polled.response.status === 200, 'protected status polling failed', polled.data);
    current = polled.data;
  }
  throw Object.assign(new Error('competence review did not become ready before timeout'), { detail: { status: current, db: lastDb } });
}

async function createReviewerAndDecision(taskUuid) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const operator = await client.query(
      `INSERT INTO operators(external_subject_hash,display_name,active)
       VALUES($1,$2,true)
       RETURNING id`,
      [operatorHash, `Staging Competence Review E2E ${runId}`]
    );
    operatorId = operator.rows[0].id;
    await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'legal_reviewer')`, [operatorId]);
    await client.query(
      `INSERT INTO review_decisions(decision_id,task_id,operator_id,action,reason_code,rationale,payload)
       VALUES($1,$2,$3,'resolve_competence_precheck','COMPETENCE_CLASSIFIED',$4,$5::jsonb)`,
      [
        decisionId,
        taskUuid,
        operatorId,
        'Die Zuständigkeit wurde für den synthetischen Staging-Fall anhand der kommunalen Aufgabenordnung und der Rechtsquelle BVG-118 geprüft.',
        JSON.stringify({
          resolved_level: 'gemeinde',
          resolved_class: 'gemeinde',
          source_ids: ['BVG-118'],
          legal_change_required: false
        })
      ]
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function cleanup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const target = await client.query(
      `SELECT id,cluster_id
         FROM submissions
        WHERE idempotency_key=$1 OR ($2::text IS NOT NULL AND public_id=$2)
        FOR UPDATE`,
      [idempotencyKey, publicId]
    );
    const ids = target.rows.map(row => row.id);
    const clusterIds = [...new Set(target.rows.map(row => row.cluster_id).filter(Boolean))];

    if (ids.length) {
      const candidates = await client.query(
        `SELECT id::text AS id
           FROM cluster_candidates
          WHERE submission_id = ANY($1::uuid[])
             OR candidate_submission_id = ANY($1::uuid[])`,
        [ids]
      );
      const candidateIds = candidates.rows.map(row => row.id);
      if (candidateIds.length) {
        await client.query(
          `DELETE FROM review_tasks
            WHERE subject_type='cluster_candidate' AND subject_id = ANY($1::text[])`,
          [candidateIds]
        );
      }
    }

    if (publicId) {
      await client.query("DELETE FROM processing_jobs WHERE subject_type='submission' AND subject_id=$1", [publicId]);
      await client.query("DELETE FROM audit_events WHERE subject_type='submission' AND subject_id=$1", [publicId]);
      await client.query("DELETE FROM review_tasks WHERE subject_type='submission' AND subject_id=$1", [publicId]);
    }
    if (ids.length) await client.query('DELETE FROM submissions WHERE id = ANY($1::uuid[])', [ids]);
    await client.query('DELETE FROM operators WHERE external_subject_hash=$1', [operatorHash]);

    for (const clusterId of clusterIds) {
      await client.query(
        `DELETE FROM clusters c
          WHERE c.id=$1
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

async function assertNoResidue(cleanedPublicId) {
  const result = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM submissions WHERE idempotency_key=$1 OR public_id=$2) AS submissions,
       (SELECT count(*)::int FROM processing_jobs WHERE subject_id=$2) AS jobs,
       (SELECT count(*)::int FROM audit_events WHERE subject_type='submission' AND subject_id=$2) AS audit,
       (SELECT count(*)::int FROM review_tasks WHERE subject_type='submission' AND subject_id=$2) AS review_tasks,
       (SELECT count(*)::int FROM review_decisions WHERE decision_id=$3) AS review_decisions,
       (SELECT count(*)::int FROM operators WHERE external_subject_hash=$4) AS operators`,
    [idempotencyKey, cleanedPublicId, decisionId, operatorHash]
  );
  const row = result.rows[0];
  assert(Object.values(row).every(value => value === 0), 'synthetic competence-review HTTP E2E residue remains after cleanup', row);
  return row;
}

let failure = null;
let resultSummary = null;
try {
  const created = await jsonResponse(await fetch(`${base}/submissions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
    body: JSON.stringify(payload)
  }));
  assert(created.response.status === 201, 'submission create must return 201', created.data);
  assert(created.data?.public_id && created.data?.status_token_once, 'submission create must issue public_id and one-time status token', created.data);
  publicId = created.data.public_id;
  token = created.data.status_token_once;

  const firstStatus = await fetchStatus();
  assert(firstStatus.response.status === 200, 'issued status token must open protected status', firstStatus.data);
  assert(firstStatus.data?.public_id === publicId, 'protected status public_id mismatch', firstStatus.data);

  const ready = await pollUntilReviewRequired(firstStatus.data);
  assert(ready.status.competence_review === null, 'human resolution must be absent before legal review', ready.status.competence_review);
  assert(ready.status.original_text === payload.text, 'pre-review status must preserve original_text', ready.status);
  assert(ready.status?.review_path?.depth === 'STANDARD', 'neutral competence fixture must remain on STANDARD procedural review', ready.status);

  const denied = await fetchStatus('definitely-wrong-token');
  assert(denied.response.status === 403 && denied.data?.code === 'STATUS_ACCESS_DENIED', 'wrong token must not reveal competence review data', denied.data);

  await createReviewerAndDecision(ready.task.task_uuid);

  const finalStatus = await fetchStatus();
  assert(finalStatus.response.status === 200, 'protected status failed after competence review decision', finalStatus.data);
  assert(finalStatus.data?.current_status === 'precheck', 'human competence resolution must not change proposal status', finalStatus.data);
  assert(finalStatus.data?.original_text === payload.text, 'human competence resolution must preserve original_text', finalStatus.data);
  assertResolution(finalStatus.data?.competence_review, 'protected status');

  const reviewEvents = Array.isArray(finalStatus.data?.history)
    ? finalStatus.data.history.filter(event => event?.event_type === 'competence_review_resolved')
    : [];
  assert(reviewEvents.length === 1, 'protected history must expose exactly one competence_review_resolved event', reviewEvents);
  assert(reviewEvents[0]?.reason_code === expectedResolution.resolution_code, 'competence review audit reason mismatch', reviewEvents[0]);
  assert(reviewEvents[0]?.payload?.boundary === 'competence_resolution_only_no_automatic_accept_or_reject', 'competence review audit boundary mismatch', reviewEvents[0]);
  assert(!Object.hasOwn(reviewEvents[0]?.payload || {}, 'operator_id'), 'citizen history must not expose reviewer identity', reviewEvents[0]);
  assert(!Object.hasOwn(reviewEvents[0]?.payload || {}, 'rationale'), 'citizen history must not expose internal reviewer rationale', reviewEvents[0]);

  const exported = await fetchExport();
  assert(exported.response.status === 200, 'privacy export must accept issued status token', exported.data);
  assert(exported.data?.submission?.public_id === publicId, 'privacy export public_id mismatch', exported.data);
  assertResolution(exported.data?.competence_review, 'privacy export');

  const db = await pool.query(
    `SELECT s.current_status,s.original_text,cp.signal_key,t.status AS task_status,d.action,d.reason_code,d.payload,
            (SELECT count(*)::int FROM audit_events e WHERE e.subject_type='submission' AND e.subject_id=s.public_id AND e.event_type='competence_review_resolved') AS resolution_events,
            (SELECT count(*)::int FROM processing_jobs j WHERE j.subject_type='submission' AND j.subject_id=s.public_id AND j.status='dead') AS dead_jobs
       FROM submissions s
       JOIN ideenwerk_competence_prechecks cp ON cp.submission_id=s.id
       JOIN review_tasks t ON t.subject_type='submission' AND t.subject_id=s.public_id AND t.review_type='competence_precheck'
       JOIN review_decisions d ON d.task_id=t.id
      WHERE s.public_id=$1 AND d.decision_id=$2`,
    [publicId, decisionId]
  );
  assert(db.rowCount === 1, 'database must contain exactly one competence review decision', db.rows);
  const checks = db.rows[0];
  assert(checks.current_status === 'precheck', 'database status changed unexpectedly', checks);
  assert(checks.original_text === payload.text, 'database original_text changed unexpectedly', checks);
  assert(checks.task_status === 'decided', 'competence review task must be decided', checks);
  assert(checks.action === 'resolve_competence_precheck' && checks.reason_code === expectedResolution.resolution_code, 'database decision contract mismatch', checks);
  assert(checks.payload?.competence_signal_key === checks.signal_key, 'decision must bind to exact competence signal', checks);
  assert(checks.payload?.resolved_level === expectedResolution.resolved_level, 'database resolved level mismatch', checks);
  assert(checks.resolution_events === 1, 'database must contain exactly one competence_review_resolved audit event', checks);
  assert(checks.dead_jobs === 0, 'competence review E2E must not leave dead jobs', checks);

  await pool.query('SELECT public.ideenwerk_run_competence_precheck($1)', [publicId]);
  const rerun = await pool.query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE status IN ('open','assigned'))::int AS active,
            count(*) FILTER (WHERE status='decided')::int AS decided
       FROM review_tasks
      WHERE subject_type='submission' AND subject_id=$1 AND review_type='competence_precheck'`,
    [publicId]
  );
  assert(rerun.rows[0]?.total === 1 && rerun.rows[0]?.active === 0 && rerun.rows[0]?.decided === 1, 'identical competence rerun must not reopen duplicate review', rerun.rows[0]);

  const replayStatus = await fetchStatus();
  assert(replayStatus.response.status === 200, 'protected status failed after identical competence rerun', replayStatus.data);
  assertResolution(replayStatus.data?.competence_review, 'protected status after identical rerun');

  resultSummary = {
    public_id: publicId,
    precheck_result: ready.status.competence_precheck?.result_code,
    review_role: ready.task.required_role,
    resolution_code: finalStatus.data?.competence_review?.resolution_code,
    resolved_level: finalStatus.data?.competence_review?.resolved_level,
    task_status: checks.task_status,
    original_text_unchanged: checks.original_text === payload.text,
    wrong_token_denied: denied.response.status === 403,
    duplicate_review_after_identical_rerun: rerun.rows[0]?.active,
    dead_jobs: checks.dead_jobs
  };
} catch (error) {
  failure = error;
} finally {
  const cleanedPublicId = publicId;
  try {
    await cleanup();
    if (cleanedPublicId) await assertNoResidue(cleanedPublicId);
  } catch (cleanupError) {
    if (!failure) failure = cleanupError;
    else failure.cleanup = cleanupError;
  }
  await pool.end();
}

if (failure) {
  console.error('[competence-review-http-e2e] FAIL', failure.message, failure.detail || '', failure.cleanup?.message || '');
  throw failure;
}

console.log(JSON.stringify({ ok: true, run_id: runId, result: resultSummary, cleanup: 'clean' }, null, 2));
