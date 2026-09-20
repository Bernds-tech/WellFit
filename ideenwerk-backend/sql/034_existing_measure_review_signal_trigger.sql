BEGIN;

-- Migration 033 introduced signal-bound overlap reviews. The queue trigger from
-- 031 only listened to the original result columns, so a baseline dataset or
-- classifier revision could change signal_key without reopening human review.
-- Include every input that defines the signal key.
DROP TRIGGER IF EXISTS trg_existing_measure_review_queue
  ON public.ideenwerk_existing_measure_checks;

CREATE TRIGGER trg_existing_measure_review_queue
AFTER INSERT OR UPDATE OF
  result_code,
  requires_human_review,
  matched_refs,
  reference_versions,
  classifier_version
ON public.ideenwerk_existing_measure_checks
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_enqueue_existing_measure_review();

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('existing_measure_review_signal_trigger_contract','034_existing_measure_review_signal_trigger',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
