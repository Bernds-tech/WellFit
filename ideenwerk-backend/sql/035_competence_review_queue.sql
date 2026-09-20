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

-- Backfill a task only where the current competence signal actually requires one.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT cp.*
      FROM public.ideenwerk_competence_prechecks cp
     WHERE cp.result_code='unclassified' OR cp.legal_change_required=true
  LOOP
    PERFORM public.ideenwerk_enqueue_competence_review_row(r.submission_id);
  END LOOP;
END;
$$;

COMMIT;
