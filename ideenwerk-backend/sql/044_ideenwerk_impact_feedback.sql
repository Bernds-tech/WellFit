BEGIN;

-- WERK Impact Feedback integration.
-- Reuse counterchecked Impact Measurement reviews as bounded, provenance-bound
-- learning material for the existing AI synthesis context. Review text remains
-- hypothesis/review material: never causal fact, ranking, recommendation or an
-- automatic political change. No external provider is activated here.

CREATE OR REPLACE FUNCTION public.ideenwerk_ai_feedback_context(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_impact jsonb;
  v_items jsonb := '[]'::jsonb;
  v_refs jsonb := '[]'::jsonb;
  v_binding jsonb;
  v_matches boolean;
  r record;
BEGIN
  SELECT public.ideenwerk_current_impact_bridge(p_submission_id) INTO v_impact;

  IF v_impact IS NULL THEN
    RETURN jsonb_build_object(
      'state','current',
      'review_refs','[]'::jsonb,
      'items','[]'::jsonb,
      'boundary','No current impact review feedback is available; absence is not evidence of no impact.'
    );
  END IF;

  IF coalesce(v_impact->>'result_code','')='revalidation_required' THEN
    RETURN jsonb_build_object(
      'state','revalidation_required',
      'reason','impact_bridge_revalidation_required',
      'review_refs','[]'::jsonb,
      'items','[]'::jsonb,
      'boundary','Stale impact mappings are never consumed as current AI feedback.'
    );
  END IF;

  FOR r IN
    SELECT
      ir.impact_review_id,
      ir.observation_id,
      ir.attribution_hypothesis,
      ir.alternative_explanations,
      ir.improvement_hypothesis,
      ir.uncertainties,
      ir.source_refs,
      ir.created_at,
      mp.measurement_plan_id,
      mp.impact_map_id,
      mp.reform_id,
      mp.model_or_artifact_ref,
      mp.source_version
    FROM public.werk_impact_reviews ir
    JOIN public.werk_impact_measurement_plans mp
      ON mp.measurement_plan_id=ir.measurement_plan_id
    WHERE nullif(btrim(ir.improvement_hypothesis),'') IS NOT NULL
      AND jsonb_array_length(ir.uncertainties)>0
      AND jsonb_array_length(ir.source_refs)>0
    ORDER BY ir.created_at DESC, ir.impact_review_id DESC
    LIMIT 50
  LOOP
    SELECT EXISTS(
      SELECT 1
      FROM jsonb_array_elements(coalesce(v_impact->'mappings','[]'::jsonb)) m
      WHERE m->>'map_id'=r.impact_map_id
        AND EXISTS(
          SELECT 1 FROM jsonb_array_elements_text(coalesce(m->'reform_ids','[]'::jsonb)) rid
          WHERE rid=r.reform_id
        )
    ) INTO v_matches;

    IF NOT v_matches THEN CONTINUE; END IF;
    IF jsonb_array_length(v_refs)>=12 THEN EXIT; END IF;

    BEGIN
      v_binding := public.werk_impact_validate_source_binding(
        r.impact_map_id,r.reform_id,r.model_or_artifact_ref,r.source_version
      );
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'state','revalidation_required',
        'reason','impact_review_source_binding_stale',
        'review_refs','[]'::jsonb,
        'items','[]'::jsonb,
        'boundary','A linked impact review no longer has a current authoritative source binding; feedback is withheld until revalidated.'
      );
    END;

    v_refs := v_refs || jsonb_build_array(r.impact_review_id);
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'impact_review_id',r.impact_review_id,
      'measurement_plan_id',r.measurement_plan_id,
      'observation_id',r.observation_id,
      'impact_map_id',r.impact_map_id,
      'reform_id',r.reform_id,
      'model_or_artifact_ref',r.model_or_artifact_ref,
      'source_version',r.source_version,
      'authoritative_source_binding',v_binding,
      'attribution_hypothesis',r.attribution_hypothesis,
      'alternative_explanations',r.alternative_explanations,
      'improvement_hypothesis',r.improvement_hypothesis,
      'uncertainties',r.uncertainties,
      'source_refs',r.source_refs,
      'created_at',r.created_at,
      'epistemic_status','review_hypothesis_not_fact_or_causal_effect',
      'boundary','Input for later variant synthesis only; never an automatic recommendation, policy change or causal conclusion.'
    ));
  END LOOP;

  RETURN jsonb_build_object(
    'state','current',
    'review_refs',v_refs,
    'items',v_items,
    'max_items',12,
    'boundary','Only current source-bound review hypotheses with uncertainty and provenance are exposed; no causal or political adoption is inferred.'
  );
END;
$$;
REVOKE ALL ON FUNCTION public.ideenwerk_ai_feedback_context(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_ai_feedback_context(uuid) TO service_role;

-- Extend the existing source snapshot. Feedback is optional, but any stale linked
-- feedback fails closed and every newly eligible review changes the snapshot hash.
CREATE OR REPLACE FUNCTION public.ideenwerk_ai_synthesis_source_snapshot(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission record;
  v_structured_updated_at timestamptz;
  v_impact jsonb;
  v_experts jsonb;
  v_feedback jsonb;
  v_impact_refs jsonb := '[]'::jsonb;
  v_expert_refs jsonb := '[]'::jsonb;
  v_feedback_refs jsonb := '[]'::jsonb;
  v_snapshot jsonb;
  v_eligible boolean := false;
  v_reason text := null;
BEGIN
  SELECT id,public_id,updated_at INTO v_submission
  FROM public.submissions WHERE id=p_submission_id LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT updated_at INTO v_structured_updated_at
  FROM public.structured_proposals WHERE submission_id=p_submission_id LIMIT 1;

  SELECT public.ideenwerk_current_impact_bridge(p_submission_id) INTO v_impact;
  SELECT public.ideenwerk_expert_input_citizen_view(p_submission_id) INTO v_experts;
  SELECT public.ideenwerk_ai_feedback_context(p_submission_id) INTO v_feedback;
  v_experts := coalesce(v_experts,'[]'::jsonb);
  v_feedback := coalesce(v_feedback,jsonb_build_object('state','current','review_refs','[]'::jsonb,'items','[]'::jsonb));

  IF v_impact IS NULL THEN
    v_reason := 'impact_bridge_missing';
  ELSIF coalesce(v_impact->>'result_code','')='revalidation_required' THEN
    v_reason := 'impact_bridge_revalidation_required';
  ELSIF coalesce(v_impact->>'result_code','')<>'candidate_mapping' OR jsonb_array_length(coalesce(v_impact->'mappings','[]'::jsonb))=0 THEN
    v_reason := 'impact_mapping_required';
  ELSIF jsonb_array_length(v_experts)=0 THEN
    v_reason := 'citizen_visible_expert_input_required';
  ELSIF coalesce(v_feedback->>'state','current')='revalidation_required' THEN
    v_reason := 'impact_feedback_revalidation_required';
  ELSE
    v_eligible := true;
  END IF;

  SELECT coalesce(jsonb_agg(x->>'map_id' ORDER BY x->>'map_id'),'[]'::jsonb)
    INTO v_impact_refs
  FROM jsonb_array_elements(coalesce(v_impact->'mappings','[]'::jsonb)) x
  WHERE nullif(x->>'map_id','') IS NOT NULL;

  SELECT coalesce(jsonb_agg(x->>'expert_input_id' ORDER BY x->>'expert_input_id'),'[]'::jsonb)
    INTO v_expert_refs
  FROM jsonb_array_elements(v_experts) x
  WHERE nullif(x->>'expert_input_id','') IS NOT NULL;

  SELECT coalesce(jsonb_agg(value ORDER BY value),'[]'::jsonb)
    INTO v_feedback_refs
  FROM jsonb_array_elements_text(coalesce(v_feedback->'review_refs','[]'::jsonb));

  v_snapshot := jsonb_build_object(
    'schema_version','2026-09-21-v2',
    'submission_public_id',v_submission.public_id,
    'submission_updated_at',v_submission.updated_at,
    'structured_updated_at',v_structured_updated_at,
    'impact_bridge',jsonb_build_object(
      'result_code',v_impact->>'result_code',
      'registry_version',v_impact->>'registry_version',
      'source_versions',coalesce(v_impact->'source_versions','{}'::jsonb),
      'checked_at',v_impact->'checked_at',
      'mapping_refs',v_impact_refs
    ),
    'expert_input_refs',v_expert_refs,
    'impact_feedback',jsonb_build_object(
      'state',coalesce(v_feedback->>'state','current'),
      'review_refs',v_feedback_refs
    ),
    'eligible',v_eligible,
    'ineligible_reason',v_reason,
    'boundary','source_snapshot_only_no_political_ranking_no_new_fiscal_effect_feedback_hypotheses_not_facts'
  );
  RETURN v_snapshot || jsonb_build_object('snapshot_hash',md5(v_snapshot::text));
END;
$$;
REVOKE ALL ON FUNCTION public.ideenwerk_ai_synthesis_source_snapshot(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_ai_synthesis_source_snapshot(uuid) TO service_role;

-- Preserve the existing RPC signature and all anti-ranking / anti-effect guards,
-- while permitting only impact-review refs present in the current v2 snapshot.
CREATE OR REPLACE FUNCTION public.ideenwerk_record_ai_synthesis(
  p_public_id text,
  p_model_provider text,
  p_model_version text,
  p_variants jsonb,
  p_uncertainty_summary text,
  p_source_snapshot_hash text,
  p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_submission_id uuid;
  v_snapshot jsonb;
  v_snapshot_hash text;
  v_variant jsonb;
  v_ref jsonb;
  v_payload jsonb;
  v_hash text;
  v_existing public.ideenwerk_ai_syntheses%ROWTYPE;
  v_id text;
  v_allowed_impact text[] := ARRAY[]::text[];
  v_allowed_expert text[] := ARRAY[]::text[];
  v_allowed_review text[] := ARRAY[]::text[];
  v_text text;
BEGIN
  IF nullif(btrim(p_model_provider),'') IS NULL OR nullif(btrim(p_model_version),'') IS NULL THEN
    RAISE EXCEPTION 'AI_SYNTHESIS_MODEL_BINDING_REQUIRED';
  END IF;
  IF nullif(btrim(p_idempotency_key),'') IS NULL THEN RAISE EXCEPTION 'AI_SYNTHESIS_IDEMPOTENCY_REQUIRED'; END IF;
  IF jsonb_typeof(p_variants)<>'array' OR jsonb_array_length(p_variants) NOT BETWEEN 2 AND 5 THEN
    RAISE EXCEPTION 'AI_SYNTHESIS_VARIANT_COUNT_INVALID';
  END IF;

  SELECT id INTO v_submission_id FROM public.submissions WHERE public_id=p_public_id LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'AI_SYNTHESIS_SUBMISSION_NOT_FOUND'; END IF;

  SELECT public.ideenwerk_ai_synthesis_source_snapshot(v_submission_id) INTO v_snapshot;
  IF v_snapshot IS NULL OR coalesce((v_snapshot->>'eligible')::boolean,false)=false THEN
    RAISE EXCEPTION 'AI_SYNTHESIS_PREREQUISITES_NOT_CURRENT:%',coalesce(v_snapshot->>'ineligible_reason','unknown');
  END IF;
  v_snapshot_hash := v_snapshot->>'snapshot_hash';
  IF p_source_snapshot_hash IS DISTINCT FROM v_snapshot_hash THEN
    RAISE EXCEPTION 'AI_SYNTHESIS_SOURCE_SNAPSHOT_STALE';
  END IF;

  SELECT coalesce(array_agg(value),ARRAY[]::text[]) INTO v_allowed_impact
  FROM jsonb_array_elements_text(coalesce(v_snapshot#>'{impact_bridge,mapping_refs}','[]'::jsonb));
  SELECT coalesce(array_agg(value),ARRAY[]::text[]) INTO v_allowed_expert
  FROM jsonb_array_elements_text(coalesce(v_snapshot->'expert_input_refs','[]'::jsonb));
  SELECT coalesce(array_agg(value),ARRAY[]::text[]) INTO v_allowed_review
  FROM jsonb_array_elements_text(coalesce(v_snapshot#>'{impact_feedback,review_refs}','[]'::jsonb));

  FOR v_variant IN SELECT value FROM jsonb_array_elements(p_variants)
  LOOP
    IF jsonb_typeof(v_variant)<>'object'
       OR nullif(btrim(v_variant->>'variant_id'),'') IS NULL
       OR nullif(btrim(v_variant->>'title'),'') IS NULL
       OR nullif(btrim(v_variant->>'summary'),'') IS NULL
       OR nullif(btrim(v_variant->>'mechanism'),'') IS NULL
       OR jsonb_typeof(v_variant->'tradeoffs')<>'array'
       OR jsonb_typeof(v_variant->'uncertainties')<>'array'
       OR jsonb_typeof(v_variant->'source_refs')<>'array'
       OR jsonb_array_length(v_variant->'source_refs')=0 THEN
      RAISE EXCEPTION 'AI_SYNTHESIS_VARIANT_SCHEMA_INVALID';
    END IF;
    IF v_variant ?| ARRAY['rank','score','recommended','recommendation','winner','preferred','accept','reject','decision'] THEN
      RAISE EXCEPTION 'AI_SYNTHESIS_POLITICAL_RANKING_FORBIDDEN';
    END IF;
    v_text := lower(v_variant::text);
    IF v_text ~ '(€|\beur\b|%|\bprozent\b|\bmio\.?\b|\bmrd\.?\b|\bmillion(en)?\b|\bmilliard(en)?\b)' THEN
      RAISE EXCEPTION 'AI_SYNTHESIS_NUMERIC_EFFECT_TEXT_FORBIDDEN';
    END IF;
    IF v_text ~ '(\bbeste\b|\bbest option\b|\bempfohlen\b|\bvorzuziehen\b|\bgewinner\b|\branking\b)' THEN
      RAISE EXCEPTION 'AI_SYNTHESIS_POLITICAL_PREFERENCE_FORBIDDEN';
    END IF;

    FOR v_ref IN SELECT value FROM jsonb_array_elements(v_variant->'source_refs')
    LOOP
      IF jsonb_typeof(v_ref)<>'object' OR nullif(v_ref->>'kind','') IS NULL OR nullif(v_ref->>'ref_id','') IS NULL THEN
        RAISE EXCEPTION 'AI_SYNTHESIS_SOURCE_REF_INVALID';
      END IF;
      IF v_ref->>'kind'='citizen_problem' AND v_ref->>'ref_id'='CITIZEN-PROBLEM' THEN
        CONTINUE;
      ELSIF v_ref->>'kind'='impact_map' AND (v_ref->>'ref_id')=ANY(v_allowed_impact) THEN
        CONTINUE;
      ELSIF v_ref->>'kind'='expert_input' AND (v_ref->>'ref_id')=ANY(v_allowed_expert) THEN
        CONTINUE;
      ELSIF v_ref->>'kind'='impact_review' AND (v_ref->>'ref_id')=ANY(v_allowed_review) THEN
        CONTINUE;
      ELSE
        RAISE EXCEPTION 'AI_SYNTHESIS_SOURCE_REF_NOT_CURRENT:%',v_ref->>'ref_id';
      END IF;
    END LOOP;
  END LOOP;

  v_payload := jsonb_build_object(
    'public_id',p_public_id,
    'model_provider',btrim(p_model_provider),
    'model_version',btrim(p_model_version),
    'variants',p_variants,
    'uncertainty_summary',p_uncertainty_summary,
    'source_snapshot_hash',v_snapshot_hash
  );
  v_hash := md5(v_payload::text);

  SELECT * INTO v_existing FROM public.ideenwerk_ai_syntheses WHERE idempotency_key=p_idempotency_key LIMIT 1;
  IF FOUND THEN
    IF v_existing.payload_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'AI_SYNTHESIS_IDEMPOTENCY_CONFLICT'; END IF;
    RETURN jsonb_build_object('synthesis_id',v_existing.synthesis_id,'created_at',v_existing.created_at,'replayed',true,'boundary','multiple_variants_no_ranking_no_decision');
  END IF;

  v_id := 'SYN-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  INSERT INTO public.ideenwerk_ai_syntheses(
    synthesis_id,submission_id,model_provider,model_version,variants,uncertainty_summary,
    source_snapshot,source_snapshot_hash,idempotency_key,payload_hash
  ) VALUES (
    v_id,v_submission_id,btrim(p_model_provider),btrim(p_model_version),p_variants,p_uncertainty_summary,
    v_snapshot,v_snapshot_hash,p_idempotency_key,v_hash
  );

  INSERT INTO public.audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',p_public_id,'ai_synthesis_recorded','system','AI_SYNTHESIS_RECORDED',
    jsonb_build_object(
      'synthesis_id',v_id,
      'model_provider',btrim(p_model_provider),
      'model_version',btrim(p_model_version),
      'variant_count',jsonb_array_length(p_variants),
      'source_snapshot_hash',v_snapshot_hash,
      'impact_review_ref_count',coalesce(jsonb_array_length(v_snapshot#>'{impact_feedback,review_refs}'),0),
      'boundary','multiple_variants_no_ranking_no_accept_reject_no_new_fiscal_effect_feedback_hypotheses_not_facts'
    )
  );

  RETURN jsonb_build_object('synthesis_id',v_id,'created_at',now(),'replayed',false,'boundary','multiple_variants_no_ranking_no_decision');
END;
$$;
REVOKE ALL ON FUNCTION public.ideenwerk_record_ai_synthesis(text,text,text,jsonb,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_record_ai_synthesis(text,text,text,jsonb,text,text,text) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('impact_feedback_contract','044_ideenwerk_impact_feedback',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
