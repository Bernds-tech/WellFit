-- IDEENWERK migration 017: enger Runtime-Vertrag fuer die No-Login Edge API.
-- Alle internen Tabellen bleiben Default-Deny. Nur service_role darf diese RPCs aufrufen.

CREATE TABLE IF NOT EXISTS ideenwerk_runtime_meta (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO ideenwerk_runtime_meta(key,value,updated_at)
VALUES('schema_contract','017_edge_intake_status',now())
ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=now();

ALTER TABLE ideenwerk_runtime_meta ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE ideenwerk_runtime_meta FROM anon, authenticated;
GRANT SELECT ON TABLE ideenwerk_runtime_meta TO service_role;

CREATE OR REPLACE FUNCTION ideenwerk_create_submission(
  p_public_id text,
  p_token_hash text,
  p_original_text text,
  p_region text DEFAULT NULL,
  p_topic text DEFAULT NULL,
  p_consent_public_anonymous boolean DEFAULT false,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_submission_id uuid;
  v_status text;
  v_existing_public_id text;
BEGIN
  IF p_public_id IS NULL OR p_public_id !~ '^IDEA-[A-F0-9]{16}$' THEN
    RAISE EXCEPTION 'invalid public id';
  END IF;
  IF p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid token hash';
  END IF;
  IF p_original_text IS NULL OR char_length(btrim(p_original_text)) < 20 OR char_length(p_original_text) > 5000 THEN
    RAISE EXCEPTION 'invalid submission text';
  END IF;
  IF p_region IS NOT NULL AND char_length(p_region) > 120 THEN
    RAISE EXCEPTION 'invalid region';
  END IF;
  IF p_topic IS NOT NULL AND char_length(p_topic) > 120 THEN
    RAISE EXCEPTION 'invalid topic';
  END IF;
  IF p_idempotency_key IS NOT NULL AND char_length(p_idempotency_key) > 200 THEN
    RAISE EXCEPTION 'invalid idempotency key';
  END IF;

  INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
  VALUES(
    p_public_id,
    NULLIF(btrim(p_idempotency_key),''),
    btrim(p_original_text),
    NULLIF(btrim(p_region),''),
    NULLIF(btrim(p_topic),''),
    'received'
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id,current_status INTO v_submission_id,v_status;

  IF v_submission_id IS NULL THEN
    SELECT public_id,current_status
      INTO v_existing_public_id,v_status
      FROM submissions
     WHERE idempotency_key=NULLIF(btrim(p_idempotency_key),'')
     LIMIT 1;

    IF v_existing_public_id IS NULL THEN
      RAISE EXCEPTION 'submission conflict';
    END IF;

    RETURN jsonb_build_object(
      'public_id',v_existing_public_id,
      'status',v_status,
      'replayed',true
    );
  END IF;

  INSERT INTO status_access(submission_id,token_hash)
  VALUES(v_submission_id,p_token_hash);

  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',
    p_public_id,
    'status_created',
    'citizen',
    NULL,
    jsonb_build_object('status','received','consent_public_anonymous',p_consent_public_anonymous)
  );

  INSERT INTO processing_jobs(job_type,subject_type,subject_id,payload)
  VALUES('pii_scan','submission',p_public_id,'{}'::jsonb)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'public_id',p_public_id,
    'status','received',
    'replayed',false
  );
END;
$$;

CREATE OR REPLACE FUNCTION ideenwerk_get_private_status(
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
    'history',v_history
  );
END;
$$;

REVOKE ALL ON FUNCTION ideenwerk_create_submission(text,text,text,text,text,boolean,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION ideenwerk_get_private_status(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION ideenwerk_create_submission(text,text,text,text,text,boolean,text) TO service_role;
GRANT EXECUTE ON FUNCTION ideenwerk_get_private_status(text,text) TO service_role;
