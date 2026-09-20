BEGIN;

-- WERK IDEENWERK migration 037: version-bound Impact Bridge.
-- This bridge only links citizen problem signals to existing WERK reform/data-contract
-- artifacts. It MUST NOT calculate a new fiscal effect, politically rank an idea,
-- accept/reject a proposal, or claim that an unmatched idea has no relevant artifact.
-- Canonical registry: werk-data/ideenwerk-impact-bridge.json version 2026-09-21-v1.
-- IMPACT_BRIDGE_RUNTIME_MAP {"map_id":"IMPACT-FISCAL-DEBT","reform_ids":["DEBT-01","DEBT-02","BUD-01","BUD-02"],"data_contract_ids":["FISCAL-DATA"],"gate_refs":["GAP-FISC-01","GAP-FISC-02","GAP-BASE-01"]}
-- IMPACT_BRIDGE_RUNTIME_MAP {"map_id":"IMPACT-SUBSIDY","reform_ids":["SUB-01"],"data_contract_ids":["SUBSIDY-DATA"],"gate_refs":["GAP-SUB-01","WERK-SUB-001"]}
-- IMPACT_BRIDGE_RUNTIME_MAP {"map_id":"IMPACT-SV-EMPLOYEE","reform_ids":["SV-01"],"data_contract_ids":["FISCAL-DATA"],"gate_refs":["WERK-SV-010","WERK-SV-011"]}
-- IMPACT_BRIDGE_RUNTIME_MAP {"map_id":"IMPACT-TAX-CORPORATE","reform_ids":["TAX-01"],"data_contract_ids":["TAX-DATA","BASELINE-LEGAL"],"gate_refs":["GAP-TAX-01"]}
-- IMPACT_BRIDGE_RUNTIME_MAP {"map_id":"IMPACT-TAX-ENFORCEMENT","reform_ids":["TAX-02"],"data_contract_ids":["TAX-DATA","FISCAL-DATA"],"gate_refs":["WERK-TAX-001"]}

CREATE TABLE IF NOT EXISTS public.ideenwerk_impact_bridge_checks (
  submission_id uuid PRIMARY KEY REFERENCES public.submissions(id) ON DELETE CASCADE,
  result_code text NOT NULL CHECK (result_code IN ('candidate_mapping','no_known_mapping')),
  mappings jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(mappings)='array'),
  registry_version text NOT NULL,
  source_versions jsonb NOT NULL CHECK (jsonb_typeof(source_versions)='object'),
  classifier_version text NOT NULL,
  match_rule text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (result_code='candidate_mapping' AND jsonb_array_length(mappings)>0)
    OR (result_code='no_known_mapping' AND jsonb_array_length(mappings)=0)
  )
);

ALTER TABLE public.ideenwerk_impact_bridge_checks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ideenwerk_impact_bridge_checks FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.ideenwerk_impact_bridge_checks TO service_role;

CREATE INDEX IF NOT EXISTS ideenwerk_impact_bridge_checks_result_idx
  ON public.ideenwerk_impact_bridge_checks(result_code,registry_version,checked_at);

CREATE OR REPLACE FUNCTION public.ideenwerk_current_impact_bridge(p_submission_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN c.registry_version='2026-09-21-v1'
     AND c.source_versions='{"reforms":"2026-09-06-v5","data_contract_registry":"2026-09-07-v17"}'::jsonb
    THEN jsonb_build_object(
      'result_code',c.result_code,
      'mappings',c.mappings,
      'registry_version',c.registry_version,
      'source_versions',c.source_versions,
      'classifier_version',c.classifier_version,
      'match_rule',c.match_rule,
      'checked_at',c.checked_at,
      'boundary','Verknüpft nur bestehende WERK-Reform- und Rechenartefakte; keine neue Wirkungszahl und keine politische Entscheidung.'
    )
    ELSE jsonb_build_object(
      'result_code','revalidation_required',
      'mappings','[]'::jsonb,
      'registry_version',c.registry_version,
      'current_registry_version','2026-09-21-v1',
      'checked_at',c.checked_at,
      'boundary','Veraltete Zuordnung wird nicht als aktueller Wirkungsbezug ausgegeben; erneute Prüfung erforderlich.'
    )
  END
  FROM public.ideenwerk_impact_bridge_checks c
  WHERE c.submission_id=p_submission_id;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_current_impact_bridge(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_current_impact_bridge(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_run_impact_bridge_check(p_public_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sub public.submissions%ROWTYPE;
  v_structured public.structured_proposals%ROWTYPE;
  v_text text;
  v_mappings jsonb := '[]'::jsonb;
  v_rule_parts text[] := ARRAY[]::text[];
  v_result text := 'no_known_mapping';
  v_registry_version constant text := '2026-09-21-v1';
  v_sources constant jsonb := '{"reforms":"2026-09-06-v5","data_contract_registry":"2026-09-07-v17"}'::jsonb;
  v_out jsonb;
BEGIN
  SELECT s.* INTO v_sub
  FROM public.submissions s
  WHERE s.public_id=p_public_id
  LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT sp.* INTO v_structured
  FROM public.structured_proposals sp
  WHERE sp.submission_id=v_sub.id
  LIMIT 1;

  v_text := lower(
    coalesce(v_sub.topic,'') || ' ' ||
    coalesce(v_sub.original_text,'') || ' ' ||
    coalesce(v_structured.problem,'') || ' ' ||
    coalesce(v_structured.proposal,'')
  );

  IF v_text ~ '(schulden|staatsverschuld|budgetdefizit|maastricht.defizit|primärsaldo|primaersaldo|zinsausgab|schuldentilg|refinanzier)' THEN
    v_mappings := v_mappings || jsonb_build_array(jsonb_build_object(
      'map_id','IMPACT-FISCAL-DEBT',
      'reform_ids',jsonb_build_array('DEBT-01','DEBT-02','BUD-01','BUD-02'),
      'data_contract_ids',jsonb_build_array('FISCAL-DATA'),
      'gate_refs',jsonb_build_array('GAP-FISC-01','GAP-FISC-02','GAP-BASE-01')
    ));
    v_rule_parts := array_append(v_rule_parts,'fiscal_debt_signal');
  END IF;

  IF v_text ~ '(förderung|foerderung|förderungen|foerderungen|subvention|förderabbau|foerderabbau|förderprogramm|foerderprogramm)' THEN
    v_mappings := v_mappings || jsonb_build_array(jsonb_build_object(
      'map_id','IMPACT-SUBSIDY',
      'reform_ids',jsonb_build_array('SUB-01'),
      'data_contract_ids',jsonb_build_array('SUBSIDY-DATA'),
      'gate_refs',jsonb_build_array('GAP-SUB-01','WERK-SUB-001')
    ));
    v_rule_parts := array_append(v_rule_parts,'subsidy_signal');
  END IF;

  IF v_text ~ '(arbeitslosenversicherung|\malv\M|sozialversicherung|dienstnehmerbeitrag|krankenversicherungsbeitrag|pensionsversicherungsbeitrag|arbeitnehmerbeitrag)' THEN
    v_mappings := v_mappings || jsonb_build_array(jsonb_build_object(
      'map_id','IMPACT-SV-EMPLOYEE',
      'reform_ids',jsonb_build_array('SV-01'),
      'data_contract_ids',jsonb_build_array('FISCAL-DATA'),
      'gate_refs',jsonb_build_array('WERK-SV-010','WERK-SV-011')
    ));
    v_rule_parts := array_append(v_rule_parts,'employee_sv_signal');
  END IF;

  IF v_text ~ '(körperschaftsteuer|koerperschaftsteuer|\mköst\M|\mkoest\M|unternehmenssteuer)' THEN
    v_mappings := v_mappings || jsonb_build_array(jsonb_build_object(
      'map_id','IMPACT-TAX-CORPORATE',
      'reform_ids',jsonb_build_array('TAX-01'),
      'data_contract_ids',jsonb_build_array('TAX-DATA','BASELINE-LEGAL'),
      'gate_refs',jsonb_build_array('GAP-TAX-01')
    ));
    v_rule_parts := array_append(v_rule_parts,'corporate_tax_signal');
  END IF;

  IF v_text ~ '(gewinnverlager|verrechnungspreis|lizenzmodell|mindestbesteuer|steuervollzug)' THEN
    v_mappings := v_mappings || jsonb_build_array(jsonb_build_object(
      'map_id','IMPACT-TAX-ENFORCEMENT',
      'reform_ids',jsonb_build_array('TAX-02'),
      'data_contract_ids',jsonb_build_array('TAX-DATA','FISCAL-DATA'),
      'gate_refs',jsonb_build_array('WERK-TAX-001')
    ));
    v_rule_parts := array_append(v_rule_parts,'tax_enforcement_signal');
  END IF;

  IF jsonb_array_length(v_mappings)>0 THEN
    v_result := 'candidate_mapping';
  END IF;

  INSERT INTO public.ideenwerk_impact_bridge_checks(
    submission_id,result_code,mappings,registry_version,source_versions,
    classifier_version,match_rule,checked_at
  ) VALUES(
    v_sub.id,v_result,v_mappings,v_registry_version,v_sources,
    'impact-bridge-v1',
    CASE WHEN cardinality(v_rule_parts)=0 THEN 'no_high_specificity_mapping' ELSE array_to_string(v_rule_parts,'+') END,
    now()
  )
  ON CONFLICT(submission_id) DO UPDATE SET
    result_code=excluded.result_code,
    mappings=excluded.mappings,
    registry_version=excluded.registry_version,
    source_versions=excluded.source_versions,
    classifier_version=excluded.classifier_version,
    match_rule=excluded.match_rule,
    checked_at=now();

  INSERT INTO public.audit_events(
    event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload
  ) VALUES(
    'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',v_sub.public_id,'impact_bridge_check_completed','system','IMPACT_BRIDGE_CHECK',
    jsonb_build_object(
      'result_code',v_result,
      'mappings',v_mappings,
      'registry_version',v_registry_version,
      'source_versions',v_sources,
      'classifier_version','impact-bridge-v1',
      'match_rule',CASE WHEN cardinality(v_rule_parts)=0 THEN 'no_high_specificity_mapping' ELSE array_to_string(v_rule_parts,'+') END,
      'boundary','existing_werk_artifact_links_only_no_new_effect_or_political_decision'
    )
  );

  SELECT public.ideenwerk_current_impact_bridge(v_sub.id) INTO v_out;
  RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_run_impact_bridge_check(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_run_impact_bridge_check(text) TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_impact_bridge_on_precheck()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.current_status='precheck' AND OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    PERFORM public.ideenwerk_run_impact_bridge_check(NEW.public_id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_impact_bridge_on_precheck() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_impact_bridge_on_precheck() TO service_role;

DROP TRIGGER IF EXISTS trg_ideenwerk_impact_bridge ON public.submissions;
CREATE TRIGGER trg_ideenwerk_impact_bridge
AFTER UPDATE OF current_status ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_impact_bridge_on_precheck();

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT public_id FROM public.submissions WHERE current_status='precheck' LOOP
    PERFORM public.ideenwerk_run_impact_bridge_check(r.public_id);
  END LOOP;
END;
$$;

-- Preserve the current protected contracts and add only the impact-bridge overlay.
DO $$
BEGIN
  IF to_regprocedure('public.ideenwerk_get_private_status_v13(text,text)') IS NULL THEN
    EXECUTE 'ALTER FUNCTION public.ideenwerk_get_private_status(text,text) RENAME TO ideenwerk_get_private_status_v13';
  END IF;
  IF to_regprocedure('public.ideenwerk_get_privacy_export_v13(text,text)') IS NULL THEN
    EXECUTE 'ALTER FUNCTION public.ideenwerk_get_privacy_export(text,text) RENAME TO ideenwerk_get_privacy_export_v13';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.ideenwerk_get_private_status(
  p_public_id text,
  p_token_hash text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base jsonb;
  v_submission_id uuid;
  v_bridge jsonb;
BEGIN
  v_base := public.ideenwerk_get_private_status_v13(p_public_id,p_token_hash);
  IF v_base IS NULL THEN RETURN NULL; END IF;
  SELECT s.id INTO v_submission_id FROM public.submissions s WHERE s.public_id=p_public_id LIMIT 1;
  SELECT public.ideenwerk_current_impact_bridge(v_submission_id) INTO v_bridge;
  RETURN v_base || jsonb_build_object('impact_bridge_check',v_bridge);
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_get_private_status(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_private_status(text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_get_privacy_export(
  p_public_id text,
  p_token_hash text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base jsonb;
  v_submission_id uuid;
  v_bridge jsonb;
BEGIN
  v_base := public.ideenwerk_get_privacy_export_v13(p_public_id,p_token_hash);
  IF v_base IS NULL THEN RETURN NULL; END IF;
  SELECT s.id INTO v_submission_id FROM public.submissions s WHERE s.public_id=p_public_id LIMIT 1;
  SELECT public.ideenwerk_current_impact_bridge(v_submission_id) INTO v_bridge;
  RETURN v_base || jsonb_build_object('impact_bridge_check',v_bridge);
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_get_privacy_export(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_privacy_export(text,text) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('impact_bridge_contract','037_ideenwerk_impact_bridge',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
