import crypto from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const assert = (condition,message) => { if (!condition) throw new Error(message); };
const hex = bytes => crypto.randomBytes(bytes).toString('hex').toUpperCase();

const publicId = `IDEA-${hex(8)}`;
const taskId = `TASK-${hex(8)}`;
const decisionId = `DEC-${hex(8)}`;
const operatorHash = crypto.randomBytes(32).toString('hex');
const tokenHash = hash(`prompt-ci-${hex(8)}`);
const question = 'Welche konkrete Verfahrensstufe des digitalen Antrags soll vereinfacht werden?';
const answer = 'Gemeint ist die Eingangsprüfung unmittelbar nach dem Absenden des digitalen Antrags.';
let submissionId = null;
let operatorId = null;

try {
  const submission = await pool.query(
    `INSERT INTO submissions(public_id,original_text,region,topic,current_status)
     VALUES($1,'Digitale Anträge sollen einfacher nachvollziehbar sein.','Österreich','Verwaltung','structured')
     RETURNING id`,[publicId]
  );
  submissionId = submission.rows[0].id;
  await pool.query(`INSERT INTO status_access(submission_id,token_hash) VALUES($1,$2)`,[submissionId,tokenHash]);

  const operator = await pool.query(
    `INSERT INTO operators(external_subject_hash,display_name) VALUES($1,'synthetic prompt reviewer') RETURNING id`,
    [operatorHash]
  );
  operatorId = operator.rows[0].id;
  await pool.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'moderator')`,[operatorId]);
  const task = await pool.query(
    `INSERT INTO review_tasks(task_id,subject_type,subject_id,review_type,required_role,status,assigned_operator_id,assigned_at)
     VALUES($1,'submission',$2,'clarification','moderator','assigned',$3,now()) RETURNING id`,
    [taskId,publicId,operatorId]
  );

  await pool.query(
    `INSERT INTO review_decisions(decision_id,task_id,operator_id,action,reason_code,payload)
     VALUES($1,$2,$3,'request_clarification','NEEDS_CLARIFICATION',jsonb_build_object('question',$4))`,
    [decisionId,task.rows[0].id,operatorId,question]
  );

  const state = await pool.query(
    `SELECT s.current_status,p.prompt_id,p.question,p.reason_code,p.status,t.status AS task_status,
            (SELECT count(*)::int FROM audit_events a WHERE a.subject_id=s.public_id AND a.event_type='clarification_requested') AS request_events
       FROM submissions s
       JOIN citizen_clarification_prompts p ON p.submission_id=s.id
       JOIN review_decisions d ON d.id=p.source_decision_id
       JOIN review_tasks t ON t.id=d.task_id
      WHERE s.id=$1`,[submissionId]
  );
  const row = state.rows[0];
  assert(row.current_status === 'clarification','review decision did not open clarification state');
  assert(row.question === question && row.reason_code === 'NEEDS_CLARIFICATION','stored prompt mismatch');
  assert(row.status === 'open','new prompt is not open');
  assert(row.task_status === 'decided','source review task was not closed');
  assert(row.request_events === 1,'clarification request audit event missing');

  const privateStatus = await pool.query(`SELECT ideenwerk_get_private_status($1,$2) AS result`,[publicId,tokenHash]);
  const visible = privateStatus.rows[0].result;
  assert(visible?.clarification_prompt?.question === question,'protected status does not expose current prompt');
  assert(visible?.clarification_prompt?.reason_code === 'NEEDS_CLARIFICATION','protected status lost prompt reason code');
  assert(JSON.stringify(visible).includes('synthetic prompt reviewer') === false,'protected status exposed operator identity');

  const denied = await pool.query(`SELECT ideenwerk_get_private_status($1,$2) AS result`,[publicId,hash('wrong-token')]);
  assert(denied.rows[0].result === null,'wrong token can read clarification prompt');

  const exported = await pool.query(`SELECT ideenwerk_get_privacy_export($1,$2) AS result`,[publicId,tokenHash]);
  assert(exported.rows[0].result?.clarification_prompts?.[0]?.question === question,'privacy export omitted clarification prompt');

  const response = await pool.query(
    `SELECT ideenwerk_submit_clarification($1,$2,$3,$4) AS result`,
    [publicId,tokenHash,answer,'prompt-ci-answer']
  );
  assert(response.rows[0].result?.accepted === true,'prompt response was not accepted');

  const linked = await pool.query(
    `SELECT p.prompt_id,p.status,p.answered_at,c.clarification_id,c.response_text
       FROM citizen_clarification_prompts p
       JOIN citizen_clarifications c ON c.clarification_prompt_id=p.id
      WHERE p.submission_id=$1`,[submissionId]
  );
  assert(linked.rows[0]?.status === 'answered' && linked.rows[0]?.answered_at,'answer did not close prompt');
  assert(linked.rows[0]?.response_text === answer,'clarification was not linked to its prompt');

  console.log('clarification prompt contract OK: human review source, private prompt visibility, token boundary, privacy export and answer linkage verified');
} finally {
  await pool.query(`DELETE FROM processing_jobs WHERE subject_type='submission' AND subject_id=$1`,[publicId]).catch(()=>{});
  await pool.query(`DELETE FROM audit_events WHERE subject_type='submission' AND subject_id=$1`,[publicId]).catch(()=>{});
  if (submissionId) await pool.query(`DELETE FROM submissions WHERE id=$1`,[submissionId]).catch(()=>{});
  await pool.query(`DELETE FROM review_tasks WHERE task_id=$1`,[taskId]).catch(()=>{});
  if (operatorId) await pool.query(`DELETE FROM operators WHERE id=$1`,[operatorId]).catch(()=>{});
  await pool.end();
}
