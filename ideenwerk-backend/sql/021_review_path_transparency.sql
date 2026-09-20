BEGIN;

-- Extend the protected citizen status with the latest assigned procedural
-- review depth. This exposes process state only; it does not score political
-- merit and does not decide acceptance/rejection.
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

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'event_type',e.event_type,
      'actor_type',e.actor_type,
      'reason_code',e.reason_code,
      'payload',e.payload,
      'created_at',e.created_at
    ) ORDER BY e.created_at),'[]'::jsonb)
    INTO v_history
    FROM audit_events e
   WHERE e.subject_type='submission'
     AND e.subject_id=v_submission.public_id;

  SELECT jsonb_build_object(
      'depth', e.payload ->> 'review_depth',
      'triage_queue', e.payload ->> 'triage_queue',
      'source', e.payload ->> 'source',
      'assigned_at', e.created_at
    )
    INTO v_review_path
    FROM audit_events e
   WHERE e.subject_type='submission'
     AND e.subject_id=v_submission.public_id
     AND e.event_type='review_path_assigned'
     AND e.payload ->> 'review_depth' IN ('FAST','STANDARD','DEEP')
   ORDER BY e.created_at DESC
   LIMIT 1;

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
    'history',v_history
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_get_private_status(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_private_status(text,text) TO service_role;

-- Public review-depth transparency is aggregate-only. The distribution is
-- suppressed while fewer than five assignments exist, preventing tiny-cell
-- disclosure without hiding the already-public total submission volume.
CREATE OR REPLACE FUNCTION public.ideenwerk_public_review_depth_metrics()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH latest AS (
    SELECT DISTINCT ON (e.subject_id)
      e.subject_id,
      e.payload ->> 'review_depth' AS review_depth
    FROM audit_events e
    WHERE e.subject_type='submission'
      AND e.event_type='review_path_assigned'
      AND e.payload ->> 'review_depth' IN ('FAST','STANDARD','DEEP')
    ORDER BY e.subject_id, e.created_at DESC
  ), counts AS (
    SELECT
      count(*)::int AS assigned_total,
      count(*) FILTER (WHERE review_depth='FAST')::int AS fast_count,
      count(*) FILTER (WHERE review_depth='STANDARD')::int AS standard_count,
      count(*) FILTER (WHERE review_depth='DEEP')::int AS deep_count
    FROM latest
  )
  SELECT jsonb_build_object(
    'assigned_total', assigned_total,
    'distribution_state', CASE WHEN assigned_total < 5 THEN 'suppressed_small_sample' ELSE 'published' END,
    'minimum_publish_count', 5,
    'fast', CASE WHEN assigned_total < 5 THEN NULL ELSE fast_count END,
    'standard', CASE WHEN assigned_total < 5 THEN NULL ELSE standard_count END,
    'deep', CASE WHEN assigned_total < 5 THEN NULL ELSE deep_count END
  )
  FROM counts;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_public_review_depth_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_public_review_depth_metrics() TO service_role, postgres;

INSERT INTO public.ideenwerk_runtime_meta(key, value, updated_at)
VALUES ('review_path_transparency_contract', '021_review_path_transparency', now())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;

COMMIT;
