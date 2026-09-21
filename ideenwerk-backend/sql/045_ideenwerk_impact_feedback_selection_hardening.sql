BEGIN;

-- WERK Impact Feedback selection hardening.
-- Resolve CTR-WERK-IMPACT-FEEDBACK-SELECTION-001 by applying the current
-- submission map/reform relevance filter before the bounded candidate LIMIT.
-- Review material remains hypothesis-only; no ranking, causal promotion,
-- provider activation, numeric effect or political decision is introduced.

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
      AND EXISTS(
        SELECT 1
        FROM jsonb_array_elements(coalesce(v_impact->'mappings','[]'::jsonb)) m
        WHERE m->>'map_id'=mp.impact_map_id
          AND EXISTS(
            SELECT 1
            FROM jsonb_array_elements_text(coalesce(m->'reform_ids','[]'::jsonb)) rid
            WHERE rid=mp.reform_id
          )
      )
    ORDER BY ir.created_at DESC, ir.impact_review_id DESC
    LIMIT 12
  LOOP
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
    'selection_order','current_submission_map_reform_before_limit',
    'boundary','Only current source-bound review hypotheses with uncertainty and provenance are exposed; no causal or political adoption is inferred.'
  );
END;
$$;
REVOKE ALL ON FUNCTION public.ideenwerk_ai_feedback_context(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_ai_feedback_context(uuid) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('impact_feedback_selection_contract','045_ideenwerk_impact_feedback_selection_hardening',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
