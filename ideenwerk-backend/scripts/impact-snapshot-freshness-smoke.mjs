import pg from 'pg';
import assert from 'node:assert/strict';
const {Client}=pg;
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const client=new Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{
  await client.query('BEGIN');

  const acl=await client.query(`SELECT
    has_function_privilege('anon','public.werk_impact_measurement_snapshot(text)','EXECUTE') AS anon_exec,
    has_function_privilege('authenticated','public.werk_impact_measurement_snapshot(text)','EXECUTE') AS auth_exec,
    has_function_privilege('service_role','public.werk_impact_measurement_snapshot(text)','EXECUTE') AS service_exec`);
  assert.equal(acl.rows[0].anon_exec,false);
  assert.equal(acl.rows[0].auth_exec,false);
  assert.equal(acl.rows[0].service_exec,true);

  const op=await client.query(`INSERT INTO operators(external_subject_hash,display_name,active) VALUES($1,'CI Snapshot Freshness Reviewer',true) RETURNING id`,['7'.repeat(64)]);
  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'impact_reviewer')`,[op.rows[0].id]);

  const currentSource='impact-bridge=2026-09-21-v1;reforms=2026-09-06-v5;data-contract-registry=2026-09-07-v17';
  const plan=await client.query(`SELECT public.werk_record_impact_measurement_plan($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) AS result`,[
    op.rows[0].id,
    'IMPACT-SV-EMPLOYEE',
    'SV-01',
    'werk-data/employee-sv-funding-bridge-results.json',
    currentSource,
    'snapshot_freshness_index',
    'Snapshot-Freshness-Testindex',
    'index_points',
    '2026-baseline',
    100,
    95,
    'CI-only baseline used to prove current read-side source binding.',
    'ci-impact-snapshot-current-0046'
  ]);
  const currentPlanId=plan.rows[0].result.measurement_plan_id;
  const current=await client.query(`SELECT public.werk_impact_measurement_snapshot($1) AS data`,[currentPlanId]);
  assert.equal(current.rows[0].data.state,'planned_no_implementation_evidence');
  assert.equal(current.rows[0].data.current_reliance,true);
  assert.equal(current.rows[0].data.historical_evidence_preserved,true);
  assert.equal(current.rows[0].data.source_binding.binding_state,'current_authoritative_registry_tuple');

  const stalePlanId='MEAS-STALESNAPSHOT0046';
  await client.query(`INSERT INTO public.werk_impact_measurement_plans(
    measurement_plan_id,impact_map_id,reform_id,model_or_artifact_ref,source_version,
    kpi_key,kpi_label,unit,baseline_period,baseline_value,target_value,methodology_note,
    created_by,idempotency_key,payload_hash
  ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,[
    stalePlanId,
    'IMPACT-SV-EMPLOYEE',
    'SV-01',
    'werk-data/employee-sv-funding-bridge-results.json',
    'impact-bridge=stale;reforms=stale;data-contract-registry=stale',
    'snapshot_freshness_index',
    'Snapshot-Freshness-Testindex',
    'index_points',
    'historical-stale-baseline',
    99,
    94,
    'CI-only historical row intentionally carrying a stale authoritative source token.',
    op.rows[0].id,
    'ci-impact-snapshot-stale-0046',
    'ci-stale-snapshot-payload-hash-0046'
  ]);

  const stale=await client.query(`SELECT public.werk_impact_measurement_snapshot($1) AS data`,[stalePlanId]);
  assert.equal(stale.rows[0].data.state,'revalidation_required');
  assert.equal(stale.rows[0].data.current_reliance,false);
  assert.equal(stale.rows[0].data.historical_evidence_preserved,true);
  assert.equal(stale.rows[0].data.source_binding.binding_state,'revalidation_required');
  assert.match(stale.rows[0].data.source_binding.reason,/WERK_IMPACT_SOURCE_VERSION_STALE_OR_UNKNOWN/);
  assert.equal(stale.rows[0].data.latest_observation,undefined);
  assert.equal(stale.rows[0].data.latest_review,undefined);
  assert.equal(stale.rows[0].data.attribution_state,'not_established_by_system');

  await client.query('ROLLBACK');
  console.log('Impact snapshot freshness DB smoke: PASS');
}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{await client.end()}
