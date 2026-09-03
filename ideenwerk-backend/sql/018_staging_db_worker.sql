-- IDEENWERK migration 018: interner Staging-Worker über pg_cron.
-- Keine öffentliche Worker-API. Der deterministische Fallback bleibt konservativ.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION ideenwerk_db_status_change(
  p_public_id text,
  p_to text,
  p_reason_code text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_from text;
BEGIN
  SELECT current_status INTO v_from FROM submissions WHERE public_id=p_public_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'submission not found: %',p_public_id; END IF;
  IF v_from=p_to THEN RETURN; END IF;
  UPDATE submissions SET current_status=p_to,updated_at=now() WHERE public_id=p_public_id;
  INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-'||upper(encode(extensions.gen_random_bytes(10),'hex')),
    'submission',p_public_id,'status_changed','system',p_reason_code,
    jsonb_build_object('from',v_from,'to',p_to)||COALESCE(p_payload,'{}'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION ideenwerk_db_enqueue(
  p_job_type text,
  p_subject_id text,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  INSERT INTO processing_jobs(job_type,subject_type,subject_id,payload)
  VALUES(p_job_type,'submission',p_subject_id,COALESCE(p_payload,'{}'::jsonb))
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION ideenwerk_process_one_job()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_job processing_jobs%ROWTYPE;
  v_sub submissions%ROWTYPE;
  v_candidate record;
  v_feature proposal_features%ROWTYPE;
  v_cluster_id uuid;
  v_cluster_public_id text;
  v_flags jsonb := '[]'::jsonb;
  v_problem text;
  v_solution text;
  v_parts text[];
  v_relevant int := 0;
  v_problem_sim numeric;
  v_solution_sim numeric;
  v_relation text;
  v_action text;
  v_attempt int;
BEGIN
  SELECT * INTO v_job
    FROM processing_jobs
   WHERE status='queued' AND available_at<=now()
   ORDER BY id
   FOR UPDATE SKIP LOCKED
   LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  v_attempt := v_job.attempts + 1;
  UPDATE processing_jobs
     SET status='running',attempts=v_attempt,locked_at=now(),locked_by='pg-cron-staging-worker',updated_at=now()
   WHERE id=v_job.id;

  BEGIN
    SELECT * INTO v_sub FROM submissions WHERE public_id=v_job.subject_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'submission missing: %',v_job.subject_id; END IF;

    IF v_job.job_type='pii_scan' THEN
      IF COALESCE(v_sub.original_text,'') ~* '[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}' THEN v_flags := v_flags || '"email"'::jsonb; END IF;
      IF COALESCE(v_sub.original_text,'') ~ '(\+43|0043|0)[[:space:]]?[0-9][0-9[:space:]/\-]{6,}' THEN v_flags := v_flags || '"phone"'::jsonb; END IF;
      IF jsonb_array_length(v_flags)>0 THEN
        INSERT INTO abuse_signals(submission_id,signal_type,signal_value,expires_at)
        VALUES(v_sub.id,'pii_detected',jsonb_build_object('flags',v_flags),now()+interval '30 days');
        PERFORM ideenwerk_db_status_change(v_sub.public_id,'privacy_hold','PII_REVIEW',jsonb_build_object('flags',v_flags));
      ELSE
        PERFORM ideenwerk_db_enqueue('structure_submission',v_sub.public_id,jsonb_build_object('source','pii_scan_pass'));
      END IF;

    ELSIF v_job.job_type='structure_submission' THEN
      INSERT INTO structured_proposals(submission_id,problem,proposal,goal,suggested_level,topic,region,open_questions,citizen_confirmed)
      VALUES(v_sub.id,v_sub.original_text,v_sub.original_text,NULL,NULL,v_sub.topic,v_sub.region,'[]'::jsonb,false)
      ON CONFLICT(submission_id) DO UPDATE SET problem=excluded.problem,proposal=excluded.proposal,topic=excluded.topic,region=excluded.region,updated_at=now();
      IF v_sub.current_status='received' THEN PERFORM ideenwerk_db_status_change(v_sub.public_id,'structured','FALLBACK_STRUCTURE'); END IF;
      PERFORM ideenwerk_db_enqueue('lexical_duplicate_search',v_sub.public_id,jsonb_build_object('threshold',0.90));

    ELSIF v_job.job_type='lexical_duplicate_search' THEN
      IF v_sub.current_status='structured' THEN PERFORM ideenwerk_db_status_change(v_sub.public_id,'cluster_review','LEXICAL_REVIEW',jsonb_build_object('threshold',0.90)); END IF;
      SELECT s.id,s.public_id,s.cluster_id,s.region,s.topic,s.current_status,extensions.similarity(s.original_text,v_sub.original_text) AS sim
        INTO v_candidate
        FROM submissions s
       WHERE s.public_id<>v_sub.public_id
         AND COALESCE(s.region,'')=COALESCE(v_sub.region,'')
         AND COALESCE(s.topic,'')=COALESCE(v_sub.topic,'')
         AND s.current_status NOT IN ('received','privacy_hold','clarification','quarantine','removed')
         AND extensions.similarity(s.original_text,v_sub.original_text)>=0.90
       ORDER BY sim DESC,s.created_at ASC LIMIT 1;
      IF FOUND THEN
        v_cluster_id:=v_candidate.cluster_id;
        IF v_cluster_id IS NULL THEN
          v_cluster_public_id:='CLU-'||upper(encode(extensions.gen_random_bytes(8),'hex'));
          INSERT INTO clusters(cluster_id,title,topic,region_scope,review_status)
          VALUES(v_cluster_public_id,'Vorläufiger Cluster – interne Prüfung',v_sub.topic,v_sub.region,'cluster_review') RETURNING id INTO v_cluster_id;
          UPDATE submissions SET cluster_id=v_cluster_id,updated_at=now() WHERE id=v_candidate.id;
          INSERT INTO cluster_members(cluster_id,submission_id,similarity,assignment_method)
          VALUES(v_cluster_id,v_candidate.id,v_candidate.sim,'lexical_pg_trgm') ON CONFLICT DO NOTHING;
        ELSE
          SELECT cluster_id INTO v_cluster_public_id FROM clusters WHERE id=v_cluster_id;
        END IF;
        UPDATE submissions SET cluster_id=v_cluster_id,updated_at=now() WHERE id=v_sub.id;
        INSERT INTO cluster_members(cluster_id,submission_id,similarity,assignment_method)
        VALUES(v_cluster_id,v_sub.id,v_candidate.sim,'lexical_pg_trgm') ON CONFLICT DO NOTHING;
        PERFORM ideenwerk_db_status_change(v_sub.public_id,'clustered','DUPLICATE_CLUSTERED',jsonb_build_object('matched_public_id',v_candidate.public_id,'similarity',v_candidate.sim,'cluster_id',v_cluster_public_id));
      ELSE
        PERFORM ideenwerk_db_enqueue('semantic_feature_extract',v_sub.public_id,jsonb_build_object('source','no_safe_lexical_duplicate'));
      END IF;

    ELSIF v_job.job_type='semantic_feature_extract' THEN
      v_parts:=regexp_match(COALESCE(v_sub.original_text,''),'^\s*([^.!?]+[.!?]?)\s*(.*)$','s');
      IF v_parts IS NOT NULL AND length(btrim(COALESCE(v_parts[2],'')))>0 THEN
        v_problem:=lower(btrim(v_parts[1])); v_solution:=lower(btrim(v_parts[2]));
      ELSE
        v_problem:=lower(btrim(COALESCE(v_sub.original_text,''))); v_solution:=v_problem;
      END IF;
      INSERT INTO proposal_features(submission_id,provider,model_version,problem_signature,solution_signature,topic,suggested_level,region_scope,open_questions,raw_payload)
      VALUES(v_sub.id,'deterministic_fallback','fallback-v2-sql',v_problem,v_solution,v_sub.topic,NULL,v_sub.region,'[]'::jsonb,jsonb_build_object('mode','staging-db-fallback'))
      ON CONFLICT(submission_id) DO UPDATE SET provider=excluded.provider,model_version=excluded.model_version,problem_signature=excluded.problem_signature,solution_signature=excluded.solution_signature,topic=excluded.topic,region_scope=excluded.region_scope,raw_payload=excluded.raw_payload,updated_at=now();
      PERFORM ideenwerk_db_enqueue('semantic_cluster_review',v_sub.public_id,jsonb_build_object('provider','deterministic_fallback','model_version','fallback-v2-sql'));

    ELSIF v_job.job_type='semantic_cluster_review' THEN
      SELECT * INTO v_feature FROM proposal_features WHERE submission_id=v_sub.id;
      IF NOT FOUND THEN RAISE EXCEPTION 'semantic features missing'; END IF;
      FOR v_candidate IN
        SELECT s.id,s.public_id,s.current_status,f.problem_signature,f.solution_signature,f.topic,f.suggested_level,f.region_scope,
               extensions.similarity(f.problem_signature,v_feature.problem_signature) AS problem_sim,
               extensions.similarity(f.solution_signature,v_feature.solution_signature) AS solution_sim
          FROM proposal_features f JOIN submissions s ON s.id=f.submission_id
         WHERE s.id<>v_sub.id
           AND s.current_status NOT IN ('received','privacy_hold','clarification','quarantine','removed')
           AND (v_feature.topic IS NULL OR f.topic=v_feature.topic OR f.topic IS NULL)
         ORDER BY GREATEST(extensions.similarity(f.problem_signature,v_feature.problem_signature),extensions.similarity(f.solution_signature,v_feature.solution_signature)) DESC,s.created_at ASC
         LIMIT 20
      LOOP
        v_problem_sim:=v_candidate.problem_sim; v_solution_sim:=v_candidate.solution_sim; v_relation:=NULL; v_action:=NULL;
        IF v_problem_sim>=0.92 AND v_solution_sim>=0.90 AND (v_feature.region_scope IS NULL OR v_candidate.region_scope IS NULL OR v_feature.region_scope=v_candidate.region_scope) THEN
          v_relation:='same_problem_same_solution'; v_action:='auto_cluster_candidate';
        ELSIF v_problem_sim>=0.88 AND v_solution_sim<=0.72 THEN
          v_relation:='same_problem_different_solution'; v_action:='preserve_variant_review';
        ELSIF v_problem_sim>=0.78 OR v_solution_sim>=0.60 THEN
          v_relation:='possible_overlap'; v_action:='human_cluster_review';
        END IF;
        IF v_relation IS NOT NULL THEN
          v_relevant:=v_relevant+1;
          INSERT INTO cluster_candidates(submission_id,candidate_submission_id,relation,problem_similarity,solution_similarity,assignment_action,method,rationale)
          VALUES(v_sub.id,v_candidate.id,v_relation,v_problem_sim,v_solution_sim,v_action,'semantic_signatures:deterministic_fallback:fallback-v2-sql','Staging-Fallback; menschliche Prüfung bei Kandidaten erforderlich')
          ON CONFLICT(submission_id,candidate_submission_id,method) DO UPDATE SET relation=excluded.relation,problem_similarity=excluded.problem_similarity,solution_similarity=excluded.solution_similarity,assignment_action=excluded.assignment_action,rationale=excluded.rationale;
        END IF;
      END LOOP;
      IF v_relevant=0 AND v_sub.current_status='cluster_review' THEN
        PERFORM ideenwerk_db_status_change(v_sub.public_id,'precheck','NO_CLUSTER_OVERLAP',jsonb_build_object('provider','deterministic_fallback','model_version','fallback-v2-sql'));
      ELSE
        INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
        VALUES('EVT-'||upper(encode(extensions.gen_random_bytes(10),'hex')),'submission',v_sub.public_id,'cluster_candidates_created','system',NULL,jsonb_build_object('relevant_candidates',v_relevant,'provider','deterministic_fallback'));
      END IF;
    ELSE
      RAISE EXCEPTION 'unsupported job type: %',v_job.job_type;
    END IF;

    UPDATE processing_jobs SET status='done',locked_at=NULL,locked_by=NULL,updated_at=now() WHERE id=v_job.id;
    RETURN jsonb_build_object('job_id',v_job.id,'job_type',v_job.job_type,'subject_id',v_job.subject_id,'status','done');

  EXCEPTION WHEN OTHERS THEN
    UPDATE processing_jobs
       SET status=CASE WHEN v_attempt>=max_attempts THEN 'dead' ELSE 'queued' END,
           last_error=left(SQLERRM,2000),locked_at=NULL,locked_by=NULL,
           available_at=CASE WHEN v_attempt>=max_attempts THEN available_at ELSE now()+interval '30 seconds' END,
           updated_at=now()
     WHERE id=v_job.id;
    RETURN jsonb_build_object('job_id',v_job.id,'job_type',v_job.job_type,'subject_id',v_job.subject_id,'status','error','error',SQLERRM);
  END;
END;
$$;

CREATE OR REPLACE FUNCTION ideenwerk_process_queue(p_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_i int:=0; v_result jsonb; v_done int:=0; v_errors int:=0;
BEGIN
  p_limit:=greatest(1,least(COALESCE(p_limit,50),500));
  WHILE v_i<p_limit LOOP
    v_result:=ideenwerk_process_one_job();
    EXIT WHEN v_result IS NULL;
    v_i:=v_i+1;
    IF v_result->>'status'='done' THEN v_done:=v_done+1; ELSE v_errors:=v_errors+1; END IF;
  END LOOP;
  RETURN jsonb_build_object('processed',v_i,'done',v_done,'errors',v_errors,'at',now());
END;
$$;

REVOKE ALL ON FUNCTION ideenwerk_db_status_change(text,text,text,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION ideenwerk_db_enqueue(text,text,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION ideenwerk_process_one_job() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION ideenwerk_process_queue(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION ideenwerk_process_queue(integer) TO service_role;

DO $$
DECLARE v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname='ideenwerk-staging-worker' LIMIT 1;
  IF v_jobid IS NOT NULL THEN PERFORM cron.unschedule(v_jobid); END IF;
  PERFORM cron.schedule('ideenwerk-staging-worker','* * * * *','SELECT public.ideenwerk_process_queue(50);');
END;
$$;

INSERT INTO ideenwerk_runtime_meta(key,value,updated_at)
VALUES('worker_contract','018_staging_db_worker',now())
ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now();
