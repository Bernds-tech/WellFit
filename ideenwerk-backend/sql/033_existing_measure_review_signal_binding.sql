BEGIN;

-- Bind a human overlap resolution to the exact existing-measure signal that was
-- reviewed. Re-running an unchanged precheck must not reopen human work; a
-- materially changed baseline signal must supersede the old task and require a
-- fresh review. This remains procedural only and never accepts/rejects an idea.

ALTER TABLE public.ideenwerk_existing_measure_checks
  ADD COLUMN IF NOT EXISTS signal_key text;

CREATE OR REPLACE FUNCTION public.ideenwerk_existing_measure_signal_key(
  p_result_code text,
  p_matched_refs jsonb,
  p_reference_versions jsonb,
  p_classifier_version text
) RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
  SELECT md5(
    coalesce(p_result_code,'') || '|' ||
    coalesce(p_matched_refs,'[]'::jsonb)::text || '|' ||
    coalesce(p_reference_versions,'{}'::jsonb)::text || '|' ||
    coalesce(p_classifier_version,'')
  );
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_existing_measure_signal_key(text,jsonb,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_existing_measure_signal_key(text,jsonb,jsonb,text) TO service_role,postgres;

UPDATE public.ideenwerk_existing_measure_checks
   SET signal_key=public.ideenwerk_existing_measure_signal_key(
     result_code,matched_refs,reference_versions,classifier_version
   )
 WHERE signal_key IS NULL;

ALTER TABLE public.ideenwerk_existing_measure_checks
  ALTER COLUMN signal_key SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname='ideenwerk_existing_measure_checks_signal_key_format'
       AND conrelid='public.ideenwerk_existing_measure_checks'::regclass
  ) THEN
    ALTER TABLE public.ideenwerk_existing_measure_checks
      ADD CONSTRAINT ideenwerk_existing_measure_checks_signal_key_format
      CHECK (signal_key ~ '^[a-f0-9]{32}$');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.ideenwerk_set_existing_measure_signal_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.signal_key := public.ideenwerk_existing_measure_signal_key(
    NEW.result_code,NEW.matched_refs,NEW.reference_versions,NEW.classifier_version
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ideenwerk_existing_measure_signal_key
  ON public.ideenwerk_existing_measure_checks;
CREATE TRIGGER trg_ideenwerk_existing_measure_signal_key
BEFORE INSERT OR UPDATE OF result_code,matched_refs,reference_versions,classifier_version
ON public.ideenwerk_existing_measure_checks
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_set_existing_measure_signal_key();

CREATE TABLE IF NOT EXISTS public.ideenwerk_existing_measure_review_bindings (
  task_id uuid PRIMARY KEY REFERENCES public.review_tasks(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  signal_key text NOT NULL CHECK (signal_key ~ '^[a-f0-9]{32}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ideenwerk_existing_measure_review_bindings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ideenwerk_existing_measure_review_bindings FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.ideenwerk_existing_measure_review_bindings TO service_role;

CREATE INDEX IF NOT EXISTS ideenwerk_existing_measure_review_bindings_signal_idx
  ON public.ideenwerk_existing_measure_review_bindings(submission_id,signal_key,created_at);

-- Backfill legacy overlap tasks to the currently known signal. Staging has no
-- live citizen rows at migration time; this keeps fresh/portable databases sane.
INSERT INTO public.ideenwerk_existing_measure_review_bindings(task_id,submission_id,signal_key)
SELECT t.id,s.id,em.signal_key
  FROM public.review_tasks t
  JOIN public.submissions s
    ON t.subject_type='submission' AND t.subject_id=s.public_id
  JOIN public.ideenwerk_existing_measure_checks em ON em.submission_id=s.id
 WHERE t.review_type='existing_measure_overlap'
ON CONFLICT(task_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ideenwerk_enqueue_existing_measure_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_public_id text;
  v_task_uuid uuid;
  v_task_id text;
  v_superseded integer := 0;
BEGIN
  SELECT s.public_id INTO v_public_id
    FROM public.submissions s
   WHERE s.id=NEW.submission_id;

  IF v_public_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.result_code='possible_overlap' AND NEW.requires_human_review=true THEN
    -- An active task for an older signal must not be decided after the evidence
    -- changed. Cancel it first, then open exactly one task for the new signal.
    UPDATE public.review_tasks t
       SET status='cancelled'
      FROM public.ideenwerk_existing_measure_review_bindings b
     WHERE b.task_id=t.id
       AND b.submission_id=NEW.submission_id
       AND b.signal_key<>NEW.signal_key
       AND t.review_type='existing_measure_overlap'
       AND t.status IN ('open','assigned');
    GET DIAGNOSTICS v_superseded = ROW_COUNT;

    IF v_superseded > 0 THEN
      INSERT INTO public.audit_events(
        event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload
      ) VALUES (
        'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
        'submission',v_public_id,'existing_measure_review_superseded','system',
        'EXISTING_MEASURE_SIGNAL_CHANGED',
        jsonb_build_object(
          'superseded_tasks',v_superseded,
          'boundary','evidence_revision_only_no_automatic_proposal_decision'
        )
      );
    END IF;

    -- A completed decision on this exact signal remains valid. Re-running the
    -- classifier with identical evidence must therefore be idempotent.
    IF EXISTS (
      SELECT 1
        FROM public.review_tasks t
        JOIN public.ideenwerk_existing_measure_review_bindings b ON b.task_id=t.id
        JOIN public.review_decisions d ON d.task_id=t.id
       WHERE b.submission_id=NEW.submission_id
         AND b.signal_key=NEW.signal_key
         AND t.review_type='existing_measure_overlap'
         AND d.action='resolve_existing_measure_overlap'
    ) THEN
      RETURN NEW;
    END IF;

    IF EXISTS (
      SELECT 1
        FROM public.review_tasks t
        JOIN public.ideenwerk_existing_measure_review_bindings b ON b.task_id=t.id
       WHERE b.submission_id=NEW.submission_id
         AND b.signal_key=NEW.signal_key
         AND t.review_type='existing_measure_overlap'
         AND t.status IN ('open','assigned')
    ) THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.review_tasks(
      task_id,subject_type,subject_id,review_type,required_role,status,priority
    ) VALUES (
      'TASK-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
      'submission',v_public_id,'existing_measure_overlap','impact_reviewer','open',75
    )
    ON CONFLICT DO NOTHING
    RETURNING id,task_id INTO v_task_uuid,v_task_id;

    IF v_task_uuid IS NOT NULL THEN
      INSERT INTO public.ideenwerk_existing_measure_review_bindings(task_id,submission_id,signal_key)
      VALUES(v_task_uuid,NEW.submission_id,NEW.signal_key)
      ON CONFLICT(task_id) DO UPDATE SET
        submission_id=excluded.submission_id,
        signal_key=excluded.signal_key;

      INSERT INTO public.audit_events(
        event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload
      ) VALUES (
        'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
        'submission',v_public_id,'existing_measure_review_enqueued','system',
        'EXISTING_MEASURE_REVIEW_REQUIRED',
        jsonb_build_object(
          'review_type','existing_measure_overlap',
          'required_role','impact_reviewer',
          'priority',75,
          'matched_refs',NEW.matched_refs,
          'boundary','human_review_required_no_automatic_decision'
        )
      );
    END IF;
  ELSE
    UPDATE public.review_tasks
       SET status='cancelled'
     WHERE subject_type='submission'
       AND subject_id=v_public_id
       AND review_type='existing_measure_overlap'
       AND status IN ('open','assigned');
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_enqueue_existing_measure_review() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_enqueue_existing_measure_review() TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_validate_existing_measure_review_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_task public.review_tasks%ROWTYPE;
  v_check public.ideenwerk_existing_measure_checks%ROWTYPE;
  v_bound_signal_key text;
BEGIN
  SELECT * INTO v_task FROM public.review_tasks WHERE id=NEW.task_id;
  IF NOT FOUND OR v_task.review_type IS DISTINCT FROM 'existing_measure_overlap' THEN
    RETURN NEW;
  END IF;

  IF v_task.subject_type IS DISTINCT FROM 'submission' THEN
    RAISE EXCEPTION 'EXISTING_MEASURE_REVIEW_INVALID_SUBJECT';
  END IF;

  IF NEW.action IS DISTINCT FROM 'resolve_existing_measure_overlap' THEN
    RAISE EXCEPTION 'EXISTING_MEASURE_REVIEW_ACTION_REQUIRED';
  END IF;

  IF NEW.reason_code IS NULL OR NEW.reason_code NOT IN (
    'BASELINE_OVERLAP_CONFIRMED',
    'BASELINE_OVERLAP_PARTIAL',
    'NO_MATERIAL_OVERLAP'
  ) THEN
    RAISE EXCEPTION 'EXISTING_MEASURE_REVIEW_REASON_INVALID';
  END IF;

  IF NEW.rationale IS NULL OR char_length(btrim(NEW.rationale)) < 12 OR char_length(NEW.rationale) > 2000 THEN
    RAISE EXCEPTION 'EXISTING_MEASURE_REVIEW_RATIONALE_REQUIRED';
  END IF;

  SELECT em.* INTO v_check
    FROM public.ideenwerk_existing_measure_checks em
    JOIN public.submissions s ON s.id=em.submission_id
   WHERE s.public_id=v_task.subject_id
   LIMIT 1;

  IF NOT FOUND OR v_check.result_code IS DISTINCT FROM 'possible_overlap' OR NOT v_check.requires_human_review THEN
    RAISE EXCEPTION 'EXISTING_MEASURE_REVIEW_NO_ACTIVE_SIGNAL';
  END IF;

  SELECT b.signal_key INTO v_bound_signal_key
    FROM public.ideenwerk_existing_measure_review_bindings b
   WHERE b.task_id=NEW.task_id;

  IF v_bound_signal_key IS NULL OR v_bound_signal_key IS DISTINCT FROM v_check.signal_key THEN
    RAISE EXCEPTION 'EXISTING_MEASURE_REVIEW_STALE_SIGNAL';
  END IF;

  NEW.payload := coalesce(NEW.payload,'{}'::jsonb) || jsonb_build_object(
    'existing_measure_signal_key',v_check.signal_key
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_validate_existing_measure_review_decision() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_validate_existing_measure_review_decision() TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_audit_existing_measure_review_resolution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_task public.review_tasks%ROWTYPE;
BEGIN
  SELECT * INTO v_task FROM public.review_tasks WHERE id=NEW.task_id;
  IF NOT FOUND OR v_task.review_type IS DISTINCT FROM 'existing_measure_overlap' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_events(
    event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload
  ) VALUES (
    'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',v_task.subject_id,'existing_measure_review_resolved','operator',NEW.reason_code,
    jsonb_build_object(
      'task_id',v_task.task_id,
      'resolution_code',NEW.reason_code,
      'signal_key',NEW.payload ->> 'existing_measure_signal_key',
      'boundary','baseline_overlap_resolution_only_no_automatic_accept_or_reject'
    )
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_audit_existing_measure_review_resolution() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_audit_existing_measure_review_resolution() TO service_role;

-- Protected citizen views only expose a resolution that belongs to the current
-- signal. Historical rationale/operator identity remain internal audit data.
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
  v_existing_measure_review jsonb;
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
  SELECT jsonb_build_object(
      'resolution_code',d.reason_code,
      'resolved_at',d.created_at,
      'boundary','Menschliche Prüfung der möglichen Baseline-Überschneidung; keine Annahme oder Ablehnung der Bürgeridee.'
    ) INTO v_existing_measure_review
    FROM review_tasks t
    JOIN review_decisions d ON d.task_id=t.id
    JOIN ideenwerk_existing_measure_review_bindings b ON b.task_id=t.id
    JOIN ideenwerk_existing_measure_checks em ON em.submission_id=b.submission_id AND em.signal_key=b.signal_key
   WHERE b.submission_id=v_submission.id
     AND t.subject_type='submission'
     AND t.subject_id=v_submission.public_id
     AND t.review_type='existing_measure_overlap'
     AND d.action='resolve_existing_measure_overlap'
   ORDER BY d.created_at DESC LIMIT 1;

  RETURN jsonb_build_object(
    'public_id',v_submission.public_id,'original_text',v_submission.original_text,'public_text',v_submission.public_text,
    'region',v_submission.region,'topic',v_submission.topic,'current_status',v_submission.current_status,'data_state',v_submission.data_state,
    'created_at',v_submission.created_at,'updated_at',v_submission.updated_at,'review_path',v_review_path,
    'competence_precheck',v_competence_precheck,'existing_measure_check',v_existing_measure_check,'existing_measure_review',v_existing_measure_review,
    'clarification_prompt',v_clarification_prompt,'privacy_requests',v_privacy_requests,'history',v_history
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_get_private_status(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_private_status(text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_get_privacy_export(p_public_id text, p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_submission submissions%ROWTYPE; v_structured jsonb; v_memberships jsonb; v_audit jsonb; v_requests jsonb; v_prompts jsonb; v_competence_precheck jsonb; v_existing_measure_check jsonb; v_existing_measure_review jsonb;
BEGIN
  IF p_public_id IS NULL OR p_public_id !~ '^IDEA-[A-F0-9]{16}$' OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN RETURN NULL; END IF;
  SELECT s.* INTO v_submission FROM submissions s JOIN status_access a ON a.submission_id=s.id WHERE s.public_id=p_public_id AND a.token_hash=p_token_hash AND a.revoked_at IS NULL AND (a.expires_at IS NULL OR a.expires_at > now()) LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload) VALUES('EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),'submission',v_submission.public_id,'privacy_export_generated','citizen','PRIVACY_EXPORT','{}'::jsonb);
  SELECT to_jsonb(sp)-'submission_id' INTO v_structured FROM structured_proposals sp WHERE sp.submission_id=v_submission.id LIMIT 1;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('cluster_id',c.cluster_id,'title',c.title,'assignment_method',cm.assignment_method,'similarity',cm.similarity,'created_at',cm.created_at) ORDER BY cm.created_at),'[]'::jsonb) INTO v_memberships FROM cluster_members cm JOIN clusters c ON c.id=cm.cluster_id WHERE cm.submission_id=v_submission.id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('event_type',e.event_type,'actor_type',e.actor_type,'reason_code',e.reason_code,'payload',e.payload,'created_at',e.created_at) ORDER BY e.created_at),'[]'::jsonb) INTO v_audit FROM audit_events e WHERE e.subject_type='submission' AND e.subject_id=v_submission.public_id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('request_id',pr.request_id,'request_type',pr.request_type,'details',pr.details,'status',pr.status,'decision_code',pr.decision_reason_code,'decision_reason_code',pr.decision_reason_code,'created_at',pr.created_at,'review_started_at',pr.review_started_at,'resolved_at',pr.resolved_at) ORDER BY pr.created_at DESC),'[]'::jsonb) INTO v_requests FROM privacy_requests pr WHERE pr.submission_id=v_submission.id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('prompt_id',p.prompt_id,'question',p.question,'reason_code',p.reason_code,'status',p.status,'created_at',p.created_at,'answered_at',p.answered_at) ORDER BY p.created_at),'[]'::jsonb) INTO v_prompts FROM citizen_clarification_prompts p WHERE p.submission_id=v_submission.id;
  SELECT jsonb_build_object('result_code',cp.result_code,'inventory_item_id',cp.inventory_item_id,'inventory_version',cp.inventory_version,'current_class',cp.current_class,'suggested_level',cp.suggested_level,'source_ids',cp.source_ids,'confidence',cp.confidence,'legal_change_required',cp.legal_change_required,'classifier_version',cp.classifier_version,'checked_at',cp.checked_at) INTO v_competence_precheck FROM ideenwerk_competence_prechecks cp WHERE cp.submission_id=v_submission.id;
  SELECT jsonb_build_object('result_code',em.result_code,'matched_refs',em.matched_refs,'reference_versions',em.reference_versions,'confidence',em.confidence,'requires_human_review',em.requires_human_review,'classifier_version',em.classifier_version,'checked_at',em.checked_at,'boundary','Review-Hinweis auf bekannte WERK-Baseline; kein Ablehnungs-, Annahme- oder Rechtsentscheid.') INTO v_existing_measure_check FROM ideenwerk_existing_measure_checks em WHERE em.submission_id=v_submission.id;
  SELECT jsonb_build_object(
      'resolution_code',d.reason_code,
      'resolved_at',d.created_at,
      'boundary','Menschliche Prüfung der möglichen Baseline-Überschneidung; keine Annahme oder Ablehnung der Bürgeridee.'
    ) INTO v_existing_measure_review
    FROM review_tasks t
    JOIN review_decisions d ON d.task_id=t.id
    JOIN ideenwerk_existing_measure_review_bindings b ON b.task_id=t.id
    JOIN ideenwerk_existing_measure_checks em ON em.submission_id=b.submission_id AND em.signal_key=b.signal_key
   WHERE b.submission_id=v_submission.id
     AND t.subject_type='submission'
     AND t.subject_id=v_submission.public_id
     AND t.review_type='existing_measure_overlap'
     AND d.action='resolve_existing_measure_overlap'
   ORDER BY d.created_at DESC LIMIT 1;
  RETURN jsonb_build_object(
    'export_type','IDEENWERK_PRIVATE_SUBMISSION_EXPORT','generated_at',now(),
    'submission',jsonb_build_object('public_id',v_submission.public_id,'original_text',v_submission.original_text,'public_text',v_submission.public_text,'region',v_submission.region,'topic',v_submission.topic,'current_status',v_submission.current_status,'data_state',v_submission.data_state,'created_at',v_submission.created_at,'updated_at',v_submission.updated_at,'restricted_at',v_submission.restricted_at,'anonymized_at',v_submission.anonymized_at,'erased_at',v_submission.erased_at,'tombstone_reason_code',v_submission.tombstone_reason_code),
    'structured_proposal',v_structured,'competence_precheck',v_competence_precheck,'existing_measure_check',v_existing_measure_check,'existing_measure_review',v_existing_measure_review,
    'cluster_memberships',v_memberships,'audit_history',v_audit,'privacy_requests',v_requests,'clarification_prompts',v_prompts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_get_privacy_export(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_privacy_export(text,text) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('existing_measure_review_signal_binding_contract','033_existing_measure_review_signal_binding',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
