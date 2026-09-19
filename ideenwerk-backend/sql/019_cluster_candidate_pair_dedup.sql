-- IDEENWERK migration 019: one human-review candidate per unordered submission pair.
-- The semantic relation is symmetric. Without a DB guard, two concurrently processed
-- submissions can create A->B and B->A candidates and therefore duplicate review tasks.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM cluster_candidates a
      JOIN cluster_candidates b
        ON a.id < b.id
       AND a.method = b.method
       AND a.submission_id = b.candidate_submission_id
       AND a.candidate_submission_id = b.submission_id
  ) THEN
    RAISE EXCEPTION 'reciprocal cluster candidates exist; review/deduplicate them before applying migration 019';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION ideenwerk_canonicalize_cluster_candidate_pair()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing_submission uuid;
  v_existing_candidate uuid;
  v_submission_created timestamptz;
  v_candidate_created timestamptz;
  v_tmp uuid;
BEGIN
  IF NEW.submission_id = NEW.candidate_submission_id THEN
    RAISE EXCEPTION 'cluster candidate cannot reference the same submission twice';
  END IF;

  -- If this unordered pair already exists, align the incoming row with the
  -- existing orientation. The table's normal UNIQUE constraint then turns the
  -- worker's ON CONFLICT into an update instead of creating a reciprocal row.
  SELECT c.submission_id, c.candidate_submission_id
    INTO v_existing_submission, v_existing_candidate
    FROM cluster_candidates c
   WHERE c.method = NEW.method
     AND (
       (c.submission_id = NEW.submission_id AND c.candidate_submission_id = NEW.candidate_submission_id)
       OR
       (c.submission_id = NEW.candidate_submission_id AND c.candidate_submission_id = NEW.submission_id)
     )
   ORDER BY c.created_at, c.id
   LIMIT 1;

  IF FOUND THEN
    NEW.submission_id := v_existing_submission;
    NEW.candidate_submission_id := v_existing_candidate;
    RETURN NEW;
  END IF;

  SELECT created_at INTO STRICT v_submission_created
    FROM submissions WHERE id = NEW.submission_id;
  SELECT created_at INTO STRICT v_candidate_created
    FROM submissions WHERE id = NEW.candidate_submission_id;

  -- New pairs get one deterministic direction: newer submission -> older
  -- candidate. UUID text is only a stable tie-breaker for equal timestamps.
  IF v_submission_created < v_candidate_created
     OR (v_submission_created = v_candidate_created
         AND NEW.submission_id::text < NEW.candidate_submission_id::text) THEN
    v_tmp := NEW.submission_id;
    NEW.submission_id := NEW.candidate_submission_id;
    NEW.candidate_submission_id := v_tmp;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cluster_candidate_pair_canonical ON cluster_candidates;
CREATE TRIGGER trg_cluster_candidate_pair_canonical
BEFORE INSERT ON cluster_candidates
FOR EACH ROW
EXECUTE FUNCTION ideenwerk_canonicalize_cluster_candidate_pair();

REVOKE ALL ON FUNCTION ideenwerk_canonicalize_cluster_candidate_pair() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION ideenwerk_canonicalize_cluster_candidate_pair() IS
  'Canonicalizes unordered cluster-candidate pairs so AI/heuristic workers cannot create duplicate reciprocal human-review tasks.';
