import pg from 'pg';
const {Client}=pg;
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
const client=new Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{
  await client.query(`
BEGIN;
DO $$
DECLARE
  v_op uuid;
  v_sub uuid;
  v_plan jsonb;
  v_plan_id text;
  v_unrel jsonb;
  v_unrel_id text;
  v_review jsonb;
  v_review_id text;
  v_feedback jsonb;
  v_public text := 'IDEA-A150000000000045';
  v_source text := 'impact-bridge=2026-09-21-v1;reforms=2026-09-06-v5;data-contract-registry=2026-09-07-v17';
BEGIN
  INSERT INTO operators(external_subject_hash,display_name,active)
  VALUES(repeat('8',64),'CI Feedback Selection Reviewer',true)
  RETURNING id INTO v_op;
  INSERT INTO operator_roles(operator_id,role) VALUES(v_op,'impact_reviewer');

  INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
  VALUES(v_public,'ci-feedback-selection-045','Die Arbeitslosenversicherung und Arbeitnehmerbeiträge sollen nachvollziehbar reformiert und gemessen werden.','Österreich','Sozialversicherung','received')
  RETURNING id INTO v_sub;
  INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed)
  VALUES(v_sub,'Belastung und Systemkomplexität','Reformvarianten mit Wirkungskontrolle prüfen','Sozialversicherung','Österreich','[]'::jsonb,false);
  PERFORM public.ideenwerk_run_impact_bridge_check(v_public);

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(coalesce(public.ideenwerk_current_impact_bridge(v_sub)->'mappings','[]'::jsonb)) m
    WHERE m->>'map_id'='IMPACT-SV-EMPLOYEE'
      AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(coalesce(m->'reform_ids','[]'::jsonb)) rid WHERE rid='SV-01')
  ) THEN RAISE EXCEPTION 'CI_SELECTION_EXPECTED_CURRENT_MAPPING_MISSING'; END IF;

  SELECT public.werk_record_impact_measurement_plan(
    v_op,'IMPACT-SV-EMPLOYEE','SV-01','werk-data/employee-sv-funding-bridge-results.json',v_source,
    'selection_relevant_kpi','Selection relevant KPI','index_points','2026-baseline',100,95,
    'CI-only selection regression baseline; no causal or fiscal claim.','ci-selection-relevant-plan-045'
  ) INTO v_plan;
  v_plan_id := v_plan->>'measurement_plan_id';

  SELECT public.werk_record_impact_review(
    v_op,v_plan_id,NULL,
    'Die relevante Abweichung bleibt getrennt von jeder Kausalbehauptung dokumentiert.',
    'Eine Zuordnung bleibt ausdrücklich nur eine zu prüfende Hypothese.',
    '["Messmethodik"]'::jsonb,
    'Der relevante Review muss trotz vieler neuerer fachfremder Reviews im gebundenen Synthesekontext erhalten bleiben.',
    '["Beobachtungsfenster"]'::jsonb,
    jsonb_build_array(jsonb_build_object('kind','plan','ref_id',v_plan_id)),
    'ci-selection-relevant-review-045'
  ) INTO v_review;
  v_review_id := v_review->>'impact_review_id';

  SELECT public.werk_record_impact_measurement_plan(
    v_op,'IMPACT-SUBSIDY','SUB-01','werk-data/subsidy-federal-account-results.json',v_source,
    'selection_unrelated_kpi','Selection unrelated KPI','index_points','2026-baseline',100,95,
    'CI-only unrelated selection regression baseline; no causal or fiscal claim.','ci-selection-unrelated-plan-045'
  ) INTO v_unrel;
  v_unrel_id := v_unrel->>'measurement_plan_id';

  INSERT INTO public.werk_impact_reviews(
    impact_review_id,measurement_plan_id,observation_id,deviation_explanation,
    attribution_hypothesis,alternative_explanations,improvement_hypothesis,
    uncertainties,source_refs,created_by,idempotency_key,payload_hash,created_at
  )
  SELECT
    'IREV-UNRELATED-'||lpad(gs::text,3,'0'),v_unrel_id,NULL,
    'Dieser fachfremde Review dient ausschließlich dem Auswahlfenster-Regressionsfall.',
    'Eine fachfremde Zuordnung bleibt nur eine Hypothese und ist für diese Bürgeridee nicht relevant.',
    '["anderer Sachbereich"]'::jsonb,
    'Dieser neuere fachfremde Review darf einen älteren relevanten Review nicht aus dem Auswahlfenster verdrängen.',
    '["fachfremde Evidenz"]'::jsonb,
    jsonb_build_array(jsonb_build_object('kind','plan','ref_id',v_unrel_id)),
    v_op,'ci-selection-unrelated-'||lpad(gs::text,3,'0')||'-045',
    md5('ci-selection-unrelated-'||gs::text),
    clock_timestamp()+(gs*interval '1 second')
  FROM generate_series(1,51) gs;

  SELECT public.ideenwerk_ai_feedback_context(v_sub) INTO v_feedback;
  IF v_feedback->>'state' <> 'current' THEN RAISE EXCEPTION 'CI_SELECTION_FEEDBACK_NOT_CURRENT:%',v_feedback; END IF;
  IF v_feedback->>'selection_order' <> 'current_submission_map_reform_before_limit' THEN RAISE EXCEPTION 'CI_SELECTION_ORDER_GUARD_MISSING:%',v_feedback; END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_feedback->'review_refs') x WHERE x=v_review_id) THEN RAISE EXCEPTION 'CI_SELECTION_RELEVANT_REVIEW_DISPLACED:%',v_feedback; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_feedback->'review_refs') x WHERE x LIKE 'IREV-UNRELATED-%') THEN RAISE EXCEPTION 'CI_SELECTION_UNRELATED_REVIEW_LEAKED:%',v_feedback; END IF;
  IF jsonb_array_length(v_feedback->'review_refs')>12 THEN RAISE EXCEPTION 'CI_SELECTION_BOUND_EXCEEDED:%',v_feedback; END IF;
END $$;
ROLLBACK;
  `);
  console.log('Impact feedback relevance-before-limit regression: PASS');
}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{await client.end()}
