import pg from 'pg';
import assert from 'node:assert/strict';
const {Client}=pg;
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const client=new Client({connectionString:process.env.DATABASE_URL});
await client.connect();
async function expectPgError(sql,params,needle){await client.query('SAVEPOINT expected_error');let seen='';try{await client.query(sql,params)}catch(e){seen=String(e?.message||e)}await client.query('ROLLBACK TO SAVEPOINT expected_error');await client.query('RELEASE SAVEPOINT expected_error');assert.ok(seen.includes(needle),`expected ${needle}, got ${seen||'no error'}`)}
try{
  await client.query('BEGIN');
  const acl=await client.query(`SELECT
    has_table_privilege('anon','public.werk_impact_measurement_plans','SELECT') AS anon_plan_select,
    has_table_privilege('authenticated','public.werk_impact_observations','SELECT') AS auth_obs_select,
    has_function_privilege('anon','public.werk_record_impact_observation(uuid,text,date,date,numeric,text,text,text,text,text)','EXECUTE') AS anon_obs_exec,
    has_function_privilege('anon','public.werk_impact_validate_source_binding(text,text,text,text)','EXECUTE') AS anon_binding_exec`);
  assert.equal(acl.rows[0].anon_plan_select,false);assert.equal(acl.rows[0].auth_obs_select,false);assert.equal(acl.rows[0].anon_obs_exec,false);assert.equal(acl.rows[0].anon_binding_exec,false);

  const op=await client.query(`INSERT INTO operators(external_subject_hash,display_name,active) VALUES($1,'CI Impact Measurement Reviewer',true) RETURNING id`,['5'.repeat(64)]);
  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'impact_reviewer')`,[op.rows[0].id]);
  const other=await client.query(`INSERT INTO operators(external_subject_hash,display_name,active) VALUES($1,'CI Non Reviewer',true) RETURNING id`,['6'.repeat(64)]);

  const planFn=`SELECT public.werk_record_impact_measurement_plan($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) AS result`;
  const currentSource='impact-bridge=2026-09-21-v1;reforms=2026-09-06-v5;data-contract-registry=2026-09-07-v17';
  const planArgs=[op.rows[0].id,'IMPACT-SV-EMPLOYEE','SV-01','werk-data/employee-sv-funding-bridge-results.json',currentSource,'employee_contribution_index','Arbeitnehmerbeitrags-Index','index_points','2026-baseline',100,95,'CI-only normalized index; no fiscal claim.','ci-impact-plan-00000042'];

  // Authoritative source binding: unknown, mismatched and stale tuples must fail
  // before any plan can be persisted or accepted as an idempotent replay.
  await expectPgError(planFn,[op.rows[0].id,'IMPACT-NOT-REAL','SV-01','werk-data/employee-sv-funding-bridge-results.json',currentSource,...planArgs.slice(5,12),'ci-impact-bad-map-000042'],'WERK_IMPACT_SOURCE_MAP_UNKNOWN');
  await expectPgError(planFn,[op.rows[0].id,'IMPACT-SV-EMPLOYEE','TAX-01','werk-data/employee-sv-funding-bridge-results.json',currentSource,...planArgs.slice(5,12),'ci-impact-bad-reform-0042'],'WERK_IMPACT_SOURCE_REFORM_MISMATCH');
  await expectPgError(planFn,[op.rows[0].id,'IMPACT-SV-EMPLOYEE','SV-01','werk-data/not-authoritative.json',currentSource,...planArgs.slice(5,12),'ci-impact-bad-artifact-042'],'WERK_IMPACT_SOURCE_ARTIFACT_MISMATCH');
  await expectPgError(planFn,[op.rows[0].id,'IMPACT-SV-EMPLOYEE','SV-01','werk-data/employee-sv-funding-bridge-results.json','impact-bridge=stale;reforms=stale;data-contract-registry=stale',...planArgs.slice(5,12),'ci-impact-stale-source-042'],'WERK_IMPACT_SOURCE_VERSION_STALE_OR_UNKNOWN');

  const plan=await client.query(planFn,planArgs);const planId=plan.rows[0].result.measurement_plan_id;assert.match(planId,/^MEAS-[A-F0-9]{20}$/);assert.equal(plan.rows[0].result.replayed,false);
  assert.equal(plan.rows[0].result.source_binding.binding_state,'current_authoritative_registry_tuple');
  assert.equal(plan.rows[0].result.source_binding.impact_map_id,'IMPACT-SV-EMPLOYEE');
  assert.equal(plan.rows[0].result.source_binding.reform_id,'SV-01');
  assert.equal(plan.rows[0].result.source_binding.model_or_artifact_ref,'werk-data/employee-sv-funding-bridge-results.json');
  assert.equal(plan.rows[0].result.source_binding.source_version,currentSource);
  const persisted=await client.query(`SELECT impact_map_id,reform_id,model_or_artifact_ref,source_version FROM public.werk_impact_measurement_plans WHERE measurement_plan_id=$1`,[planId]);
  assert.deepEqual(persisted.rows[0],{impact_map_id:'IMPACT-SV-EMPLOYEE',reform_id:'SV-01',model_or_artifact_ref:'werk-data/employee-sv-funding-bridge-results.json',source_version:currentSource});
  const replay=await client.query(planFn,planArgs);assert.equal(replay.rows[0].result.replayed,true);assert.equal(replay.rows[0].result.source_binding.binding_state,'current_authoritative_registry_tuple');
  await expectPgError(planFn,[other.rows[0].id,...planArgs.slice(1,12),'ci-impact-plan-nonreviewer'],'WERK_IMPACT_REVIEWER_REQUIRED');

  let snap=await client.query(`SELECT public.werk_impact_measurement_snapshot($1) AS data`,[planId]);
  assert.equal(snap.rows[0].data.state,'planned_no_implementation_evidence');assert.equal(snap.rows[0].data.attribution_state,'not_established_by_system');

  const implFn=`SELECT public.werk_record_impact_implementation($1,$2,$3,$4,$5,$6,$7,$8,$9) AS result`;
  const impl=await client.query(implFn,[op.rows[0].id,planId,'2026-09-01T00:00:00Z','ci-implementation-v1','CI-only synthetic implementation event for measurement contract testing.','CI implementation source','https://example.org/implementation','CI-IMPL-42','ci-impact-impl-00000042']);
  const implId=impl.rows[0].result.implementation_event_id;assert.match(implId,/^IMPL-[A-F0-9]{20}$/);
  snap=await client.query(`SELECT public.werk_impact_measurement_snapshot($1) AS data`,[planId]);assert.equal(snap.rows[0].data.state,'implemented_awaiting_observation');

  const obsFn=`SELECT public.werk_record_impact_observation($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS result`;
  await expectPgError(obsFn,[op.rows[0].id,'MEAS-NOT-FOUND','2026-09-01','2026-09-30',97,'CI observation','https://example.org/observation','CI-OBS-X','ci-data-v1','ci-impact-obs-missing42'],'WERK_IMPACT_PLAN_NOT_FOUND');
  await expectPgError(obsFn,[op.rows[0].id,planId,'2026-10-01','2026-09-30',97,'CI observation','https://example.org/observation','CI-OBS-X','ci-data-v1','ci-impact-obs-period042'],'WERK_IMPACT_PERIOD_INVALID');
  const obs=await client.query(obsFn,[op.rows[0].id,planId,'2026-09-01','2026-09-30',97,'CI observation source','https://example.org/observation','CI-OBS-42','ci-data-v1','ci-impact-obs-00000042']);
  const obsId=obs.rows[0].result.observation_id;assert.match(obsId,/^OBS-[A-F0-9]{20}$/);
  snap=await client.query(`SELECT public.werk_impact_measurement_snapshot($1) AS data`,[planId]);
  assert.equal(snap.rows[0].data.state,'observation_available_attribution_not_established');
  assert.equal(Number(snap.rows[0].data.latest_observation.deviation_from_baseline),-3);
  assert.equal(Number(snap.rows[0].data.latest_observation.deviation_from_target),2);
  assert.equal(snap.rows[0].data.attribution_state,'not_established_by_system');

  const reviewFn=`SELECT public.werk_record_impact_review($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9::jsonb,$10) AS result`;
  const review=await client.query(reviewFn,[op.rows[0].id,planId,obsId,'Die beobachtete Abweichung wird getrennt von einer Kausalbehauptung dokumentiert.','Ein Zusammenhang mit der Umsetzung ist eine zu prüfende Hypothese, keine festgestellte Wirkung.',JSON.stringify(['Konjunktur','Messmethodik']),'Prüfe die Messmethodik und alternative Erklärungen vor jeder Reformanpassung.',JSON.stringify(['kurzer Beobachtungszeitraum']),JSON.stringify([{kind:'observation',ref_id:obsId}]),'ci-impact-review-000042']);
  assert.match(review.rows[0].result.impact_review_id,/^IREV-[A-F0-9]{20}$/);assert.equal(review.rows[0].result.boundary,'review_only_no_automatic_policy_change');
  snap=await client.query(`SELECT public.werk_impact_measurement_snapshot($1) AS data`,[planId]);
  assert.equal(snap.rows[0].data.latest_review.boundary,'review_only_no_automatic_policy_change');
  assert.equal(snap.rows[0].data.boundary,'Observed movement and arithmetic deviation do not establish causal policy impact.');

  await expectPgError(`UPDATE public.werk_impact_observations SET observed_value=1 WHERE observation_id=$1`,[obsId],'WERK_IMPACT_EVIDENCE_APPEND_ONLY');
  await expectPgError(`DELETE FROM public.werk_impact_measurement_plans WHERE measurement_plan_id=$1`,[planId],'WERK_IMPACT_EVIDENCE_APPEND_ONLY');

  await client.query('ROLLBACK');
  console.log('Impact measurement DB smoke: PASS');
}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{await client.end()}
