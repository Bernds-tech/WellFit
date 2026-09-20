BEGIN;

-- WERK IDEENWERK migration 035: route ambiguous or legal-change competence
-- prechecks into a bounded human legal review. The review classifies procedural
-- competence only; it MUST NOT accept/reject or politically score a citizen idea.

ALTER TABLE public.ideenwerk_competence_prechecks
  ADD COLUMN IF NOT EXISTS signal_key text;

CREATE OR REPLACE FUNCTION public.ideenwerk_competence_signal_key(
  p_result_code text,
  p_inventory_item_id text,
  p_inventory_version text,
  p_current_class text,
  p_suggested_level text,
  p_source_ids jsonb,
  p_confidence numeric,
  p_legal_change_required boolean,
  p_classifier_version text
) RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog, public
AS $$
  SELECT md5(
    coalesce(p_result_code,'') || '|' ||
    coalesce(p_inventory_item_id,'') || '|' ||
    coalesce(p_inventory_version,'') || '|' ||
    coalesce(p_current_class,'') || '|' ||
    coalesce(p_suggested_level,'') || '|' ||
    coalesce(p_source_ids,'[]'::jsonb)::text || '|' ||
    coalesce(p_confidence::text,'') || '|' ||
    coalesce(p_legal_change_required::text,'') || '|' ||
    coalesce(p_classifier_version,'')
  );
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_competence_signal_key(text,text,text,text,text,jsonb,numeric,boolean,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_competence_signal_key(text,text,text,text,text,jsonb,numeric,boolean,text)
  TO service_role,postgres;

UPDATE public.ideenwerk_competence_prechecks
   SET signal_key=public.ideenwerk_competence_signal_key(
     result_code,inventory_item_id,inventory_version,current_class,suggested_level,
     source_ids,confidence,legal_change_required,classifier_version
   )
 WHERE signal_key IS NULL;

ALTER TABLE public.ideenwerk_competence_prechecks
  ALTER COLUMN signal_key SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname='ideenwerk_competence_prechecks_signal_key_format'
       AND conrelid='public.ideenwerk_competence_prechecks'::regclass
  ) THEN
    ALTER TABLE public.ideenwerk_competence_prechecks
      ADD CONSTRAINT ideenwerk_competence_prechecks_signal_key_format
      CHECK (signal_key ~ '^[a-f0-9]{32}$');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.ideenwerk_set_competence_signal_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.signal_key := public.ideenwerk_competence_signal_key(
    NEW.result_code,NEW.inventory_item_id,NEW.inventory_version,NEW.current_class,
    NEW.suggested_level,NEW.source_ids,NEW.confidence,NEW.legal_change_required,
    NEW.classifier_version
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_set_competence_signal_key() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_set_competence_signal_key() TO service_role,postgres;

DROP TRIGGER IF EXISTS trg_ideenwerk_competence_signal_key
  ON public.ideenwerk_competence_prechecks;
CREATE TRIGGER trg_ideenwerk_competence_signal_key
BEFORE INSERT OR UPDATE OF
  result_code,inventory_item_id,inventory_version,current_class,suggested_level,
  source_ids,confidence,legal_change_required,classifier_version
ON public.ideenwerk_competence_prechecks
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_set_competence_signal_key();

CREATE TABLE IF NOT EXISTS public.ideenwerk_competence_review_bindings (
  task_id uuid PRIMARY KEY REFERENCES public.review_tasks(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  signal_key text NOT NULL CHECK (signal_key ~ '^[a-f0-9]{32}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ideenwerk_competence_review_bindings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ideenwerk_competence_review_bindings FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.ideenwerk_competence_review_bindings TO service_role;

CREATE INDEX IF NOT EXISTS ideenwerk_competence_review_bindings_signal_idx
  ON public.ideenwerk_competence_review_bindings(submission_id,signal_key,created_at);

CREATE OR REPLACE FUNCTION public.ideenwerk_enqueue_competence_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_public_id text;
  v_task_uuid uuid;
  v_superseded integer := 0;
BEGIN
  SELECT s.public_id INTO v_public_id
    FROM public.submissions s
   WHERE s.id=NEW.submission_id;

  IF v_public_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.result_code='unclassified' OR NEW.legal_change_required=true THEN
    UPDATE public.review_tasks t
       SET status='cancelled'
      FROM public.ideenwerk_competence_review_bindings b
     WHERE b.task_id=t.id
       AND b.submission_id=NEW.submission_id
       AND b.signal_key<>NEW.signal_key
       AND t.review_type='competence_precheck'
       AND t.status IN ('open','assigned');
    GET DIAGNOSTICS v_superseded = ROW_COUNT;

    IF v_superseded > 0 THEN
      INSERT INTO public.audit_events(
        event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload
      ) VALUES (
        'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
        'submission',v_public_id,'competence_review_superseded','system',
        'COMPETENCE_SIGNAL_CHANGED',
        jsonb_build_object(
          'superseded_tasks',v_superseded,
          'boundary','competence_evidence_revision_only_no_automatic_proposal_decision'
        )
      );
    END IF;

    IF EXISTS (
      SELECT 1
        FROM public.review_tasks t
        JOIN public.ideenwerk_competence_review_bindings b ON b.task_id=t.id
        JOIN public.review_decisions d ON d.task_id=t.id
       WHERE b.submission_id=NEW.submission_id
         AND b.signal_key=NEW.signal_key
         AND t.review_type='competence_precheck'
         AND d.action='resolve_competence_precheck'
    ) THEN
      RETURN NEW;
    END IF;

    IF EXISTS (
      SELECT 1
        FROM public.review_tasks t
        JOIN public.ideenwerk_competence_review_bindings b ON b.task_id=t.id
       WHERE b.submission_id=NEW.submission_id
         AND b.signal_key=NEW.signal_key
         AND t.review_type='competence_precheck'
         AND t.status IN ('open','assigned')
    ) THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.review_tasks(
      task_id,subject_type,subject_id,review_type,required_role,status,priority
    ) VALUES (
      'TASK-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
      'submission',v_public_id,'competence_precheck','legal_reviewer','open',80
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_task_uuid;

    IF v_task_uuid IS NOT NULL THEN
      INSERT INTO public.ideenwerk_competence_review_bindings(task_id,submission_id,signal_key)
      VALUES(v_task_uuid,NEW.submission_id,NEW.signal_key)
      ON CONFLICT(task_id) DO UPDATE SET
        submission_id=excluded.submission_id,
        signal_key=excluded.signal_key;

      INSERT INTO public.audit_events(
        event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload
      ) VALUES (
        'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
        'submission',v_public_id,'competence_review_enqueued','system',
        'COMPETENCE_REVIEW_REQUIRED',
        jsonb_build_object(
          'review_type','competence_precheck',
          'required_role','legal_reviewer',
          'priority',80,
          'precheck_result',NEW.result_code,
          'inventory_item_id',NEW.inventory_item_id,
          'legal_change_required',NEW.legal_change_required,
          'boundary','human_competence_review_only_no_automatic_proposal_decision'
        )
      );
    END IF;
  ELSE
    UPDATE public.review_tasks
       SET status='cancelled'
     WHERE subject_type='submission'
       AND subject_id=v_public_id
       AND review_type='competence_precheck'
       AND status IN ('open','assigned');
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_enqueue_competence_review() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_enqueue_competence_review() TO service_role;

DROP TRIGGER IF EXISTS trg_ideenwerk_competence_review_queue
  ON public.ideenwerk_competence_prechecks;
CREATE TRIGGER trg_ideenwerk_competence_review_queue
AFTER INSERT OR UPDATE OF
  result_code,inventory_item_id,inventory_version,current_class,suggested_level,
  source_ids,confidence,legal_change_required,classifier_version
ON public.ideenwerk_competence_prechecks
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_enqueue_competence_review();

-- Reconcile any current signal that already needs human competence review.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT cp.submission_id
      FROM public.ideenwerk_competence_prechecks cp
     WHERE cp.result_code='unclassified' OR cp.legal_change_required=true
  LOOP
    UPDATE public.ideenwerk_competence_prechecks
       SET result_code=result_code
     WHERE submission_id=r.submission_id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.ideenwerk_validate_competence_review_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_task public.review_tasks%ROWTYPE;
  v_check public.ideenwerk_competence_prechecks%ROWTYPE;
  v_bound_signal_key text;
  v_level text;
  v_class text;
  v_sources jsonb;
  v_legal_change boolean;
BEGIN
  SELECT * INTO v_task FROM public.review_tasks WHERE id=NEW.task_id;
  IF NOT FOUND OR v_task.review_type IS DISTINCT FROM 'competence_precheck' THEN
    RETURN NEW;
  END IF;

  IF v_task.subject_type IS DISTINCT FROM 'submission' THEN
    RAISE EXCEPTION 'COMPETENCE_REVIEW_INVALID_SUBJECT';
  END IF;

  IF NEW.action IS DISTINCT FROM 'resolve_competence_precheck' THEN
    RAISE EXCEPTION 'COMPETENCE_REVIEW_ACTION_REQUIRED';
  END IF;

  IF NEW.reason_code IS NULL OR NEW.reason_code NOT IN (
    'COMPETENCE_CLASSIFIED',
    'COMPETENCE_CORRECTED',
    'LEGAL_CHANGE_REQUIRED_CONFIRMED',
    'COMPETENCE_UNRESOLVED'
  ) THEN
    RAISE EXCEPTION 'COMPETENCE_REVIEW_REASON_INVALID';
  END IF;

  IF NEW.rationale IS NULL OR char_length(btrim(NEW.rationale)) < 12 OR char_length(NEW.rationale) > 2000 THEN
    RAISE EXCEPTION 'COMPETENCE_REVIEW_RATIONALE_REQUIRED';
  END IF;

  SELECT cp.* INTO v_check
    FROM public.ideenwerk_competence_prechecks cp
    JOIN public.submissions s ON s.id=cp.submission_id
   WHERE s.public_id=v_task.subject_id
   LIMIT 1;

  IF NOT FOUND OR NOT (v_check.result_code='unclassified' OR v_check.legal_change_required=true) THEN
    RAISE EXCEPTION 'COMPETENCE_REVIEW_NO_ACTIVE_SIGNAL';
  END IF;

  SELECT b.signal_key INTO v_bound_signal_key
    FROM public.ideenwerk_competence_review_bindings b
   WHERE b.task_id=NEW.task_id;

  IF v_bound_signal_key IS NULL OR v_bound_signal_key IS DISTINCT FROM v_check.signal_key THEN
    RAISE EXCEPTION 'COMPETENCE_REVIEW_STALE_SIGNAL';
  END IF;

  IF NEW.reason_code='LEGAL_CHANGE_REQUIRED_CONFIRMED' THEN
    IF v_check.legal_change_required IS NOT TRUE OR v_check.result_code IS DISTINCT FROM 'matched' THEN
      RAISE EXCEPTION 'COMPETENCE_REVIEW_REASON_INCOMPATIBLE';
    END IF;
    v_level := v_check.suggested_level;
    v_class := v_check.current_class;
    v_sources := v_check.source_ids;
    v_legal_change := true;
  ELSIF NEW.reason_code IN ('COMPETENCE_CLASSIFIED','COMPETENCE_CORRECTED') THEN
    IF NEW.reason_code='COMPETENCE_CLASSIFIED' AND v_check.result_code IS DISTINCT FROM 'unclassified' THEN
      RAISE EXCEPTION 'COMPETENCE_REVIEW_REASON_INCOMPATIBLE';
    END IF;
    v_level := btrim(NEW.payload ->> 'resolved_level');
    v_class := btrim(NEW.payload ->> 'resolved_class');
    v_sources := NEW.payload -> 'source_ids';
    IF v_level IS NULL OR v_level NOT IN ('bund','land','gemeinde','geteilt','eu') THEN
      RAISE EXCEPTION 'COMPETENCE_REVIEW_LEVEL_REQUIRED';
    END IF;
    IF v_class IS NULL OR char_length(v_class) < 2 OR char_length(v_class) > 80 THEN
      RAISE EXCEPTION 'COMPETENCE_REVIEW_CLASS_REQUIRED';
    END IF;
    IF v_sources IS NULL OR jsonb_typeof(v_sources)<>'array' OR jsonb_array_length(v_sources)<1 THEN
      RAISE EXCEPTION 'COMPETENCE_REVIEW_SOURCES_REQUIRED';
    END IF;
    IF NOT (NEW.payload ? 'legal_change_required')
       OR jsonb_typeof(NEW.payload -> 'legal_change_required')<>'boolean' THEN
      RAISE EXCEPTION 'COMPETENCE_REVIEW_LEGAL_FLAG_REQUIRED';
    END IF;
    v_legal_change := (NEW.payload ->> 'legal_change_required')::boolean;
  ELSE
    v_level := NULL;
    v_class := NULL;
    v_sources := v_check.source_ids;
    v_legal_change := v_check.legal_change_required;
  END IF;

  NEW.payload := jsonb_build_object(
    'competence_signal_key',v_check.signal_key,
    'resolved_level',v_level,
    'resolved_class',v_class,
    'source_ids',coalesce(v_sources,'[]'::jsonb),
    'legal_change_required',v_legal_change
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_validate_competence_review_decision() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_validate_competence_review_decision() TO service_role;

DROP TRIGGER IF EXISTS trg_ideenwerk_validate_competence_review_decision ON public.review_decisions;
CREATE TRIGGER trg_ideenwerk_validate_competence_review_decision
BEFORE INSERT ON public.review_decisions
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_validate_competence_review_decision();

CREATE OR REPLACE FUNCTION public.ideenwerk_audit_competence_review_resolution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_task public.review_tasks%ROWTYPE;
BEGIN
  SELECT * INTO v_task FROM public.review_tasks WHERE id=NEW.task_id;
  IF NOT FOUND OR v_task.review_type IS DISTINCT FROM 'competence_precheck' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_events(
    event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload
  ) VALUES (
    'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',v_task.subject_id,'competence_review_resolved','operator',NEW.reason_code,
    jsonb_build_object(
      'task_id',v_task.task_id,
      'resolution_code',NEW.reason_code,
      'signal_key',NEW.payload ->> 'competence_signal_key',
      'resolved_level',NEW.payload -> 'resolved_level',
      'resolved_class',NEW.payload -> 'resolved_class',
      'source_ids',NEW.payload -> 'source_ids',
      'legal_change_required',NEW.payload -> 'legal_change_required',
      'boundary','competence_resolution_only_no_automatic_accept_or_reject'
    )
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_audit_competence_review_resolution() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_audit_competence_review_resolution() TO service_role;

DROP TRIGGER IF EXISTS trg_ideenwerk_audit_competence_review_resolution ON public.review_decisions;
CREATE TRIGGER trg_ideenwerk_audit_competence_review_resolution
AFTER INSERT ON public.review_decisions
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_audit_competence_review_resolution();

-- Preserve the full v12 private contracts and add only a bounded competence-review
-- overlay. This avoids duplicating the large privacy/status functions and keeps
-- the existing Edge API RPC names stable.
DO $$
BEGIN
  IF to_regprocedure('public.ideenwerk_get_private_status_v12(text,text)') IS NULL THEN
    EXECUTE 'ALTER FUNCTION public.ideenwerk_get_private_status(text,text) RENAME TO ideenwerk_get_private_status_v12';
  END IF;
  IF to_regprocedure('public.ideenwerk_get_privacy_export_v12(text,text)') IS NULL THEN
    EXECUTE 'ALTER FUNCTION public.ideenwerk_get_privacy_export(text,text) RENAME TO ideenwerk_get_privacy_export_v12';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.ideenwerk_current_competence_review(p_submission_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'resolution_code',d.reason_code,
    'resolved_level',d.payload -> 'resolved_level',
    'resolved_class',d.payload -> 'resolved_class',
    'source_ids',coalesce(d.payload -> 'source_ids','[]'::jsonb),
    'legal_change_required',d.payload -> 'legal_change_required',
    'resolved_at',d.created_at,
    'boundary','Menschliche Zuständigkeitsprüfung; keine Annahme oder Ablehnung der Bürgeridee.'
  )
    FROM public.review_tasks t
    JOIN public.review_decisions d ON d.task_id=t.id
    JOIN public.ideenwerk_competence_review_bindings b ON b.task_id=t.id
    JOIN public.ideenwerk_competence_prechecks cp ON cp.submission_id=b.submission_id
   WHERE b.submission_id=p_submission_id
     AND b.signal_key=cp.signal_key
     AND t.review_type='competence_precheck'
     AND d.action='resolve_competence_precheck'
     AND d.payload ->> 'competence_signal_key'=cp.signal_key
   ORDER BY d.created_at DESC
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_current_competence_review(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_current_competence_review(uuid) TO service_role;

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
  v_review jsonb;
BEGIN
  v_base := public.ideenwerk_get_private_status_v12(p_public_id,p_token_hash);
  IF v_base IS NULL THEN RETURN NULL; END IF;

  SELECT s.id INTO v_submission_id FROM public.submissions s WHERE s.public_id=p_public_id LIMIT 1;
  SELECT public.ideenwerk_current_competence_review(v_submission_id) INTO v_review;
  RETURN v_base || jsonb_build_object('competence_review',v_review);
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
  v_review jsonb;
BEGIN
  v_base := public.ideenwerk_get_privacy_export_v12(p_public_id,p_token_hash);
  IF v_base IS NULL THEN RETURN NULL; END IF;

  SELECT s.id INTO v_submission_id FROM public.submissions s WHERE s.public_id=p_public_id LIMIT 1;
  SELECT public.ideenwerk_current_competence_review(v_submission_id) INTO v_review;
  RETURN v_base || jsonb_build_object('competence_review',v_review);
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_get_privacy_export(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_privacy_export(text,text) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('competence_review_contract','035_competence_review_queue',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
