BEGIN;

-- Procedural review-depth contract. This function classifies process depth only;
-- it does not score political merit or decide whether a proposal is accepted.
CREATE OR REPLACE FUNCTION public.ideenwerk_review_depth(
  p_queue text,
  p_signals jsonb DEFAULT '{}'::jsonb
) RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  v_signals jsonb := COALESCE(p_signals, '{}'::jsonb);
  v_fiscal numeric := 0;
BEGIN
  IF p_queue IN ('quarantine', 'clarification') THEN
    RETURN NULL;
  END IF;

  IF jsonb_typeof(v_signals -> 'annual_fiscal_effect_eur') = 'number' THEN
    v_fiscal := (v_signals ->> 'annual_fiscal_effect_eur')::numeric;
  END IF;

  IF p_queue = 'rights_sensitive'
     OR COALESCE(v_signals -> 'constitutional_sensitive', 'false'::jsonb) = 'true'::jsonb
     OR COALESCE(v_signals -> 'security_sensitive', 'false'::jsonb) = 'true'::jsonb
     OR v_fiscal >= 1000000000
  THEN
    RETURN 'DEEP';
  END IF;

  IF p_queue = 'fast_duplicate' THEN
    RETURN 'FAST';
  END IF;

  IF p_queue = 'standard_review'
     AND COALESCE(v_signals -> 'small_reversible', 'false'::jsonb) = 'true'::jsonb
  THEN
    RETURN 'FAST';
  END IF;

  RETURN 'STANDARD';
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_review_depth(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_review_depth(text, jsonb) TO service_role, postgres;

-- Preserve the existing status transition behavior and add one auditable review
-- path assignment exactly when a submission first enters precheck.
CREATE OR REPLACE FUNCTION public.ideenwerk_db_status_change(
  p_public_id text,
  p_to text,
  p_reason_code text DEFAULT NULL::text,
  p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_from text;
  v_queue text;
  v_signals jsonb;
  v_depth text;
  v_source text;
BEGIN
  SELECT current_status INTO v_from
    FROM submissions
   WHERE public_id = p_public_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'submission not found: %', p_public_id;
  END IF;

  IF v_from = p_to THEN
    RETURN;
  END IF;

  UPDATE submissions
     SET current_status = p_to,
         updated_at = now()
   WHERE public_id = p_public_id;

  INSERT INTO audit_events(
    event_id, subject_type, subject_id, event_type, actor_type, reason_code, payload
  ) VALUES (
    'EVT-' || upper(encode(extensions.gen_random_bytes(10), 'hex')),
    'submission', p_public_id, 'status_changed', 'system', p_reason_code,
    jsonb_build_object('from', v_from, 'to', p_to) || COALESCE(p_payload, '{}'::jsonb)
  );

  IF p_to = 'precheck' THEN
    v_signals := CASE
      WHEN jsonb_typeof(COALESCE(p_payload, '{}'::jsonb) -> 'review_signals') = 'object'
        THEN p_payload -> 'review_signals'
      ELSE '{}'::jsonb
    END;

    v_queue := CASE COALESCE(p_payload, '{}'::jsonb) ->> 'triage_queue'
      WHEN 'fast_duplicate' THEN 'fast_duplicate'
      WHEN 'rights_sensitive' THEN 'rights_sensitive'
      WHEN 'existing_measure_review' THEN 'existing_measure_review'
      WHEN 'high_attention' THEN 'high_attention'
      WHEN 'quality_low_attention' THEN 'quality_low_attention'
      WHEN 'standard_review' THEN 'standard_review'
      ELSE 'standard_review'
    END;

    v_depth := public.ideenwerk_review_depth(v_queue, v_signals);
    v_source := CASE
      WHEN COALESCE(p_payload, '{}'::jsonb) ? 'triage_queue'
        OR COALESCE(p_payload, '{}'::jsonb) ? 'review_signals'
      THEN 'explicit_precheck_signals'
      ELSE 'precheck_default_no_confirmed_risk_signals'
    END;

    INSERT INTO audit_events(
      event_id, subject_type, subject_id, event_type, actor_type, reason_code, payload
    ) VALUES (
      'EVT-' || upper(encode(extensions.gen_random_bytes(10), 'hex')),
      'submission', p_public_id, 'review_path_assigned', 'system', 'PRECHECK_REVIEW_PATH',
      jsonb_build_object(
        'triage_queue', v_queue,
        'review_depth', v_depth,
        'review_signals', v_signals,
        'source', v_source
      )
    );
  END IF;
END;
$$;

INSERT INTO public.ideenwerk_runtime_meta(key, value, updated_at)
VALUES ('review_path_contract', '020_review_path_audit', now())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;

COMMIT;
