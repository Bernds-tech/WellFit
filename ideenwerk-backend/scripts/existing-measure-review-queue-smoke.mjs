import pg from 'pg';
import assert from 'node:assert/strict';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const client = new Client({ connectionString });
await client.connect();

const overlapId = 'IDEA-C0FFEE0000000032';
const noOverlapId = 'IDEA-C0FFEE0000000033';

try {
  await client.query('BEGIN');

  const overlap = await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES($1,$2,$3,'Österreich','Verwaltung & Digitalisierung','cluster_review')
    RETURNING id
  `,[overlapId,'ci-existing-measure-review-overlap','Digitale Verwaltungsportale sollen Once-Only konsequent nutzen.']);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Mehrfache Datenerfassung','Once-Only für Verwaltungsportale ausbauen','Verwaltung & Digitalisierung','Österreich','[]'::jsonb,false)
  `,[overlap.rows[0].id]);
  await client.query(`UPDATE submissions SET current_status='precheck',updated_at=now() WHERE id=$1`,[overlap.rows[0].id]);

  const task = await client.query(`
    SELECT task_id,subject_type,subject_id,review_type,required_role,status,priority,assigned_operator_id
      FROM review_tasks
     WHERE subject_type='submission' AND subject_id=$1 AND review_type='existing_measure_overlap'
  `,[overlapId]);
  assert.equal(task.rowCount,1);
  assert.equal(task.rows[0].subject_type,'submission');
  assert.equal(task.rows[0].subject_id,overlapId);
  assert.equal(task.rows[0].review_type,'existing_measure_overlap');
  assert.equal(task.rows[0].required_role,'impact_reviewer');
  assert.equal(task.rows[0].status,'open');
  assert.equal(task.rows[0].priority,75);
  assert.equal(task.rows[0].assigned_operator_id,null);

  const reviewAudit = await client.query(`
    SELECT reason_code,payload
      FROM audit_events
     WHERE subject_type='submission' AND subject_id=$1 AND event_type='existing_measure_review_enqueued'
  `,[overlapId]);
  assert.equal(reviewAudit.rowCount,1);
  assert.equal(reviewAudit.rows[0].reason_code,'EXISTING_MEASURE_REVIEW_REQUIRED');
  assert.equal(reviewAudit.rows[0].payload.boundary,'human_review_required_no_automatic_decision');
  assert.equal(reviewAudit.rows[0].payload.required_role,'impact_reviewer');
  assert.ok(!Object.hasOwn(reviewAudit.rows[0].payload,'operator_id'));
  assert.ok(!Object.hasOwn(reviewAudit.rows[0].payload,'original_text'));

  const state = await client.query(`
    SELECT current_status,original_text,
      (SELECT count(*)::int FROM review_decisions d JOIN review_tasks t ON t.id=d.task_id WHERE t.subject_type='submission' AND t.subject_id=$1) AS decisions
      FROM submissions WHERE id=$2
  `,[overlapId,overlap.rows[0].id]);
  assert.equal(state.rows[0].current_status,'precheck');
  assert.equal(state.rows[0].original_text,'Digitale Verwaltungsportale sollen Once-Only konsequent nutzen.');
  assert.equal(state.rows[0].decisions,0);

  await client.query(`SELECT public.ideenwerk_run_existing_measure_check($1)`,[overlapId]);
  const replay = await client.query(`
    SELECT count(*)::int AS active_tasks
      FROM review_tasks
     WHERE subject_type='submission' AND subject_id=$1 AND review_type='existing_measure_overlap'
       AND status IN ('open','assigned')
  `,[overlapId]);
  assert.equal(replay.rows[0].active_tasks,1);
  const enqueueAuditCount = await client.query(`
    SELECT count(*)::int AS count FROM audit_events
     WHERE subject_type='submission' AND subject_id=$1 AND event_type='existing_measure_review_enqueued'
  `,[overlapId]);
  assert.equal(enqueueAuditCount.rows[0].count,1);

  const noOverlap = await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES($1,$2,$3,'Österreich','Sonstiges','cluster_review')
    RETURNING id
  `,[noOverlapId,'ci-existing-measure-review-none','Österreich soll an öffentlichen Plätzen mehr Trinkbrunnen aufstellen.']);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Trinkwasser unterwegs','Mehr Trinkbrunnen','Sonstiges','Österreich','[]'::jsonb,false)
  `,[noOverlap.rows[0].id]);
  await client.query(`UPDATE submissions SET current_status='precheck',updated_at=now() WHERE id=$1`,[noOverlap.rows[0].id]);

  const absent = await client.query(`
    SELECT count(*)::int AS count FROM review_tasks
     WHERE subject_type='submission' AND subject_id=$1 AND review_type='existing_measure_overlap'
  `,[noOverlapId]);
  assert.equal(absent.rows[0].count,0);

  await client.query('ROLLBACK');
  console.log('existing measure review queue smoke: PASS');
} catch (error) {
  await client.query('ROLLBACK').catch(()=>{});
  throw error;
} finally {
  await client.end();
}
