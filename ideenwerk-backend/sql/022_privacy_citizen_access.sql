BEGIN;

-- WERK IDEENWERK: no-login privacy rights over the existing status-token trust boundary.
-- The functions below never expose token hashes and never hard-delete citizen data.

CREATE OR REPLACE FUNCTION public.ideenwerk_create_privacy_request(
  p_public_id text,
  p_token_hash text,
  p_request_type text,
  p_details text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_submission_id uuid;
  v_request privacy_requests%ROWTYPE;
  v_details text;
  v_request_id text;
BEGIN
  IF p_public_id IS NULL OR p_public_id !~ '^IDEA-[A-F0-9]{16}$'
     OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN NULL;
  END IF;

  IF p_request_type IS NULL OR p_request_type NOT IN ('export','correction','deletion','restriction','cluster_appeal') THEN
    RAISE EXCEPTION 'invalid privacy request type';
  END IF;

  v_details := NULLIF(btrim(p_details),'');
  IF v_details IS NOT NULL AND char_length(v_details) > 3000 THEN
    RAISE EXCEPTION 'privacy request details too long';
  END IF;

  SELECT s.id INTO v_submission_id
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

  -- Network retries must not create duplicate open requests with identical content.
  SELECT pr.* INTO v_request
    FROM privacy_requests pr
   WHERE pr.submission_id=v_submission_id
     AND pr.request_type=p_request_type
     AND COALESCE(pr.details,'')=COALESCE(v_details,'')
     AND pr.status IN ('received','reviewing')
   ORDER BY pr.created_at DESC
   LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'request_id',v_request.request_id,
      'request_type',v_request.request_type,
      'status',v_request.status,
      'created_at',v_request.created_at,
      'replayed',true
    );
  END IF;

  v_request_id := 'PRIV-' || upper(encode(extensions.gen_random_bytes(8),'hex'));

  INSERT INTO privacy_requests(request_id,submission_id,request_type,details)
  VALUES(v_request_id,v_submission_id,p_request_type,v_details)
  RETURNING * INTO v_request;

  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',
    p_public_id,
    'privacy_request_created',
    'citizen',
    'PRIVACY_' || upper(p_request_type),
    jsonb_build_object('request_id',v_request.request_id,'request_type',v_request.request_type)
  );

  RETURN jsonb_build_object(
    'request_id',v_request.request_id,
    'request_type',v_request.request_type,
    'status',v_request.status,
    'created_at',v_request.created_at,
    'replayed',false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.ideenwerk_list_privacy_requests(
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
  v_requests jsonb;
BEGIN
  IF p_public_id IS NULL OR p_public_id !~ '^IDEA-[A-F0-9]{16}$'
     OR p_token_hash IS NULL OR p_token_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN NULL;
  END IF;

  SELECT s.id INTO v_submission_id
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
      'request_id',pr.request_id,
      'request_type',pr.request_type,
      'details',pr.details,
      'status',pr.status,
      'decision_reason_code',pr.decision_reason_code,
      'created_at',pr.created_at,
      'resolved_at',pr.resolved_at
    ) ORDER BY pr.created_at),'[]'::jsonb)
    INTO v_requests
    FROM privacy_requests pr
   WHERE pr.submission_id=v_submission_id;

  RETURN jsonb_build_object('requests',v_requests);
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

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-' || upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',
    v_submission.public_id,
    'privacy_export_generated',
    'citizen',
    'PRIVACY_EXPORT',
    '{}'::jsonb
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
      'resolved_at',pr.resolved_at
    ) ORDER BY pr.created_at),'[]'::jsonb)
    INTO v_requests
    FROM privacy_requests pr
   WHERE pr.submission_id=v_submission.id;

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
    'privacy_requests',v_requests
  );
END;
$$;

-- Keep the protected status as the single citizen cockpit: it now also carries
-- request summaries, while preserving the review-path contract from migration 021.
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

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'request_id',pr.request_id,
      'request_type',pr.request_type,
      'status',pr.status,
      'decision_reason_code',pr.decision_reason_code,
      'created_at',pr.created_at,
      'resolved_at',pr.resolved_at
    ) ORDER BY pr.created_at DESC),'[]'::jsonb)
    INTO v_privacy_requests
    FROM privacy_requests pr
   WHERE pr.submission_id=v_submission.id;

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
    'privacy_requests',v_privacy_requests,
    'history',v_history
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_create_privacy_request(text,text,text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ideenwerk_list_privacy_requests(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ideenwerk_get_privacy_export(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ideenwerk_get_private_status(text,text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.ideenwerk_create_privacy_request(text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ideenwerk_list_privacy_requests(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_privacy_export(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_private_status(text,text) TO service_role;

INSERT INTO public.ideenwerk_runtime_meta(key, value, updated_at)
VALUES ('privacy_citizen_access_contract', '022_privacy_citizen_access', now())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;

COMMIT;
