import pg from 'pg';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const client = new Client({ connectionString });
await client.connect();

const publicId = 'IDEA-C0FFEE0000000034';
const originalText = 'Digitale Verwaltungsportale sollen Once-Only konsequent nutzen und Mehrfachmeldungen vermeiden.';
const tokenHash = crypto.createHash('sha256').update('ci-existing-measure-resolution-token').digest('hex');
const operatorHash = crypto.createHash('sha256').update('ci-existing-measure-resolution-operator').digest('hex');

async function expectFailure(sql, params, marker) {
  await client.query('SAVEPOINT expected_failure');
  let error;
  try {
    await client.query(sql, params);
  } catch (caught) {
    error = caught;
  }
  await client.query('ROLLBACK TO SAVEPOINT expected_failure');
  await client.query('RELEASE SAVEPOINT expected_failure');
  assert.ok(error, `expected failure ${marker}`);
  assert.match(String(error.message), new RegExp(marker));
}

try {
  await client.query('BEGIN');

  const submission = await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES($1,$2,$3,'Österreich','Verwaltung & Digitalisierung','cluster_review')
    RETURNING id
  `,[publicId,'ci-existing-measure-resolution',originalText]);
  const submissionId = submission.rows[0].id;

  await client.query(`INSERT INTO status_access(submission_id,token_hash) VALUES($1,$2)`,[submissionId,tokenHash]);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Mehrfache Datenerfassung','Once-Only für Verwaltungsportale ausbauen','Verwaltung & Digitalisierung','Österreich','[]'::jsonb,false)
  `,[submissionId]);
  await client.query(`UPDATE submissions SET current_status='precheck',updated_at=now() WHERE id=$1`,[submissionId]);

  const task = await client.query(`
    SELECT t.id,t.task_id,t.status,t.required_role,b.signal_key
      FROM review_tasks t
      JOIN ideenwerk_existing_measure_review_bindings b ON b.task_id=t.id
     WHERE t.subject_type='submission' AND t.subject_id=$1 AND t.review_type='existing_measure_overlap'
  `,[publicId]);
  assert.equal(task.rowCount,1);
  assert.equal(task.rows[0].status,'open');
  assert.equal(task.rows[0].required_role,'impact_reviewer');
  assert.match(task.rows[0].signal_key,/^[a-f0-9]{32}$/);
  const firstSignalKey = task.rows[0].signal_key;

  const operator = await client.query(`
    INSERT INTO operators(external_subject_hash,display_name,active)
    VALUES($1,'CI Impact Reviewer',true) RETURNING id
  `,[operatorHash]);
  const operatorId = operator.rows[0].id;
  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'impact_reviewer')`,[operatorId]);

  const decisionSql = `
    INSERT INTO review_decisions(decision_id,task_id,operator_id,action,reason_code,rationale,payload)
    VALUES($1,$2,$3,$4,$5,$6,'{}'::jsonb)
  `;

  await expectFailure(decisionSql,[
    'DEC-C0FFEE0000000034-A',task.rows[0].id,operatorId,'accept','BASELINE_OVERLAP_CONFIRMED','Sachliche Überschneidung ist anhand der Referenzen geprüft.'
  ],'EXISTING_MEASURE_REVIEW_ACTION_REQUIRED');

  await expectFailure(decisionSql,[
    'DEC-C0FFEE0000000034-B',task.rows[0].id,operatorId,'resolve_existing_measure_overlap','ACCEPT_IDEA','Sachliche Überschneidung ist anhand der Referenzen geprüft.'
  ],'EXISTING_MEASURE_REVIEW_REASON_INVALID');

  await expectFailure(decisionSql,[
    'DEC-C0FFEE0000000034-C',task.rows[0].id,operatorId,'resolve_existing_measure_overlap','BASELINE_OVERLAP_PARTIAL','zu kurz'
  ],'EXISTING_MEASURE_REVIEW_RATIONALE_REQUIRED');

  await client.query(decisionSql,[
    'DEC-C0FFEE0000000034',task.rows[0].id,operatorId,'resolve_existing_measure_overlap','BASELINE_OVERLAP_PARTIAL',
    'Die bekannte Once-Only-Baseline deckt einen Teil des Vorschlags ab; der zusätzliche Umfang bleibt gesondert zu prüfen.'
  ]);

  const taskAfter = await client.query(`SELECT status FROM review_tasks WHERE id=$1`,[task.rows[0].id]);
  assert.equal(taskAfter.rows[0].status,'decided');

  const decisionPayload = await client.query(`SELECT payload FROM review_decisions WHERE decision_id='DEC-C0FFEE0000000034'`);
  assert.equal(decisionPayload.rows[0].payload.existing_measure_signal_key,firstSignalKey);

  const immutable = await client.query(`
    SELECT s.current_status,s.original_text,em.result_code,em.requires_human_review,em.signal_key
      FROM submissions s JOIN ideenwerk_existing_measure_checks em ON em.submission_id=s.id
     WHERE s.id=$1
  `,[submissionId]);
  assert.equal(immutable.rows[0].current_status,'precheck');
  assert.equal(immutable.rows[0].original_text,originalText);
  assert.equal(immutable.rows[0].result_code,'possible_overlap');
  assert.equal(immutable.rows[0].requires_human_review,true);
  assert.equal(immutable.rows[0].signal_key,firstSignalKey);

  const status = await client.query(`SELECT public.ideenwerk_get_private_status($1,$2) AS payload`,[publicId,tokenHash]);
  const resolution = status.rows[0].payload.existing_measure_review;
  assert.equal(resolution.resolution_code,'BASELINE_OVERLAP_PARTIAL');
  assert.ok(resolution.resolved_at);
  assert.ok(resolution.boundary.includes('keine Annahme oder Ablehnung'));
  assert.deepEqual(Object.keys(resolution).sort(),['boundary','resolution_code','resolved_at']);
  assert.equal(status.rows[0].payload.original_text,originalText);

  const exported = await client.query(`SELECT public.ideenwerk_get_privacy_export($1,$2) AS payload`,[publicId,tokenHash]);
  assert.equal(exported.rows[0].payload.existing_measure_review.resolution_code,'BASELINE_OVERLAP_PARTIAL');
  assert.deepEqual(Object.keys(exported.rows[0].payload.existing_measure_review).sort(),['boundary','resolution_code','resolved_at']);

  const audit = await client.query(`
    SELECT reason_code,payload FROM audit_events
     WHERE subject_type='submission' AND subject_id=$1 AND event_type='existing_measure_review_resolved'
  `,[publicId]);
  assert.equal(audit.rowCount,1);
  assert.equal(audit.rows[0].reason_code,'BASELINE_OVERLAP_PARTIAL');
  assert.equal(audit.rows[0].payload.resolution_code,'BASELINE_OVERLAP_PARTIAL');
  assert.equal(audit.rows[0].payload.signal_key,firstSignalKey);
  assert.equal(audit.rows[0].payload.boundary,'baseline_overlap_resolution_only_no_automatic_accept_or_reject');
  assert.ok(!Object.hasOwn(audit.rows[0].payload,'operator_id'));
  assert.ok(!Object.hasOwn(audit.rows[0].payload,'rationale'));

  // Re-running the exact same bounded signal must not reopen human review.
  await client.query(`SELECT public.ideenwerk_run_existing_measure_check($1)`,[publicId]);
  const unchanged = await client.query(`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE status IN ('open','assigned'))::int AS active,
           count(*) FILTER (WHERE status='decided')::int AS decided
      FROM review_tasks
     WHERE subject_type='submission' AND subject_id=$1 AND review_type='existing_measure_overlap'
  `,[publicId]);
  assert.equal(unchanged.rows[0].total,1);
  assert.equal(unchanged.rows[0].active,0);
  assert.equal(unchanged.rows[0].decided,1);

  const unchangedStatus = await client.query(`SELECT public.ideenwerk_get_private_status($1,$2) AS payload`,[publicId,tokenHash]);
  assert.equal(unchangedStatus.rows[0].payload.existing_measure_review.resolution_code,'BASELINE_OVERLAP_PARTIAL');

  // A materially changed baseline revision gets a new signal and therefore one
  // fresh task. The old decision must disappear from the current citizen view.
  await client.query(`
    UPDATE ideenwerk_existing_measure_checks
       SET reference_versions=reference_versions || '{"synthetic_revision":"v2"}'::jsonb
     WHERE submission_id=$1
  `,[submissionId]);

  const revised = await client.query(`
    SELECT t.id,t.status,b.signal_key
      FROM review_tasks t
      JOIN ideenwerk_existing_measure_review_bindings b ON b.task_id=t.id
     WHERE t.subject_type='submission' AND t.subject_id=$1 AND t.review_type='existing_measure_overlap'
     ORDER BY t.created_at,t.id
  `,[publicId]);
  assert.equal(revised.rowCount,2);
  assert.equal(revised.rows.filter(r=>['open','assigned'].includes(r.status)).length,1);
  const secondTask = revised.rows.find(r=>['open','assigned'].includes(r.status));
  assert.notEqual(secondTask.signal_key,firstSignalKey);

  const revisedStatus = await client.query(`SELECT public.ideenwerk_get_private_status($1,$2) AS payload`,[publicId,tokenHash]);
  assert.equal(revisedStatus.rows[0].payload.existing_measure_review,null);

  // If evidence changes again while a review is still open, that task is
  // superseded and cannot be decided against stale evidence.
  await client.query(`
    UPDATE ideenwerk_existing_measure_checks
       SET matched_refs=matched_refs || '[{"dataset":"synthetic","id":"CHANGED"}]'::jsonb
     WHERE submission_id=$1
  `,[submissionId]);

  await expectFailure(decisionSql,[
    'DEC-C0FFEE0000000034-STALE',secondTask.id,operatorId,'resolve_existing_measure_overlap','BASELINE_OVERLAP_CONFIRMED',
    'Diese Entscheidung darf wegen geänderter Referenzgrundlage nicht mehr auf den alten Prüfstand angewendet werden.'
  ],'EXISTING_MEASURE_REVIEW_STALE_SIGNAL');

  const superseded = await client.query(`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE status='cancelled')::int AS cancelled,
           count(*) FILTER (WHERE status IN ('open','assigned'))::int AS active
      FROM review_tasks
     WHERE subject_type='submission' AND subject_id=$1 AND review_type='existing_measure_overlap'
  `,[publicId]);
  assert.equal(superseded.rows[0].total,3);
  assert.equal(superseded.rows[0].cancelled,1);
  assert.equal(superseded.rows[0].active,1);

  const supersededAudit = await client.query(`
    SELECT count(*)::int AS n FROM audit_events
     WHERE subject_type='submission' AND subject_id=$1
       AND event_type='existing_measure_review_superseded'
       AND reason_code='EXISTING_MEASURE_SIGNAL_CHANGED'
  `,[publicId]);
  assert.equal(supersededAudit.rows[0].n,1);

  await client.query('ROLLBACK');
  console.log('existing measure review resolution smoke: PASS');
} catch (error) {
  await client.query('ROLLBACK').catch(()=>{});
  throw error;
} finally {
  await client.end();
}
