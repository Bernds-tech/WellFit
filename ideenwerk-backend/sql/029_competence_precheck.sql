BEGIN;

-- WERK IDEENWERK migration 029: conservative competence precheck.
-- The classifier is deliberately narrow: it only matches high-specificity patterns
-- backed by the existing audited competence inventory. Unknown/ambiguous matters
-- remain unclassified for human/legal review. This is not a political decision.

CREATE TABLE IF NOT EXISTS public.ideenwerk_competence_prechecks (
  submission_id uuid PRIMARY KEY REFERENCES public.submissions(id) ON DELETE CASCADE,
  result_code text NOT NULL CHECK (result_code IN ('matched','unclassified')),
  inventory_item_id text,
  inventory_version text NOT NULL DEFAULT '2026-09-02-v1',
  current_class text,
  suggested_level text,
  source_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence numeric(4,3) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  legal_change_required boolean NOT NULL DEFAULT false,
  classifier_version text NOT NULL DEFAULT 'competence-precheck-v1',
  match_rule text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (result_code='matched' AND inventory_item_id IS NOT NULL AND current_class IS NOT NULL)
    OR result_code='unclassified'
  )
);

ALTER TABLE public.ideenwerk_competence_prechecks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ideenwerk_competence_prechecks FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.ideenwerk_competence_prechecks TO service_role;

CREATE INDEX IF NOT EXISTS ideenwerk_competence_prechecks_result_idx
  ON public.ideenwerk_competence_prechecks(result_code,current_class,checked_at);

CREATE OR REPLACE FUNCTION public.ideenwerk_run_competence_precheck(p_public_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sub public.submissions%ROWTYPE;
  v_structured public.structured_proposals%ROWTYPE;
  v_text text;
  v_result text := 'unclassified';
  v_item text := NULL;
  v_class text := NULL;
  v_level text := NULL;
  v_sources jsonb := '[]'::jsonb;
  v_confidence numeric(4,3) := 0;
  v_legal_change boolean := false;
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

  -- Specific regulated topics first. Rules intentionally prefer false negatives
  -- over false certainty. Current competence is read from the existing inventory.
  IF v_text ~ '(glücksspiel|gluecksspiel|casino|spielautomat|sportwetten)' THEN
    v_result := 'matched'; v_item := 'COMP-GAMBLING'; v_class := 'bund'; v_level := 'bund';
    v_sources := '["BVG-10","BMF-GAMBLING-2026"]'::jsonb; v_confidence := 0.970; v_rule := 'gambling_specific';
  ELSIF v_text ~ '(rauchen|rauchverbot|zigarett)' AND v_text ~ '(gastronom|restaurant|wirtshaus|gasthaus|lokal)' THEN
    v_result := 'matched'; v_item := 'COMP-SMOKING'; v_class := 'opening'; v_level := 'bund';
    v_sources := '["TNRSG-12","BVG-10"]'::jsonb; v_confidence := 0.950; v_legal_change := true; v_rule := 'gastronomy_smoking_specific';
  ELSIF v_text ~ '(staatsbürgerschaft|staatsbuergerschaft)' THEN
    v_result := 'matched'; v_item := 'COMP-CITIZENSHIP'; v_class := 'bund_land_exec'; v_level := 'geteilt';
    v_sources := '["BVG-11"]'::jsonb; v_confidence := 0.980; v_rule := 'citizenship_specific';
  ELSIF v_text ~ '(asyl|einwander|auswander|fremdenrecht|aufenthaltsrecht)' THEN
    v_result := 'matched'; v_item := 'COMP-MIGRATION'; v_class := 'bund'; v_level := 'bund';
    v_sources := '["BVG-10"]'::jsonb; v_confidence := 0.950; v_rule := 'migration_specific';
  ELSIF v_text ~ '(raumplanung|flächenwidm|flaechenwidm|bebauungsplan)' THEN
    v_result := 'matched'; v_item := 'COMP-LOCAL-PLANNING'; v_class := 'gemeinde'; v_level := 'gemeinde';
    v_sources := '["BVG-118","OEST-GEMEINDE"]'::jsonb; v_confidence := 0.940; v_rule := 'local_planning_specific';
  ELSIF v_text ~ '(gemeindestraß|gemeindestrass|bestattungswesen|rettungswesen|gemeindevermögen|gemeindevermoegen|gemeindesteuer)' THEN
    v_result := 'matched'; v_item := 'COMP-MUNICIPAL-SERVICES'; v_class := 'gemeinde'; v_level := 'gemeinde';
    v_sources := '["BVG-118","OEST-GEMEINDE"]'::jsonb; v_confidence := 0.940; v_rule := 'municipal_services_specific';
  ELSIF (
      v_text ~ '(landes|gemeinde).*(volksabstimmung|volksbegehren|volksbefragung)'
      OR v_text ~ '(volksabstimmung|volksbegehren|volksbefragung).*(landes|gemeinde)'
    ) THEN
    v_result := 'matched'; v_item := 'COMP-REGIONAL-DEMOCRACY'; v_class := 'land'; v_level := 'land';
    v_sources := '["BVG-15","BVG-10"]'::jsonb; v_confidence := 0.900; v_rule := 'regional_democracy_specific';
  ELSIF v_text ~ '(bundesverfassung|volksabstimmung|volksbegehren|volksbefragung)' THEN
    v_result := 'matched'; v_item := 'COMP-CONST-DEMO'; v_class := 'bund'; v_level := 'bund';
    v_sources := '["BVG-10","BVG-49B"]'::jsonb; v_confidence := 0.900; v_rule := 'federal_democracy_specific';
  ELSIF v_text ~ '(digital|online|portal)' AND v_text ~ '(verwaltung|genehmigung|behörde|behoerde|amt)' THEN
    v_result := 'matched'; v_item := 'COMP-ADMIN-DIGITAL'; v_class := 'mixed'; v_level := 'geteilt';
    v_sources := '["BVG-10","BVG-15","BVG-118"]'::jsonb; v_confidence := 0.850; v_rule := 'digital_admin_specific';
  ELSIF v_text ~ '(finanzausgleich|aufgabenfinanzierung)' OR v_text ~ '(finanzierung).*(bund|länder|laender|gemeinde)' THEN
    v_result := 'matched'; v_item := 'COMP-FINANCING'; v_class := 'mixed'; v_level := 'geteilt';
    v_sources := '["OEST-GEBIET","FAG-INFO"]'::jsonb; v_confidence := 0.880; v_rule := 'federal_financing_specific';
  ELSIF v_text ~ '(bundesfinanz|bundeshaushalt|bundesabgabe|staatsverschuld)' THEN
    v_result := 'matched'; v_item := 'COMP-FINANCE'; v_class := 'bund'; v_level := 'bund';
    v_sources := '["BVG-10"]'::jsonb; v_confidence := 0.930; v_rule := 'federal_finance_specific';
  END IF;

  INSERT INTO public.ideenwerk_competence_prechecks(
    submission_id,result_code,inventory_item_id,inventory_version,current_class,
    suggested_level,source_ids,confidence,legal_change_required,classifier_version,match_rule,checked_at
  ) VALUES(
    v_sub.id,v_result,v_item,'2026-09-02-v1',v_class,v_level,v_sources,
    v_confidence,v_legal_change,'competence-precheck-v1',v_rule,now()
  )
  ON CONFLICT(submission_id) DO UPDATE SET
    result_code=excluded.result_code,
    inventory_item_id=excluded.inventory_item_id,
    inventory_version=excluded.inventory_version,
    current_class=excluded.current_class,
    suggested_level=excluded.suggested_level,
    source_ids=excluded.source_ids,
    confidence=excluded.confidence,
    legal_change_required=excluded.legal_change_required,
    classifier_version=excluded.classifier_version,
    match_rule=excluded.match_rule,
    checked_at=now();

  -- Reuse the existing structured_proposals field but never overwrite an already
  -- populated citizen/operator/earlier-system value.
  IF v_result='matched' AND v_level IS NOT NULL THEN
    UPDATE public.structured_proposals
       SET suggested_level=v_level,updated_at=now()
     WHERE submission_id=v_sub.id
       AND (suggested_level IS NULL OR btrim(suggested_level)='' OR lower(btrim(suggested_level))='tbd');
  END IF;

  INSERT INTO public.audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',v_sub.public_id,'competence_precheck_completed','system','COMPETENCE_PRECHECK',
    jsonb_build_object(
      'result_code',v_result,
      'inventory_item_id',v_item,
      'inventory_version','2026-09-02-v1',
      'current_class',v_class,
      'suggested_level',v_level,
      'source_ids',v_sources,
      'confidence',v_confidence,
      'legal_change_required',v_legal_change,
      'classifier_version','competence-precheck-v1',
      'match_rule',v_rule
    )
  );

  SELECT jsonb_build_object(
    'result_code',cp.result_code,
    'inventory_item_id',cp.inventory_item_id,
    'inventory_version',cp.inventory_version,
    'current_class',cp.current_class,
    'suggested_level',cp.suggested_level,
    'source_ids',cp.source_ids,
    'confidence',cp.confidence,
    'legal_change_required',cp.legal_change_required,
    'classifier_version',cp.classifier_version,
    'checked_at',cp.checked_at
  ) INTO v_out
  FROM public.ideenwerk_competence_prechecks cp
  WHERE cp.submission_id=v_sub.id;

  RETURN v_out;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_run_competence_precheck(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_run_competence_precheck(text) TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_competence_precheck_on_precheck()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.current_status='precheck' AND OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    PERFORM public.ideenwerk_run_competence_precheck(NEW.public_id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_competence_precheck_on_precheck() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_competence_precheck_on_precheck() TO service_role;

DROP TRIGGER IF EXISTS trg_ideenwerk_competence_precheck ON public.submissions;
CREATE TRIGGER trg_ideenwerk_competence_precheck
AFTER UPDATE OF current_status ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_competence_precheck_on_precheck();

-- Existing precheck rows are handled once when the migration is installed.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT public_id FROM public.submissions WHERE current_status='precheck' LOOP
    PERFORM public.ideenwerk_run_competence_precheck(r.public_id);
  END LOOP;
END;
$$;

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
BEGIN
  IF p_public_id IS NULL OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN NULL;
  END IF;

  SELECT s.* INTO v_submission
    FROM submissions s
    JOIN status_access a ON a.submission_id=s.id
   WHERE s.public_id=p_public_id
     AND a.token_hash=p_token_hash
     AND a.revoked_at IS NULL
     AND (a.expires_at IS NULL OR a.expires_at > now())
   LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'event_type',e.event_type,'actor_type',e.actor_type,'reason_code',e.reason_code,
      'payload',e.payload,'created_at',e.created_at
    ) ORDER BY e.created_at),'[]'::jsonb)
    INTO v_history
    FROM audit_events e
   WHERE e.subject_type='submission' AND e.subject_id=v_submission.public_id;

  SELECT jsonb_build_object(
      'depth',e.payload ->> 'review_depth','triage_queue',e.payload ->> 'triage_queue',
      'source',e.payload ->> 'source','assigned_at',e.created_at
    )
    INTO v_review_path
    FROM audit_events e
   WHERE e.subject_type='submission' AND e.subject_id=v_submission.public_id
     AND e.event_type='review_path_assigned'
     AND e.payload ->> 'review_depth' IN ('FAST','STANDARD','DEEP')
   ORDER BY e.created_at DESC LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'request_id',pr.request_id,'request_type',pr.request_type,'status',pr.status,
      'decision_code',pr.decision_reason_code,
      'decision_reason_code',pr.decision_reason_code,
      'created_at',pr.created_at,'review_started_at',pr.review_started_at,'resolved_at',pr.resolved_at
    ) ORDER BY pr.created_at DESC),'[]'::jsonb)
    INTO v_privacy_requests
    FROM privacy_requests pr
   WHERE pr.submission_id=v_submission.id;

  SELECT jsonb_build_object(
      'prompt_id',p.prompt_id,'question',p.question,'reason_code',p.reason_code,
      'status',p.status,'created_at',p.created_at,'answered_at',p.answered_at
    )
    INTO v_clarification_prompt
    FROM citizen_clarification_prompts p
   WHERE p.submission_id=v_submission.id AND p.status='open'
   ORDER BY p.created_at DESC LIMIT 1;

  SELECT jsonb_build_object(
      'result_code',cp.result_code,
      'inventory_item_id',cp.inventory_item_id,
      'inventory_version',cp.inventory_version,
      'current_class',cp.current_class,
      'suggested_level',cp.suggested_level,
      'source_ids',cp.source_ids,
      'confidence',cp.confidence,
      'legal_change_required',cp.legal_change_required,
      'classifier_version',cp.classifier_version,
      'checked_at',cp.checked_at
    )
    INTO v_competence_precheck
    FROM ideenwerk_competence_prechecks cp
   WHERE cp.submission_id=v_submission.id;

  RETURN jsonb_build_object(
    'public_id',v_submission.public_id,
    'original_text',v_submission.original_text,
    'public_text',v_submission.public_text,
    'region',v_submission.region,
    'topic',v_submission.topic,
    'current_status',v_submission.current_status,
    'data_state',v_submission.data_state,
    'created_at',v_submission.created_at,
    'updated_at',v_submission.updated_at,
    'review_path',v_review_path,
    'competence_precheck',v_competence_precheck,
    'clarification_prompt',v_clarification_prompt,
    'privacy_requests',v_privacy_requests,
    'history',v_history
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.ideenwerk_get_privacy_export(
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
  v_structured jsonb;
  v_memberships jsonb;
  v_audit jsonb;
  v_requests jsonb;
  v_prompts jsonb;
  v_competence_precheck jsonb;
BEGIN
  IF p_public_id IS NULL OR p_public_id !~ '^IDEA-[A-F0-9]{16}$'
     OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN RETURN NULL; END IF;

  SELECT s.* INTO v_submission
    FROM submissions s JOIN status_access a ON a.submission_id=s.id
   WHERE s.public_id=p_public_id AND a.token_hash=p_token_hash AND a.revoked_at IS NULL
     AND (a.expires_at IS NULL OR a.expires_at > now())
   LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES('EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',v_submission.public_id,'privacy_export_generated','citizen','PRIVACY_EXPORT','{}'::jsonb);

  SELECT to_jsonb(sp) - 'submission_id' INTO v_structured
    FROM structured_proposals sp WHERE sp.submission_id=v_submission.id LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'cluster_id',c.cluster_id,'title',c.title,'assignment_method',cm.assignment_method,
      'similarity',cm.similarity,'created_at',cm.created_at
    ) ORDER BY cm.created_at),'[]'::jsonb)
    INTO v_memberships
    FROM cluster_members cm JOIN clusters c ON c.id=cm.cluster_id
   WHERE cm.submission_id=v_submission.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'event_type',e.event_type,'actor_type',e.actor_type,'reason_code',e.reason_code,
      'payload',e.payload,'created_at',e.created_at
    ) ORDER BY e.created_at),'[]'::jsonb)
    INTO v_audit
    FROM audit_events e
   WHERE e.subject_type='submission' AND e.subject_id=v_submission.public_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'request_id',pr.request_id,'request_type',pr.request_type,'details',pr.details,
      'status',pr.status,'decision_code',pr.decision_reason_code,
      'decision_reason_code',pr.decision_reason_code,'created_at',pr.created_at,
      'review_started_at',pr.review_started_at,'resolved_at',pr.resolved_at
    ) ORDER BY pr.created_at),'[]'::jsonb)
    INTO v_requests
    FROM privacy_requests pr WHERE pr.submission_id=v_submission.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'prompt_id',p.prompt_id,'question',p.question,'reason_code',p.reason_code,
      'status',p.status,'created_at',p.created_at,'answered_at',p.answered_at
    ) ORDER BY p.created_at),'[]'::jsonb)
    INTO v_prompts
    FROM citizen_clarification_prompts p WHERE p.submission_id=v_submission.id;

  SELECT jsonb_build_object(
      'result_code',cp.result_code,'inventory_item_id',cp.inventory_item_id,
      'inventory_version',cp.inventory_version,'current_class',cp.current_class,
      'suggested_level',cp.suggested_level,'source_ids',cp.source_ids,
      'confidence',cp.confidence,'legal_change_required',cp.legal_change_required,
      'classifier_version',cp.classifier_version,'checked_at',cp.checked_at
    )
    INTO v_competence_precheck
    FROM ideenwerk_competence_prechecks cp WHERE cp.submission_id=v_submission.id;

  RETURN jsonb_build_object(
    'export_type','IDEENWERK_PRIVATE_SUBMISSION_EXPORT','generated_at',now(),
    'submission',jsonb_build_object(
      'public_id',v_submission.public_id,'original_text',v_submission.original_text,
      'public_text',v_submission.public_text,'region',v_submission.region,'topic',v_submission.topic,
      'current_status',v_submission.current_status,'data_state',v_submission.data_state,
      'created_at',v_submission.created_at,'updated_at',v_submission.updated_at,
      'restricted_at',v_submission.restricted_at,'anonymized_at',v_submission.anonymized_at,
      'erased_at',v_submission.erased_at,'tombstone_reason_code',v_submission.tombstone_reason_code
    ),
    'structured_proposal',v_structured,
    'competence_precheck',v_competence_precheck,
    'cluster_memberships',v_memberships,
    'audit_history',v_audit,
    'privacy_requests',v_requests,
    'clarification_prompts',v_prompts
  );
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('competence_precheck_contract','029_competence_precheck',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now();
  END IF;
END;
$$;

COMMIT;
