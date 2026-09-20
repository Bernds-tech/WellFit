import pg from 'pg';
import assert from 'node:assert/strict';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const client = new Client({ connectionString });
await client.connect();

const ids = ['IDEA-C0FFEE0000000030','IDEA-C0FFEE0000000031'];

try {
  await client.query('BEGIN');

  const access = await client.query(`
    SELECT
      has_table_privilege('anon','public.ideenwerk_existing_measure_checks','SELECT') AS anon_select,
      has_table_privilege('authenticated','public.ideenwerk_existing_measure_checks','SELECT') AS auth_select,
      has_function_privilege('anon','public.ideenwerk_run_existing_measure_check(text)','EXECUTE') AS anon_exec,
      has_function_privilege('authenticated','public.ideenwerk_run_existing_measure_check(text)','EXECUTE') AS auth_exec
  `);
  assert.equal(access.rows[0].anon_select,false);
  assert.equal(access.rows[0].auth_select,false);
  assert.equal(access.rows[0].anon_exec,false);
  assert.equal(access.rows[0].auth_exec,false);

  const overlap = await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES($1,$2,$3,'Österreich','Verwaltung & Digitalisierung','cluster_review')
    RETURNING id
  `,[ids[0],'ci-existing-measure-overlap','Behörden sollen Daten über Once-Only und digitale Verwaltungsportale nur einmal erfassen.']);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Mehrfache Datenerfassung','Once-Only in der Verwaltung ausbauen','Verwaltung & Digitalisierung','Österreich','[]'::jsonb,false)
  `,[overlap.rows[0].id]);
  await client.query(`UPDATE submissions SET current_status='precheck',updated_at=now() WHERE id=$1`,[overlap.rows[0].id]);

  const overlapResult = await client.query(`
    SELECT result_code,matched_refs,reference_versions,confidence,requires_human_review,classifier_version,match_rule
      FROM ideenwerk_existing_measure_checks WHERE submission_id=$1
  `,[overlap.rows[0].id]);
  assert.equal(overlapResult.rowCount,1);
  assert.equal(overlapResult.rows[0].result_code,'possible_overlap');
  assert.equal(overlapResult.rows[0].requires_human_review,true);
  assert.equal(overlapResult.rows[0].classifier_version,'existing-measure-check-v1');
  assert.equal(overlapResult.rows[0].match_rule,'digital_administration_baseline');
  assert.ok(Number(overlapResult.rows[0].confidence) >= 0.95);
  assert.ok(overlapResult.rows[0].matched_refs.some((ref)=>ref.id==='GOV-DADEX'));
  assert.ok(overlapResult.rows[0].matched_refs.some((ref)=>ref.id==='GOV-REFORMPARTNERSHIP-ADMIN'));
  assert.equal(overlapResult.rows[0].reference_versions.current_government_measures_register,'2026-09-03-v2');

  const status = await client.query(`SELECT current_status,original_text FROM submissions WHERE id=$1`,[overlap.rows[0].id]);
  assert.equal(status.rows[0].current_status,'precheck');
  assert.equal(status.rows[0].original_text,'Behörden sollen Daten über Once-Only und digitale Verwaltungsportale nur einmal erfassen.');

  const audit = await client.query(`
    SELECT reason_code,payload FROM audit_events
     WHERE subject_type='submission' AND subject_id=$1 AND event_type='existing_measure_check_completed'
     ORDER BY created_at DESC LIMIT 1
  `,[ids[0]]);
  assert.equal(audit.rowCount,1);
  assert.equal(audit.rows[0].reason_code,'EXISTING_MEASURE_CHECK');
  assert.equal(audit.rows[0].payload.result_code,'possible_overlap');
  assert.equal(audit.rows[0].payload.boundary,'review_hint_only_no_automatic_decision');
  assert.ok(!Object.hasOwn(audit.rows[0].payload,'original_text'));

  const unknown = await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES($1,$2,$3,'Österreich','Sonstiges','cluster_review')
    RETURNING id
  `,[ids[1],'ci-existing-measure-none','Österreich soll an öffentlichen Plätzen mehr Trinkbrunnen aufstellen.']);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Trinkwasser unterwegs','Mehr Trinkbrunnen','Sonstiges','Österreich','[]'::jsonb,false)
  `,[unknown.rows[0].id]);
  await client.query(`UPDATE submissions SET current_status='precheck',updated_at=now() WHERE id=$1`,[unknown.rows[0].id]);

  const unknownResult = await client.query(`
    SELECT result_code,matched_refs,confidence,requires_human_review,match_rule
      FROM ideenwerk_existing_measure_checks WHERE submission_id=$1
  `,[unknown.rows[0].id]);
  assert.equal(unknownResult.rowCount,1);
  assert.equal(unknownResult.rows[0].result_code,'no_known_overlap');
  assert.deepEqual(unknownResult.rows[0].matched_refs,[]);
  assert.equal(Number(unknownResult.rows[0].confidence),0);
  assert.equal(unknownResult.rows[0].requires_human_review,false);
  assert.equal(unknownResult.rows[0].match_rule,'no_high_specificity_match');

  await client.query('ROLLBACK');
  console.log('existing measure check smoke: PASS');
} catch (error) {
  await client.query('ROLLBACK').catch(()=>{});
  throw error;
} finally {
  await client.end();
}
