import pg from 'pg';

const { Pool } = pg;

const base = String(process.env.WERK_STAGING_EDGE_URL || '').replace(/\/$/, '');
const databaseUrl = process.env.DATABASE_URL;
const timeoutMs = Math.max(10_000, Number(process.env.STAGING_E2E_TIMEOUT_MS || 90_000));
const intervalMs = Math.max(250, Number(process.env.STAGING_E2E_INTERVAL_MS || 1_500));

if (!base || !/^https:\/\//.test(base)) {
  console.error('[competence-http-e2e] WERK_STAGING_EDGE_URL must be an https URL to the deployed werk-ideenwerk-api function');
  process.exit(2);
}
if (!databaseUrl) {
  console.error('[competence-http-e2e] DATABASE_URL is required for staging assertions and cleanup');
  process.exit(2);
}

const runId = `COMPETENCE-HTTP-E2E-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${Math.random().toString(16).slice(2, 10)}`;
const idempotencyKey = `competence-http-e2e:${runId}`;
const payload = {
  text: 'Synthetischer Kompetenz-E2E: Digitale Verwaltungsabläufe sollen transparent, nachvollziehbar und ohne personenbezogene Daten verbessert werden.',
  region: 'Niederösterreich',
  topic: 'Verwaltung',
  consent_public_anonymous: false
};
const expected = {
  result_code: 'matched',
  inventory_item_id: 'COMP-ADMIN-DIGITAL',
  current_class: 'mixed',
  suggested_level: 'geteilt',
  source_ids: ['BVG-10', 'BVG-15', 'BVG-118'],
  confidence: 0.85,
  legal_change_required: false,
  classifier_version: 'competence-precheck-v1'
};
const expectedExistingMeasure = {
  result_code: 'possible_overlap',
  ref_ids: ['GOV-REFORMPARTNERSHIP-ADMIN', 'GOV-DADEX', 'ADM-01'],
  confidence: 0.96,
  requires_human_review: true,
  classifier_version: 'existing-measure-check-v1',
  reference_versions: {
    current_government_measures_register: '2026-09-03-v2',
    implementation_overlap: '2026-09-03-v3',
    government_measure_legal_status: '2026-09-05-v3',
    government_reference_measures: '2026-09-03-v1'
  }
};

const pool = new Pool({ connectionString: databaseUrl });
let publicId = null;
let token = null;

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

function assertCompetence(actual, label) {
  assert(actual && typeof actual === 'object', `${label} must expose competence_precheck`, actual);
  assert(actual.result_code === expected.result_code, `${label} result_code mismatch`, actual);
  assert(actual.inventory_item_id === expected.inventory_item_id, `${label} inventory_item_id mismatch`, actual);
  assert(actual.current_class === expected.current_class, `${label} current_class mismatch`, actual);
  assert(actual.suggested_level === expected.suggested_level, `${label} suggested_level mismatch`, actual);
  assert(
    Array.isArray(actual.source_ids) &&
      actual.source_ids.length === expected.source_ids.length &&
      expected.source_ids.every(source => actual.source_ids.includes(source)),
    `${label} source_ids mismatch`,
    actual
  );
  assert(Number(actual.confidence) === expected.confidence, `${label} confidence mismatch`, actual);
  assert(actual.legal_change_required === expected.legal_change_required, `${label} legal_change_required mismatch`, actual);
  assert(actual.classifier_version === expected.classifier_version, `${label} classifier_version mismatch`, actual);
}

function assertExistingMeasure(actual, label) {
  assert(actual && typeof actual === 'object', `${label} must expose existing_measure_check`, actual);
  assert(actual.result_code === expectedExistingMeasure.result_code, `${label} existing-measure result_code mismatch`, actual);
  const refs = Array.isArray(actual.matched_refs) ? actual.matched_refs : [];
  const ids = refs.map(ref => ref?.id).filter(Boolean);
  assert(expectedExistingMeasure.ref_ids.every(id => ids.includes(id)), `${label} existing-measure refs mismatch`, actual);
  assert(Number(actual.confidence) === expectedExistingMeasure.confidence, `${label} existing-measure confidence mismatch`, actual);
  assert(actual.requires_human_review === expectedExistingMeasure.requires_human_review, `${label} existing-measure review flag mismatch`, actual);
  assert(actual.classifier_version === expectedExistingMeasure.classifier_version, `${label} existing-measure classifier mismatch`, actual);
  for (const [key, value] of Object.entries(expectedExistingMeasure.reference_versions)) {
    assert(actual?.reference_versions?.[key] === value, `${label} existing-measure reference version mismatch for ${key}`, actual);
  }
}

async function pollUntilPrechecksVisible(startData) {
  const deadline = Date.now() + timeoutMs;
  let current = startData;
  while (Date.now() < deadline) {
    if (current?.competence_precheck && current?.existing_measure_check && current?.current_status === 'precheck') return current;
    const dead = await pool.query(
      `SELECT count(*)::int AS count
         FROM processing_jobs
        WHERE subject_type='submission' AND subject_id=$1 AND status='dead'`,
      [publicId]
    );
    assert(dead.rows[0]?.count === 0, 'dead job found while waiting for prechecks', dead.rows[0]);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    const polled = await fetchStatus();
    assert(polled.response.status === 200, 'protected status polling failed', polled.data);
    current = polled.data;
  }
  throw Object.assign(new Error('prechecks did not become visible before timeout'), { detail: current });
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
       (SELECT count(*)::int FROM ideenwerk_existing_measure_checks em JOIN submissions s ON s.id=em.submission_id WHERE s.public_id=$2) AS existing_measure_checks`,
    [idempotencyKey, cleanedPublicId]
  );
  const row = result.rows[0];
  assert(Object.values(row).every(value => value === 0), 'synthetic precheck HTTP E2E residue remains after cleanup', row);
  return row;
}

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

  const finalStatus = await pollUntilPrechecksVisible(firstStatus.data);
  assert(finalStatus.current_status === 'precheck', 'precheck test must reach precheck', finalStatus);
  assertCompetence(finalStatus.competence_precheck, 'protected status');
  assertExistingMeasure(finalStatus.existing_measure_check, 'protected status');
  assert(finalStatus?.review_path?.depth === 'STANDARD', 'neutral precheck fixture must remain on STANDARD procedural review', finalStatus);

  const competenceEvents = Array.isArray(finalStatus?.history)
    ? finalStatus.history.filter(event => event?.event_type === 'competence_precheck_completed')
    : [];
  assert(competenceEvents.length === 1, 'protected history must expose exactly one competence_precheck_completed event', competenceEvents);
  assert(competenceEvents[0]?.payload?.inventory_item_id === expected.inventory_item_id, 'competence audit event inventory item mismatch', competenceEvents[0]);
  assert(!Object.hasOwn(competenceEvents[0]?.payload || {}, 'original_text'), 'competence audit event must not duplicate original_text', competenceEvents[0]);

  const measureEvents = Array.isArray(finalStatus?.history)
    ? finalStatus.history.filter(event => event?.event_type === 'existing_measure_check_completed')
    : [];
  assert(measureEvents.length === 1, 'protected history must expose exactly one existing_measure_check_completed event', measureEvents);
  assert(measureEvents[0]?.payload?.result_code === expectedExistingMeasure.result_code, 'existing-measure audit result mismatch', measureEvents[0]);
  assert(measureEvents[0]?.payload?.boundary === 'review_hint_only_no_automatic_decision', 'existing-measure audit boundary mismatch', measureEvents[0]);
  assert(!Object.hasOwn(measureEvents[0]?.payload || {}, 'original_text'), 'existing-measure audit event must not duplicate original_text', measureEvents[0]);

  const denied = await fetchStatus('definitely-wrong-token');
  assert(denied.response.status === 403 && denied.data?.code === 'STATUS_ACCESS_DENIED', 'wrong token must not reveal protected precheck results', denied.data);

  const exported = await fetchExport();
  assert(exported.response.status === 200, 'privacy export must accept the issued token', exported.data);
  assert(exported.data?.submission?.public_id === publicId, 'privacy export public_id mismatch', exported.data);
  assertCompetence(exported.data?.competence_precheck, 'privacy export');
  assertExistingMeasure(exported.data?.existing_measure_check, 'privacy export');
  assert(exported.data?.structured_proposal?.suggested_level === expected.suggested_level, 'structured proposal must reuse matched suggested_level', exported.data?.structured_proposal);

  const db = await pool.query(
    `WITH target AS (
       SELECT id,public_id,current_status,original_text FROM submissions WHERE public_id=$1
     )
     SELECT
       (SELECT current_status FROM target) AS current_status,
       (SELECT original_text FROM target) AS original_text,
       (SELECT cp.result_code FROM ideenwerk_competence_prechecks cp JOIN target t ON cp.submission_id=t.id) AS result_code,
       (SELECT cp.inventory_item_id FROM ideenwerk_competence_prechecks cp JOIN target t ON cp.submission_id=t.id) AS inventory_item_id,
       (SELECT cp.current_class FROM ideenwerk_competence_prechecks cp JOIN target t ON cp.submission_id=t.id) AS current_class,
       (SELECT cp.suggested_level FROM ideenwerk_competence_prechecks cp JOIN target t ON cp.submission_id=t.id) AS competence_level,
       (SELECT sp.suggested_level FROM structured_proposals sp JOIN target t ON sp.submission_id=t.id) AS structured_level,
       (SELECT em.result_code FROM ideenwerk_existing_measure_checks em JOIN target t ON em.submission_id=t.id) AS measure_result_code,
       (SELECT em.requires_human_review FROM ideenwerk_existing_measure_checks em JOIN target t ON em.submission_id=t.id) AS measure_requires_review,
       (SELECT em.matched_refs FROM ideenwerk_existing_measure_checks em JOIN target t ON em.submission_id=t.id) AS measure_refs,
       (SELECT count(*)::int FROM audit_events e JOIN target t ON e.subject_id=t.public_id WHERE e.subject_type='submission' AND e.event_type='competence_precheck_completed') AS competence_events,
       (SELECT count(*)::int FROM audit_events e JOIN target t ON e.subject_id=t.public_id WHERE e.subject_type='submission' AND e.event_type='existing_measure_check_completed') AS measure_events,
       (SELECT count(*)::int FROM processing_jobs j JOIN target t ON j.subject_id=t.public_id WHERE j.status='dead') AS dead_jobs,
       (SELECT count(*)::int FROM processing_jobs j JOIN target t ON j.subject_id=t.public_id WHERE j.status IN ('queued','running')) AS active_jobs,
       (SELECT count(*)::int FROM processing_jobs j JOIN target t ON j.subject_id=t.public_id WHERE j.status='done') AS done_jobs`,
    [publicId]
  );
  const checks = db.rows[0];
  assert(checks?.current_status === 'precheck', 'database fixture must finish at precheck', checks);
  assert(checks?.original_text === payload.text, 'prechecks must preserve immutable original_text', checks);
  assert(checks?.result_code === expected.result_code, 'database competence result mismatch', checks);
  assert(checks?.inventory_item_id === expected.inventory_item_id, 'database competence inventory item mismatch', checks);
  assert(checks?.current_class === expected.current_class, 'database competence class mismatch', checks);
  assert(checks?.competence_level === expected.suggested_level && checks?.structured_level === expected.suggested_level, 'database suggested_level reuse mismatch', checks);
  assert(checks?.measure_result_code === expectedExistingMeasure.result_code, 'database existing-measure result mismatch', checks);
  assert(checks?.measure_requires_review === true, 'database existing-measure human-review flag mismatch', checks);
  const dbMeasureRefIds = Array.isArray(checks?.measure_refs) ? checks.measure_refs.map(ref => ref?.id) : [];
  assert(expectedExistingMeasure.ref_ids.every(id => dbMeasureRefIds.includes(id)), 'database existing-measure refs mismatch', checks);
  assert(checks?.competence_events === 1, 'database must contain exactly one competence audit event', checks);
  assert(checks?.measure_events === 1, 'database must contain exactly one existing-measure audit event', checks);
  assert(checks?.dead_jobs === 0 && checks?.active_jobs === 0 && checks?.done_jobs > 0, 'worker job state invalid after precheck E2E', checks);

  const cleanedPublicId = publicId;
  await cleanup();
  const residue = await assertNoResidue(cleanedPublicId);
  publicId = null;

  console.log(JSON.stringify({
    ok: true,
    run_id: runId,
    final_status: finalStatus.current_status,
    review_depth: finalStatus.review_path?.depth,
    competence: finalStatus.competence_precheck,
    existing_measure_check: finalStatus.existing_measure_check,
    wrong_token_denied: true,
    privacy_export_verified: true,
    original_text_immutable: true,
    done_jobs: checks.done_jobs,
    cleanup: residue
  }));
} catch (error) {
  console.error('[competence-http-e2e] FAIL', error.message, error.detail || '');
  try { await cleanup(); } catch (cleanupError) { console.error('[competence-http-e2e] cleanup failed', cleanupError.message); }
  process.exitCode = 1;
} finally {
  await pool.end();
}
