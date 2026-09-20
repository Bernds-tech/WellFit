import pg from 'pg';
import { randomBytes } from 'node:crypto';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
const suffix = randomBytes(5).toString('hex').toUpperCase();
const privacyRequestId = `PRIV-${randomBytes(8).toString('hex').toUpperCase()}`;
const pubA = `IDEA-GUARD-A-${suffix}`;
const pubB = `IDEA-GUARD-B-${suffix}`;

function fail(message) {
  throw new Error(`[operator-guardrails] ${message}`);
}

async function expectFailure(name, fn) {
  await client.query(`SAVEPOINT ${name}`);
  let failed = false;
  try {
    await fn();
  } catch (e) {
    failed = true;
    console.log(`[operator-guardrails] expected failure ${name}:`, e.message);
    await client.query(`ROLLBACK TO SAVEPOINT ${name}`);
  }
  await client.query(`RELEASE SAVEPOINT ${name}`);
  if (!failed) fail(`${name} unexpectedly succeeded`);
}

await client.connect();
try {
  await client.query('BEGIN');

  const a = await client.query(
    `INSERT INTO submissions(public_id,original_text,current_status,region,topic)
     VALUES($1,'Testidee A','cluster_review','Wien','Verwaltung') RETURNING id`, [pubA]
  );
  const b = await client.query(
    `INSERT INTO submissions(public_id,original_text,current_status,region,topic)
     VALUES($1,'Testidee B','cluster_review','Wien','Verwaltung') RETURNING id`, [pubB]
  );

  const cc = await client.query(
    `INSERT INTO cluster_candidates(
       submission_id,candidate_submission_id,relation,problem_similarity,solution_similarity,assignment_action,method,rationale
     ) VALUES($1,$2,'same_problem_same_solution',0.98,0.96,'human_cluster_review','guardrail_smoke','test')
     RETURNING id`, [a.rows[0].id,b.rows[0].id]
  );
  const candidateId = cc.rows[0].id;

  const task = await client.query(
    `SELECT id,task_id,required_role,status FROM review_tasks
      WHERE subject_type='cluster_candidate' AND subject_id=$1 AND review_type='cluster_assignment'`,
    [candidateId]
  );
  if (task.rowCount !== 1) fail('cluster candidate did not create exactly one review task');
  if (task.rows[0].required_role !== 'cluster_reviewer') fail('unexpected required role');

  await expectFailure('cluster_accept_without_decision', async () => {
    await client.query(`UPDATE cluster_candidates SET review_status='accepted' WHERE id=$1`, [candidateId]);
  });

  const op1 = await client.query(
    `INSERT INTO operators(external_subject_hash,display_name)
     VALUES($1,'Guardrail Operator 1') RETURNING id`, ['a'.repeat(64)]
  );

  await expectFailure('decision_without_role', async () => {
    await client.query(
      `INSERT INTO review_decisions(decision_id,task_id,operator_id,action,reason_code,rationale)
       VALUES($1,$2,$3,'accept','TEST_ACCEPT','should fail')`,
      [`DEC-${suffix}-BAD`,task.rows[0].id,op1.rows[0].id]
    );
  });

  await client.query(
    `INSERT INTO operator_roles(operator_id,role) VALUES($1,'cluster_reviewer')`, [op1.rows[0].id]
  );
  const decision = await client.query(
    `INSERT INTO review_decisions(decision_id,task_id,operator_id,action,reason_code,rationale)
     VALUES($1,$2,$3,'accept','TEST_ACCEPT','authorized review') RETURNING id`,
    [`DEC-${suffix}-OK`,task.rows[0].id,op1.rows[0].id]
  );

  const closedTask = await client.query(`SELECT status FROM review_tasks WHERE id=$1`, [task.rows[0].id]);
  if (closedTask.rows[0].status !== 'decided') fail('review task was not closed after decision');

  await client.query(`UPDATE cluster_candidates SET review_status='accepted' WHERE id=$1`, [candidateId]);

  const appeal = await client.query(
    `INSERT INTO appeals(appeal_id,original_decision_id,subject_type,subject_id,reason,details)
     VALUES($1,$2,'cluster_candidate',$3,'TEST_APPEAL','guardrail smoke') RETURNING id`,
    [`APP-${suffix}`,decision.rows[0].id,String(candidateId)]
  );

  await client.query(
    `INSERT INTO operator_roles(operator_id,role) VALUES($1,'appeal_reviewer') ON CONFLICT DO NOTHING`, [op1.rows[0].id]
  );
  await expectFailure('self_appeal_review', async () => {
    await client.query(`UPDATE appeals SET reviewer_operator_id=$2,status='reviewing' WHERE id=$1`, [appeal.rows[0].id,op1.rows[0].id]);
  });

  const op2 = await client.query(
    `INSERT INTO operators(external_subject_hash,display_name)
     VALUES($1,'Guardrail Operator 2') RETURNING id`, ['b'.repeat(64)]
  );
  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'appeal_reviewer')`, [op2.rows[0].id]);
  await client.query(`UPDATE appeals SET reviewer_operator_id=$2,status='reviewing' WHERE id=$1`, [appeal.rows[0].id,op2.rows[0].id]);

  // Privacy resolution is deliberately a state/audit workflow only. The migration
  // must not mutate or erase the underlying citizen submission.
  await client.query(
    `INSERT INTO privacy_requests(request_id,submission_id,request_type,details)
     VALUES($1,$2,'correction','Guardrail correction request')`,
    [privacyRequestId,a.rows[0].id]
  );
  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'legal_reviewer')`, [op2.rows[0].id]);

  await expectFailure('privacy_direct_resolve', async () => {
    await client.query(
      `SELECT ideenwerk_operator_transition_privacy_request($1,$2,'resolved','TEST_DIRECT_RESOLVE')`,
      [privacyRequestId,'b'.repeat(64)]
    );
  });

  const started = await client.query(
    `SELECT ideenwerk_operator_transition_privacy_request($1,$2,'reviewing','TEST_REVIEW_START') AS result`,
    [privacyRequestId,'b'.repeat(64)]
  );
  if (started.rows[0].result?.status !== 'reviewing') fail('privacy request did not enter reviewing');
  if (started.rows[0].result?.destructive_execution !== false) fail('privacy transition did not declare non-destructive execution');

  const replayStart = await client.query(
    `SELECT ideenwerk_operator_transition_privacy_request($1,$2,'reviewing','TEST_REVIEW_START') AS result`,
    [privacyRequestId,'b'.repeat(64)]
  );
  if (replayStart.rows[0].result?.replayed !== true) fail('privacy review-start retry was not idempotent');

  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'legal_reviewer')`, [op1.rows[0].id]);
  await expectFailure('privacy_wrong_operator', async () => {
    await client.query(
      `SELECT ideenwerk_operator_transition_privacy_request($1,$2,'resolved','TEST_RESOLVED')`,
      [privacyRequestId,'a'.repeat(64)]
    );
  });

  const resolved = await client.query(
    `SELECT ideenwerk_operator_transition_privacy_request($1,$2,'resolved','TEST_RESOLVED') AS result`,
    [privacyRequestId,'b'.repeat(64)]
  );
  if (resolved.rows[0].result?.status !== 'resolved') fail('privacy request did not resolve');
  if (resolved.rows[0].result?.decision_reason_code !== 'TEST_RESOLVED') fail('privacy decision reason was not persisted');

  const replayResolved = await client.query(
    `SELECT ideenwerk_operator_transition_privacy_request($1,$2,'resolved','TEST_RESOLVED') AS result`,
    [privacyRequestId,'b'.repeat(64)]
  );
  if (replayResolved.rows[0].result?.replayed !== true) fail('privacy resolution retry was not idempotent');

  await expectFailure('privacy_conflicting_replay', async () => {
    await client.query(
      `SELECT ideenwerk_operator_transition_privacy_request($1,$2,'resolved','DIFFERENT_REASON')`,
      [privacyRequestId,'b'.repeat(64)]
    );
  });

  const privacyRow = await client.query(
    `SELECT status,decision_reason_code,assigned_operator_id,review_started_at,resolved_at
       FROM privacy_requests WHERE request_id=$1`, [privacyRequestId]
  );
  if (privacyRow.rows[0].status !== 'resolved' || !privacyRow.rows[0].review_started_at || !privacyRow.rows[0].resolved_at) {
    fail('privacy request timestamps/state incomplete');
  }
  if (privacyRow.rows[0].assigned_operator_id !== op2.rows[0].id) fail('privacy request assignment changed unexpectedly');

  const privacyAudit = await client.query(
    `SELECT event_type,reason_code,payload
       FROM audit_events
      WHERE subject_type='submission' AND subject_id=$1
        AND event_type IN ('privacy_request_review_started','privacy_request_resolved','privacy_request_rejected')
      ORDER BY created_at`, [pubA]
  );
  if (privacyAudit.rowCount !== 2) fail(`expected 2 privacy audit events, found ${privacyAudit.rowCount}`);
  if (privacyAudit.rows.some(row => row.payload?.destructive_execution !== false)) fail('privacy audit did not retain non-destructive marker');

  const sourceStillPresent = await client.query(`SELECT original_text,current_status FROM submissions WHERE id=$1`, [a.rows[0].id]);
  if (sourceStillPresent.rows[0].original_text !== 'Testidee A' || sourceStillPresent.rows[0].current_status !== 'cluster_review') {
    fail('privacy resolution mutated citizen submission data');
  }

  console.log('[operator-guardrails] PASS');
  await client.query('ROLLBACK');
} catch (e) {
  try { await client.query('ROLLBACK'); } catch {}
  console.error(e);
  process.exitCode = 1;
} finally {
  await client.end();
}
