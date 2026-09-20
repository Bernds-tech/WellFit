BEGIN;

-- WERK IDEENWERK migration 027: expose the current clarification prompt only
-- through the existing protected status-token/export contracts. Operator identity
-- remains internal; the citizen sees the question, reason code and timestamps.

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
  v_privacy_requests jsonb;
  v_clarification_prompt jsonb;
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

  IF NOT FOUND THEN RETURN NULL; END IF;

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
      'depth',e.payload ->> 'review_depth',
      'triage_queue',e.payload ->> 'triage_queue',
      'source',e.payload ->> 'source',
      'assigned_at',e.created_at
    )
    INTO v_review_path
    FROM audit_events e
   WHERE e.subject_type='submission'
     AND e.subject_id=v_submission.public_id
     AND e.event_type='review_path_assigned'
     AND e.payload ->> 'review_depth' IN ('FAST','STANDARD','DEEP')
   ORDER BY e.created_at DESC
   LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'request_id',pr.request_id,
      'request_type',pr.request_type,
      'status',pr.status,
      'decision_reason_code',pr.decision_reason_code,
      'created_at',pr.created_at,
      'review_started_at',pr.review_started_at,
      'resolved_at',pr.resolved_at
    ) ORDER BY pr.created_at DESC),'[]'::jsonb)
    INTO v_privacy_requests
    FROM privacy_requests pr
   WHERE pr.submission_id=v_submission.id;

  SELECT jsonb_build_object(
      'prompt_id',p.prompt_id,
      'question',p.question,
      'reason_code',p.reason_code,
      'status',p.status,
      'created_at',p.created_at,
      'answered_at',p.answered_at
    )
    INTO v_clarification_prompt
    FROM citizen_clarification_prompts p
   WHERE p.submission_id=v_submission.id
     AND p.status='open'
   ORDER BY p.created_at DESC
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
    'clarification_prompt',v_clarification_prompt,
    'privacy_requests',v_privacy_requests,
    'history',v_history
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.ideenwerk_get_privacy_export(
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
  v_structured jsonb;
  v_memberships jsonb;
  v_audit jsonb;
  v_requests jsonb;
  v_prompts jsonb;
BEGIN
  IF p_public_id IS NULL OR p_public_id !~ '^IDEA-[A-F0-9]{16}$'
     OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN
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

  IF NOT FOUND THEN RETURN NULL; END IF;

  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',v_submission.public_id,'privacy_export_generated','citizen','PRIVACY_EXPORT','{}'::jsonb
  );

  SELECT to_jsonb(sp) - 'submission_id'
    INTO v_structured
    FROM structured_proposals sp
   WHERE sp.submission_id=v_submission.id
   LIMIT 1;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'cluster_id',c.cluster_id,
      'title',c.title,
      'assignment_method',cm.assignment_method,
      'similarity',cm.similarity,
      'created_at',cm.created_at
    ) ORDER BY cm.created_at),'[]'::jsonb)
    INTO v_memberships
    FROM cluster_members cm
    JOIN clusters c ON c.id=cm.cluster_id
   WHERE cm.submission_id=v_submission.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'event_type',e.event_type,
      'actor_type',e.actor_type,
      'reason_code',e.reason_code,
      'payload',e.payload,
      'created_at',e.created_at
    ) ORDER BY e.created_at),'[]'::jsonb)
    INTO v_audit
    FROM audit_events e
   WHERE e.subject_type='submission'
     AND e.subject_id=v_submission.public_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'request_id',pr.request_id,
      'request_type',pr.request_type,
      'details',pr.details,
      'status',pr.status,
      'decision_reason_code',pr.decision_reason_code,
      'created_at',pr.created_at,
      'review_started_at',pr.review_started_at,
      'resolved_at',pr.resolved_at
    ) ORDER BY pr.created_at),'[]'::jsonb)
    INTO v_requests
    FROM privacy_requests pr
   WHERE pr.submission_id=v_submission.id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'prompt_id',p.prompt_id,
      'question',p.question,
      'reason_code',p.reason_code,
      'status',p.status,
      'created_at',p.created_at,
      'answered_at',p.answered_at
    ) ORDER BY p.created_at),'[]'::jsonb)
    INTO v_prompts
    FROM citizen_clarification_prompts p
   WHERE p.submission_id=v_submission.id;

  RETURN jsonb_build_object(
    'export_type','IDEENWERK_PRIVATE_SUBMISSION_EXPORT',
    'generated_at',now(),
    'submission',jsonb_build_object(
      'public_id',v_submission.public_id,
      'original_text',v_submission.original_text,
      'public_text',v_submission.public_text,
      'region',v_submission.region,
      'topic',v_submission.topic,
      'current_status',v_submission.current_status,
      'data_state',v_submission.data_state,
      'created_at',v_submission.created_at,
      'updated_at',v_submission.updated_at,
      'restricted_at',v_submission.restricted_at,
      'anonymized_at',v_submission.anonymized_at,
      'erased_at',v_submission.erased_at,
      'tombstone_reason_code',v_submission.tombstone_reason_code
    ),
    'structured_proposal',v_structured,
    'cluster_memberships',v_memberships,
    'audit_history',v_audit,
    'privacy_requests',v_requests,
    'clarification_prompts',v_prompts
  );
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('clarification_prompt_visibility_contract','027_clarification_prompt_visibility',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now();
  END IF;
END;
$$;

COMMIT;
