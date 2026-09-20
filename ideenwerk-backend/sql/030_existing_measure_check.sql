BEGIN;

-- WERK IDEENWERK migration 030: conservative existing-measure overlap precheck.
-- This check reuses the audited WERK government-baseline registries as a bounded
-- reference set. A hit is only a review hint: it never rejects, accepts, scores or
-- changes the citizen's proposal. A no-hit result is explicitly NOT proof that no
-- existing measure exists. Rules intentionally prefer false negatives.

CREATE TABLE IF NOT EXISTS public.ideenwerk_existing_measure_checks (
  submission_id uuid PRIMARY KEY REFERENCES public.submissions(id) ON DELETE CASCADE,
  result_code text NOT NULL CHECK (result_code IN ('possible_overlap','no_known_overlap')),
  matched_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  reference_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(4,3) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  requires_human_review boolean NOT NULL DEFAULT false,
  classifier_version text NOT NULL DEFAULT 'existing-measure-check-v1',
  match_rule text NOT NULL DEFAULT 'no_high_specificity_match',
  checked_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(matched_refs)='array'),
  CHECK (jsonb_typeof(reference_versions)='object'),
  CHECK (
    (result_code='possible_overlap' AND jsonb_array_length(matched_refs) > 0 AND requires_human_review=true)
    OR (result_code='no_known_overlap' AND jsonb_array_length(matched_refs)=0)
  )
);

ALTER TABLE public.ideenwerk_existing_measure_checks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ideenwerk_existing_measure_checks FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.ideenwerk_existing_measure_checks TO service_role;

CREATE INDEX IF NOT EXISTS ideenwerk_existing_measure_checks_result_idx
  ON public.ideenwerk_existing_measure_checks(result_code,requires_human_review,checked_at);

CREATE OR REPLACE FUNCTION public.ideenwerk_run_existing_measure_check(p_public_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sub public.submissions%ROWTYPE;
  v_structured public.structured_proposals%ROWTYPE;
  v_text text;
  v_result text := 'no_known_overlap';
  v_refs jsonb := '[]'::jsonb;
  v_versions jsonb := jsonb_build_object(
    'current_government_measures_register','2026-09-03-v2',
    'implementation_overlap','2026-09-03-v3',
    'government_measure_legal_status','2026-09-05-v3',
    'government_reference_measures','2026-09-03-v1'
  );
  v_confidence numeric(4,3) := 0;
  v_review boolean := false;
  v_rule text := 'no_high_specificity_match';
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

  -- High-specificity aliases only. The referenced content remains authoritative in
  -- werk-data; these aliases are a runtime index, not a second policy registry.
  IF v_text ~ '(dade[xX]|once[- ]only)' OR
     (v_text ~ '(digital|online|portal)' AND v_text ~ '(verwaltung|behörde|behoerde|amt|genehmigung)') THEN
    v_result := 'possible_overlap';
    v_refs := '[
      {"dataset":"current-government-measures-register","id":"GOV-REFORMPARTNERSHIP-ADMIN"},
      {"dataset":"current-government-measures-register","id":"GOV-DADEX"},
      {"dataset":"implementation-overlap","id":"ADM-01"}
    ]'::jsonb;
    v_confidence := 0.960; v_review := true; v_rule := 'digital_administration_baseline';

  ELSIF v_text ~ '(förder|foerder|subvention)' AND v_text ~ '(taskforce|abbau|streich|kürz|kuerz|einspar|bündel|buendel)' THEN
    v_result := 'possible_overlap';
    v_refs := '[
      {"dataset":"current-government-measures-register","id":"GOV-SUBSIDY-2026"},
      {"dataset":"implementation-overlap","id":"FISC-01"}
    ]'::jsonb;
    v_confidence := 0.940; v_review := true; v_rule := 'subsidy_reform_baseline';

  ELSIF v_text ~ '(flaf|familienlastenausgleich|lohnnebenkosten|dienstgeberbeitrag)' THEN
    v_result := 'possible_overlap';
    v_refs := '[
      {"dataset":"current-government-measures-register","id":"GOV-FLAF-2028"},
      {"dataset":"implementation-overlap","id":"OVER-LNK-2028"},
      {"dataset":"government-measure-legal-status","id":"REV-OFF-FLAF"}
    ]'::jsonb;
    v_confidence := 0.980; v_review := true; v_rule := 'flaf_labour_cost_baseline';

  ELSIF v_text ~ '(progressiv).*(körperschaftsteuer|koerperschaftsteuer|köst|koest)' OR
        v_text ~ '(körperschaftsteuer|koerperschaftsteuer|köst|koest).*(progressiv)' THEN
    v_result := 'possible_overlap';
    v_refs := '[
      {"dataset":"current-government-measures-register","id":"GOV-BBG-27-28"},
      {"dataset":"government-measure-legal-status","id":"REV-KOEST"}
    ]'::jsonb;
    v_confidence := 0.990; v_review := true; v_rule := 'progressive_corporate_tax_baseline';

  ELSIF v_text ~ '(paketsteuer|paketsteuergesetz|pakstg)' THEN
    v_result := 'possible_overlap';
    v_refs := '[
      {"dataset":"current-government-measures-register","id":"GOV-BBG-27-28"},
      {"dataset":"government-measure-legal-status","id":"REV-PACKAGE-TAX"}
    ]'::jsonb;
    v_confidence := 0.995; v_review := true; v_rule := 'parcel_tax_baseline';

  ELSIF v_text ~ '(höchstbeitragsgrundlage|hoechstbeitragsgrundlage)' THEN
    v_result := 'possible_overlap';
    v_refs := '[
      {"dataset":"current-government-measures-register","id":"GOV-BBG-27-28"},
      {"dataset":"government-measure-legal-status","id":"REV-HBG"}
    ]'::jsonb;
    v_confidence := 0.990; v_review := true; v_rule := 'maximum_contribution_base_baseline';

  ELSIF v_text ~ '(arbeitslosenversicherung|alv)' AND
        v_text ~ '(dienstnehmerbeitrag|dienstnehmerbeiträge|dienstnehmerbeitraege|reduziert|reduktion|entfall|auslauf)' THEN
    v_result := 'possible_overlap';
    v_refs := '[
      {"dataset":"current-government-measures-register","id":"GOV-BBG-27-28"},
      {"dataset":"government-measure-legal-status","id":"REV-ALV-DN"}
    ]'::jsonb;
    v_confidence := 0.970; v_review := true; v_rule := 'unemployment_employee_contribution_baseline';

  ELSIF v_text ~ '(pensionsanpassung).*(2027)' OR v_text ~ '(2027).*(pensionsanpassung)' THEN
    v_result := 'possible_overlap';
    v_refs := '[
      {"dataset":"current-government-measures-register","id":"GOV-BBG-27-28"},
      {"dataset":"government-measure-legal-status","id":"EXP-BBG-PENS27"}
    ]'::jsonb;
    v_confidence := 0.990; v_review := true; v_rule := 'pension_adjustment_2027_baseline';

  ELSIF v_text ~ '(primärversorgung|primaerversorgung|patientenpfad|digital vor ambulant|ambulant vor stationär|ambulant vor stationaer)' THEN
    v_result := 'possible_overlap';
    v_refs := '[
      {"dataset":"current-government-measures-register","id":"GOV-REFORMPARTNERSHIP-HEALTH"}
    ]'::jsonb;
    v_confidence := 0.920; v_review := true; v_rule := 'health_reform_partnership_baseline';

  ELSIF v_text ~ '(schulautonomie|schulverwaltungssystem|einheitlich.*personalkategor|elementarpädagogik.*berufsmobil|elementarpaedagogik.*berufsmobil)' THEN
    v_result := 'possible_overlap';
    v_refs := '[
      {"dataset":"current-government-measures-register","id":"GOV-REFORMPARTNERSHIP-EDU"}
    ]'::jsonb;
    v_confidence := 0.920; v_review := true; v_rule := 'education_reform_partnership_baseline';

  ELSIF v_text ~ '(bundespersonal|verwaltungspersonal|vbä|vbae)' AND v_text ~ '(abbau|reduz|einspar)' THEN
    v_result := 'possible_overlap';
    v_refs := '[
      {"dataset":"implementation-overlap","id":"OVER-ADMIN-PERSONAL"}
    ]'::jsonb;
    v_confidence := 0.940; v_review := true; v_rule := 'federal_staff_reduction_baseline';
  END IF;

  INSERT INTO public.ideenwerk_existing_measure_checks(
    submission_id,result_code,matched_refs,reference_versions,confidence,
    requires_human_review,classifier_version,match_rule,checked_at
  ) VALUES(
    v_sub.id,v_result,v_refs,v_versions,v_confidence,v_review,
    'existing-measure-check-v1',v_rule,now()
  )
  ON CONFLICT(submission_id) DO UPDATE SET
    result_code=excluded.result_code,
    matched_refs=excluded.matched_refs,
    reference_versions=excluded.reference_versions,
    confidence=excluded.confidence,
    requires_human_review=excluded.requires_human_review,
    classifier_version=excluded.classifier_version,
    match_rule=excluded.match_rule,
    checked_at=now();

  INSERT INTO public.audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',v_sub.public_id,'existing_measure_check_completed','system','EXISTING_MEASURE_CHECK',
    jsonb_build_object(
      'result_code',v_result,
      'matched_refs',v_refs,
      'reference_versions',v_versions,
      'confidence',v_confidence,
      'requires_human_review',v_review,
      'classifier_version','existing-measure-check-v1',
      'match_rule',v_rule,
      'boundary','review_hint_only_no_automatic_decision'
    )
  );

  SELECT jsonb_build_object(
    'result_code',c.result_code,
    'matched_refs',c.matched_refs,
    'reference_versions',c.reference_versions,
    'confidence',c.confidence,
    'requires_human_review',c.requires_human_review,
    'classifier_version',c.classifier_version,
    'checked_at',c.checked_at,
    'boundary','Review-Hinweis auf bekannte WERK-Baseline; kein Ablehnungs-, Annahme- oder Rechtsentscheid.'
  ) INTO v_out
  FROM public.ideenwerk_existing_measure_checks c
  WHERE c.submission_id=v_sub.id;

  RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_run_existing_measure_check(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_run_existing_measure_check(text) TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_existing_measure_check_on_precheck()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.current_status='precheck' AND OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    PERFORM public.ideenwerk_run_existing_measure_check(NEW.public_id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_existing_measure_check_on_precheck() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_existing_measure_check_on_precheck() TO service_role;

DROP TRIGGER IF EXISTS trg_ideenwerk_existing_measure_check ON public.submissions;
CREATE TRIGGER trg_ideenwerk_existing_measure_check
AFTER UPDATE OF current_status ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_existing_measure_check_on_precheck();

-- Existing precheck rows are handled once when the migration is installed.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT public_id FROM public.submissions WHERE current_status='precheck' LOOP
    PERFORM public.ideenwerk_run_existing_measure_check(r.public_id);
  END LOOP;
END;
$$;

-- Extend the already protected citizen status contract. No operator identity or
-- unpublished review notes are exposed.
CREATE OR REPLACE FUNCTION public.ideenwerk_get_private_status(
  p_public_id text,
  p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_submission submissions%ROWTYPE;
  v_history jsonb;
  v_review_path jsonb;
  v_privacy_requests jsonb;
  v_clarification_prompt jsonb;
  v_competence_precheck jsonb;
  v_existing_measure_check jsonb;
BEGIN
  IF p_public_id IS NULL OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN RETURN NULL; END IF;
  SELECT s.* INTO v_submission FROM submissions s JOIN status_access a ON a.submission_id=s.id WHERE s.public_id=p_public_id AND a.token_hash=p_token_hash AND a.revoked_at IS NULL AND (a.expires_at IS NULL OR a.expires_at > now()) LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('event_type',e.event_type,'actor_type',e.actor_type,'reason_code',e.reason_code,'payload',e.payload,'created_at',e.created_at) ORDER BY e.created_at),'[]'::jsonb) INTO v_history FROM audit_events e WHERE e.subject_type='submission' AND e.subject_id=v_submission.public_id;
  SELECT jsonb_build_object('depth',e.payload ->> 'review_depth','triage_queue',e.payload ->> 'triage_queue','source',e.payload ->> 'source','assigned_at',e.created_at) INTO v_review_path FROM audit_events e WHERE e.subject_type='submission' AND e.subject_id=v_submission.public_id AND e.event_type='review_path_assigned' AND e.payload ->> 'review_depth' IN ('FAST','STANDARD','DEEP') ORDER BY e.created_at DESC LIMIT 1;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('request_id',pr.request_id,'request_type',pr.request_type,'status',pr.status,'decision_code',pr.decision_reason_code,'decision_reason_code',pr.decision_reason_code,'created_at',pr.created_at,'review_started_at',pr.review_started_at,'resolved_at',pr.resolved_at) ORDER BY pr.created_at DESC),'[]'::jsonb) INTO v_privacy_requests FROM privacy_requests pr WHERE pr.submission_id=v_submission.id;
  SELECT jsonb_build_object('prompt_id',p.prompt_id,'question',p.question,'reason_code',p.reason_code,'status',p.status,'created_at',p.created_at,'answered_at',p.answered_at) INTO v_clarification_prompt FROM citizen_clarification_prompts p WHERE p.submission_id=v_submission.id AND p.status='open' ORDER BY p.created_at DESC LIMIT 1;
  SELECT jsonb_build_object('result_code',cp.result_code,'inventory_item_id',cp.inventory_item_id,'inventory_version',cp.inventory_version,'current_class',cp.current_class,'suggested_level',cp.suggested_level,'source_ids',cp.source_ids,'confidence',cp.confidence,'legal_change_required',cp.legal_change_required,'classifier_version',cp.classifier_version,'checked_at',cp.checked_at) INTO v_competence_precheck FROM ideenwerk_competence_prechecks cp WHERE cp.submission_id=v_submission.id;
  SELECT jsonb_build_object('result_code',em.result_code,'matched_refs',em.matched_refs,'reference_versions',em.reference_versions,'confidence',em.confidence,'requires_human_review',em.requires_human_review,'classifier_version',em.classifier_version,'checked_at',em.checked_at,'boundary','Review-Hinweis auf bekannte WERK-Baseline; kein Ablehnungs-, Annahme- oder Rechtsentscheid.') INTO v_existing_measure_check FROM ideenwerk_existing_measure_checks em WHERE em.submission_id=v_submission.id;

  RETURN jsonb_build_object(
    'public_id',v_submission.public_id,'original_text',v_submission.original_text,'public_text',v_submission.public_text,
    'region',v_submission.region,'topic',v_submission.topic,'current_status',v_submission.current_status,'data_state',v_submission.data_state,
    'created_at',v_submission.created_at,'updated_at',v_submission.updated_at,'review_path',v_review_path,
    'competence_precheck',v_competence_precheck,'existing_measure_check',v_existing_measure_check,
    'clarification_prompt',v_clarification_prompt,'privacy_requests',v_privacy_requests,'history',v_history
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_get_private_status(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_private_status(text,text) TO service_role;

-- Extend the private GDPR export with the same bounded check result.
CREATE OR REPLACE FUNCTION public.ideenwerk_get_privacy_export(p_public_id text, p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_submission submissions%ROWTYPE; v_structured jsonb; v_memberships jsonb; v_audit jsonb; v_requests jsonb; v_prompts jsonb; v_competence_precheck jsonb; v_existing_measure_check jsonb;
BEGIN
  IF p_public_id IS NULL OR p_public_id !~ '^IDEA-[A-F0-9]{16}$' OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN RETURN NULL; END IF;
  SELECT s.* INTO v_submission FROM submissions s JOIN status_access a ON a.submission_id=s.id WHERE s.public_id=p_public_id AND a.token_hash=p_token_hash AND a.revoked_at IS NULL AND (a.expires_at IS NULL OR a.expires_at > now()) LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload) VALUES('EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),'submission',v_submission.public_id,'privacy_export_generated','citizen','PRIVACY_EXPORT','{}'::jsonb);
  SELECT to_jsonb(sp)-'submission_id' INTO v_structured FROM structured_proposals sp WHERE sp.submission_id=v_submission.id LIMIT 1;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('cluster_id',c.cluster_id,'title',c.title,'assignment_method',cm.assignment_method,'similarity',cm.similarity,'created_at',cm.created_at) ORDER BY cm.created_at),'[]'::jsonb) INTO v_memberships FROM cluster_members cm JOIN clusters c ON c.id=cm.cluster_id WHERE cm.submission_id=v_submission.id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('event_type',e.event_type,'actor_type',e.actor_type,'reason_code',e.reason_code,'payload',e.payload,'created_at',e.created_at) ORDER BY e.created_at),'[]'::jsonb) INTO v_audit FROM audit_events e WHERE e.subject_type='submission' AND e.subject_id=v_submission.public_id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('request_id',pr.request_id,'request_type',pr.request_type,'details',pr.details,'status',pr.status,'decision_code',pr.decision_reason_code,'decision_reason_code',pr.decision_reason_code,'created_at',pr.created_at,'review_started_at',pr.review_started_at,'resolved_at',pr.resolved_at) ORDER BY pr.created_at),'[]'::jsonb) INTO v_requests FROM privacy_requests pr WHERE pr.submission_id=v_submission.id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('prompt_id',p.prompt_id,'question',p.question,'reason_code',p.reason_code,'status',p.status,'created_at',p.created_at,'answered_at',p.answered_at) ORDER BY p.created_at),'[]'::jsonb) INTO v_prompts FROM citizen_clarification_prompts p WHERE p.submission_id=v_submission.id;
  SELECT jsonb_build_object('result_code',cp.result_code,'inventory_item_id',cp.inventory_item_id,'inventory_version',cp.inventory_version,'current_class',cp.current_class,'suggested_level',cp.suggested_level,'source_ids',cp.source_ids,'confidence',cp.confidence,'legal_change_required',cp.legal_change_required,'classifier_version',cp.classifier_version,'checked_at',cp.checked_at) INTO v_competence_precheck FROM ideenwerk_competence_prechecks cp WHERE cp.submission_id=v_submission.id;
  SELECT jsonb_build_object('result_code',em.result_code,'matched_refs',em.matched_refs,'reference_versions',em.reference_versions,'confidence',em.confidence,'requires_human_review',em.requires_human_review,'classifier_version',em.classifier_version,'checked_at',em.checked_at,'boundary','Review-Hinweis auf bekannte WERK-Baseline; kein Ablehnungs-, Annahme- oder Rechtsentscheid.') INTO v_existing_measure_check FROM ideenwerk_existing_measure_checks em WHERE em.submission_id=v_submission.id;
  RETURN jsonb_build_object(
    'export_type','IDEENWERK_PRIVATE_SUBMISSION_EXPORT','generated_at',now(),
    'submission',jsonb_build_object('public_id',v_submission.public_id,'original_text',v_submission.original_text,'public_text',v_submission.public_text,'region',v_submission.region,'topic',v_submission.topic,'current_status',v_submission.current_status,'data_state',v_submission.data_state,'created_at',v_submission.created_at,'updated_at',v_submission.updated_at,'restricted_at',v_submission.restricted_at,'anonymized_at',v_submission.anonymized_at,'erased_at',v_submission.erased_at,'tombstone_reason_code',v_submission.tombstone_reason_code),
    'structured_proposal',v_structured,'competence_precheck',v_competence_precheck,'existing_measure_check',v_existing_measure_check,
    'cluster_memberships',v_memberships,'audit_history',v_audit,'privacy_requests',v_requests,'clarification_prompts',v_prompts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_get_privacy_export(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_privacy_export(text,text) TO service_role;

-- Runtime marker is staging-only. Portable CI intentionally has no runtime table.
DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('existing_measure_check_contract','030_existing_measure_check',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
