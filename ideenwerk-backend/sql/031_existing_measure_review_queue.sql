BEGIN;

-- WERK IDEENWERK migration 031: turn a bounded existing-measure overlap signal
-- into a real human review task. This is procedural routing only: the trigger does
-- not accept, reject, merge or otherwise decide the citizen proposal.

CREATE OR REPLACE FUNCTION public.ideenwerk_enqueue_existing_measure_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_public_id text;
  v_task_id text;
  v_inserted_task_id text;
BEGIN
  SELECT s.public_id INTO v_public_id
    FROM public.submissions s
   WHERE s.id=NEW.submission_id;

  IF v_public_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.result_code='possible_overlap' AND NEW.requires_human_review=true THEN
    v_task_id := 'TASK-' || upper(encode(extensions.gen_random_bytes(10),'hex'));

    INSERT INTO public.review_tasks(
      task_id,subject_type,subject_id,review_type,required_role,status,priority
    ) VALUES (
      v_task_id,'submission',v_public_id,'existing_measure_overlap','impact_reviewer','open',75
    )
    ON CONFLICT DO NOTHING
    RETURNING task_id INTO v_inserted_task_id;

    IF v_inserted_task_id IS NOT NULL THEN
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

DROP TRIGGER IF EXISTS trg_existing_measure_review_queue ON public.ideenwerk_existing_measure_checks;
CREATE TRIGGER trg_existing_measure_review_queue
AFTER INSERT OR UPDATE OF result_code,requires_human_review,matched_refs
ON public.ideenwerk_existing_measure_checks
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_enqueue_existing_measure_review();

-- Reconcile any rows that already existed when this migration was installed.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT em.submission_id,s.public_id,em.matched_refs
      FROM public.ideenwerk_existing_measure_checks em
      JOIN public.submissions s ON s.id=em.submission_id
     WHERE em.result_code='possible_overlap' AND em.requires_human_review=true
  LOOP
    INSERT INTO public.review_tasks(task_id,subject_type,subject_id,review_type,required_role,status,priority)
    VALUES(
      'TASK-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
      'submission',r.public_id,'existing_measure_overlap','impact_reviewer','open',75
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('existing_measure_review_queue_contract','031_existing_measure_review_queue',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
