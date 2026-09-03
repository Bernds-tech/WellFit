-- IDEENWERK: serverseitige Durchsetzung menschlicher Review-Regeln.
-- Ziel: Clusterkandidaten können nicht still von KI/Worker akzeptiert werden; Rollen und Appeals werden DB-seitig abgesichert.

CREATE OR REPLACE FUNCTION ideenwerk_validate_review_decision()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_required_role text;
  v_task_status text;
  v_assigned uuid;
  v_active boolean;
  v_has_role boolean;
BEGIN
  SELECT t.required_role, t.status, t.assigned_operator_id
    INTO v_required_role, v_task_status, v_assigned
    FROM review_tasks t
   WHERE t.id = NEW.task_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'IDEENWERK review task not found';
  END IF;

  IF v_task_status IN ('decided','cancelled') THEN
    RAISE EXCEPTION 'IDEENWERK review task is not open for decision: %', v_task_status;
  END IF;

  IF v_assigned IS NOT NULL AND v_assigned <> NEW.operator_id THEN
    RAISE EXCEPTION 'IDEENWERK review task assigned to another operator';
  END IF;

  SELECT o.active,
         EXISTS(
           SELECT 1 FROM operator_roles r
            WHERE r.operator_id = NEW.operator_id
              AND r.role = v_required_role
         )
    INTO v_active, v_has_role
    FROM operators o
   WHERE o.id = NEW.operator_id;

  IF NOT FOUND OR v_active IS NOT TRUE THEN
    RAISE EXCEPTION 'IDEENWERK operator is missing or inactive';
  END IF;

  IF v_has_role IS NOT TRUE THEN
    RAISE EXCEPTION 'IDEENWERK operator lacks required role: %', v_required_role;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_review_decision ON review_decisions;
CREATE TRIGGER trg_validate_review_decision
BEFORE INSERT ON review_decisions
FOR EACH ROW
EXECUTE FUNCTION ideenwerk_validate_review_decision();

CREATE OR REPLACE FUNCTION ideenwerk_close_review_task_after_decision()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE review_tasks
     SET status='decided', decided_at=now()
   WHERE id=NEW.task_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_close_review_task_after_decision ON review_decisions;
CREATE TRIGGER trg_close_review_task_after_decision
AFTER INSERT ON review_decisions
FOR EACH ROW
EXECUTE FUNCTION ideenwerk_close_review_task_after_decision();

CREATE OR REPLACE FUNCTION ideenwerk_require_human_cluster_decision()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.review_status = 'pending' AND NEW.review_status IN ('accepted','rejected') THEN
    IF NOT EXISTS (
      SELECT 1
        FROM review_tasks t
        JOIN review_decisions d ON d.task_id=t.id
       WHERE t.subject_type='cluster_candidate'
         AND t.subject_id=NEW.id::text
         AND t.review_type='cluster_assignment'
    ) THEN
      RAISE EXCEPTION 'IDEENWERK cluster candidate requires a human review decision';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_require_human_cluster_decision ON cluster_candidates;
CREATE TRIGGER trg_require_human_cluster_decision
BEFORE UPDATE OF review_status ON cluster_candidates
FOR EACH ROW
EXECUTE FUNCTION ideenwerk_require_human_cluster_decision();

CREATE OR REPLACE FUNCTION ideenwerk_validate_appeal_reviewer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_original_operator uuid;
  v_is_appeal_reviewer boolean;
  v_active boolean;
BEGIN
  IF NEW.reviewer_operator_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT d.operator_id INTO v_original_operator
    FROM review_decisions d
   WHERE d.id=NEW.original_decision_id;

  IF NEW.reviewer_operator_id = v_original_operator THEN
    RAISE EXCEPTION 'IDEENWERK appeal reviewer must differ from original decision operator';
  END IF;

  SELECT o.active,
         EXISTS(
           SELECT 1 FROM operator_roles r
            WHERE r.operator_id=NEW.reviewer_operator_id
              AND r.role='appeal_reviewer'
         )
    INTO v_active, v_is_appeal_reviewer
    FROM operators o
   WHERE o.id=NEW.reviewer_operator_id;

  IF NOT FOUND OR v_active IS NOT TRUE OR v_is_appeal_reviewer IS NOT TRUE THEN
    RAISE EXCEPTION 'IDEENWERK appeal reviewer missing required role or inactive';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_appeal_reviewer ON appeals;
CREATE TRIGGER trg_validate_appeal_reviewer
BEFORE INSERT OR UPDATE OF reviewer_operator_id ON appeals
FOR EACH ROW
EXECUTE FUNCTION ideenwerk_validate_appeal_reviewer();

-- Diese Migration ergänzt die Anwendungskontrolle. OIDC/MFA bleibt weiterhin extern zu implementieren;
-- die DB verhindert jedoch, dass fehlende Rollenprüfung oder Self-Appeals durch einen App-Bug still durchrutschen.
