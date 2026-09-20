BEGIN;

-- WERK IDEENWERK migration 026: auditable clarification prompts.
-- Reuses the existing human review task/decision model. A clarification prompt is
-- materialized only from a validated review_decision(action=request_clarification),
-- remains private, and is exposed to the citizen only through the status-token RPC.

CREATE TABLE IF NOT EXISTS citizen_clarification_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id text NOT NULL UNIQUE,
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  source_decision_id uuid NOT NULL UNIQUE REFERENCES review_decisions(id) ON DELETE RESTRICT,
  question text NOT NULL CHECK (char_length(question) BETWEEN 10 AND 1500),
  reason_code text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','superseded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS citizen_clarification_prompts_one_open_idx
  ON citizen_clarification_prompts(submission_id)
  WHERE status='open';
CREATE INDEX IF NOT EXISTS citizen_clarification_prompts_submission_idx
  ON citizen_clarification_prompts(submission_id,created_at DESC);

ALTER TABLE citizen_clarification_prompts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE citizen_clarification_prompts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE citizen_clarification_prompts TO service_role;

ALTER TABLE citizen_clarifications
  ADD COLUMN IF NOT EXISTS clarification_prompt_id uuid
  REFERENCES citizen_clarification_prompts(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION ideenwerk_validate_clarification_review_decision()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  v_subject_type text;
  v_subject_id text;
  v_status text;
  v_question text := btrim(COALESCE(NEW.payload ->> 'question',''));
BEGIN
  IF NEW.action <> 'request_clarification' THEN
    RETURN NEW;
  END IF;

  SELECT t.subject_type,t.subject_id
    INTO v_subject_type,v_subject_id
    FROM review_tasks t
   WHERE t.id=NEW.task_id;

  IF NOT FOUND OR v_subject_type <> 'submission' THEN
    RAISE EXCEPTION 'IDEENWERK clarification request requires a submission review task';
  END IF;

  IF char_length(v_question) < 10 OR char_length(v_question) > 1500 THEN
    RAISE EXCEPTION 'IDEENWERK clarification question must contain 10..1500 characters';
  END IF;

  IF NEW.reason_code NOT IN ('NEEDS_CLARIFICATION','INSUFFICIENT_EVIDENCE','FINANCE_OPEN','WRONG_LEVEL','PII_REVIEW') THEN
    RAISE EXCEPTION 'IDEENWERK clarification reason code is not allowed: %', NEW.reason_code;
  END IF;

  IF v_question ~* '[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}'
     OR v_question ~ '(\+43|0043|0)[[:space:]]?[0-9][0-9[:space:]/\-]{6,}' THEN
    RAISE EXCEPTION 'IDEENWERK clarification question contains contact data';
  END IF;

  SELECT s.current_status INTO v_status
    FROM submissions s
   WHERE s.public_id=v_subject_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'IDEENWERK clarification submission not found';
  END IF;

  -- Keep migration 026 within the already approved status-machine transitions.
  -- structured/privacy_hold -> clarification are canonical; clarification allows a
  -- replacement question without creating a second workflow branch.
  IF v_status NOT IN ('structured','privacy_hold','clarification') THEN
    RAISE EXCEPTION 'IDEENWERK clarification request is invalid from status: %', v_status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_00_validate_clarification_review_decision ON review_decisions;
CREATE TRIGGER trg_00_validate_clarification_review_decision
BEFORE INSERT ON review_decisions
FOR EACH ROW
EXECUTE FUNCTION ideenwerk_validate_clarification_review_decision();

CREATE OR REPLACE FUNCTION ideenwerk_materialize_clarification_prompt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  v_public_id text;
  v_submission_id uuid;
  v_from text;
  v_prompt_id text;
  v_question text := btrim(NEW.payload ->> 'question');
BEGIN
  IF NEW.action <> 'request_clarification' THEN
    RETURN NEW;
  END IF;

  SELECT t.subject_id INTO v_public_id
    FROM review_tasks t
   WHERE t.id=NEW.task_id AND t.subject_type='submission';

  SELECT s.id,s.current_status INTO v_submission_id,v_from
    FROM submissions s
   WHERE s.public_id=v_public_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'IDEENWERK clarification submission disappeared';
  END IF;

  UPDATE citizen_clarification_prompts
     SET status='superseded'
   WHERE submission_id=v_submission_id AND status='open';

  v_prompt_id := 'CLQ-' || upper(encode(extensions.gen_random_bytes(10),'hex'));
  INSERT INTO citizen_clarification_prompts(
    prompt_id,submission_id,source_decision_id,question,reason_code
  ) VALUES(
    v_prompt_id,v_submission_id,NEW.id,v_question,NEW.reason_code
  );

  IF v_from <> 'clarification' THEN
    UPDATE submissions
       SET current_status='clarification',updated_at=now()
     WHERE id=v_submission_id;

    INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
    VALUES(
      'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
      'submission',v_public_id,'status_changed','operator',NEW.reason_code,
      jsonb_build_object('from',v_from,'to','clarification','prompt_id',v_prompt_id)
    );
  END IF;

  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',v_public_id,'clarification_requested','operator',NEW.reason_code,
    jsonb_build_object('prompt_id',v_prompt_id,'question_length',char_length(v_question))
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_materialize_clarification_prompt ON review_decisions;
CREATE TRIGGER trg_materialize_clarification_prompt
AFTER INSERT ON review_decisions
FOR EACH ROW
EXECUTE FUNCTION ideenwerk_materialize_clarification_prompt();

CREATE OR REPLACE FUNCTION ideenwerk_link_clarification_prompt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.clarification_prompt_id IS NULL THEN
    SELECT p.id INTO NEW.clarification_prompt_id
      FROM citizen_clarification_prompts p
     WHERE p.submission_id=NEW.submission_id
       AND p.status='open'
     ORDER BY p.created_at DESC
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_clarification_prompt ON citizen_clarifications;
CREATE TRIGGER trg_link_clarification_prompt
BEFORE INSERT ON citizen_clarifications
FOR EACH ROW
EXECUTE FUNCTION ideenwerk_link_clarification_prompt();

CREATE OR REPLACE FUNCTION ideenwerk_close_clarification_prompt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.clarification_prompt_id IS NOT NULL THEN
    UPDATE citizen_clarification_prompts
       SET status='answered',answered_at=NEW.created_at
     WHERE id=NEW.clarification_prompt_id AND status='open';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_close_clarification_prompt ON citizen_clarifications;
CREATE TRIGGER trg_close_clarification_prompt
AFTER INSERT ON citizen_clarifications
FOR EACH ROW
EXECUTE FUNCTION ideenwerk_close_clarification_prompt();

CREATE OR REPLACE FUNCTION ideenwerk_list_clarification_prompts(
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
    'prompt_id',p.prompt_id,
    'question',p.question,
    'reason_code',p.reason_code,
    'status',p.status,
    'created_at',p.created_at,
    'answered_at',p.answered_at
  ) ORDER BY p.created_at),'[]'::jsonb)
  INTO v_rows
  FROM citizen_clarification_prompts p
  WHERE p.submission_id=v_submission_id;

  RETURN jsonb_build_object('public_id',p_public_id,'prompts',v_rows);
END;
$$;

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
    'prompt_id',p.prompt_id,
    'response_text',c.response_text,
    'created_at',c.created_at
  ) ORDER BY c.created_at),'[]'::jsonb)
  INTO v_rows
  FROM citizen_clarifications c
  LEFT JOIN citizen_clarification_prompts p ON p.id=c.clarification_prompt_id
  WHERE c.submission_id=v_submission_id;

  RETURN jsonb_build_object('public_id',p_public_id,'clarifications',v_rows);
END;
$$;

REVOKE ALL ON FUNCTION ideenwerk_list_clarification_prompts(text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION ideenwerk_list_clarifications(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION ideenwerk_list_clarification_prompts(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION ideenwerk_list_clarifications(text,text) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('clarification_prompt_contract','026_clarification_prompt',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now();
  END IF;
END;
$$;

COMMIT;
