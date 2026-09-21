import pg from 'pg';
import assert from 'node:assert/strict';

const {Client}=pg;
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const client=new Client({connectionString:process.env.DATABASE_URL});
await client.connect();

const publicId='IDEA-A150000000000045';
const currentSource='impact-bridge=2026-09-21-v1;reforms=2026-09-06-v5;data-contract-registry=2026-09-07-v17';

try{
  await client.query('BEGIN');

  const op=await client.query(`INSERT INTO operators(external_subject_hash,display_name,active) VALUES($1,'CI Feedback Selection Reviewer',true) RETURNING id`,['8'.repeat(64)]);
  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'impact_reviewer')`,[op.rows[0].id]);
  const sub=await client.query(`INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status) VALUES($1,'ci-feedback-selection','Die Arbeitslosenversicherung und Arbeitnehmerbeiträge sollen nachvollziehbar reformiert und gemessen werden.','Österreich','Sozialversicherung','received') RETURNING id`,[publicId]);
  await client.query(`INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed) VALUES($1,'Belastung und Systemkomplexität','Reformvarianten mit Wirkungskontrolle prüfen','Sozialversicherung','Österreich','[]'::jsonb,false)`,[sub.rows[0].id]);
  await client.query(`SELECT public.ideenwerk_run_impact_bridge_check($1)`,[publicId]);

  const bridge=await client.query(`SELECT public.ideenwerk_current_impact_bridge($1::uuid) AS data`,[sub.rows[0].id]);
  assert.equal(bridge.rows[0].data.result_code,'candidate_mapping');
  assert.ok(bridge.rows[0].data.mappings.some(m=>m.map_id==='IMPACT-SV-EMPLOYEE' && m.reform_ids.includes('SV-01')),'expected current SV mapping');
  assert.ok(!bridge.rows[0].data.mappings.some(m=>m.map_id==='IMPACT-SUBSIDY'),'subsidy mapping must be unrelated for this regression');

  const planFn=`SELECT public.werk_record_impact_measurement_plan($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) AS result`;
  const relevantPlan=await client.query(planFn,[op.rows[0].id,'IMPACT-SV-EMPLOYEE','SV-01','werk-data/employee-sv-funding-bridge-results.json',currentSource,'selection_relevant_kpi','Selection relevant KPI','index_points','2026-baseline',100,95,'CI-only selection regression baseline; no causal or fiscal claim.','ci-selection-relevant-plan-045']);
  const relevantPlanId=relevantPlan.rows[0].result.measurement_plan_id;

  const reviewFn=`SELECT public.werk_record_impact_review($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9::jsonb,$10) AS result`;
  const relevantReview=await client.query(reviewFn,[op.rows[0].id,relevantPlanId,null,'Die relevante Abweichung bleibt getrennt von jeder Kausalbehauptung dokumentiert.','Eine Zuordnung bleibt ausdrücklich nur eine zu prüfende Hypothese.',JSON.stringify(['Messmethodik']),'Der relevante Review muss trotz vieler neuerer fachfremder Reviews im gebundenen Synthesekontext erhalten bleiben.',JSON.stringify(['Beobachtungsfenster']),JSON.stringify([{kind:'plan',ref_id:relevantPlanId}]),'ci-selection-relevant-review-045']);
  const relevantReviewId=relevantReview.rows[0].result.impact_review_id;

  const unrelatedPlan=await client.query(planFn,[op.rows[0].id,'IMPACT-SUBSIDY','SUB-01','werk-data/subsidy-federal-account-results.json',currentSource,'selection_unrelated_kpi','Selection unrelated KPI','index_points','2026-baseline',100,95,'CI-only unrelated selection regression baseline; no causal or fiscal claim.','ci-selection-unrelated-plan-045']);
  const unrelatedPlanId=unrelatedPlan.rows[0].result.measurement_plan_id;

  await client.query(`
    INSERT INTO public.werk_impact_reviews(
      impact_review_id,measurement_plan_id,observation_id,deviation_explanation,
      attribution_hypothesis,alternative_explanations,improvement_hypothesis,
      uncertainties,source_refs,created_by,idempotency_key,payload_hash,created_at
    )
    SELECT
      'IREV-UNRELATED-'||lpad(gs::text,3,'0'),
      $1,
      NULL,
      'Dieser fachfremde Review dient ausschließlich dem Auswahlfenster-Regressionsfall.',
      'Eine fachfremde Zuordnung bleibt nur eine Hypothese und ist für diese Bürgeridee nicht relevant.',
      '["anderer Sachbereich"]'::jsonb,
      'Dieser neuere fachfremde Review darf einen älteren relevanten Review nicht aus dem Auswahlfenster verdrängen.',
      '["fachfremde Evidenz"]'::jsonb,
      jsonb_build_array(jsonb_build_object('kind','plan','ref_id',$1)),
      $2,
      'ci-selection-unrelated-'||lpad(gs::text,3,'0')||'-045',
      md5(('ci-selection-unrelated-'||gs::text)::text),
      clock_timestamp() + (gs * interval '1 second')
    FROM generate_series(1,51) gs
  `,[unrelatedPlanId,op.rows[0].id]);

  const counts=await client.query(`SELECT count(*)::int AS total,count(*) FILTER (WHERE measurement_plan_id=$1)::int AS unrelated FROM public.werk_impact_reviews`,[unrelatedPlanId]);
  assert.equal(counts.rows[0].unrelated,51);
  assert.ok(counts.rows[0].total>=52);

  const feedback=await client.query(`SELECT public.ideenwerk_ai_feedback_context($1::uuid) AS data`,[sub.rows[0].id]);
  assert.equal(feedback.rows[0].data.state,'current');
  assert.equal(feedback.rows[0].data.selection_order,'current_submission_map_reform_before_limit');
  assert.ok(feedback.rows[0].data.review_refs.includes(relevantReviewId),'relevant review was incorrectly displaced by >50 newer unrelated reviews');
  assert.ok(feedback.rows[0].data.review_refs.every(id=>!String(id).startsWith('IREV-UNRELATED-')),'unrelated review leaked into current submission context');
  assert.ok(feedback.rows[0].data.review_refs.length<=12,'feedback bound exceeded');

  await client.query('ROLLBACK');
  console.log('Impact feedback relevance-before-limit regression: PASS');
}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{await client.end()}
