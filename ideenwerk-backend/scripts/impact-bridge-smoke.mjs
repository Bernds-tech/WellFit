import pg from 'pg';
import assert from 'node:assert/strict';

const { Client }=pg;
const connectionString=process.env.DATABASE_URL;
if(!connectionString) throw new Error('DATABASE_URL is required');
const client=new Client({connectionString});
await client.connect();
const ids=['IDEA-C0FFEE0000000037','IDEA-C0FFEE0000000038'];

try{
  await client.query('BEGIN');
  const access=await client.query(`
    SELECT
      has_table_privilege('anon','public.ideenwerk_impact_bridge_checks','SELECT') AS anon_select,
      has_table_privilege('authenticated','public.ideenwerk_impact_bridge_checks','SELECT') AS auth_select,
      has_function_privilege('anon','public.ideenwerk_run_impact_bridge_check(text)','EXECUTE') AS anon_exec,
      has_function_privilege('authenticated','public.ideenwerk_run_impact_bridge_check(text)','EXECUTE') AS auth_exec
  `);
  assert.equal(access.rows[0].anon_select,false);
  assert.equal(access.rows[0].auth_select,false);
  assert.equal(access.rows[0].anon_exec,false);
  assert.equal(access.rows[0].auth_exec,false);

  const hit=await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES($1,$2,$3,'Österreich','Soziales & Arbeit','cluster_review') RETURNING id
  `,[ids[0],'ci-impact-bridge-hit','Die Arbeitnehmerbeiträge zur Sozialversicherung und Arbeitslosenversicherung sollen sinken, aber nur wenn die Finanzierung belastbar ist.']);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Hohe Arbeitnehmerbeiträge','Sozialversicherungsbeiträge prüfen','Soziales & Arbeit','Österreich','[]'::jsonb,false)
  `,[hit.rows[0].id]);
  await client.query(`UPDATE submissions SET current_status='precheck',updated_at=now() WHERE id=$1`,[hit.rows[0].id]);

  const row=await client.query(`
    SELECT result_code,mappings,registry_version,source_versions,classifier_version,match_rule
      FROM ideenwerk_impact_bridge_checks WHERE submission_id=$1
  `,[hit.rows[0].id]);
  assert.equal(row.rowCount,1);
  assert.equal(row.rows[0].result_code,'candidate_mapping');
  assert.equal(row.rows[0].registry_version,'2026-09-21-v1');
  assert.equal(row.rows[0].classifier_version,'impact-bridge-v1');
  const sv=row.rows[0].mappings.find(x=>x.map_id==='IMPACT-SV-EMPLOYEE');
  assert.ok(sv);
  assert.deepEqual(sv.reform_ids,['SV-01']);
  assert.ok(sv.data_contract_ids.includes('FISCAL-DATA'));
  assert.ok(!Object.hasOwn(sv,'effect'));
  assert.ok(!Object.hasOwn(sv,'amount'));

  const current=await client.query(`SELECT public.ideenwerk_current_impact_bridge($1::uuid) AS bridge`,[hit.rows[0].id]);
  assert.equal(current.rows[0].bridge.result_code,'candidate_mapping');
  assert.equal(current.rows[0].bridge.registry_version,'2026-09-21-v1');

  const audit=await client.query(`
    SELECT payload FROM audit_events
     WHERE subject_type='submission' AND subject_id=$1 AND event_type='impact_bridge_check_completed'
     ORDER BY created_at DESC LIMIT 1
  `,[ids[0]]);
  assert.equal(audit.rowCount,1);
  assert.equal(audit.rows[0].payload.boundary,'existing_werk_artifact_links_only_no_new_effect_or_political_decision');

  await client.query(`UPDATE ideenwerk_impact_bridge_checks SET registry_version='stale-test' WHERE submission_id=$1`,[hit.rows[0].id]);
  const stale=await client.query(`SELECT public.ideenwerk_current_impact_bridge($1::uuid) AS bridge`,[hit.rows[0].id]);
  assert.equal(stale.rows[0].bridge.result_code,'revalidation_required');
  assert.deepEqual(stale.rows[0].bridge.mappings,[]);

  const none=await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES($1,$2,$3,'Österreich','Sonstiges','cluster_review') RETURNING id
  `,[ids[1],'ci-impact-bridge-none','Auf öffentlichen Plätzen sollen mehr Trinkbrunnen stehen.']);
  await client.query(`
    INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
    VALUES($1,'Trinkwasser unterwegs','Mehr Trinkbrunnen','Sonstiges','Österreich','[]'::jsonb,false)
  `,[none.rows[0].id]);
  await client.query(`UPDATE submissions SET current_status='precheck',updated_at=now() WHERE id=$1`,[none.rows[0].id]);
  const noneRow=await client.query(`SELECT result_code,mappings,match_rule FROM ideenwerk_impact_bridge_checks WHERE submission_id=$1`,[none.rows[0].id]);
  assert.equal(noneRow.rows[0].result_code,'no_known_mapping');
  assert.deepEqual(noneRow.rows[0].mappings,[]);
  assert.equal(noneRow.rows[0].match_rule,'no_high_specificity_mapping');

  await client.query('ROLLBACK');
  console.log('impact bridge DB smoke: PASS');
}catch(error){
  await client.query('ROLLBACK').catch(()=>{});
  throw error;
}finally{
  await client.end();
}
