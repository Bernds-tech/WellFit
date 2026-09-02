CREATE TABLE IF NOT EXISTS operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_subject_hash char(64) NOT NULL UNIQUE,
  display_name text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS operator_roles (
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('cluster_reviewer','moderator','legal_reviewer','impact_reviewer','appeal_reviewer','auditor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(operator_id,role)
);

CREATE TABLE IF NOT EXISTS review_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id text NOT NULL UNIQUE,
  subject_type text NOT NULL CHECK (subject_type IN ('submission','cluster_candidate','moderation_report','cluster','reform_candidate')),
  subject_id text NOT NULL,
  review_type text NOT NULL,
  required_role text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','decided','cancelled')),
  priority smallint NOT NULL DEFAULT 50 CHECK (priority BETWEEN 0 AND 100),
  assigned_operator_id uuid REFERENCES operators(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  assigned_at timestamptz,
  decided_at timestamptz
);

CREATE TABLE IF NOT EXISTS review_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id text NOT NULL UNIQUE,
  task_id uuid NOT NULL REFERENCES review_tasks(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES operators(id) ON DELETE RESTRICT,
  action text NOT NULL,
  reason_code text NOT NULL,
  rationale text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appeal_id text NOT NULL UNIQUE,
  original_decision_id uuid NOT NULL REFERENCES review_decisions(id) ON DELETE RESTRICT,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','reviewing','upheld','corrected','dismissed')),
  reviewer_operator_id uuid REFERENCES operators(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS review_tasks_queue_idx ON review_tasks(status,required_role,priority DESC,created_at ASC);
CREATE INDEX IF NOT EXISTS review_decisions_task_idx ON review_decisions(task_id,created_at);
CREATE INDEX IF NOT EXISTS appeals_status_idx ON appeals(status,created_at);

-- Sicherheits-/Governance-Regeln, die in der Anwendung zusätzlich erzwungen werden müssen:
-- 1) Operator darf nur Rollen aus einem extern verifizierten OIDC/MFA-Kontext erhalten.
-- 2) Appeal-Reviewer darf nicht dieselbe Person wie der Erstentscheider sein.
-- 3) Auditoren sind read-only.
-- 4) Sensible Entfernungen/Appeals benötigen den im Governance-Modell vorgesehenen Vier-Augen-Pfad.
-- 5) Jede Entscheidung erzeugt zusätzlich ein audit_events-Ereignis.
