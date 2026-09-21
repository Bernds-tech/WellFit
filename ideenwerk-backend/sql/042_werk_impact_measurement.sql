BEGIN;

-- WERK impact measurement: separate forecast/baseline, implementation evidence,
-- observations and review-only attribution/improvement hypotheses.
-- Arithmetic deviations are never labelled as causal effects.

CREATE TABLE IF NOT EXISTS public.werk_impact_measurement_plans (
  measurement_plan_id text PRIMARY KEY,
  impact_map_id text NOT NULL,
  reform_id text NOT NULL,
  model_or_artifact_ref text NOT NULL,
  source_version text NOT NULL,
  kpi_key text NOT NULL,
  kpi_label text NOT NULL,
  unit text NOT NULL,
  baseline_period text NOT NULL,
  baseline_value numeric NOT NULL,
  target_value numeric,
  methodology_note text,
  created_by uuid NOT NULL REFERENCES public.operators(id),
  idempotency_key text NOT NULL UNIQUE,
  payload_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(btrim(impact_map_id)) BETWEEN 3 AND 120),
  CHECK (char_length(btrim(reform_id)) BETWEEN 2 AND 120),
  CHECK (char_length(btrim(model_or_artifact_ref)) BETWEEN 3 AND 500),
  CHECK (char_length(btrim(source_version)) BETWEEN 1 AND 160),
  CHECK (char_length(btrim(kpi_key)) BETWEEN 2 AND 120),
  CHECK (char_length(btrim(kpi_label)) BETWEEN 3 AND 300),
  CHECK (char_length(btrim(unit)) BETWEEN 1 AND 80),
  CHECK (char_length(btrim(baseline_period)) BETWEEN 1 AND 120)
);

CREATE TABLE IF NOT EXISTS public.werk_impact_implementation_events (
  implementation_event_id text PRIMARY KEY,
  measurement_plan_id text NOT NULL REFERENCES public.werk_impact_measurement_plans(measurement_plan_id),
  implemented_at timestamptz NOT NULL,
  implementation_version text NOT NULL,
  description text NOT NULL,
  source_label text NOT NULL,
  source_url text,
  source_reference text,
  created_by uuid NOT NULL REFERENCES public.operators(id),
  idempotency_key text NOT NULL UNIQUE,
  payload_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source_url IS NOT NULL OR source_reference IS NOT NULL),
  CHECK (source_url IS NULL OR source_url ~ '^https?://'),
  CHECK (char_length(btrim(implementation_version)) BETWEEN 1 AND 160),
  CHECK (char_length(btrim(description)) BETWEEN 20 AND 4000),
  CHECK (char_length(btrim(source_label)) BETWEEN 3 AND 300)
);

CREATE TABLE IF NOT EXISTS public.werk_impact_observations (
  observation_id text PRIMARY KEY,
  measurement_plan_id text NOT NULL REFERENCES public.werk_impact_measurement_plans(measurement_plan_id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  observed_value numeric NOT NULL,
  source_label text NOT NULL,
  source_url text,
  source_reference text,
  data_version text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.operators(id),
  idempotency_key text NOT NULL UNIQUE,
  payload_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  CHECK (source_url IS NOT NULL OR source_reference IS NOT NULL),
  CHECK (source_url IS NULL OR source_url ~ '^https?://'),
  CHECK (char_length(btrim(source_label)) BETWEEN 3 AND 300),
  CHECK (char_length(btrim(data_version)) BETWEEN 1 AND 160)
);

CREATE TABLE IF NOT EXISTS public.werk_impact_reviews (
  impact_review_id text PRIMARY KEY,
  measurement_plan_id text NOT NULL REFERENCES public.werk_impact_measurement_plans(measurement_plan_id),
  observation_id text REFERENCES public.werk_impact_observations(observation_id),
  deviation_explanation text,
  attribution_hypothesis text,
  alternative_explanations jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(alternative_explanations)='array'),
  improvement_hypothesis text,
  uncertainties jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(uncertainties)='array'),
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_refs)='array'),
  created_by uuid NOT NULL REFERENCES public.operators(id),
  idempotency_key text NOT NULL UNIQUE,
  payload_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (deviation_explanation IS NULL OR char_length(btrim(deviation_explanation)) BETWEEN 20 AND 5000),
  CHECK (attribution_hypothesis IS NULL OR char_length(btrim(attribution_hypothesis)) BETWEEN 20 AND 5000),
  CHECK (improvement_hypothesis IS NULL OR char_length(btrim(improvement_hypothesis)) BETWEEN 20 AND 5000)
);

ALTER TABLE public.werk_impact_measurement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.werk_impact_implementation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.werk_impact_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.werk_impact_reviews ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.werk_impact_measurement_plans FROM PUBLIC,anon,authenticated;
REVOKE ALL ON TABLE public.werk_impact_implementation_events FROM PUBLIC,anon,authenticated;
REVOKE ALL ON TABLE public.werk_impact_observations FROM PUBLIC,anon,authenticated;
REVOKE ALL ON TABLE public.werk_impact_reviews FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON TABLE public.werk_impact_measurement_plans TO service_role;
GRANT SELECT,INSERT ON TABLE public.werk_impact_implementation_events TO service_role;
GRANT SELECT,INSERT ON TABLE public.werk_impact_observations TO service_role;
GRANT SELECT,INSERT ON TABLE public.werk_impact_reviews TO service_role;

CREATE INDEX IF NOT EXISTS werk_impact_implementation_plan_idx ON public.werk_impact_implementation_events(measurement_plan_id,implemented_at DESC);
CREATE INDEX IF NOT EXISTS werk_impact_observation_plan_period_idx ON public.werk_impact_observations(measurement_plan_id,period_end DESC,created_at DESC);
CREATE INDEX IF NOT EXISTS werk_impact_review_plan_created_idx ON public.werk_impact_reviews(measurement_plan_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.werk_impact_evidence_append_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'WERK_IMPACT_EVIDENCE_APPEND_ONLY';
END;
$$;
REVOKE ALL ON FUNCTION public.werk_impact_evidence_append_only() FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS trg_werk_impact_plan_append_only ON public.werk_impact_measurement_plans;
CREATE TRIGGER trg_werk_impact_plan_append_only BEFORE UPDATE OR DELETE ON public.werk_impact_measurement_plans
FOR EACH ROW EXECUTE FUNCTION public.werk_impact_evidence_append_only();
DROP TRIGGER IF EXISTS trg_werk_impact_implementation_append_only ON public.werk_impact_implementation_events;
CREATE TRIGGER trg_werk_impact_implementation_append_only BEFORE UPDATE OR DELETE ON public.werk_impact_implementation_events
FOR EACH ROW EXECUTE FUNCTION public.werk_impact_evidence_append_only();
DROP TRIGGER IF EXISTS trg_werk_impact_observation_append_only ON public.werk_impact_observations;
CREATE TRIGGER trg_werk_impact_observation_append_only BEFORE UPDATE OR DELETE ON public.werk_impact_observations
FOR EACH ROW EXECUTE FUNCTION public.werk_impact_evidence_append_only();
DROP TRIGGER IF EXISTS trg_werk_impact_review_append_only ON public.werk_impact_reviews;
CREATE TRIGGER trg_werk_impact_review_append_only BEFORE UPDATE OR DELETE ON public.werk_impact_reviews
FOR EACH ROW EXECUTE FUNCTION public.werk_impact_evidence_append_only();

CREATE OR REPLACE FUNCTION public.werk_impact_reviewer_authorized(p_operator_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.operators o
    JOIN public.operator_roles r ON r.operator_id=o.id
    WHERE o.id=p_operator_id AND o.active=true AND r.role='impact_reviewer'
  );
$$;
REVOKE ALL ON FUNCTION public.werk_impact_reviewer_authorized(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_impact_reviewer_authorized(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.werk_record_impact_measurement_plan(
  p_operator_id uuid,
  p_impact_map_id text,
  p_reform_id text,
  p_model_or_artifact_ref text,
  p_source_version text,
  p_kpi_key text,
  p_kpi_label text,
  p_unit text,
  p_baseline_period text,
  p_baseline_value numeric,
  p_target_value numeric,
  p_methodology_note text,
  p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public,extensions
AS $$
DECLARE
  v_payload jsonb; v_hash text; v_existing public.werk_impact_measurement_plans%ROWTYPE; v_id text;
BEGIN
  IF NOT public.werk_impact_reviewer_authorized(p_operator_id) THEN RAISE EXCEPTION 'WERK_IMPACT_REVIEWER_REQUIRED'; END IF;
  IF nullif(btrim(p_idempotency_key),'') IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 16 AND 128 THEN RAISE EXCEPTION 'WERK_IMPACT_IDEMPOTENCY_INVALID'; END IF;
  v_payload:=jsonb_build_object('impact_map_id',p_impact_map_id,'reform_id',p_reform_id,'model_or_artifact_ref',p_model_or_artifact_ref,'source_version',p_source_version,'kpi_key',p_kpi_key,'kpi_label',p_kpi_label,'unit',p_unit,'baseline_period',p_baseline_period,'baseline_value',p_baseline_value,'target_value',p_target_value,'methodology_note',p_methodology_note);
  v_hash:=md5(v_payload::text);
  SELECT * INTO v_existing FROM public.werk_impact_measurement_plans WHERE idempotency_key=p_idempotency_key LIMIT 1;
  IF FOUND THEN
    IF v_existing.payload_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'WERK_IMPACT_IDEMPOTENCY_CONFLICT'; END IF;
    RETURN jsonb_build_object('measurement_plan_id',v_existing.measurement_plan_id,'replayed',true,'boundary','baseline_or_forecast_not_observed_effect');
  END IF;
  v_id:='MEAS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  INSERT INTO public.werk_impact_measurement_plans(measurement_plan_id,impact_map_id,reform_id,model_or_artifact_ref,source_version,kpi_key,kpi_label,unit,baseline_period,baseline_value,target_value,methodology_note,created_by,idempotency_key,payload_hash)
  VALUES(v_id,btrim(p_impact_map_id),btrim(p_reform_id),btrim(p_model_or_artifact_ref),btrim(p_source_version),btrim(p_kpi_key),btrim(p_kpi_label),btrim(p_unit),btrim(p_baseline_period),p_baseline_value,p_target_value,p_methodology_note,p_operator_id,p_idempotency_key,v_hash);
  RETURN jsonb_build_object('measurement_plan_id',v_id,'replayed',false,'boundary','baseline_or_forecast_not_observed_effect');
END;
$$;
REVOKE ALL ON FUNCTION public.werk_record_impact_measurement_plan(uuid,text,text,text,text,text,text,text,text,numeric,numeric,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_record_impact_measurement_plan(uuid,text,text,text,text,text,text,text,text,numeric,numeric,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.werk_record_impact_implementation(
  p_operator_id uuid,p_measurement_plan_id text,p_implemented_at timestamptz,p_implementation_version text,p_description text,p_source_label text,p_source_url text,p_source_reference text,p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE v_payload jsonb;v_hash text;v_existing public.werk_impact_implementation_events%ROWTYPE;v_id text;
BEGIN
  IF NOT public.werk_impact_reviewer_authorized(p_operator_id) THEN RAISE EXCEPTION 'WERK_IMPACT_REVIEWER_REQUIRED'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.werk_impact_measurement_plans WHERE measurement_plan_id=p_measurement_plan_id) THEN RAISE EXCEPTION 'WERK_IMPACT_PLAN_NOT_FOUND'; END IF;
  IF p_source_url IS NULL AND p_source_reference IS NULL THEN RAISE EXCEPTION 'WERK_IMPACT_SOURCE_REQUIRED'; END IF;
  IF nullif(btrim(p_idempotency_key),'') IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 16 AND 128 THEN RAISE EXCEPTION 'WERK_IMPACT_IDEMPOTENCY_INVALID'; END IF;
  v_payload:=jsonb_build_object('measurement_plan_id',p_measurement_plan_id,'implemented_at',p_implemented_at,'implementation_version',p_implementation_version,'description',p_description,'source_label',p_source_label,'source_url',p_source_url,'source_reference',p_source_reference);v_hash:=md5(v_payload::text);
  SELECT * INTO v_existing FROM public.werk_impact_implementation_events WHERE idempotency_key=p_idempotency_key LIMIT 1;
  IF FOUND THEN IF v_existing.payload_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'WERK_IMPACT_IDEMPOTENCY_CONFLICT';END IF;RETURN jsonb_build_object('implementation_event_id',v_existing.implementation_event_id,'replayed',true);END IF;
  v_id:='IMPL-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  INSERT INTO public.werk_impact_implementation_events(implementation_event_id,measurement_plan_id,implemented_at,implementation_version,description,source_label,source_url,source_reference,created_by,idempotency_key,payload_hash)
  VALUES(v_id,p_measurement_plan_id,p_implemented_at,btrim(p_implementation_version),btrim(p_description),btrim(p_source_label),p_source_url,p_source_reference,p_operator_id,p_idempotency_key,v_hash);
  RETURN jsonb_build_object('implementation_event_id',v_id,'replayed',false,'boundary','implementation_evidence_not_impact_proof');
END;$$;
REVOKE ALL ON FUNCTION public.werk_record_impact_implementation(uuid,text,timestamptz,text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_record_impact_implementation(uuid,text,timestamptz,text,text,text,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.werk_record_impact_observation(
  p_operator_id uuid,p_measurement_plan_id text,p_period_start date,p_period_end date,p_observed_value numeric,p_source_label text,p_source_url text,p_source_reference text,p_data_version text,p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE v_payload jsonb;v_hash text;v_existing public.werk_impact_observations%ROWTYPE;v_id text;
BEGIN
  IF NOT public.werk_impact_reviewer_authorized(p_operator_id) THEN RAISE EXCEPTION 'WERK_IMPACT_REVIEWER_REQUIRED'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.werk_impact_measurement_plans WHERE measurement_plan_id=p_measurement_plan_id) THEN RAISE EXCEPTION 'WERK_IMPACT_PLAN_NOT_FOUND'; END IF;
  IF p_period_end<p_period_start THEN RAISE EXCEPTION 'WERK_IMPACT_PERIOD_INVALID'; END IF;
  IF p_source_url IS NULL AND p_source_reference IS NULL THEN RAISE EXCEPTION 'WERK_IMPACT_SOURCE_REQUIRED'; END IF;
  IF nullif(btrim(p_idempotency_key),'') IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 16 AND 128 THEN RAISE EXCEPTION 'WERK_IMPACT_IDEMPOTENCY_INVALID'; END IF;
  v_payload:=jsonb_build_object('measurement_plan_id',p_measurement_plan_id,'period_start',p_period_start,'period_end',p_period_end,'observed_value',p_observed_value,'source_label',p_source_label,'source_url',p_source_url,'source_reference',p_source_reference,'data_version',p_data_version);v_hash:=md5(v_payload::text);
  SELECT * INTO v_existing FROM public.werk_impact_observations WHERE idempotency_key=p_idempotency_key LIMIT 1;
  IF FOUND THEN IF v_existing.payload_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'WERK_IMPACT_IDEMPOTENCY_CONFLICT';END IF;RETURN jsonb_build_object('observation_id',v_existing.observation_id,'replayed',true);END IF;
  v_id:='OBS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  INSERT INTO public.werk_impact_observations(observation_id,measurement_plan_id,period_start,period_end,observed_value,source_label,source_url,source_reference,data_version,created_by,idempotency_key,payload_hash)
  VALUES(v_id,p_measurement_plan_id,p_period_start,p_period_end,p_observed_value,btrim(p_source_label),p_source_url,p_source_reference,btrim(p_data_version),p_operator_id,p_idempotency_key,v_hash);
  RETURN jsonb_build_object('observation_id',v_id,'replayed',false,'boundary','observed_value_not_causal_attribution');
END;$$;
REVOKE ALL ON FUNCTION public.werk_record_impact_observation(uuid,text,date,date,numeric,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_record_impact_observation(uuid,text,date,date,numeric,text,text,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.werk_record_impact_review(
  p_operator_id uuid,p_measurement_plan_id text,p_observation_id text,p_deviation_explanation text,p_attribution_hypothesis text,p_alternative_explanations jsonb,p_improvement_hypothesis text,p_uncertainties jsonb,p_source_refs jsonb,p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions AS $$
DECLARE v_payload jsonb;v_hash text;v_existing public.werk_impact_reviews%ROWTYPE;v_id text;
BEGIN
  IF NOT public.werk_impact_reviewer_authorized(p_operator_id) THEN RAISE EXCEPTION 'WERK_IMPACT_REVIEWER_REQUIRED'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.werk_impact_measurement_plans WHERE measurement_plan_id=p_measurement_plan_id) THEN RAISE EXCEPTION 'WERK_IMPACT_PLAN_NOT_FOUND'; END IF;
  IF p_observation_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.werk_impact_observations WHERE observation_id=p_observation_id AND measurement_plan_id=p_measurement_plan_id) THEN RAISE EXCEPTION 'WERK_IMPACT_OBSERVATION_MISMATCH'; END IF;
  IF jsonb_typeof(coalesce(p_alternative_explanations,'[]'::jsonb))<>'array' OR jsonb_typeof(coalesce(p_uncertainties,'[]'::jsonb))<>'array' OR jsonb_typeof(coalesce(p_source_refs,'[]'::jsonb))<>'array' THEN RAISE EXCEPTION 'WERK_IMPACT_REVIEW_ARRAY_INVALID'; END IF;
  IF nullif(btrim(p_idempotency_key),'') IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 16 AND 128 THEN RAISE EXCEPTION 'WERK_IMPACT_IDEMPOTENCY_INVALID'; END IF;
  v_payload:=jsonb_build_object('measurement_plan_id',p_measurement_plan_id,'observation_id',p_observation_id,'deviation_explanation',p_deviation_explanation,'attribution_hypothesis',p_attribution_hypothesis,'alternative_explanations',coalesce(p_alternative_explanations,'[]'::jsonb),'improvement_hypothesis',p_improvement_hypothesis,'uncertainties',coalesce(p_uncertainties,'[]'::jsonb),'source_refs',coalesce(p_source_refs,'[]'::jsonb));v_hash:=md5(v_payload::text);
  SELECT * INTO v_existing FROM public.werk_impact_reviews WHERE idempotency_key=p_idempotency_key LIMIT 1;
  IF FOUND THEN IF v_existing.payload_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'WERK_IMPACT_IDEMPOTENCY_CONFLICT';END IF;RETURN jsonb_build_object('impact_review_id',v_existing.impact_review_id,'replayed',true);END IF;
  v_id:='IREV-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  INSERT INTO public.werk_impact_reviews(impact_review_id,measurement_plan_id,observation_id,deviation_explanation,attribution_hypothesis,alternative_explanations,improvement_hypothesis,uncertainties,source_refs,created_by,idempotency_key,payload_hash)
  VALUES(v_id,p_measurement_plan_id,p_observation_id,p_deviation_explanation,p_attribution_hypothesis,coalesce(p_alternative_explanations,'[]'::jsonb),p_improvement_hypothesis,coalesce(p_uncertainties,'[]'::jsonb),coalesce(p_source_refs,'[]'::jsonb),p_operator_id,p_idempotency_key,v_hash);
  RETURN jsonb_build_object('impact_review_id',v_id,'replayed',false,'boundary','review_only_no_automatic_policy_change');
END;$$;
REVOKE ALL ON FUNCTION public.werk_record_impact_review(uuid,text,text,text,text,jsonb,text,jsonb,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_record_impact_review(uuid,text,text,text,text,jsonb,text,jsonb,jsonb,text) TO service_role;

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
  v_state text;
BEGIN
  SELECT * INTO v_plan FROM public.werk_impact_measurement_plans WHERE measurement_plan_id=p_measurement_plan_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO v_impl FROM public.werk_impact_implementation_events WHERE measurement_plan_id=p_measurement_plan_id ORDER BY implemented_at DESC,created_at DESC LIMIT 1;
  SELECT * INTO v_obs FROM public.werk_impact_observations WHERE measurement_plan_id=p_measurement_plan_id ORDER BY period_end DESC,created_at DESC LIMIT 1;
  SELECT * INTO v_review FROM public.werk_impact_reviews WHERE measurement_plan_id=p_measurement_plan_id ORDER BY created_at DESC LIMIT 1;
  IF v_impl.implementation_event_id IS NULL THEN v_state:='planned_no_implementation_evidence';
  ELSIF v_obs.observation_id IS NULL THEN v_state:='implemented_awaiting_observation';
  ELSE v_state:='observation_available_attribution_not_established'; END IF;
  RETURN jsonb_build_object(
    'measurement_plan_id',v_plan.measurement_plan_id,
    'state',v_state,
    'impact_map_id',v_plan.impact_map_id,
    'reform_id',v_plan.reform_id,
    'model_or_artifact_ref',v_plan.model_or_artifact_ref,
    'source_version',v_plan.source_version,
    'kpi',jsonb_build_object('key',v_plan.kpi_key,'label',v_plan.kpi_label,'unit',v_plan.unit),
    'forecast_or_baseline',jsonb_build_object('period',v_plan.baseline_period,'value',v_plan.baseline_value,'target_value',v_plan.target_value,'methodology_note',v_plan.methodology_note,'boundary','forecast_or_baseline_not_observed_fact'),
    'implementation',CASE WHEN v_impl.implementation_event_id IS NULL THEN NULL ELSE jsonb_build_object('implementation_event_id',v_impl.implementation_event_id,'implemented_at',v_impl.implemented_at,'implementation_version',v_impl.implementation_version,'description',v_impl.description,'source_label',v_impl.source_label,'source_url',v_impl.source_url,'source_reference',v_impl.source_reference) END,
    'latest_observation',CASE WHEN v_obs.observation_id IS NULL THEN NULL ELSE jsonb_build_object('observation_id',v_obs.observation_id,'period_start',v_obs.period_start,'period_end',v_obs.period_end,'observed_value',v_obs.observed_value,'data_version',v_obs.data_version,'source_label',v_obs.source_label,'source_url',v_obs.source_url,'source_reference',v_obs.source_reference,'deviation_from_baseline',v_obs.observed_value-v_plan.baseline_value,'deviation_from_target',CASE WHEN v_plan.target_value IS NULL THEN NULL ELSE v_obs.observed_value-v_plan.target_value END,'boundary','arithmetic_deviation_not_causal_effect') END,
    'latest_review',CASE WHEN v_review.impact_review_id IS NULL THEN NULL ELSE jsonb_build_object('impact_review_id',v_review.impact_review_id,'observation_id',v_review.observation_id,'deviation_explanation',v_review.deviation_explanation,'attribution_hypothesis',v_review.attribution_hypothesis,'alternative_explanations',v_review.alternative_explanations,'improvement_hypothesis',v_review.improvement_hypothesis,'uncertainties',v_review.uncertainties,'source_refs',v_review.source_refs,'boundary','review_only_no_automatic_policy_change') END,
    'attribution_state','not_established_by_system',
    'boundary','Observed movement and arithmetic deviation do not establish causal policy impact.'
  );
END;$$;
REVOKE ALL ON FUNCTION public.werk_impact_measurement_snapshot(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_impact_measurement_snapshot(text) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('impact_measurement_contract','042_werk_impact_measurement',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
