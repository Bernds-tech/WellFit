import pg from 'pg';

const { Pool } = pg;

const base = String(process.env.WERK_STAGING_EDGE_URL || '').replace(/\/$/, '');
const databaseUrl = process.env.DATABASE_URL;
const timeoutMs = Math.max(10_000, Number(process.env.STAGING_E2E_TIMEOUT_MS || 90_000));
const intervalMs = Math.max(250, Number(process.env.STAGING_E2E_INTERVAL_MS || 1_500));

if (!base || !/^https:\/\//.test(base)) {
  console.error('[staging-e2e] WERK_STAGING_EDGE_URL must be an https URL to the deployed werk-ideenwerk-api function');
  process.exit(2);
}
if (!databaseUrl) {
  console.error('[staging-e2e] DATABASE_URL is required for staging assertions and cleanup');
  process.exit(2);
}

const runId = `STAGING-E2E-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${Math.random().toString(16).slice(2, 10)}`;
const idempotencyKey = `staging-e2e:${runId}`;
const clarificationIdempotencyKey = `staging-e2e:clarification:${runId}`;
const payload = {
  text: 'Synthetischer WERK-Staging-Test: Verwaltungsabläufe sollen transparent, nachvollziehbar und ohne personenbezogene Daten verbessert werden.',
  region: 'Niederösterreich',
  topic: 'Verwaltung',
  consent_public_anonymous: false
};
const clarificationText = 'Bitte ergänzen: Die Idee betrifft nur standardisierte Verwaltungsabläufe und soll ohne personenbezogene Daten geprüft werden.';
const pool = new Pool({ connectionString: databaseUrl });
let publicId = null;
let token = null;
let clarificationId = null;

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

async function fetchStatus(authToken) {
  return jsonResponse(await fetch(`${base}/status/${publicId}`, {
    headers: { authorization: `Bearer ${authToken}` }
  }));
}

async function privacyGet(path, authToken=token) {
  return jsonResponse(await fetch(`${base}${path}/${publicId}`, {
    headers: { authorization: `Bearer ${authToken}` }
  }));
}

async function createPrivacyRequest(requestType, details) {
  return jsonResponse(await fetch(`${base}/privacy/requests/${publicId}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ request_type: requestType, details })
  }));
}

async function submitClarification(authToken, text=clarificationText, key=clarificationIdempotencyKey) {
  return jsonResponse(await fetch(`${base}/status/${publicId}/clarification`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${authToken}`,
      'content-type': 'application/json',
      'idempotency-key': key
    },
    body: JSON.stringify({ text })
  }));
}

async function prepareClarificationCheckpoint() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const target = await client.query(
      `SELECT id,public_id,current_status,original_text
         FROM submissions
        WHERE public_id=$1
        FOR UPDATE`,
      [publicId]
    );
    assert(target.rowCount === 1, 'synthetic submission missing before clarification checkpoint', { publicId });
    const row = target.rows[0];
    const active = await client.query(
      `SELECT count(*)::int AS count
         FROM processing_jobs
        WHERE subject_type='submission'
          AND subject_id=$1
          AND status IN ('queued','running')`,
      [publicId]
    );
    assert(active.rows[0]?.count === 0, 'cannot prepare clarification checkpoint while worker jobs are active', active.rows[0]);
    assert(row.original_text === payload.text, 'original text changed before clarification checkpoint', row);

    if (row.current_status !== 'clarification') {
      await client.query(
        `UPDATE submissions
            SET current_status='clarification',updated_at=now()
          WHERE id=$1`,
        [row.id]
      );
      await client.query(
        `INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
         VALUES(
           'EVT-E2E-'||upper(substr(md5(random()::text||clock_timestamp()::text),1,20)),
           'submission',$1,'staging_test_checkpoint','system','STAGING_E2E_CLARIFICATION_SETUP',
           $2::jsonb
         )`,
        [publicId, JSON.stringify({ from: row.current_status, to: 'clarification', run_id: runId })]
      );
    }
    await client.query('COMMIT');
    return { from: row.current_status, to: 'clarification' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function pollUntilStable(startData) {
  const deadline = Date.now() + timeoutMs;
  let current = startData;
  while (Date.now() < deadline && ['received','structured','cluster_review','clarification'].includes(current?.current_status)) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    const polled = await fetchStatus(token);
    assert(polled.response.status === 200, 'private status polling failed', polled.data);
    current = polled.data;
  }
  return current;
}

async function cleanup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const target = await client.query(
      `SELECT id,public_id,cluster_id
         FROM submissions
        WHERE idempotency_key=$1 OR ($2::text IS NOT NULL AND public_id=$2)
        FOR UPDATE`,
      [idempotencyKey, publicId]
    );
    const ids = target.rows.map(row => row.id);
    const publicIds = target.rows.map(row => row.public_id);
    const clusterIds = [...new Set(target.rows.map(row => row.cluster_id).filter(Boolean))];

    let deletedReviewTasks = 0;
    let deletedJobs = 0;
    let deletedAudit = 0;
    let deletedSubmissions = 0;
    let deletedClusters = 0;

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
        const result = await client.query(
          `DELETE FROM review_tasks
            WHERE subject_type='cluster_candidate'
              AND subject_id = ANY($1::text[])`,
          [candidateIds]
        );
        deletedReviewTasks = result.rowCount;
      }
    }

    if (publicIds.length) {
      deletedJobs = (await client.query('DELETE FROM processing_jobs WHERE subject_id = ANY($1::text[])', [publicIds])).rowCount;
      deletedAudit = (await client.query(
        `DELETE FROM audit_events
          WHERE subject_type='submission'
            AND subject_id = ANY($1::text[])`,
        [publicIds]
      )).rowCount;
    }

    if (ids.length) {
      deletedSubmissions = (await client.query('DELETE FROM submissions WHERE id = ANY($1::uuid[])', [ids])).rowCount;
    }

    if (clusterIds.length) {
      deletedClusters = (await client.query(
        `DELETE FROM clusters c
          WHERE c.id = ANY($1::uuid[])
            AND NOT EXISTS (SELECT 1 FROM cluster_members cm WHERE cm.cluster_id=c.id)
            AND NOT EXISTS (SELECT 1 FROM cluster_variants cv WHERE cv.cluster_id=c.id)`,
        [clusterIds]
      )).rowCount;
    }

    await client.query('COMMIT');
    return { deletedSubmissions, deletedJobs, deletedAudit, deletedReviewTasks, deletedClusters };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function assertNoSyntheticResidue(cleanedPublicId, cleanedClarificationId) {
  const residue = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM submissions WHERE idempotency_key=$1 OR public_id=$2) AS submissions,
       (SELECT count(*)::int FROM processing_jobs WHERE subject_id=$2) AS jobs,
       (SELECT count(*)::int FROM audit_events WHERE subject_type='submission' AND subject_id=$2) AS audit,
       (SELECT count(*)::int FROM citizen_clarifications WHERE clarification_id=$3) AS clarifications`,
    [idempotencyKey, cleanedPublicId, cleanedClarificationId]
  );
  const row = residue.rows[0];
  assert(row?.submissions === 0 && row?.jobs === 0 && row?.audit === 0 && row?.clarifications === 0,
    'synthetic staging residue remains after cleanup', row);
  return row;
}

try {
  const created = await jsonResponse(await fetch(`${base}/submissions`, {
    method: 'POST',
    headers: { 'content-type':'application/json', 'idempotency-key': idempotencyKey },
    body: JSON.stringify(payload)
  }));
  assert(created.response.status === 201, 'submission create must return 201', created.data);
  assert(created.data?.public_id && created.data?.status_token_once, 'submission create must return public_id and one-time status token', created.data);
  publicId = created.data.public_id;
  token = created.data.status_token_once;

  const firstStatus = await fetchStatus(token);
  assert(firstStatus.response.status === 200, 'private status must accept issued token', firstStatus.data);
  assert(firstStatus.data?.public_id === publicId, 'private status public_id mismatch', firstStatus.data);

  let finalStatus = await pollUntilStable(firstStatus.data);
  assert(!['received','structured','cluster_review','clarification'].includes(finalStatus?.current_status), 'staging worker did not advance submission to a stable checkpoint before timeout', finalStatus);
  assert(finalStatus?.review_path?.depth === 'STANDARD', 'protected status must expose the assigned STANDARD review path for the neutral synthetic case', finalStatus);
  assert(['standard_review','high_attention','quality_low_attention','existing_measure_review'].includes(finalStatus?.review_path?.triage_queue), 'protected status review path must expose an expected triage queue', finalStatus);
  assert(Array.isArray(finalStatus?.privacy_requests) && finalStatus.privacy_requests.length === 0, 'fresh protected status must expose an empty privacy request list', finalStatus);

  const exportResult = await privacyGet('/privacy/export');
  assert(exportResult.response.status === 200, 'privacy export must accept the issued token', exportResult.data);
  assert(exportResult.data?.submission?.public_id === publicId, 'privacy export public_id mismatch', exportResult.data);
  assert(!JSON.stringify(exportResult.data).includes('token_hash'), 'privacy export must never expose token hashes', exportResult.data);

  const deniedExport = await privacyGet('/privacy/export','definitely-wrong-token');
  assert(deniedExport.response.status === 403 && deniedExport.data?.code === 'STATUS_ACCESS_DENIED', 'wrong token must be denied for privacy export', deniedExport.data);

  const correction = await createPrivacyRequest('correction', `Synthetische Korrekturanfrage ${runId}`);
  assert(correction.response.status === 201, 'privacy correction request must return 201', correction.data);
  assert(correction.data?.request_id && correction.data?.status === 'received' && correction.data?.replayed === false, 'privacy correction request contract failed', correction.data);

  const correctionReplay = await createPrivacyRequest('correction', `Synthetische Korrekturanfrage ${runId}`);
  assert(correctionReplay.response.status === 200, 'identical open privacy request replay must return 200', correctionReplay.data);
  assert(correctionReplay.data?.replayed === true && correctionReplay.data?.request_id === correction.data.request_id, 'privacy request replay must reuse the same request id', correctionReplay.data);

  const deletion = await createPrivacyRequest('deletion', `Synthetischer Löschwunsch ${runId}; nur Workflowtest, keine automatische Löschung.`);
  assert(deletion.response.status === 201 && deletion.data?.request_id, 'privacy deletion request must be accepted as a review request', deletion.data);

  const requestList = await privacyGet('/privacy/requests');
  assert(requestList.response.status === 200, 'privacy request list failed', requestList.data);
  assert(Array.isArray(requestList.data?.requests) && requestList.data.requests.length === 2, 'privacy request list must contain exactly the correction and deletion test requests', requestList.data);

  const statusAfterPrivacy = await fetchStatus(token);
  assert(statusAfterPrivacy.response.status === 200, 'status after privacy requests failed', statusAfterPrivacy.data);
  assert(Array.isArray(statusAfterPrivacy.data?.privacy_requests) && statusAfterPrivacy.data.privacy_requests.length === 2, 'protected status must expose privacy request summaries', statusAfterPrivacy.data);
  assert(statusAfterPrivacy.data?.data_state !== 'erased', 'deletion request must not automatically erase citizen data', statusAfterPrivacy.data);
  assert(statusAfterPrivacy.data?.original_text === payload.text, 'deletion request must not mutate original text before review', statusAfterPrivacy.data);

  const clarificationCheckpoint = await prepareClarificationCheckpoint();
  assert(clarificationCheckpoint.to === 'clarification', 'failed to prepare synthetic clarification checkpoint', clarificationCheckpoint);

  const deniedClarification = await submitClarification('definitely-wrong-token');
  assert(
    deniedClarification.response.status === 403 && deniedClarification.data?.code === 'STATUS_ACCESS_DENIED',
    'wrong token must be denied for deployed clarification route',
    deniedClarification.data
  );

  const clarification = await submitClarification(token);
  assert(clarification.response.status === 201, 'deployed clarification route must return 201 for a new clarification', clarification.data);
  assert(
    clarification.data?.accepted === true &&
      clarification.data?.replayed === false &&
      clarification.data?.clarification_id &&
      clarification.data?.status === 'cluster_review' &&
      clarification.data?.next === 'semantic_cluster_review',
    'deployed clarification route contract failed',
    clarification.data
  );
  clarificationId = clarification.data.clarification_id;

  const clarificationReplay = await submitClarification(token);
  assert(clarificationReplay.response.status === 200, 'clarification replay must return 200', clarificationReplay.data);
  assert(
    clarificationReplay.data?.accepted === true &&
      clarificationReplay.data?.replayed === true &&
      clarificationReplay.data?.clarification_id === clarificationId,
    'clarification replay must reuse the same clarification id',
    clarificationReplay.data
  );

  const statusAfterClarification = await fetchStatus(token);
  assert(statusAfterClarification.response.status === 200, 'status after clarification failed', statusAfterClarification.data);
  assert(
    Array.isArray(statusAfterClarification.data?.clarifications) &&
      statusAfterClarification.data.clarifications.length === 1 &&
      statusAfterClarification.data.clarifications[0]?.clarification_id === clarificationId &&
      statusAfterClarification.data.clarifications[0]?.response_text === clarificationText,
    'protected status must expose exactly the submitted clarification',
    statusAfterClarification.data
  );
  assert(statusAfterClarification.data?.original_text === payload.text, 'clarification must not mutate original text', statusAfterClarification.data);

  finalStatus = await pollUntilStable(statusAfterClarification.data);
  assert(!['clarification','structured','cluster_review'].includes(finalStatus?.current_status), 'staging worker did not continue after clarification before timeout', finalStatus);
  assert(finalStatus?.review_path?.depth === 'STANDARD', 'clarified neutral case must return to STANDARD review path', finalStatus);

  const exportAfterClarification = await privacyGet('/privacy/export');
  assert(exportAfterClarification.response.status === 200, 'privacy export after clarification failed', exportAfterClarification.data);
  assert(
    Array.isArray(exportAfterClarification.data?.citizen_clarifications) &&
      exportAfterClarification.data.citizen_clarifications.length === 1 &&
      exportAfterClarification.data.citizen_clarifications[0]?.clarification_id === clarificationId,
    'privacy export must include the citizen clarification',
    exportAfterClarification.data
  );

  const replay = await jsonResponse(await fetch(`${base}/submissions`, {
    method: 'POST',
    headers: { 'content-type':'application/json', 'idempotency-key': idempotencyKey },
    body: JSON.stringify(payload)
  }));
  assert(replay.response.status === 200, 'idempotent replay must return 200', replay.data);
  assert(replay.data?.replayed === true && replay.data?.public_id === publicId, 'idempotent replay contract failed', replay.data);
  assert(replay.data?.status_token_once === null, 'idempotent replay must never reissue the status token', replay.data);

  const denied = await fetchStatus('definitely-wrong-token');
  assert(denied.response.status === 403 && denied.data?.code === 'STATUS_ACCESS_DENIED', 'wrong status token must be denied', denied.data);

  const metrics = await jsonResponse(await fetch(`${base}/transparency/metrics`));
  assert(metrics.response.status === 200, 'transparency metrics endpoint failed', metrics.data);
  assert(Number(metrics.data?.submissions_total) >= 1, 'transparency metrics did not observe the synthetic submission', metrics.data);
  assert(Number(metrics.data?.review_depth?.assigned_total) >= 1, 'review-depth aggregate did not observe the synthetic assignment', metrics.data);
  assert(['suppressed_small_sample','published'].includes(metrics.data?.review_depth?.distribution_state), 'review-depth aggregate has invalid publication state', metrics.data);
  if (metrics.data.review_depth.distribution_state === 'suppressed_small_sample') {
    assert(metrics.data.review_depth.fast === null && metrics.data.review_depth.standard === null && metrics.data.review_depth.deep === null, 'small review-depth sample must suppress bucket counts', metrics.data);
  } else {
    const sum = Number(metrics.data.review_depth.fast) + Number(metrics.data.review_depth.standard) + Number(metrics.data.review_depth.deep);
    assert(sum === Number(metrics.data.review_depth.assigned_total), 'published review-depth buckets must reconcile to assigned_total', metrics.data);
  }

  const db = await pool.query(
    `WITH target AS (
       SELECT id,public_id,current_status,original_text FROM submissions WHERE public_id=$1
     )
     SELECT
       (SELECT current_status FROM target) AS current_status,
       (SELECT original_text FROM target) AS original_text,
       (SELECT count(*)::int FROM processing_jobs j JOIN target t ON j.subject_id=t.public_id WHERE j.status='dead') AS dead_jobs,
       (SELECT count(*)::int FROM processing_jobs j JOIN target t ON j.subject_id=t.public_id WHERE j.status IN ('queued','running')) AS active_jobs,
       (SELECT count(*)::int FROM processing_jobs j JOIN target t ON j.subject_id=t.public_id WHERE j.status='done') AS done_jobs,
       (SELECT count(*)::int FROM privacy_requests pr JOIN target t ON pr.submission_id=t.id) AS privacy_requests,
       (SELECT count(*)::int FROM citizen_clarifications c JOIN target t ON c.submission_id=t.id) AS clarifications,
       (SELECT count(*)::int FROM audit_events e JOIN target t ON e.subject_id=t.public_id WHERE e.subject_type='submission' AND e.event_type='privacy_export_generated') AS privacy_exports_audited,
       (SELECT count(*)::int FROM audit_events e JOIN target t ON e.subject_id=t.public_id WHERE e.subject_type='submission' AND e.event_type='clarification_received') AS clarification_events,
       (SELECT count(*)::int FROM review_tasks rt
          WHERE rt.status IN ('open','assigned')
            AND rt.subject_type='cluster_candidate'
            AND NOT EXISTS (SELECT 1 FROM cluster_candidates cc WHERE cc.id::text=rt.subject_id)) AS orphan_review_tasks`,
    [publicId]
  );
  const checks = db.rows[0];
  assert(checks?.dead_jobs === 0, 'dead jobs found after staging E2E', checks);
  assert(checks?.active_jobs === 0, 'queued/running jobs remain after staging E2E', checks);
  assert(checks?.orphan_review_tasks === 0, 'orphan review tasks found after staging E2E', checks);
  assert(Number(checks?.done_jobs) > 0, 'worker produced no completed jobs', checks);
  assert(Number(checks?.privacy_requests) === 2, 'database must contain exactly two synthetic privacy requests before cleanup', checks);
  assert(Number(checks?.clarifications) === 1, 'database must contain exactly one synthetic clarification before cleanup', checks);
  assert(Number(checks?.privacy_exports_audited) >= 2, 'both privacy exports must create audit events', checks);
  assert(Number(checks?.clarification_events) === 1, 'clarification must create exactly one clarification_received audit event', checks);
  assert(checks?.original_text === payload.text, 'database original_text must remain immutable after clarification', checks);

  const cleanedPublicId = publicId;
  const cleanedClarificationId = clarificationId;
  const cleanupResult = await cleanup();
  const residue = await assertNoSyntheticResidue(cleanedPublicId, cleanedClarificationId);
  publicId = null;

  console.log(JSON.stringify({
    ok:true,
    run_id:runId,
    final_status:finalStatus.current_status,
    review_path:finalStatus.review_path,
    clarification:{
      clarification_id:cleanedClarificationId,
      replayed:clarificationReplay.data?.replayed === true,
      wrong_token_denied:deniedClarification.response.status === 403,
      worker_continued:true,
      original_text_immutable:true,
      exported:true
    },
    privacy_requests:checks.privacy_requests,
    privacy_exports_audited:checks.privacy_exports_audited,
    history_events:Array.isArray(finalStatus?.history)?finalStatus.history.length:null,
    done_jobs:checks.done_jobs,
    metrics_seen:metrics.data,
    cleanup:cleanupResult,
    residue
  }));
} catch (error) {
  console.error('[staging-e2e] FAIL', error.message, error.detail || '');
  try {
    const cleanupResult = await cleanup();
    console.error('[staging-e2e] cleanup after failure', cleanupResult);
  } catch (cleanupError) {
    console.error('[staging-e2e] cleanup failed', cleanupError.message);
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}
