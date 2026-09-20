import pg from 'pg';
import assert from 'node:assert/strict';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const client = new Client({ connectionString });
await client.connect();

const ids = ['IDEA-C0FFEE0000000001','IDEA-C0FFEE0000000002'];

try {
  await client.query('BEGIN');

  const matched = await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES($1,$2,$3,'Österreich','Migration & Integration','cluster_review')
    RETURNING id
  `,[ids[0],'ci-competence-matched','Das Asylverfahren soll nachvollziehbarer organisiert werden.']);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Asylverfahren','Verfahren klarer organisieren','Migration & Integration','Österreich','[]'::jsonb,false)
  `,[matched.rows[0].id]);
  await client.query(`UPDATE submissions SET current_status='precheck',updated_at=now() WHERE id=$1`,[matched.rows[0].id]);

  const matchedResult = await client.query(`
    SELECT result_code,inventory_item_id,current_class,suggested_level,source_ids,
           confidence,legal_change_required,classifier_version
      FROM ideenwerk_competence_prechecks WHERE submission_id=$1
  `,[matched.rows[0].id]);
  assert.equal(matchedResult.rowCount,1);
  assert.equal(matchedResult.rows[0].result_code,'matched');
  assert.equal(matchedResult.rows[0].inventory_item_id,'COMP-MIGRATION');
  assert.equal(matchedResult.rows[0].current_class,'bund');
  assert.equal(matchedResult.rows[0].suggested_level,'bund');
  assert.deepEqual(matchedResult.rows[0].source_ids,['BVG-10']);
  assert.equal(matchedResult.rows[0].legal_change_required,false);
  assert.equal(matchedResult.rows[0].classifier_version,'competence-precheck-v1');

  const structured = await client.query(`SELECT suggested_level FROM structured_proposals WHERE submission_id=$1`,[matched.rows[0].id]);
  assert.equal(structured.rows[0].suggested_level,'bund');

  const audit = await client.query(`
    SELECT payload FROM audit_events
     WHERE subject_type='submission' AND subject_id=$1 AND event_type='competence_precheck_completed'
     ORDER BY created_at DESC LIMIT 1
  `,[ids[0]]);
  assert.equal(audit.rowCount,1);
  assert.equal(audit.rows[0].payload.inventory_item_id,'COMP-MIGRATION');
  assert.equal(audit.rows[0].payload.suggested_level,'bund');
  assert.ok(!Object.hasOwn(audit.rows[0].payload,'original_text'));

  const unknown = await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES($1,$2,$3,'Österreich','Sonstiges','cluster_review')
    RETURNING id
  `,[ids[1],'ci-competence-unclassified','Österreich soll in diesem Bereich besser werden.']);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Allgemeines Anliegen','Besser organisieren','Sonstiges','Österreich','[]'::jsonb,false)
  `,[unknown.rows[0].id]);
  await client.query(`UPDATE submissions SET current_status='precheck',updated_at=now() WHERE id=$1`,[unknown.rows[0].id]);

  const unknownResult = await client.query(`
    SELECT result_code,inventory_item_id,current_class,suggested_level,source_ids,confidence
      FROM ideenwerk_competence_prechecks WHERE submission_id=$1
  `,[unknown.rows[0].id]);
  assert.equal(unknownResult.rowCount,1);
  assert.equal(unknownResult.rows[0].result_code,'unclassified');
  assert.equal(unknownResult.rows[0].inventory_item_id,null);
  assert.equal(unknownResult.rows[0].current_class,null);
  assert.equal(unknownResult.rows[0].suggested_level,null);
  assert.deepEqual(unknownResult.rows[0].source_ids,[]);
  assert.equal(Number(unknownResult.rows[0].confidence),0);

  const unknownStructured = await client.query(`SELECT suggested_level FROM structured_proposals WHERE submission_id=$1`,[unknown.rows[0].id]);
  assert.equal(unknownStructured.rows[0].suggested_level,null);

  await client.query('ROLLBACK');
  console.log('competence precheck smoke: PASS');
} catch (error) {
  await client.query('ROLLBACK').catch(()=>{});
  throw error;
} finally {
  await client.end();
}
