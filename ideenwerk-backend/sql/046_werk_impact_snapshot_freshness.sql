BEGIN;

-- WERK impact measurement read-side freshness hardening.
-- Persisted evidence remains append-only historical evidence, but a snapshot may
-- only present itself as current after the stored authoritative source tuple is
-- revalidated against the existing Impact Bridge validator from migration 043.

CREATE OR REPLACE FUNCTION public.werk_impact_measurement_snapshot(p_measurement_plan_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_plan public.werk_impact_measurement_plans%ROWTYPE;
  v_impl public.werk_impact_implementation_events%ROWTYPE;
  v_obs public.werk_impact_observations%ROWTYPE;
  v_review public.werk_impact_reviews%ROWTYPE;
  v_binding jsonb;
  v_state text;
  v_revalidation_reason text;
BEGIN
  SELECT * INTO v_plan
  FROM public.werk_impact_measurement_plans
  WHERE measurement_plan_id=p_measurement_plan_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Current-state projection is fail-closed. Historical rows are not rewritten
  -- or deleted when their source tuple is no longer authoritative.
  BEGIN
    v_binding := public.werk_impact_validate_source_binding(
      v_plan.impact_map_id,
      v_plan.reform_id,
      v_plan.model_or_artifact_ref,
      v_plan.source_version
    );
  EXCEPTION
    WHEN OTHERS THEN
      IF SQLERRM LIKE 'WERK_IMPACT_SOURCE_%' THEN
        v_revalidation_reason := SQLERRM;
        RETURN jsonb_build_object(
          'measurement_plan_id',v_plan.measurement_plan_id,
          'state','revalidation_required',
          'current_reliance',false,
          'historical_evidence_preserved',true,
          'impact_map_id',v_plan.impact_map_id,
          'reform_id',v_plan.reform_id,
          'model_or_artifact_ref',v_plan.model_or_artifact_ref,
          'source_version',v_plan.source_version,
          'source_binding',jsonb_build_object(
            'binding_state','revalidation_required',
            'reason',v_revalidation_reason
          ),
          'attribution_state','not_established_by_system',
          'boundary','Stored append-only evidence remains historical; current-state projection is withheld until authoritative source binding is current.'
        );
      END IF;
      RAISE;
  END;

  SELECT * INTO v_impl
  FROM public.werk_impact_implementation_events
  WHERE measurement_plan_id=p_measurement_plan_id
  ORDER BY implemented_at DESC,created_at DESC
  LIMIT 1;

  SELECT * INTO v_obs
  FROM public.werk_impact_observations
  WHERE measurement_plan_id=p_measurement_plan_id
  ORDER BY period_end DESC,created_at DESC
  LIMIT 1;

  SELECT * INTO v_review
  FROM public.werk_impact_reviews
  WHERE measurement_plan_id=p_measurement_plan_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_impl.implementation_event_id IS NULL THEN
    v_state:='planned_no_implementation_evidence';
  ELSIF v_obs.observation_id IS NULL THEN
    v_state:='implemented_awaiting_observation';
  ELSE
    v_state:='observation_available_attribution_not_established';
  END IF;

  RETURN jsonb_build_object(
    'measurement_plan_id',v_plan.measurement_plan_id,
    'state',v_state,
    'current_reliance',true,
    'historical_evidence_preserved',true,
    'impact_map_id',v_plan.impact_map_id,
    'reform_id',v_plan.reform_id,
    'model_or_artifact_ref',v_plan.model_or_artifact_ref,
    'source_version',v_plan.source_version,
    'source_binding',v_binding,
    'kpi',jsonb_build_object('key',v_plan.kpi_key,'label',v_plan.kpi_label,'unit',v_plan.unit),
    'forecast_or_baseline',jsonb_build_object('period',v_plan.baseline_period,'value',v_plan.baseline_value,'target_value',v_plan.target_value,'methodology_note',v_plan.methodology_note,'boundary','forecast_or_baseline_not_observed_fact'),
    'implementation',CASE WHEN v_impl.implementation_event_id IS NULL THEN NULL ELSE jsonb_build_object('implementation_event_id',v_impl.implementation_event_id,'implemented_at',v_impl.implemented_at,'implementation_version',v_impl.implementation_version,'description',v_impl.description,'source_label',v_impl.source_label,'source_url',v_impl.source_url,'source_reference',v_impl.source_reference) END,
    'latest_observation',CASE WHEN v_obs.observation_id IS NULL THEN NULL ELSE jsonb_build_object('observation_id',v_obs.observation_id,'period_start',v_obs.period_start,'period_end',v_obs.period_end,'observed_value',v_obs.observed_value,'data_version',v_obs.data_version,'source_label',v_obs.source_label,'source_url',v_obs.source_url,'source_reference',v_obs.source_reference,'deviation_from_baseline',v_obs.observed_value-v_plan.baseline_value,'deviation_from_target',CASE WHEN v_plan.target_value IS NULL THEN NULL ELSE v_obs.observed_value-v_plan.target_value END,'boundary','arithmetic_deviation_not_causal_effect') END,
    'latest_review',CASE WHEN v_review.impact_review_id IS NULL THEN NULL ELSE jsonb_build_object('impact_review_id',v_review.impact_review_id,'observation_id',v_review.observation_id,'deviation_explanation',v_review.deviation_explanation,'attribution_hypothesis',v_review.attribution_hypothesis,'alternative_explanations',v_review.alternative_explanations,'improvement_hypothesis',v_review.improvement_hypothesis,'uncertainties',v_review.uncertainties,'source_refs',v_review.source_refs,'boundary','review_only_no_automatic_policy_change') END,
    'attribution_state','not_established_by_system',
    'boundary','Observed movement and arithmetic deviation do not establish causal policy impact.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.werk_impact_measurement_snapshot(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_impact_measurement_snapshot(text) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('impact_measurement_snapshot_freshness_contract','046_werk_impact_snapshot_freshness',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
