import pg from 'pg';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const client = new Client({ connectionString });
await client.connect();

const publicId = 'IDEA-C0FFEE0000000035';
const originalText = 'Mehr öffentliche Trinkbrunnen sollen an stark frequentierten Orten im Sommer verfügbar sein.';
const tokenHash = crypto.createHash('sha256').update('ci-competence-review-token').digest('hex');
const legalOperatorHash = crypto.createHash('sha256').update('ci-competence-review-legal').digest('hex');
const wrongOperatorHash = crypto.createHash('sha256').update('ci-competence-review-impact').digest('hex');

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
    VALUES($1,$2,$3,'Österreich','Lebensqualität','cluster_review')
    RETURNING id
  `,[publicId,'ci-competence-review',originalText]);
  const submissionId = submission.rows[0].id;

  await client.query(`INSERT INTO status_access(submission_id,token_hash) VALUES($1,$2)`,[submissionId,tokenHash]);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Sommerhitze im öffentlichen Raum','Mehr öffentliche Trinkbrunnen','Lebensqualität','Österreich','[]'::jsonb,false)
  `,[submissionId]);
  await client.query(`UPDATE submissions SET current_status='precheck',updated_at=now() WHERE id=$1`,[submissionId]);

  const precheck = await client.query(`
    SELECT result_code,legal_change_required,signal_key FROM ideenwerk_competence_prechecks WHERE submission_id=$1
  `,[submissionId]);
  assert.equal(precheck.rows[0].result_code,'unclassified');
  assert.equal(precheck.rows[0].legal_change_required,false);
  assert.match(precheck.rows[0].signal_key,/^[a-f0-9]{32}$/);
  const firstSignalKey = precheck.rows[0].signal_key;

  const task = await client.query(`
    SELECT t.id,t.task_id,t.status,t.required_role,b.signal_key
      FROM review_tasks t
      JOIN ideenwerk_competence_review_bindings b ON b.task_id=t.id
     WHERE t.subject_type='submission' AND t.subject_id=$1 AND t.review_type='competence_precheck'
  `,[publicId]);
  assert.equal(task.rowCount,1);
  assert.equal(task.rows[0].status,'open');
  assert.equal(task.rows[0].required_role,'legal_reviewer');
  assert.equal(task.rows[0].signal_key,firstSignalKey);

  const legalOperator = await client.query(`
    INSERT INTO operators(external_subject_hash,display_name,active)
    VALUES($1,'CI Legal Reviewer',true) RETURNING id
  `,[legalOperatorHash]);
  const legalOperatorId = legalOperator.rows[0].id;
  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'legal_reviewer')`,[legalOperatorId]);

  const wrongOperator = await client.query(`
    INSERT INTO operators(external_subject_hash,display_name,active)
    VALUES($1,'CI Impact Reviewer',true) RETURNING id
  `,[wrongOperatorHash]);
  const wrongOperatorId = wrongOperator.rows[0].id;
  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'impact_reviewer')`,[wrongOperatorId]);

  const decisionSql = `
    INSERT INTO review_decisions(decision_id,task_id,operator_id,action,reason_code,rationale,payload)
    VALUES($1,$2,$3,$4,$5,$6,$7::jsonb)
  `;
  const classifiedPayload = JSON.stringify({
    resolved_level:'gemeinde',
    resolved_class:'gemeinde',
    source_ids:['BVG-118'],
    legal_change_required:false
  });

  await expectFailure(decisionSql,[
    'DEC-C0FFEE0000000035-WRONGROLE',task.rows[0].id,wrongOperatorId,
    'resolve_competence_precheck','COMPETENCE_CLASSIFIED',
    'Die Zuständigkeit wurde anhand der angegebenen Rechtsquelle fachlich geprüft.',classifiedPayload
  ],'lacks required role');

  await expectFailure(decisionSql,[
    'DEC-C0FFEE0000000035-A',task.rows[0].id,legalOperatorId,
    'accept','COMPETENCE_CLASSIFIED',
    'Die Zuständigkeit wurde anhand der angegebenen Rechtsquelle fachlich geprüft.',classifiedPayload
  ],'COMPETENCE_REVIEW_ACTION_REQUIRED');

  await expectFailure(decisionSql,[
    'DEC-C0FFEE0000000035-B',task.rows[0].id,legalOperatorId,
    'resolve_competence_precheck','ACCEPT_IDEA',
    'Die Zuständigkeit wurde anhand der angegebenen Rechtsquelle fachlich geprüft.',classifiedPayload
  ],'COMPETENCE_REVIEW_REASON_INVALID');

  await expectFailure(decisionSql,[
    'DEC-C0FFEE0000000035-C',task.rows[0].id,legalOperatorId,
    'resolve_competence_precheck','COMPETENCE_CLASSIFIED','zu kurz',classifiedPayload
  ],'COMPETENCE_REVIEW_RATIONALE_REQUIRED');

  await expectFailure(decisionSql,[
    'DEC-C0FFEE0000000035-D',task.rows[0].id,legalOperatorId,
    'resolve_competence_precheck','COMPETENCE_CLASSIFIED',
    'Die Zuständigkeit wurde geprüft, aber ohne belastbare Quellenangabe darf sie nicht abgeschlossen werden.',
    JSON.stringify({resolved_level:'gemeinde',resolved_class:'gemeinde',source_ids:[],legal_change_required:false})
  ],'COMPETENCE_REVIEW_SOURCES_REQUIRED');

  await client.query(decisionSql,[
    'DEC-C0FFEE0000000035',task.rows[0].id,legalOperatorId,
    'resolve_competence_precheck','COMPETENCE_CLASSIFIED',
    'Die Zuständigkeit wurde anhand der kommunalen Aufgabenordnung und der angeführten Rechtsquelle geprüft.',
    classifiedPayload
  ]);

  const decided = await client.query(`SELECT status FROM review_tasks WHERE id=$1`,[task.rows[0].id]);
  assert.equal(decided.rows[0].status,'decided');

  const immutable = await client.query(`
    SELECT s.current_status,s.original_text,cp.result_code,cp.signal_key
      FROM submissions s JOIN ideenwerk_competence_prechecks cp ON cp.submission_id=s.id
     WHERE s.id=$1
  `,[submissionId]);
  assert.equal(immutable.rows[0].current_status,'precheck');
  assert.equal(immutable.rows[0].original_text,originalText);
  assert.equal(immutable.rows[0].result_code,'unclassified');
  assert.equal(immutable.rows[0].signal_key,firstSignalKey);

  const decisionPayload = await client.query(`SELECT payload FROM review_decisions WHERE decision_id='DEC-C0FFEE0000000035'`);
  assert.equal(decisionPayload.rows[0].payload.competence_signal_key,firstSignalKey);
  assert.equal(decisionPayload.rows[0].payload.resolved_level,'gemeinde');
  assert.equal(decisionPayload.rows[0].payload.resolved_class,'gemeinde');
  assert.deepEqual(decisionPayload.rows[0].payload.source_ids,['BVG-118']);
  assert.equal(decisionPayload.rows[0].payload.legal_change_required,false);

  const status = await client.query(`SELECT public.ideenwerk_get_private_status($1,$2) AS payload`,[publicId,tokenHash]);
  const resolution = status.rows[0].payload.competence_review;
  assert.equal(resolution.resolution_code,'COMPETENCE_CLASSIFIED');
  assert.equal(resolution.resolved_level,'gemeinde');
  assert.equal(resolution.resolved_class,'gemeinde');
  assert.deepEqual(resolution.source_ids,['BVG-118']);
  assert.equal(resolution.legal_change_required,false);
  assert.ok(resolution.resolved_at);
  assert.ok(resolution.boundary.includes('keine Annahme oder Ablehnung'));
  assert.deepEqual(Object.keys(resolution).sort(),[
    'boundary','legal_change_required','resolution_code','resolved_at','resolved_class','resolved_level','source_ids'
  ]);
  assert.equal(status.rows[0].payload.original_text,originalText);

  const exported = await client.query(`SELECT public.ideenwerk_get_privacy_export($1,$2) AS payload`,[publicId,tokenHash]);
  assert.equal(exported.rows[0].payload.competence_review.resolution_code,'COMPETENCE_CLASSIFIED');
  assert.equal(exported.rows[0].payload.competence_review.resolved_level,'gemeinde');

  const audit = await client.query(`
    SELECT reason_code,payload FROM audit_events
     WHERE subject_type='submission' AND subject_id=$1 AND event_type='competence_review_resolved'
  `,[publicId]);
  assert.equal(audit.rowCount,1);
  assert.equal(audit.rows[0].reason_code,'COMPETENCE_CLASSIFIED');
  assert.equal(audit.rows[0].payload.signal_key,firstSignalKey);
  assert.equal(audit.rows[0].payload.boundary,'competence_resolution_only_no_automatic_accept_or_reject');
  assert.ok(!Object.hasOwn(audit.rows[0].payload,'operator_id'));
  assert.ok(!Object.hasOwn(audit.rows[0].payload,'rationale'));

  // Identical classifier reruns keep the completed human resolution valid and do
  // not reopen a duplicate task.
  await client.query(`SELECT public.ideenwerk_run_competence_precheck($1)`,[publicId]);
  const unchanged = await client.query(`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE status IN ('open','assigned'))::int AS active,
           count(*) FILTER (WHERE status='decided')::int AS decided
      FROM review_tasks
     WHERE subject_type='submission' AND subject_id=$1 AND review_type='competence_precheck'
  `,[publicId]);
  assert.equal(unchanged.rows[0].total,1);
  assert.equal(unchanged.rows[0].active,0);
  assert.equal(unchanged.rows[0].decided,1);

  // A material inventory revision produces a fresh signal and hides the old
  // resolution from the current citizen view.
  await client.query(`
    UPDATE ideenwerk_competence_prechecks
       SET inventory_version='2026-09-20-ci-v2'
     WHERE submission_id=$1
  `,[submissionId]);
  const revised = await client.query(`
    SELECT t.id,t.status,b.signal_key
      FROM review_tasks t
      JOIN ideenwerk_competence_review_bindings b ON b.task_id=t.id
     WHERE t.subject_type='submission' AND t.subject_id=$1 AND t.review_type='competence_precheck'
     ORDER BY t.created_at,t.id
  `,[publicId]);
  assert.equal(revised.rowCount,2);
  assert.equal(revised.rows.filter(r=>['open','assigned'].includes(r.status)).length,1);
  const secondTask = revised.rows.find(r=>['open','assigned'].includes(r.status));
  assert.notEqual(secondTask.signal_key,firstSignalKey);

  const revisedStatus = await client.query(`SELECT public.ideenwerk_get_private_status($1,$2) AS payload`,[publicId,tokenHash]);
  assert.equal(revisedStatus.rows[0].payload.competence_review,null);

  // Evidence changing again while review is open supersedes the stale task.
  await client.query(`
    UPDATE ideenwerk_competence_prechecks
       SET source_ids='["BVG-118","CI-REVISION"]'::jsonb
     WHERE submission_id=$1
  `,[submissionId]);

  await expectFailure(decisionSql,[
    'DEC-C0FFEE0000000035-STALE',secondTask.id,legalOperatorId,
    'resolve_competence_precheck','COMPETENCE_CLASSIFIED',
    'Diese Entscheidung darf nach geänderter Kompetenzgrundlage nicht mehr auf den alten Prüfstand angewendet werden.',
    classifiedPayload
  ],'COMPETENCE_REVIEW_STALE_SIGNAL');

  const superseded = await client.query(`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE status='cancelled')::int AS cancelled,
           count(*) FILTER (WHERE status IN ('open','assigned'))::int AS active
      FROM review_tasks
     WHERE subject_type='submission' AND subject_id=$1 AND review_type='competence_precheck'
  `,[publicId]);
  assert.equal(superseded.rows[0].total,3);
  assert.equal(superseded.rows[0].cancelled,1);
  assert.equal(superseded.rows[0].active,1);

  const supersededAudit = await client.query(`
    SELECT count(*)::int AS n FROM audit_events
     WHERE subject_type='submission' AND subject_id=$1
       AND event_type='competence_review_superseded'
       AND reason_code='COMPETENCE_SIGNAL_CHANGED'
  `,[publicId]);
  assert.equal(supersededAudit.rows[0].n,1);

  // A confident ordinary match does not create a legal-review task.
  const matched = await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES('IDEA-C0FFEE0000003536','ci-competence-no-review','Asylverfahren sollen digital besser nachvollziehbar sein.','Österreich','Migration','precheck')
    RETURNING id
  `);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Nachvollziehbarkeit','Asylverfahren digital nachvollziehbar machen','Migration','Österreich','[]'::jsonb,false)
  `,[matched.rows[0].id]);
  await client.query(`SELECT public.ideenwerk_run_competence_precheck('IDEA-C0FFEE0000003536')`);
  const noReview = await client.query(`
    SELECT count(*)::int AS n FROM review_tasks
     WHERE subject_type='submission' AND subject_id='IDEA-C0FFEE0000003536' AND review_type='competence_precheck'
  `);
  assert.equal(noReview.rows[0].n,0);

  // A high-confidence match that explicitly requires a legal opening does create
  // the same bounded legal-review task.
  const legalChange = await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES('IDEA-C0FFEE0000003537','ci-competence-legal-change','Rauchen in Gastronomielokalen soll rechtlich neu geregelt werden.','Österreich','Gesundheit','precheck')
    RETURNING id
  `);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Regelungsfrage','Rauchen in Gastronomielokalen neu regeln','Gesundheit','Österreich','[]'::jsonb,false)
  `,[legalChange.rows[0].id]);
  await client.query(`SELECT public.ideenwerk_run_competence_precheck('IDEA-C0FFEE0000003537')`);
  const legalChangeReview = await client.query(`
    SELECT t.required_role,cp.result_code,cp.legal_change_required
      FROM review_tasks t
      JOIN submissions s ON s.public_id=t.subject_id
      JOIN ideenwerk_competence_prechecks cp ON cp.submission_id=s.id
     WHERE t.subject_id='IDEA-C0FFEE0000003537' AND t.review_type='competence_precheck'
  `);
  assert.equal(legalChangeReview.rowCount,1);
  assert.equal(legalChangeReview.rows[0].required_role,'legal_reviewer');
  assert.equal(legalChangeReview.rows[0].result_code,'matched');
  assert.equal(legalChangeReview.rows[0].legal_change_required,true);

  const access = await client.query(`
    SELECT c.relrowsecurity,
           has_table_privilege('anon','public.ideenwerk_competence_review_bindings','SELECT') AS anon_select,
           has_table_privilege('authenticated','public.ideenwerk_competence_review_bindings','SELECT') AS auth_select
      FROM pg_class c
     WHERE c.oid='public.ideenwerk_competence_review_bindings'::regclass
  `);
  assert.equal(access.rows[0].relrowsecurity,true);
  assert.equal(access.rows[0].anon_select,false);
  assert.equal(access.rows[0].auth_select,false);

  await client.query('ROLLBACK');
  console.log('competence review resolution smoke: PASS');
} catch (error) {
  await client.query('ROLLBACK').catch(()=>{});
  throw error;
} finally {
  await client.end();
}
