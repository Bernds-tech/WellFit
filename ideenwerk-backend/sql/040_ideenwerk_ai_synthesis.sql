BEGIN;

-- WERK IDEENWERK migration 040: bounded AI synthesis contract.
-- Purpose: persist multiple source-bound solution variants only after the current
-- Impact Bridge and citizen-visible expert/affected-party evidence are both present.
-- This contract never ranks options, accepts/rejects a proposal, or manufactures a
-- fiscal effect. Numeric fiscal claims remain in the linked WERK source artifacts.

CREATE TABLE IF NOT EXISTS public.ideenwerk_ai_syntheses (
  synthesis_id text PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  model_provider text NOT NULL,
  model_version text NOT NULL,
  variants jsonb NOT NULL CHECK (jsonb_typeof(variants)='array' AND jsonb_array_length(variants) BETWEEN 2 AND 5),
  uncertainty_summary text,
  source_snapshot jsonb NOT NULL CHECK (jsonb_typeof(source_snapshot)='object'),
  source_snapshot_hash text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  payload_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ideenwerk_ai_syntheses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ideenwerk_ai_syntheses FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON TABLE public.ideenwerk_ai_syntheses TO service_role;

CREATE INDEX IF NOT EXISTS ideenwerk_ai_syntheses_submission_created_idx
  ON public.ideenwerk_ai_syntheses(submission_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.ideenwerk_ai_synthesis_append_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'AI_SYNTHESIS_APPEND_ONLY';
END;
$$;

DROP TRIGGER IF EXISTS trg_ideenwerk_ai_synthesis_append_only ON public.ideenwerk_ai_syntheses;
CREATE TRIGGER trg_ideenwerk_ai_synthesis_append_only
BEFORE UPDATE OR DELETE ON public.ideenwerk_ai_syntheses
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_ai_synthesis_append_only();

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
  v_impact_refs jsonb := '[]'::jsonb;
  v_expert_refs jsonb := '[]'::jsonb;
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
  v_experts := coalesce(v_experts,'[]'::jsonb);

  IF v_impact IS NULL THEN
    v_reason := 'impact_bridge_missing';
  ELSIF coalesce(v_impact->>'result_code','')='revalidation_required' THEN
    v_reason := 'impact_bridge_revalidation_required';
  ELSIF coalesce(v_impact->>'result_code','')<>'candidate_mapping' OR jsonb_array_length(coalesce(v_impact->'mappings','[]'::jsonb))=0 THEN
    v_reason := 'impact_mapping_required';
  ELSIF jsonb_array_length(v_experts)=0 THEN
    v_reason := 'citizen_visible_expert_input_required';
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

  v_snapshot := jsonb_build_object(
    'schema_version','2026-09-21-v1',
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
    'eligible',v_eligible,
    'ineligible_reason',v_reason,
    'boundary','source_snapshot_only_no_political_ranking_or_new_fiscal_effect'
  );
  RETURN v_snapshot || jsonb_build_object('snapshot_hash',md5(v_snapshot::text));
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_ai_synthesis_source_snapshot(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_ai_synthesis_source_snapshot(uuid) TO service_role;

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
      'boundary','multiple_variants_no_ranking_no_accept_reject_no_new_fiscal_effect'
    )
  );

  RETURN jsonb_build_object('synthesis_id',v_id,'created_at',now(),'replayed',false,'boundary','multiple_variants_no_ranking_no_decision');
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_record_ai_synthesis(text,text,text,jsonb,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_record_ai_synthesis(text,text,text,jsonb,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_current_ai_synthesis(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ideenwerk_ai_syntheses%ROWTYPE;
  v_snapshot jsonb;
BEGIN
  SELECT * INTO v_row FROM public.ideenwerk_ai_syntheses
  WHERE submission_id=p_submission_id ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT public.ideenwerk_ai_synthesis_source_snapshot(p_submission_id) INTO v_snapshot;
  IF v_snapshot IS NULL OR v_snapshot->>'snapshot_hash' IS DISTINCT FROM v_row.source_snapshot_hash THEN
    RETURN jsonb_build_object(
      'state','revalidation_required',
      'synthesis_id',v_row.synthesis_id,
      'variants','[]'::jsonb,
      'created_at',v_row.created_at,
      'boundary','Quellstand hat sich geändert; frühere KI-Varianten werden nicht als aktuell ausgegeben.'
    );
  END IF;
  RETURN jsonb_build_object(
    'state','current',
    'synthesis_id',v_row.synthesis_id,
    'model_provider',v_row.model_provider,
    'model_version',v_row.model_version,
    'variants',v_row.variants,
    'uncertainty_summary',v_row.uncertainty_summary,
    'source_snapshot',v_row.source_snapshot,
    'created_at',v_row.created_at,
    'boundary','Mehrere nachvollziehbare Varianten ohne politisches Ranking, Annahme/Ablehnung oder neue fiskalische Wirkungszahl.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_current_ai_synthesis(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_current_ai_synthesis(uuid) TO service_role;

-- Preserve current protected citizen contracts and add only the synthesis overlay.
DO $$
BEGIN
  IF to_regprocedure('public.ideenwerk_get_private_status_v15(text,text)') IS NULL THEN
    EXECUTE 'ALTER FUNCTION public.ideenwerk_get_private_status(text,text) RENAME TO ideenwerk_get_private_status_v15';
  END IF;
  IF to_regprocedure('public.ideenwerk_get_privacy_export_v15(text,text)') IS NULL THEN
    EXECUTE 'ALTER FUNCTION public.ideenwerk_get_privacy_export(text,text) RENAME TO ideenwerk_get_privacy_export_v15';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.ideenwerk_get_private_status(p_public_id text,p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base jsonb;
  v_submission_id uuid;
  v_synthesis jsonb;
BEGIN
  v_base := public.ideenwerk_get_private_status_v15(p_public_id,p_token_hash);
  IF v_base IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO v_submission_id FROM public.submissions WHERE public_id=p_public_id LIMIT 1;
  SELECT public.ideenwerk_current_ai_synthesis(v_submission_id) INTO v_synthesis;
  RETURN v_base || jsonb_build_object('ai_synthesis',v_synthesis);
END;
$$;
REVOKE ALL ON FUNCTION public.ideenwerk_get_private_status(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_private_status(text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_get_privacy_export(p_public_id text,p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base jsonb;
  v_submission_id uuid;
  v_synthesis jsonb;
BEGIN
  v_base := public.ideenwerk_get_privacy_export_v15(p_public_id,p_token_hash);
  IF v_base IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO v_submission_id FROM public.submissions WHERE public_id=p_public_id LIMIT 1;
  SELECT public.ideenwerk_current_ai_synthesis(v_submission_id) INTO v_synthesis;
  RETURN v_base || jsonb_build_object('ai_synthesis',v_synthesis);
END;
$$;
REVOKE ALL ON FUNCTION public.ideenwerk_get_privacy_export(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_privacy_export(text,text) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('ai_synthesis_contract','040_ideenwerk_ai_synthesis',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
