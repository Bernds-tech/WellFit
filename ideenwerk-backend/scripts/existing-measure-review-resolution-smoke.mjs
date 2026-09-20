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
    SELECT id,task_id,status,required_role
      FROM review_tasks
     WHERE subject_type='submission' AND subject_id=$1 AND review_type='existing_measure_overlap'
  `,[publicId]);
  assert.equal(task.rowCount,1);
  assert.equal(task.rows[0].status,'open');
  assert.equal(task.rows[0].required_role,'impact_reviewer');

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

  const immutable = await client.query(`
    SELECT s.current_status,s.original_text,em.result_code,em.requires_human_review
      FROM submissions s JOIN ideenwerk_existing_measure_checks em ON em.submission_id=s.id
     WHERE s.id=$1
  `,[submissionId]);
  assert.equal(immutable.rows[0].current_status,'precheck');
  assert.equal(immutable.rows[0].original_text,originalText);
  assert.equal(immutable.rows[0].result_code,'possible_overlap');
  assert.equal(immutable.rows[0].requires_human_review,true);

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
  assert.equal(audit.rows[0].payload.boundary,'baseline_overlap_resolution_only_no_automatic_accept_or_reject');
  assert.ok(!Object.hasOwn(audit.rows[0].payload,'operator_id'));
  assert.ok(!Object.hasOwn(audit.rows[0].payload,'rationale'));

  await client.query('ROLLBACK');
  console.log('existing measure review resolution smoke: PASS');
} catch (error) {
  await client.query('ROLLBACK').catch(()=>{});
  throw error;
} finally {
  await client.end();
}
