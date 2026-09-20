BEGIN;

-- WERK IDEENWERK: bounded, non-destructive operator resolution for citizen privacy requests.
-- This migration records review state and decisions only. It never deletes, anonymises,
-- restricts, corrects or re-clusters citizen data.

ALTER TABLE public.privacy_requests
  DROP CONSTRAINT IF EXISTS privacy_requests_status_check;

ALTER TABLE public.privacy_requests
  ADD CONSTRAINT privacy_requests_status_check
  CHECK (status IN ('received','reviewing','resolved','completed','partially_completed','rejected','cancelled'));

ALTER TABLE public.privacy_requests
  ADD COLUMN IF NOT EXISTS assigned_operator_id uuid REFERENCES public.operators(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_started_at timestamptz;

CREATE INDEX IF NOT EXISTS privacy_requests_operator_queue_idx
  ON public.privacy_requests(status,request_type,created_at ASC);

CREATE OR REPLACE FUNCTION public.ideenwerk_operator_transition_privacy_request(
  p_request_id text,
  p_operator_subject_hash text,
  p_target_status text,
  p_reason_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request public.privacy_requests%ROWTYPE;
  v_operator_id uuid;
  v_operator_active boolean;
  v_required_role text;
  v_public_id text;
  v_reason_code text;
  v_now timestamptz := now();
BEGIN
  IF p_request_id IS NULL OR p_request_id !~ '^PRIV-[A-F0-9]{16}$' THEN
    RAISE EXCEPTION 'IDEENWERK invalid privacy request id';
  END IF;

  IF p_operator_subject_hash IS NULL OR p_operator_subject_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'IDEENWERK invalid operator subject hash';
  END IF;

  IF p_target_status IS NULL OR p_target_status NOT IN ('reviewing','resolved','rejected') THEN
    RAISE EXCEPTION 'IDEENWERK invalid privacy target status';
  END IF;

  v_reason_code := upper(btrim(COALESCE(p_reason_code,'')));
  IF v_reason_code !~ '^[A-Z0-9][A-Z0-9_:-]{2,79}$' THEN
    RAISE EXCEPTION 'IDEENWERK privacy transition requires a bounded reason code';
  END IF;

  SELECT pr.* INTO v_request
    FROM public.privacy_requests pr
   WHERE pr.request_id=p_request_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'IDEENWERK privacy request not found';
  END IF;

  SELECT s.public_id INTO v_public_id
    FROM public.submissions s
   WHERE s.id=v_request.submission_id;

  IF v_public_id IS NULL THEN
    RAISE EXCEPTION 'IDEENWERK privacy request submission not found';
  END IF;

  v_required_role := CASE
    WHEN v_request.request_type='cluster_appeal' THEN 'appeal_reviewer'
    ELSE 'legal_reviewer'
  END;

  SELECT o.id,o.active INTO v_operator_id,v_operator_active
    FROM public.operators o
   WHERE o.external_subject_hash=p_operator_subject_hash
   LIMIT 1;

  IF NOT FOUND OR v_operator_active IS NOT TRUE THEN
    RAISE EXCEPTION 'IDEENWERK operator is missing or inactive';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.operator_roles r
     WHERE r.operator_id=v_operator_id
       AND r.role=v_required_role
  ) THEN
    RAISE EXCEPTION 'IDEENWERK operator lacks required role: %', v_required_role;
  END IF;

  -- Safe network retry: the exact same operator may replay the already-recorded state
  -- without creating another audit event.
  IF v_request.status=p_target_status THEN
    IF v_request.assigned_operator_id IS DISTINCT FROM v_operator_id THEN
      RAISE EXCEPTION 'IDEENWERK privacy request is assigned to another operator';
    END IF;
    IF p_target_status IN ('resolved','rejected')
       AND v_request.decision_reason_code IS DISTINCT FROM v_reason_code THEN
      RAISE EXCEPTION 'IDEENWERK privacy decision replay conflicts with recorded reason';
    END IF;
    RETURN jsonb_build_object(
      'request_id',v_request.request_id,
      'request_type',v_request.request_type,
      'status',v_request.status,
      'decision_reason_code',v_request.decision_reason_code,
      'review_started_at',v_request.review_started_at,
      'resolved_at',v_request.resolved_at,
      'required_role',v_required_role,
      'replayed',true,
      'destructive_execution',false
    );
  END IF;

  IF p_target_status='reviewing' THEN
    IF v_request.status<>'received' THEN
      RAISE EXCEPTION 'IDEENWERK invalid privacy transition: % -> reviewing', v_request.status;
    END IF;

    UPDATE public.privacy_requests
       SET status='reviewing',
           assigned_operator_id=v_operator_id,
           review_started_at=COALESCE(review_started_at,v_now)
     WHERE id=v_request.id
     RETURNING * INTO v_request;

    INSERT INTO public.audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
    VALUES(
      'EVT-' || upper(replace(gen_random_uuid()::text,'-','')),
      'submission',
      v_public_id,
      'privacy_request_review_started',
      'operator',
      v_reason_code,
      jsonb_build_object(
        'request_id',v_request.request_id,
        'request_type',v_request.request_type,
        'from_status','received',
        'to_status','reviewing',
        'required_role',v_required_role,
        'destructive_execution',false
      )
    );
  ELSE
    IF v_request.status<>'reviewing' THEN
      RAISE EXCEPTION 'IDEENWERK invalid privacy transition: % -> %', v_request.status, p_target_status;
    END IF;
    IF v_request.assigned_operator_id IS DISTINCT FROM v_operator_id THEN
      RAISE EXCEPTION 'IDEENWERK privacy request is assigned to another operator';
    END IF;

    UPDATE public.privacy_requests
       SET status=p_target_status,
           decision_reason_code=v_reason_code,
           resolved_at=v_now
     WHERE id=v_request.id
     RETURNING * INTO v_request;

    INSERT INTO public.audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
    VALUES(
      'EVT-' || upper(replace(gen_random_uuid()::text,'-','')),
      'submission',
      v_public_id,
      CASE WHEN p_target_status='resolved' THEN 'privacy_request_resolved' ELSE 'privacy_request_rejected' END,
      'operator',
      v_reason_code,
      jsonb_build_object(
        'request_id',v_request.request_id,
        'request_type',v_request.request_type,
        'from_status','reviewing',
        'to_status',p_target_status,
        'required_role',v_required_role,
        'destructive_execution',false
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'request_id',v_request.request_id,
    'request_type',v_request.request_type,
    'status',v_request.status,
    'decision_reason_code',v_request.decision_reason_code,
    'review_started_at',v_request.review_started_at,
    'resolved_at',v_request.resolved_at,
    'required_role',v_required_role,
    'replayed',false,
    'destructive_execution',false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_operator_transition_privacy_request(text,text,text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_operator_transition_privacy_request(text,text,text,text)
  TO service_role;

COMMIT;
