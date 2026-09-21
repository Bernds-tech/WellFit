BEGIN;

-- Enforce one canonical parliamentary trace per decision/version at the database layer.
CREATE UNIQUE INDEX IF NOT EXISTS werk_parliamentary_traces_decision_version_uniq
  ON public.werk_parliamentary_traces(source_decision_id,source_decision_version);

-- The service role may read the internal trace tables, but every write must pass
-- through the bounded SECURITY DEFINER RPCs below. This prevents direct table DML
-- from bypassing evidence/state-transition and append-only event invariants.
REVOKE ALL ON TABLE public.werk_parliamentary_traces FROM service_role;
REVOKE ALL ON TABLE public.werk_parliamentary_trace_events FROM service_role;
GRANT SELECT ON TABLE public.werk_parliamentary_traces TO service_role;
GRANT SELECT ON TABLE public.werk_parliamentary_trace_events TO service_role;

CREATE OR REPLACE FUNCTION public.werk_create_parliamentary_trace(
  p_source_decision_id text,
  p_source_decision_version text,
  p_decision_artifact_hash text,
  p_competence_or_legal_refs jsonb DEFAULT '[]'::jsonb,
  p_recorded_by_operator_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,extensions
AS $$
DECLARE
  v_existing public.werk_parliamentary_traces%ROWTYPE;
  v_trace_id text;
  v_row_id uuid;
BEGIN
  IF nullif(btrim(p_source_decision_id),'') IS NULL OR char_length(btrim(p_source_decision_id)) > 220 THEN
    RAISE EXCEPTION 'WERK_TRACE_DECISION_ID_INVALID';
  END IF;
  IF nullif(btrim(p_source_decision_version),'') IS NULL OR char_length(btrim(p_source_decision_version)) > 120 THEN
    RAISE EXCEPTION 'WERK_TRACE_DECISION_VERSION_INVALID';
  END IF;
  IF coalesce(p_decision_artifact_hash,'') !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'WERK_TRACE_DECISION_HASH_INVALID';
  END IF;
  IF jsonb_typeof(coalesce(p_competence_or_legal_refs,'[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'WERK_TRACE_LEGAL_REFS_INVALID';
  END IF;

  v_trace_id:='WTRACE-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));

  INSERT INTO public.werk_parliamentary_traces(
    trace_id,source_decision_id,source_decision_version,decision_artifact_hash,
    competence_or_legal_refs,recorded_by_operator_id
  ) VALUES(
    v_trace_id,btrim(p_source_decision_id),btrim(p_source_decision_version),
    p_decision_artifact_hash,coalesce(p_competence_or_legal_refs,'[]'::jsonb),
    p_recorded_by_operator_id
  )
  ON CONFLICT (source_decision_id,source_decision_version) DO NOTHING
  RETURNING id INTO v_row_id;

  IF v_row_id IS NULL THEN
    SELECT * INTO v_existing
    FROM public.werk_parliamentary_traces
    WHERE source_decision_id=btrim(p_source_decision_id)
      AND source_decision_version=btrim(p_source_decision_version)
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'WERK_TRACE_REPLAY_RETRY_REQUIRED';
    END IF;
    IF btrim(v_existing.decision_artifact_hash) IS DISTINCT FROM p_decision_artifact_hash THEN
      RAISE EXCEPTION 'WERK_TRACE_DECISION_VERSION_CONFLICT';
    END IF;
    RETURN jsonb_build_object(
      'trace_id',v_existing.trace_id,
      'state',v_existing.current_state,
      'replayed',true,
      'boundary','trace_only_no_law_or_vote_claim'
    );
  END IF;

  INSERT INTO public.werk_parliamentary_trace_events(
    event_id,trace_id,from_state,to_state,reason_code,evidence_refs,recorded_by_operator_id
  ) VALUES(
    'WTEVT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20)),
    v_row_id,NULL,'decision_recorded','decision_artifact_registered',
    jsonb_build_array(jsonb_build_object(
      'source_decision_id',btrim(p_source_decision_id),
      'source_decision_version',btrim(p_source_decision_version),
      'decision_artifact_hash',p_decision_artifact_hash
    )),
    p_recorded_by_operator_id
  );

  RETURN jsonb_build_object(
    'trace_id',v_trace_id,
    'state','decision_recorded',
    'replayed',false,
    'boundary','trace_only_no_law_or_vote_claim'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.werk_create_parliamentary_trace(text,text,text,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_create_parliamentary_trace(text,text,text,jsonb,uuid) TO service_role;

INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
VALUES('parliamentary_trace_runtime_contract','049_parliamentary_trace_integrity_hardened',now())
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=EXCLUDED.updated_at;

COMMIT;
