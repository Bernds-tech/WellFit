-- IDEENWERK: jeder semantische Clusterkandidat muss in eine menschliche Review-Queue.
-- Dedupliziert offene/zugewiesene Tasks und priorisiert Varianten höher als bloße Überschneidungen.

CREATE UNIQUE INDEX IF NOT EXISTS review_tasks_active_subject_unique
  ON review_tasks(subject_type, subject_id, review_type)
  WHERE status IN ('open','assigned');

CREATE OR REPLACE FUNCTION ideenwerk_enqueue_cluster_candidate_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_priority smallint;
  v_task_id text;
BEGIN
  IF NEW.review_status <> 'pending' THEN
    RETURN NEW;
  END IF;

  v_priority := CASE NEW.relation
    WHEN 'same_problem_different_solution' THEN 90
    WHEN 'same_problem_same_solution' THEN 80
    WHEN 'possible_overlap' THEN 65
    ELSE 50
  END;

  v_task_id := 'TASK-' || upper(encode(gen_random_bytes(10), 'hex'));

  INSERT INTO review_tasks(
    task_id, subject_type, subject_id, review_type, required_role, status, priority
  ) VALUES (
    v_task_id,
    'cluster_candidate',
    NEW.id::text,
    'cluster_assignment',
    'cluster_reviewer',
    'open',
    v_priority
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cluster_candidate_review_queue ON cluster_candidates;
CREATE TRIGGER trg_cluster_candidate_review_queue
AFTER INSERT OR UPDATE OF review_status, relation ON cluster_candidates
FOR EACH ROW
EXECUTE FUNCTION ideenwerk_enqueue_cluster_candidate_review();

-- Governance: Ein Clusterkandidat darf technisch existieren, ohne automatisch zusammengeführt zu werden.
-- Der Review-Task ist die Brücke zur menschlichen Entscheidung; die KI/Heuristik bleibt Vorschlagsgeber.
