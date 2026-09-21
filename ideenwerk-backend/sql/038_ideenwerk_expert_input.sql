BEGIN;

-- WERK IDEENWERK migration 038: source-bound expert / affected-party input.
-- This contract adds evidence and disclosed perspectives to an existing citizen submission.
-- It MUST NOT mutate citizen text, rank a political option, veto an idea, accept/reject a
-- proposal, change review depth, or manufacture a fiscal/impact claim.

CREATE TABLE IF NOT EXISTS public.ideenwerk_expert_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_input_id text NOT NULL UNIQUE CHECK (expert_input_id ~ '^EXP-[A-F0-9]{20}$'),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  recorded_by_operator_id uuid NOT NULL REFERENCES public.operators(id) ON DELETE RESTRICT,
  contributor_type text NOT NULL CHECK (contributor_type IN (
    'subject_matter_expert','affected_person','practitioner','researcher','institution','other'
  )),
  expertise_or_affected_role text NOT NULL CHECK (
    char_length(btrim(expertise_or_affected_role)) BETWEEN 3 AND 240
  ),
  source_label text NOT NULL CHECK (char_length(btrim(source_label)) BETWEEN 3 AND 300),
  source_url text,
  source_reference text,
  relationship_code text NOT NULL CHECK (relationship_code IN (
    'none_declared','professional','financial','organizational','directly_affected','other'
  )),
  relationship_disclosure text,
  statement text NOT NULL CHECK (char_length(btrim(statement)) BETWEEN 20 AND 8000),
  evidence_note text CHECK (evidence_note IS NULL OR char_length(evidence_note) <= 5000),
  counterposition_summary text CHECK (
    counterposition_summary IS NULL OR char_length(btrim(counterposition_summary)) BETWEEN 20 AND 5000
  ),
  counterposition_source_label text,
  counterposition_source_url text,
  counterposition_source_reference text,
  citizen_visible boolean NOT NULL DEFAULT true,
  public_transparency_eligible boolean NOT NULL DEFAULT false,
  idempotency_key text NOT NULL UNIQUE CHECK (
    char_length(idempotency_key) BETWEEN 16 AND 128
    AND idempotency_key ~ '^[A-Za-z0-9._:-]+$'
  ),
  payload_hash char(32) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source_url IS NOT NULL OR source_reference IS NOT NULL),
  CHECK (source_url IS NULL OR source_url ~ '^https?://'),
  CHECK (
    relationship_code='none_declared'
    OR (relationship_disclosure IS NOT NULL AND char_length(btrim(relationship_disclosure)) BETWEEN 3 AND 1000)
  ),
  CHECK (
    counterposition_summary IS NULL
    OR (
      counterposition_source_label IS NOT NULL
      AND (counterposition_source_url IS NOT NULL OR counterposition_source_reference IS NOT NULL)
    )
  ),
  CHECK (counterposition_source_url IS NULL OR counterposition_source_url ~ '^https?://')
);

ALTER TABLE public.ideenwerk_expert_inputs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ideenwerk_expert_inputs FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON TABLE public.ideenwerk_expert_inputs TO service_role;

CREATE INDEX IF NOT EXISTS ideenwerk_expert_inputs_submission_created_idx
  ON public.ideenwerk_expert_inputs(submission_id,created_at,expert_input_id);
CREATE INDEX IF NOT EXISTS ideenwerk_expert_inputs_transparency_idx
  ON public.ideenwerk_expert_inputs(public_transparency_eligible,contributor_type,relationship_code,created_at);

-- Rows are append-only while their parent submission exists. Cascaded cleanup is still
-- possible after the parent submission has been removed, which keeps synthetic teardown
-- and future lawful erasure paths from being trapped by the audit guard.
CREATE OR REPLACE FUNCTION public.ideenwerk_guard_expert_input_append_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP='UPDATE' THEN
    RAISE EXCEPTION 'EXPERT_INPUT_APPEND_ONLY';
  END IF;
  IF TG_OP='DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.submissions s WHERE s.id=OLD.submission_id) THEN
      RAISE EXCEPTION 'EXPERT_INPUT_APPEND_ONLY';
    END IF;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_guard_expert_input_append_only() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_guard_expert_input_append_only() TO service_role;

DROP TRIGGER IF EXISTS trg_ideenwerk_expert_input_append_only ON public.ideenwerk_expert_inputs;
CREATE TRIGGER trg_ideenwerk_expert_input_append_only
BEFORE UPDATE OR DELETE ON public.ideenwerk_expert_inputs
FOR EACH ROW EXECUTE FUNCTION public.ideenwerk_guard_expert_input_append_only();

CREATE OR REPLACE FUNCTION public.ideenwerk_expert_input_citizen_view(p_submission_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'expert_input_id',e.expert_input_id,
        'contributor_type',e.contributor_type,
        'expertise_or_affected_role',e.expertise_or_affected_role,
        'source_label',e.source_label,
        'source_url',e.source_url,
        'source_reference',e.source_reference,
        'relationship_code',e.relationship_code,
        'relationship_disclosure',e.relationship_disclosure,
        'statement',e.statement,
        'evidence_note',e.evidence_note,
        'counterposition',CASE WHEN e.counterposition_summary IS NULL THEN NULL ELSE jsonb_build_object(
          'summary',e.counterposition_summary,
          'source_label',e.counterposition_source_label,
          'source_url',e.counterposition_source_url,
          'source_reference',e.counterposition_source_reference
        ) END,
        'created_at',e.created_at,
        'boundary','Fach- oder Betroffeneninput mit offengelegter Quelle/Beziehung; keine politische Entscheidung und kein Expertenveto.'
      ) ORDER BY e.created_at,e.expert_input_id
    ),
    '[]'::jsonb
  )
  FROM public.ideenwerk_expert_inputs e
  WHERE e.submission_id=p_submission_id AND e.citizen_visible=true;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_expert_input_citizen_view(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_expert_input_citizen_view(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_record_expert_input(
  p_operator_id uuid,
  p_public_id text,
  p_contributor_type text,
  p_expertise_or_affected_role text,
  p_source_label text,
  p_source_url text,
  p_source_reference text,
  p_relationship_code text,
  p_relationship_disclosure text,
  p_statement text,
  p_evidence_note text,
  p_counterposition_summary text,
  p_counterposition_source_label text,
  p_counterposition_source_url text,
  p_counterposition_source_reference text,
  p_citizen_visible boolean,
  p_public_transparency_eligible boolean,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission_id uuid;
  v_authorized boolean := false;
  v_payload jsonb;
  v_hash char(32);
  v_existing public.ideenwerk_expert_inputs%ROWTYPE;
  v_id text;
  v_row public.ideenwerk_expert_inputs%ROWTYPE;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.operators o
    JOIN public.operator_roles r ON r.operator_id=o.id
    WHERE o.id=p_operator_id AND o.active=true AND r.role='impact_reviewer'
  ) INTO v_authorized;
  IF NOT v_authorized THEN
    RAISE EXCEPTION 'EXPERT_INPUT_IMPACT_REVIEWER_REQUIRED';
  END IF;

  SELECT s.id INTO v_submission_id
  FROM public.submissions s
  WHERE s.public_id=p_public_id
    AND s.erased_at IS NULL
  LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'EXPERT_INPUT_SUBMISSION_NOT_FOUND'; END IF;

  IF p_contributor_type IS NULL OR p_contributor_type NOT IN (
    'subject_matter_expert','affected_person','practitioner','researcher','institution','other'
  ) THEN RAISE EXCEPTION 'EXPERT_INPUT_CONTRIBUTOR_TYPE_INVALID'; END IF;
  IF p_expertise_or_affected_role IS NULL OR char_length(btrim(p_expertise_or_affected_role)) NOT BETWEEN 3 AND 240 THEN
    RAISE EXCEPTION 'EXPERT_INPUT_ROLE_REQUIRED';
  END IF;
  IF p_source_label IS NULL OR char_length(btrim(p_source_label)) NOT BETWEEN 3 AND 300 THEN
    RAISE EXCEPTION 'EXPERT_INPUT_SOURCE_LABEL_REQUIRED';
  END IF;
  IF p_source_url IS NULL AND p_source_reference IS NULL THEN
    RAISE EXCEPTION 'EXPERT_INPUT_SOURCE_BINDING_REQUIRED';
  END IF;
  IF p_source_url IS NOT NULL AND p_source_url !~ '^https?://' THEN
    RAISE EXCEPTION 'EXPERT_INPUT_SOURCE_URL_INVALID';
  END IF;
  IF p_relationship_code IS NULL OR p_relationship_code NOT IN (
    'none_declared','professional','financial','organizational','directly_affected','other'
  ) THEN RAISE EXCEPTION 'EXPERT_INPUT_RELATIONSHIP_CODE_INVALID'; END IF;
  IF p_relationship_code<>'none_declared' AND (
    p_relationship_disclosure IS NULL OR char_length(btrim(p_relationship_disclosure)) NOT BETWEEN 3 AND 1000
  ) THEN RAISE EXCEPTION 'EXPERT_INPUT_RELATIONSHIP_DISCLOSURE_REQUIRED'; END IF;
  IF p_statement IS NULL OR char_length(btrim(p_statement)) NOT BETWEEN 20 AND 8000 THEN
    RAISE EXCEPTION 'EXPERT_INPUT_STATEMENT_REQUIRED';
  END IF;
  IF p_evidence_note IS NOT NULL AND char_length(p_evidence_note)>5000 THEN
    RAISE EXCEPTION 'EXPERT_INPUT_EVIDENCE_NOTE_TOO_LONG';
  END IF;
  IF p_counterposition_summary IS NOT NULL THEN
    IF char_length(btrim(p_counterposition_summary)) NOT BETWEEN 20 AND 5000 THEN
      RAISE EXCEPTION 'EXPERT_INPUT_COUNTERPOSITION_INVALID';
    END IF;
    IF p_counterposition_source_label IS NULL OR (
      p_counterposition_source_url IS NULL AND p_counterposition_source_reference IS NULL
    ) THEN RAISE EXCEPTION 'EXPERT_INPUT_COUNTERPOSITION_SOURCE_REQUIRED'; END IF;
    IF p_counterposition_source_url IS NOT NULL AND p_counterposition_source_url !~ '^https?://' THEN
      RAISE EXCEPTION 'EXPERT_INPUT_COUNTERPOSITION_URL_INVALID';
    END IF;
  END IF;
  IF p_idempotency_key IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 16 AND 128
     OR p_idempotency_key !~ '^[A-Za-z0-9._:-]+$' THEN
    RAISE EXCEPTION 'EXPERT_INPUT_IDEMPOTENCY_KEY_INVALID';
  END IF;

  v_payload := jsonb_build_object(
    'submission_id',v_submission_id,
    'operator_id',p_operator_id,
    'contributor_type',p_contributor_type,
    'expertise_or_affected_role',btrim(p_expertise_or_affected_role),
    'source_label',btrim(p_source_label),
    'source_url',p_source_url,
    'source_reference',p_source_reference,
    'relationship_code',p_relationship_code,
    'relationship_disclosure',p_relationship_disclosure,
    'statement',btrim(p_statement),
    'evidence_note',p_evidence_note,
    'counterposition_summary',p_counterposition_summary,
    'counterposition_source_label',p_counterposition_source_label,
    'counterposition_source_url',p_counterposition_source_url,
    'counterposition_source_reference',p_counterposition_source_reference,
    'citizen_visible',coalesce(p_citizen_visible,true),
    'public_transparency_eligible',coalesce(p_public_transparency_eligible,false)
  );
  v_hash := md5(v_payload::text);

  SELECT * INTO v_existing
  FROM public.ideenwerk_expert_inputs
  WHERE idempotency_key=p_idempotency_key
  LIMIT 1;
  IF FOUND THEN
    IF v_existing.payload_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'EXPERT_INPUT_IDEMPOTENCY_CONFLICT';
    END IF;
    RETURN jsonb_build_object(
      'expert_input_id',v_existing.expert_input_id,
      'created_at',v_existing.created_at,
      'replayed',true,
      'boundary','append_only_evidence_input_no_political_decision'
    );
  END IF;

  v_id := 'EXP-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));

  INSERT INTO public.ideenwerk_expert_inputs(
    expert_input_id,submission_id,recorded_by_operator_id,contributor_type,
    expertise_or_affected_role,source_label,source_url,source_reference,
    relationship_code,relationship_disclosure,statement,evidence_note,
    counterposition_summary,counterposition_source_label,counterposition_source_url,
    counterposition_source_reference,citizen_visible,public_transparency_eligible,
    idempotency_key,payload_hash
  ) VALUES (
    v_id,v_submission_id,p_operator_id,p_contributor_type,btrim(p_expertise_or_affected_role),
    btrim(p_source_label),p_source_url,p_source_reference,p_relationship_code,
    p_relationship_disclosure,btrim(p_statement),p_evidence_note,p_counterposition_summary,
    p_counterposition_source_label,p_counterposition_source_url,p_counterposition_source_reference,
    coalesce(p_citizen_visible,true),coalesce(p_public_transparency_eligible,false),
    p_idempotency_key,v_hash
  ) RETURNING * INTO v_row;

  INSERT INTO public.audit_events(
    event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload
  ) VALUES (
    'EVT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,20)),
    'submission',p_public_id,'expert_input_recorded','operator','EXPERT_INPUT_RECORDED',
    jsonb_build_object(
      'expert_input_id',v_row.expert_input_id,
      'contributor_type',v_row.contributor_type,
      'relationship_code',v_row.relationship_code,
      'source_bound',true,
      'counterposition_bound',v_row.counterposition_summary IS NOT NULL,
      'citizen_visible',v_row.citizen_visible,
      'public_transparency_eligible',v_row.public_transparency_eligible,
      'boundary','evidence_input_only_no_veto_no_ranking_no_accept_reject'
    )
  );

  RETURN jsonb_build_object(
    'expert_input_id',v_row.expert_input_id,
    'created_at',v_row.created_at,
    'replayed',false,
    'boundary','append_only_evidence_input_no_political_decision'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_record_expert_input(
  uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text
) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_record_expert_input(
  uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text
) TO service_role;

-- Public transparency stays aggregate-only and content-free. It is kept behind the
-- existing trusted API layer (service_role) rather than exposing a parallel direct RPC.
CREATE OR REPLACE FUNCTION public.ideenwerk_expert_input_transparency()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH eligible AS (
    SELECT * FROM public.ideenwerk_expert_inputs WHERE public_transparency_eligible=true
  ), by_type AS (
    SELECT COALESCE(jsonb_object_agg(contributor_type,n ORDER BY contributor_type),'{}'::jsonb) AS value
    FROM (SELECT contributor_type,count(*)::int AS n FROM eligible GROUP BY contributor_type) q
  ), by_relationship AS (
    SELECT COALESCE(jsonb_object_agg(relationship_code,n ORDER BY relationship_code),'{}'::jsonb) AS value
    FROM (SELECT relationship_code,count(*)::int AS n FROM eligible GROUP BY relationship_code) q
  )
  SELECT jsonb_build_object(
    'total_entries',(SELECT count(*)::int FROM eligible),
    'submissions_with_input',(SELECT count(DISTINCT submission_id)::int FROM eligible),
    'by_contributor_type',(SELECT value FROM by_type),
    'by_relationship_code',(SELECT value FROM by_relationship),
    'last_recorded_at',(SELECT max(created_at) FROM eligible),
    'boundary','Nur aggregierte Transparenz; keine Stellungnahmen, Einreichungs-IDs oder Operator-Identitäten werden öffentlich aggregiert ausgegeben.'
  );
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_expert_input_transparency() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_expert_input_transparency() TO service_role;

-- Preserve all existing protected citizen contracts and add only the expert-input overlay.
DO $$
BEGIN
  IF to_regprocedure('public.ideenwerk_get_private_status_v14(text,text)') IS NULL THEN
    EXECUTE 'ALTER FUNCTION public.ideenwerk_get_private_status(text,text) RENAME TO ideenwerk_get_private_status_v14';
  END IF;
  IF to_regprocedure('public.ideenwerk_get_privacy_export_v14(text,text)') IS NULL THEN
    EXECUTE 'ALTER FUNCTION public.ideenwerk_get_privacy_export(text,text) RENAME TO ideenwerk_get_privacy_export_v14';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.ideenwerk_get_private_status(
  p_public_id text,
  p_token_hash text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base jsonb;
  v_submission_id uuid;
  v_expert_inputs jsonb;
BEGIN
  v_base := public.ideenwerk_get_private_status_v14(p_public_id,p_token_hash);
  IF v_base IS NULL THEN RETURN NULL; END IF;
  SELECT s.id INTO v_submission_id FROM public.submissions s WHERE s.public_id=p_public_id LIMIT 1;
  SELECT public.ideenwerk_expert_input_citizen_view(v_submission_id) INTO v_expert_inputs;
  RETURN v_base || jsonb_build_object('expert_inputs',v_expert_inputs);
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_get_private_status(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_private_status(text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.ideenwerk_get_privacy_export(
  p_public_id text,
  p_token_hash text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base jsonb;
  v_submission_id uuid;
  v_expert_inputs jsonb;
BEGIN
  v_base := public.ideenwerk_get_privacy_export_v14(p_public_id,p_token_hash);
  IF v_base IS NULL THEN RETURN NULL; END IF;
  SELECT s.id INTO v_submission_id FROM public.submissions s WHERE s.public_id=p_public_id LIMIT 1;
  SELECT public.ideenwerk_expert_input_citizen_view(v_submission_id) INTO v_expert_inputs;
  RETURN v_base || jsonb_build_object('expert_inputs',v_expert_inputs);
END;
$$;

REVOKE ALL ON FUNCTION public.ideenwerk_get_privacy_export(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideenwerk_get_privacy_export(text,text) TO service_role;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('expert_input_contract','038_ideenwerk_expert_input',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
