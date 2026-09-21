BEGIN;

CREATE TABLE IF NOT EXISTS public.werk_parliamentary_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id text NOT NULL UNIQUE,
  source_decision_id text NOT NULL,
  source_decision_version text NOT NULL,
  decision_artifact_hash char(64) NOT NULL,
  current_state text NOT NULL DEFAULT 'decision_recorded'
    CHECK (current_state IN (
      'decision_recorded',
      'legal_and_competence_review',
      'implementation_path_defined',
      'proposal_or_measure_prepared',
      'formal_process_in_progress',
      'formal_outcome_recorded',
      'implementation_evidence_recorded',
      'impact_measurement_linked',
      'closed_or_reopened'
    )),
  competence_or_legal_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  responsible_institution_or_process text,
  formal_reference text,
  outcome_code text
    CHECK (outcome_code IS NULL OR outcome_code IN (
      'pending',
      'implemented_as_recorded',
      'implemented_with_changes',
      'not_implemented',
      'legally_unavailable',
      'superseded_by_new_decision',
      'unknown_requires_evidence'
    )),
  outcome_source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  implementation_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  impact_measurement_plan_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  recorded_by_operator_id uuid REFERENCES public.operators(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (trace_id ~ '^WTRACE-[A-Z0-9]{20}$'),
  CHECK (btrim(decision_artifact_hash) ~ '^[a-f0-9]{64}$'),
  CHECK (char_length(btrim(source_decision_id)) BETWEEN 3 AND 220),
  CHECK (char_length(btrim(source_decision_version)) BETWEEN 1 AND 120),
  CHECK (jsonb_typeof(competence_or_legal_refs)='array'),
  CHECK (jsonb_typeof(outcome_source_refs)='array'),
  CHECK (jsonb_typeof(implementation_refs)='array'),
  CHECK (jsonb_typeof(impact_measurement_plan_refs)='array')
);

CREATE TABLE IF NOT EXISTS public.werk_parliamentary_trace_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  trace_id uuid NOT NULL REFERENCES public.werk_parliamentary_traces(id) ON DELETE RESTRICT,
  from_state text,
  to_state text NOT NULL,
  reason_code text NOT NULL,
  evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  formal_reference text,
  outcome_code text,
  recorded_by_operator_id uuid REFERENCES public.operators(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (event_id ~ '^WTEVT-[A-Z0-9]{20}$'),
  CHECK (jsonb_typeof(evidence_refs)='array')
);

ALTER TABLE public.werk_parliamentary_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.werk_parliamentary_trace_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.werk_parliamentary_traces FROM PUBLIC,anon,authenticated;
REVOKE ALL ON TABLE public.werk_parliamentary_trace_events FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.werk_parliamentary_traces TO service_role;
GRANT SELECT,INSERT ON TABLE public.werk_parliamentary_trace_events TO service_role;

CREATE INDEX IF NOT EXISTS werk_parliamentary_traces_state_idx
  ON public.werk_parliamentary_traces(current_state,updated_at DESC);
CREATE INDEX IF NOT EXISTS werk_parliamentary_traces_operator_idx
  ON public.werk_parliamentary_traces(recorded_by_operator_id)
  WHERE recorded_by_operator_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS werk_parliamentary_trace_events_trace_idx
  ON public.werk_parliamentary_trace_events(trace_id,created_at);
CREATE INDEX IF NOT EXISTS werk_parliamentary_trace_events_operator_idx
  ON public.werk_parliamentary_trace_events(recorded_by_operator_id)
  WHERE recorded_by_operator_id IS NOT NULL;

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

  SELECT * INTO v_existing
  FROM public.werk_parliamentary_traces
  WHERE source_decision_id=btrim(p_source_decision_id)
    AND source_decision_version=btrim(p_source_decision_version)
  LIMIT 1;

  IF FOUND THEN
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

  v_trace_id:='WTRACE-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  INSERT INTO public.werk_parliamentary_traces(
    trace_id,source_decision_id,source_decision_version,decision_artifact_hash,
    competence_or_legal_refs,recorded_by_operator_id
  ) VALUES(
    v_trace_id,btrim(p_source_decision_id),btrim(p_source_decision_version),
    p_decision_artifact_hash,coalesce(p_competence_or_legal_refs,'[]'::jsonb),
    p_recorded_by_operator_id
  ) RETURNING id INTO v_row_id;

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

CREATE OR REPLACE FUNCTION public.werk_advance_parliamentary_trace(
  p_trace_id text,
  p_expected_state text,
  p_to_state text,
  p_reason_code text,
  p_evidence_refs jsonb,
  p_responsible_institution_or_process text DEFAULT NULL,
  p_formal_reference text DEFAULT NULL,
  p_outcome_code text DEFAULT NULL,
  p_implementation_refs jsonb DEFAULT NULL,
  p_impact_measurement_plan_refs jsonb DEFAULT NULL,
  p_recorded_by_operator_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_trace public.werk_parliamentary_traces%ROWTYPE;
  v_allowed boolean:=false;
BEGIN
  SELECT * INTO v_trace
  FROM public.werk_parliamentary_traces
  WHERE trace_id=p_trace_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'WERK_TRACE_UNKNOWN'; END IF;
  IF v_trace.current_state IS DISTINCT FROM p_expected_state THEN
    RAISE EXCEPTION 'WERK_TRACE_STALE_STATE';
  END IF;
  IF nullif(btrim(p_reason_code),'') IS NULL THEN RAISE EXCEPTION 'WERK_TRACE_REASON_REQUIRED'; END IF;
  IF jsonb_typeof(coalesce(p_evidence_refs,'[]'::jsonb)) <> 'array'
     OR jsonb_array_length(coalesce(p_evidence_refs,'[]'::jsonb))=0 THEN
    RAISE EXCEPTION 'WERK_TRACE_EVIDENCE_REQUIRED';
  END IF;

  v_allowed :=
    (p_expected_state='decision_recorded' AND p_to_state='legal_and_competence_review') OR
    (p_expected_state='legal_and_competence_review' AND p_to_state='implementation_path_defined') OR
    (p_expected_state='implementation_path_defined' AND p_to_state='proposal_or_measure_prepared') OR
    (p_expected_state='proposal_or_measure_prepared' AND p_to_state='formal_process_in_progress') OR
    (p_expected_state='formal_process_in_progress' AND p_to_state='formal_outcome_recorded') OR
    (p_expected_state='formal_outcome_recorded' AND p_to_state='implementation_evidence_recorded') OR
    (p_expected_state='implementation_evidence_recorded' AND p_to_state='impact_measurement_linked') OR
    (p_expected_state='impact_measurement_linked' AND p_to_state='closed_or_reopened') OR
    (p_expected_state='closed_or_reopened' AND p_to_state='legal_and_competence_review');

  IF NOT v_allowed THEN RAISE EXCEPTION 'WERK_TRACE_TRANSITION_INVALID'; END IF;

  IF p_to_state='formal_outcome_recorded' AND p_outcome_code IS NULL THEN
    RAISE EXCEPTION 'WERK_TRACE_OUTCOME_REQUIRED';
  END IF;
  IF p_outcome_code IS NOT NULL AND p_outcome_code NOT IN (
    'pending','implemented_as_recorded','implemented_with_changes','not_implemented',
    'legally_unavailable','superseded_by_new_decision','unknown_requires_evidence'
  ) THEN RAISE EXCEPTION 'WERK_TRACE_OUTCOME_INVALID';
  END IF;
  IF p_to_state='implementation_evidence_recorded'
     AND (p_implementation_refs IS NULL OR jsonb_typeof(p_implementation_refs)<>'array' OR jsonb_array_length(p_implementation_refs)=0) THEN
    RAISE EXCEPTION 'WERK_TRACE_IMPLEMENTATION_EVIDENCE_REQUIRED';
  END IF;
  IF p_to_state='impact_measurement_linked'
     AND (p_impact_measurement_plan_refs IS NULL OR jsonb_typeof(p_impact_measurement_plan_refs)<>'array' OR jsonb_array_length(p_impact_measurement_plan_refs)=0) THEN
    RAISE EXCEPTION 'WERK_TRACE_IMPACT_LINK_REQUIRED';
  END IF;

  UPDATE public.werk_parliamentary_traces
  SET current_state=p_to_state,
      responsible_institution_or_process=coalesce(nullif(btrim(coalesce(p_responsible_institution_or_process,'')),''),responsible_institution_or_process),
      formal_reference=coalesce(nullif(btrim(coalesce(p_formal_reference,'')),''),formal_reference),
      outcome_code=coalesce(p_outcome_code,outcome_code),
      outcome_source_refs=CASE WHEN p_to_state='formal_outcome_recorded' THEN p_evidence_refs ELSE outcome_source_refs END,
      implementation_refs=coalesce(p_implementation_refs,implementation_refs),
      impact_measurement_plan_refs=coalesce(p_impact_measurement_plan_refs,impact_measurement_plan_refs),
      updated_at=now()
  WHERE id=v_trace.id;

  INSERT INTO public.werk_parliamentary_trace_events(
    event_id,trace_id,from_state,to_state,reason_code,evidence_refs,
    formal_reference,outcome_code,recorded_by_operator_id
  ) VALUES(
    'WTEVT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20)),
    v_trace.id,p_expected_state,p_to_state,btrim(p_reason_code),p_evidence_refs,
    nullif(btrim(coalesce(p_formal_reference,'')),''),p_outcome_code,p_recorded_by_operator_id
  );

  RETURN jsonb_build_object(
    'trace_id',p_trace_id,
    'state',p_to_state,
    'boundary','descriptive_trace_only_no_actor_score_no_law_claim'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.werk_get_parliamentary_trace(p_trace_id text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT CASE WHEN t.id IS NULL THEN NULL ELSE jsonb_build_object(
    'trace_id',t.trace_id,
    'source_decision_id',t.source_decision_id,
    'source_decision_version',t.source_decision_version,
    'decision_artifact_hash',t.decision_artifact_hash,
    'current_state',t.current_state,
    'competence_or_legal_refs',t.competence_or_legal_refs,
    'responsible_institution_or_process',t.responsible_institution_or_process,
    'formal_reference',t.formal_reference,
    'outcome_code',t.outcome_code,
    'outcome_source_refs',t.outcome_source_refs,
    'implementation_refs',t.implementation_refs,
    'impact_measurement_plan_refs',t.impact_measurement_plan_refs,
    'events',coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'event_id',e.event_id,
        'from_state',e.from_state,
        'to_state',e.to_state,
        'reason_code',e.reason_code,
        'evidence_refs',e.evidence_refs,
        'formal_reference',e.formal_reference,
        'outcome_code',e.outcome_code,
        'created_at',e.created_at
      ) ORDER BY e.created_at,e.id)
      FROM public.werk_parliamentary_trace_events e
      WHERE e.trace_id=t.id
    ),'[]'::jsonb),
    'created_at',t.created_at,
    'updated_at',t.updated_at,
    'boundary','descriptive_trace_only_no_actor_score_no_law_claim'
  ) END
  FROM public.werk_parliamentary_traces t
  WHERE t.trace_id=p_trace_id;
$$;

REVOKE ALL ON FUNCTION public.werk_create_parliamentary_trace(text,text,text,jsonb,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.werk_advance_parliamentary_trace(text,text,text,text,jsonb,text,text,text,jsonb,jsonb,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.werk_get_parliamentary_trace(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_create_parliamentary_trace(text,text,text,jsonb,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.werk_advance_parliamentary_trace(text,text,text,text,jsonb,text,text,text,jsonb,jsonb,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.werk_get_parliamentary_trace(text) TO service_role;

INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
VALUES('parliamentary_trace_runtime_contract','048_parliamentary_trace_internal_disabled',now())
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=EXCLUDED.updated_at;

COMMIT;
