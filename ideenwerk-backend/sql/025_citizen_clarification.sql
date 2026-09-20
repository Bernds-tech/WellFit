-- IDEENWERK migration 025: protected citizen clarification response.
-- Clarifications remain private, never overwrite original_text, and re-enter the
-- existing semantic review path with a deterministic, auditable refresh.

CREATE TABLE IF NOT EXISTS citizen_clarifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clarification_id text NOT NULL UNIQUE,
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  response_text text NOT NULL CHECK (char_length(response_text) BETWEEN 5 AND 3000),
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS citizen_clarifications_idempotency_idx
  ON citizen_clarifications(submission_id,idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS citizen_clarifications_submission_idx
  ON citizen_clarifications(submission_id,created_at);

ALTER TABLE citizen_clarifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE citizen_clarifications FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE citizen_clarifications TO service_role;

CREATE OR REPLACE FUNCTION ideenwerk_list_clarifications(
  p_public_id text,
  p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_submission_id uuid;
  v_rows jsonb;
BEGIN
  SELECT s.id INTO v_submission_id
    FROM submissions s
    JOIN status_access a ON a.submission_id=s.id
   WHERE s.public_id=p_public_id
     AND a.token_hash=p_token_hash
     AND a.revoked_at IS NULL
     AND (a.expires_at IS NULL OR a.expires_at>now())
   LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'clarification_id',c.clarification_id,
    'response_text',c.response_text,
    'created_at',c.created_at
  ) ORDER BY c.created_at),'[]'::jsonb)
  INTO v_rows
  FROM citizen_clarifications c
  WHERE c.submission_id=v_submission_id;

  RETURN jsonb_build_object('public_id',p_public_id,'clarifications',v_rows);
END;
$$;

CREATE OR REPLACE FUNCTION ideenwerk_submit_clarification(
  p_public_id text,
  p_token_hash text,
  p_response_text text,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sub submissions%ROWTYPE;
  v_existing citizen_clarifications%ROWTYPE;
  v_clarification_id text;
  v_text text := btrim(COALESCE(p_response_text,''));
  v_effective_text text;
  v_problem_signature text;
  v_solution_signature text;
  v_count integer;
BEGIN
  IF char_length(v_text)<5 OR char_length(v_text)>3000 THEN
    RETURN jsonb_build_object('accepted',false,'code','INVALID_CLARIFICATION');
  END IF;
  IF p_idempotency_key IS NOT NULL AND char_length(p_idempotency_key)>200 THEN
    RETURN jsonb_build_object('accepted',false,'code','INVALID_IDEMPOTENCY_KEY');
  END IF;

  SELECT s.* INTO v_sub
    FROM submissions s
    JOIN status_access a ON a.submission_id=s.id
   WHERE s.public_id=p_public_id
     AND a.token_hash=p_token_hash
     AND a.revoked_at IS NULL
     AND (a.expires_at IS NULL OR a.expires_at>now())
   FOR UPDATE OF s
   LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
      FROM citizen_clarifications
     WHERE submission_id=v_sub.id AND idempotency_key=p_idempotency_key
     LIMIT 1;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'accepted',true,
        'replayed',true,
        'clarification_id',v_existing.clarification_id,
        'status',(SELECT current_status FROM submissions WHERE id=v_sub.id)
      );
    END IF;
  END IF;

  IF v_sub.current_status<>'clarification' THEN
    RETURN jsonb_build_object('accepted',false,'code','CLARIFICATION_NOT_EXPECTED','current_status',v_sub.current_status);
  END IF;

  IF EXISTS (
    SELECT 1 FROM processing_jobs
     WHERE subject_type='submission' AND subject_id=v_sub.public_id AND status='running'
  ) THEN
    RETURN jsonb_build_object('accepted',false,'code','CLARIFICATION_PROCESSING_BUSY','current_status',v_sub.current_status);
  END IF;

  -- Same conservative contact-data filter used by the current worker. The text
  -- remains private either way; obvious contact data is rejected before storage.
  IF v_text ~* '[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}'
     OR v_text ~ '(\+43|0043|0)[[:space:]]?[0-9][0-9[:space:]/\-]{6,}' THEN
    RETURN jsonb_build_object('accepted',false,'code','CLARIFICATION_PII_DETECTED');
  END IF;

  v_clarification_id := 'CLR-'||upper(encode(extensions.gen_random_bytes(10),'hex'));
  INSERT INTO citizen_clarifications(clarification_id,submission_id,response_text,idempotency_key)
  VALUES(v_clarification_id,v_sub.id,v_text,p_idempotency_key);

  SELECT v_sub.original_text || E'\n\nKlarstellung der einreichenden Person:\n' ||
         string_agg(c.response_text,E'\n\n' ORDER BY c.created_at),
         count(*)
    INTO v_effective_text,v_count
    FROM citizen_clarifications c
   WHERE c.submission_id=v_sub.id;

  v_problem_signature := lower(btrim(v_sub.original_text));
  v_solution_signature := lower(btrim(v_effective_text));

  -- The immutable original remains in submissions.original_text. Only derived,
  -- reproducible working artefacts are refreshed with the private clarification.
  INSERT INTO structured_proposals(
    submission_id,problem,proposal,goal,suggested_level,topic,region,open_questions,citizen_confirmed
  ) VALUES(
    v_sub.id,v_sub.original_text,v_effective_text,NULL,NULL,v_sub.topic,v_sub.region,'[]'::jsonb,true
  )
  ON CONFLICT(submission_id) DO UPDATE SET
    proposal=excluded.proposal,
    topic=excluded.topic,
    region=excluded.region,
    citizen_confirmed=true,
    updated_at=now();

  INSERT INTO proposal_features(
    submission_id,provider,model_version,problem_signature,solution_signature,
    topic,suggested_level,region_scope,open_questions,raw_payload
  ) VALUES(
    v_sub.id,'deterministic_clarification','clarification-v1-sql',
    v_problem_signature,v_solution_signature,v_sub.topic,NULL,v_sub.region,'[]'::jsonb,
    jsonb_build_object('mode','citizen_clarification_refresh','clarification_count',v_count)
  )
  ON CONFLICT(submission_id) DO UPDATE SET
    provider=excluded.provider,
    model_version=excluded.model_version,
    problem_signature=excluded.problem_signature,
    solution_signature=excluded.solution_signature,
    topic=excluded.topic,
    region_scope=excluded.region_scope,
    raw_payload=excluded.raw_payload,
    updated_at=now();

  UPDATE cluster_candidates
     SET review_status='superseded'
   WHERE submission_id=v_sub.id AND review_status='pending';

  UPDATE processing_jobs
     SET status='failed',last_error='superseded_by_citizen_clarification',updated_at=now()
   WHERE subject_type='submission' AND subject_id=v_sub.public_id AND status='queued';

  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-'||upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',v_sub.public_id,'clarification_received','citizen','CLARIFICATION_RESPONSE',
    jsonb_build_object('clarification_id',v_clarification_id,'response_length',char_length(v_text))
  );

  UPDATE submissions SET current_status='structured',updated_at=now() WHERE id=v_sub.id;
  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-'||upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',v_sub.public_id,'status_changed','citizen','CLARIFICATION_RECEIVED',
    jsonb_build_object('from','clarification','to','structured','clarification_id',v_clarification_id)
  );

  UPDATE submissions SET current_status='cluster_review',updated_at=now() WHERE id=v_sub.id;
  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-'||upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',v_sub.public_id,'status_changed','system','CLARIFICATION_RESTRUCTURED',
    jsonb_build_object('from','structured','to','cluster_review','clarification_id',v_clarification_id,'provider','deterministic_clarification','model_version','clarification-v1-sql')
  );

  INSERT INTO processing_jobs(job_type,subject_type,subject_id,payload)
  VALUES(
    'semantic_cluster_review','submission',v_sub.public_id,
    jsonb_build_object('source','citizen_clarification','clarification_id',v_clarification_id,'provider','deterministic_clarification','model_version','clarification-v1-sql')
  )
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'accepted',true,
    'replayed',false,
    'clarification_id',v_clarification_id,
    'status','cluster_review',
    'next','semantic_cluster_review'
  );
END;
$$;

REVOKE ALL ON FUNCTION ideenwerk_list_clarifications(text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION ideenwerk_submit_clarification(text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION ideenwerk_list_clarifications(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION ideenwerk_submit_clarification(text,text,text,text) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('clarification_contract','025_citizen_clarification',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now();
  END IF;
END;
$$;
