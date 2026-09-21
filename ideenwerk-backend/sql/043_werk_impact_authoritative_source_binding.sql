BEGIN;

-- WERK Impact Measurement hardening: compile the existing canonical Impact Bridge
-- registry into a fail-closed runtime validator. This is NOT a second registry.
-- Canonical source: werk-data/ideenwerk-impact-bridge.json
-- Canonical versions: impact bridge 2026-09-21-v1; reforms 2026-09-06-v5;
-- data-contract registry 2026-09-07-v17.
-- Any change in that canonical registry must update this compiled validator and CI
-- parity guard in the same bounded change.

CREATE OR REPLACE FUNCTION public.werk_impact_validate_source_binding(
  p_impact_map_id text,
  p_reform_id text,
  p_model_or_artifact_ref text,
  p_source_version text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_map text := btrim(coalesce(p_impact_map_id,''));
  v_reform text := btrim(coalesce(p_reform_id,''));
  v_artifact text := btrim(coalesce(p_model_or_artifact_ref,''));
  v_source text := btrim(coalesce(p_source_version,''));
  v_reforms text[];
  v_artifacts text[];
  v_current_source constant text := 'impact-bridge=2026-09-21-v1;reforms=2026-09-06-v5;data-contract-registry=2026-09-07-v17';
BEGIN
  CASE v_map
    WHEN 'IMPACT-FISCAL-DEBT' THEN
      v_reforms := ARRAY['DEBT-01','DEBT-02','BUD-01','BUD-02'];
      v_artifacts := ARRAY[
        'werk-data/budget-baseline-2026-2031.json',
        'werk-data/calculation-results-2026.json',
        'werk-data/debt-flow-reconciliation-2026-2031.json'
      ];
    WHEN 'IMPACT-SUBSIDY' THEN
      v_reforms := ARRAY['SUB-01'];
      v_artifacts := ARRAY[
        'werk-data/subsidy-federal-account-results.json',
        'werk-data/subsidy-account-review-priorities.json'
      ];
    WHEN 'IMPACT-SV-EMPLOYEE' THEN
      v_reforms := ARRAY['SV-01'];
      v_artifacts := ARRAY[
        'werk-data/post-debt-employee-sv-model.json',
        'werk-data/post-debt-employee-sv-results.json',
        'werk-data/employee-alv-interval-results.json',
        'werk-data/employee-sv-funding-bridge-results.json'
      ];
    WHEN 'IMPACT-TAX-CORPORATE' THEN
      v_reforms := ARRAY['TAX-01'];
      v_artifacts := ARRAY[
        'werk-data/tax-baseline-2022-2025.json',
        'werk-data/government-measure-legal-status.json'
      ];
    WHEN 'IMPACT-TAX-ENFORCEMENT' THEN
      v_reforms := ARRAY['TAX-02'];
      v_artifacts := ARRAY[
        'werk-data/tax-enforcement-evidence-2025.json',
        'werk-data/tax-enforcement-break-even-results.json'
      ];
    ELSE
      RAISE EXCEPTION 'WERK_IMPACT_SOURCE_MAP_UNKNOWN';
  END CASE;

  IF NOT (v_reform = ANY(v_reforms)) THEN
    RAISE EXCEPTION 'WERK_IMPACT_SOURCE_REFORM_MISMATCH';
  END IF;
  IF NOT (v_artifact = ANY(v_artifacts)) THEN
    RAISE EXCEPTION 'WERK_IMPACT_SOURCE_ARTIFACT_MISMATCH';
  END IF;
  IF v_source IS DISTINCT FROM v_current_source THEN
    RAISE EXCEPTION 'WERK_IMPACT_SOURCE_VERSION_STALE_OR_UNKNOWN';
  END IF;

  RETURN jsonb_build_object(
    'impact_map_id',v_map,
    'reform_id',v_reform,
    'model_or_artifact_ref',v_artifact,
    'source_version',v_current_source,
    'impact_bridge_registry_version','2026-09-21-v1',
    'reforms_version','2026-09-06-v5',
    'data_contract_registry_version','2026-09-07-v17',
    'binding_state','current_authoritative_registry_tuple'
  );
END;
$$;
REVOKE ALL ON FUNCTION public.werk_impact_validate_source_binding(text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_impact_validate_source_binding(text,text,text,text) TO service_role;

-- Keep the existing RPC signature for callers, but validate the full source tuple
-- before idempotency lookup or insert. Unknown, stale or mismatched tuples fail closed.
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
  v_payload jsonb;
  v_hash text;
  v_existing public.werk_impact_measurement_plans%ROWTYPE;
  v_id text;
  v_binding jsonb;
BEGIN
  IF NOT public.werk_impact_reviewer_authorized(p_operator_id) THEN
    RAISE EXCEPTION 'WERK_IMPACT_REVIEWER_REQUIRED';
  END IF;
  IF nullif(btrim(p_idempotency_key),'') IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 16 AND 128 THEN
    RAISE EXCEPTION 'WERK_IMPACT_IDEMPOTENCY_INVALID';
  END IF;

  -- Authoritative source validation must occur before persistence/replay acceptance.
  v_binding := public.werk_impact_validate_source_binding(
    p_impact_map_id,p_reform_id,p_model_or_artifact_ref,p_source_version
  );

  v_payload:=jsonb_build_object(
    'impact_map_id',p_impact_map_id,
    'reform_id',p_reform_id,
    'model_or_artifact_ref',p_model_or_artifact_ref,
    'source_version',p_source_version,
    'kpi_key',p_kpi_key,
    'kpi_label',p_kpi_label,
    'unit',p_unit,
    'baseline_period',p_baseline_period,
    'baseline_value',p_baseline_value,
    'target_value',p_target_value,
    'methodology_note',p_methodology_note,
    'authoritative_source_binding',v_binding
  );
  v_hash:=md5(v_payload::text);

  SELECT * INTO v_existing
  FROM public.werk_impact_measurement_plans
  WHERE idempotency_key=p_idempotency_key
  LIMIT 1;
  IF FOUND THEN
    IF v_existing.payload_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'WERK_IMPACT_IDEMPOTENCY_CONFLICT';
    END IF;
    RETURN jsonb_build_object(
      'measurement_plan_id',v_existing.measurement_plan_id,
      'replayed',true,
      'source_binding',v_binding,
      'boundary','baseline_or_forecast_not_observed_effect'
    );
  END IF;

  v_id:='MEAS-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  INSERT INTO public.werk_impact_measurement_plans(
    measurement_plan_id,impact_map_id,reform_id,model_or_artifact_ref,source_version,
    kpi_key,kpi_label,unit,baseline_period,baseline_value,target_value,methodology_note,
    created_by,idempotency_key,payload_hash
  ) VALUES(
    v_id,btrim(p_impact_map_id),btrim(p_reform_id),btrim(p_model_or_artifact_ref),btrim(p_source_version),
    btrim(p_kpi_key),btrim(p_kpi_label),btrim(p_unit),btrim(p_baseline_period),
    p_baseline_value,p_target_value,p_methodology_note,p_operator_id,p_idempotency_key,v_hash
  );

  RETURN jsonb_build_object(
    'measurement_plan_id',v_id,
    'replayed',false,
    'source_binding',v_binding,
    'boundary','baseline_or_forecast_not_observed_effect'
  );
END;
$$;
REVOKE ALL ON FUNCTION public.werk_record_impact_measurement_plan(uuid,text,text,text,text,text,text,text,text,numeric,numeric,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_record_impact_measurement_plan(uuid,text,text,text,text,text,text,text,text,numeric,numeric,text,text) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('impact_measurement_source_binding_contract','043_werk_impact_authoritative_source_binding',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
