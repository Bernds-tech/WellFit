import pg from 'pg';
import assert from 'node:assert/strict';
const {Client}=pg;
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const client=new Client({connectionString:process.env.DATABASE_URL});
await client.connect();
async function expectPgError(sql,params,needle){await client.query('SAVEPOINT expected_error');let seen='';try{await client.query(sql,params)}catch(e){seen=String(e?.message||e)}await client.query('ROLLBACK TO SAVEPOINT expected_error');await client.query('RELEASE SAVEPOINT expected_error');assert.ok(seen.includes(needle),`expected ${needle}, got ${seen||'no error'}`)}
const publicId='IDEA-A150000000000044';
try{
  await client.query('BEGIN');
  const acl=await client.query(`SELECT has_function_privilege('anon','public.ideenwerk_ai_feedback_context(uuid)','EXECUTE') anon_feedback_exec,has_function_privilege('authenticated','public.ideenwerk_ai_feedback_context(uuid)','EXECUTE') auth_feedback_exec`);
  assert.equal(acl.rows[0].anon_feedback_exec,false);assert.equal(acl.rows[0].auth_feedback_exec,false);

  const op=await client.query(`INSERT INTO operators(external_subject_hash,display_name,active) VALUES($1,'CI Impact Feedback Reviewer',true) RETURNING id`,['7'.repeat(64)]);
  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'impact_reviewer')`,[op.rows[0].id]);
  const sub=await client.query(`INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status) VALUES($1,'ci-impact-feedback','Die Arbeitslosenversicherung und Arbeitnehmerbeiträge sollen nachvollziehbar reformiert werden.','Österreich','Sozialversicherung','received') RETURNING id`,[publicId]);
  await client.query(`INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed) VALUES($1,'Belastung und Systemkomplexität','Reformvarianten mit Wirkungskontrolle prüfen','Sozialversicherung','Österreich','[]'::jsonb,false)`,[sub.rows[0].id]);
  await client.query(`SELECT public.ideenwerk_run_impact_bridge_check($1)`,[publicId]);

  const expertArgs=[op.rows[0].id,publicId,'subject_matter_expert','Sozialversicherungsrecht','Fachquelle','https://example.org/fachquelle','REF-44','professional','Fachlicher Bezug ohne Entscheidungsbefugnis.','Die Umsetzung sollte anhand realer Beobachtungen erneut geprüft werden, ohne Kausalität vorwegzunehmen.','Keine vollständige Wirkungsprognose.','Eine Betroffenenperspektive weist auf Umsetzungsrisiken hin.','Gegenquelle','https://example.org/gegenquelle','GREF-44',true,true,'ci-feedback-expert-000044'];
  const expertFn=`SELECT public.ideenwerk_record_expert_input(${expertArgs.map((_,i)=>`$${i+1}`).join(',')}) AS result`;
  const expert=await client.query(expertFn,expertArgs);const expertId=expert.rows[0].result.expert_input_id;

  let feedback=await client.query(`SELECT public.ideenwerk_ai_feedback_context($1::uuid) AS data`,[sub.rows[0].id]);
  assert.equal(feedback.rows[0].data.state,'current');assert.deepEqual(feedback.rows[0].data.review_refs,[]);

  const currentSource='impact-bridge=2026-09-21-v1;reforms=2026-09-06-v5;data-contract-registry=2026-09-07-v17';
  const plan=await client.query(`SELECT public.werk_record_impact_measurement_plan($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) AS result`,[op.rows[0].id,'IMPACT-SV-EMPLOYEE','SV-01','werk-data/employee-sv-funding-bridge-results.json',currentSource,'employee_contribution_index','Arbeitnehmerbeitrags-Index','index_points','2026-baseline',100,95,'CI-only normalized baseline; no causal or fiscal claim.','ci-feedback-plan-000044']);
  const planId=plan.rows[0].result.measurement_plan_id;
  const obs=await client.query(`SELECT public.werk_record_impact_observation($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS result`,[op.rows[0].id,planId,'2026-09-01','2026-09-30',97,'CI feedback observation source','https://example.org/observation','CI-FEEDBACK-OBS-44','ci-data-v1','ci-feedback-obs-000044']);
  const obsId=obs.rows[0].result.observation_id;

  const reviewFn=`SELECT public.werk_record_impact_review($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9::jsonb,$10) AS result`;
  const validReview=await client.query(reviewFn,[op.rows[0].id,planId,obsId,'Die beobachtete Abweichung wird getrennt von einer Kausalbehauptung dokumentiert.','Ein Zusammenhang mit der Umsetzung bleibt eine zu prüfende Hypothese.',JSON.stringify(['Konjunktur','Messmethodik']),'Prüfe die Messmethodik und alternative Erklärungen vor jeder weiteren Anpassung.',JSON.stringify(['kurzer Beobachtungszeitraum']),JSON.stringify([{kind:'observation',ref_id:obsId}]),'ci-feedback-review-000044']);
  const reviewId=validReview.rows[0].result.impact_review_id;
  await client.query(reviewFn,[op.rows[0].id,planId,obsId,'Ein zweiter Review dient nur dem Negativtest der Feedback-Eignung.','Auch diese Zuordnung ist keine festgestellte Kausalwirkung.',JSON.stringify(['Saisonalität']),'Diese Hypothese darf ohne dokumentierte Unsicherheit nicht in den Synthesekontext gelangen.',JSON.stringify([]),JSON.stringify([{kind:'observation',ref_id:obsId}]),'ci-feedback-review-empty-044']);

  feedback=await client.query(`SELECT public.ideenwerk_ai_feedback_context($1::uuid) AS data`,[sub.rows[0].id]);
  assert.equal(feedback.rows[0].data.state,'current');
  assert.deepEqual(feedback.rows[0].data.review_refs,[reviewId]);
  assert.equal(feedback.rows[0].data.items.length,1);
  assert.equal(feedback.rows[0].data.items[0].epistemic_status,'review_hypothesis_not_fact_or_causal_effect');
  assert.equal(feedback.rows[0].data.items[0].impact_map_id,'IMPACT-SV-EMPLOYEE');
  assert.equal(feedback.rows[0].data.items[0].reform_id,'SV-01');
  assert.ok(feedback.rows[0].data.items[0].uncertainties.length>0);
  assert.ok(feedback.rows[0].data.items[0].source_refs.length>0);

  const snapshot=await client.query(`SELECT public.ideenwerk_ai_synthesis_source_snapshot($1::uuid) AS data`,[sub.rows[0].id]);
  assert.equal(snapshot.rows[0].data.schema_version,'2026-09-21-v2');
  assert.equal(snapshot.rows[0].data.eligible,true);
  assert.ok(snapshot.rows[0].data.expert_input_refs.includes(expertId));
  assert.deepEqual(snapshot.rows[0].data.impact_feedback.review_refs,[reviewId]);

  const variants=[
    {variant_id:'V1',title:'Messpfad',summary:'Die weitere Ausgestaltung berücksichtigt den dokumentierten Review als prüfbare Rückmeldung.',mechanism:'Beobachtung, Gegenhypothesen und Unsicherheit werden vor einer Anpassung gemeinsam geprüft.',tradeoffs:['Zusätzlicher Prüfaufwand.'],uncertainties:['Übertragbarkeit bleibt offen.'],source_refs:[{kind:'citizen_problem',ref_id:'CITIZEN-PROBLEM'},{kind:'impact_map',ref_id:'IMPACT-SV-EMPLOYEE'},{kind:'expert_input',ref_id:expertId},{kind:'impact_review',ref_id:reviewId}]},
    {variant_id:'V2',title:'Vergleichspfad',summary:'Die Rückmeldung wird mit alternativen Erklärungen und weiterem Betroffenenwissen verglichen.',mechanism:'Neue Varianten bleiben an Quellen und Unsicherheiten gebunden.',tradeoffs:['Mehr Evidenzschritte.'],uncertainties:['Messmethodik bleibt zu prüfen.'],source_refs:[{kind:'citizen_problem',ref_id:'CITIZEN-PROBLEM'},{kind:'impact_review',ref_id:reviewId}]}
  ];
  const synthFn=`SELECT public.ideenwerk_record_ai_synthesis($1,$2,$3,$4::jsonb,$5,$6,$7) AS result`;
  const synth=await client.query(synthFn,[publicId,'ci_contract_only','ci-model-v2',JSON.stringify(variants),'Feedback bleibt hypothesengebunden und wird nicht als Kausalwirkung behandelt.',snapshot.rows[0].data.snapshot_hash,'ci-feedback-synth-000044']);
  assert.equal(synth.rows[0].result.replayed,false);

  const staleRef=structuredClone(variants);staleRef[0].source_refs=[{kind:'impact_review',ref_id:'IREV-NOT-CURRENT'}];
  await expectPgError(synthFn,[publicId,'ci_contract_only','ci-model-v2',JSON.stringify(staleRef),null,snapshot.rows[0].data.snapshot_hash,'ci-feedback-stale-ref-044'],'AI_SYNTHESIS_SOURCE_REF_NOT_CURRENT');

  await client.query(`UPDATE public.ideenwerk_impact_bridge_checks SET registry_version='stale-feedback-ci' WHERE submission_id=$1`,[sub.rows[0].id]);
  feedback=await client.query(`SELECT public.ideenwerk_ai_feedback_context($1::uuid) AS data`,[sub.rows[0].id]);
  assert.equal(feedback.rows[0].data.state,'revalidation_required');assert.equal(feedback.rows[0].data.review_refs.length,0);
  const current=await client.query(`SELECT public.ideenwerk_current_ai_synthesis($1::uuid) AS data`,[sub.rows[0].id]);
  assert.equal(current.rows[0].data.state,'revalidation_required');assert.equal(current.rows[0].data.variants.length,0);

  await client.query('ROLLBACK');
  console.log('Impact feedback DB smoke: PASS');
}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{await client.end()}
