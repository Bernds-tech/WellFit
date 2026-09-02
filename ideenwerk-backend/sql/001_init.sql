CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE,
  idempotency_key text UNIQUE,
  original_text text NOT NULL,
  public_text text,
  region text,
  topic text,
  current_status text NOT NULL DEFAULT 'received',
  cluster_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS status_access (
  submission_id uuid PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS structured_proposals (
  submission_id uuid PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
  problem text,
  proposal text,
  goal text,
  suggested_level text,
  topic text,
  region text,
  open_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  citizen_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id text NOT NULL UNIQUE,
  title text NOT NULL,
  topic text,
  region_scope text,
  review_status text NOT NULL DEFAULT 'clustered',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE submissions
  ADD CONSTRAINT submissions_cluster_fk
  FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS cluster_members (
  cluster_id uuid NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  similarity numeric(6,5),
  assignment_method text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cluster_id, submission_id)
);

CREATE TABLE IF NOT EXISTS supports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('cluster','reform_candidate')),
  target_id text NOT NULL,
  support_type text NOT NULL CHECK (support_type IN ('reaction','verified_support')),
  verifier_subject_hash char(64),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS supports_verified_once
  ON supports(target_type, target_id, verifier_subject_hash)
  WHERE support_type = 'verified_support' AND verifier_subject_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  review_type text NOT NULL,
  reviewer_role text NOT NULL,
  result text NOT NULL,
  findings jsonb NOT NULL DEFAULT '{}'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  event_type text NOT NULL,
  actor_type text NOT NULL,
  reason_code text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS abuse_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES submissions(id) ON DELETE CASCADE,
  signal_type text NOT NULL,
  signal_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS moderation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id text NOT NULL UNIQUE,
  target_type text NOT NULL,
  target_id text NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'received',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions(current_status, created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_topic_region_idx ON submissions(topic, region, created_at DESC);
CREATE INDEX IF NOT EXISTS cluster_members_submission_idx ON cluster_members(submission_id);
CREATE INDEX IF NOT EXISTS audit_subject_idx ON audit_events(subject_type, subject_id, created_at);

-- Produktiv zusätzlich vorsehen:
-- 1) Vektor-Spalte/pgvector für Ähnlichkeitssuche.
-- 2) Aufbewahrungs-/Löschjobs für abuse_signals und widerrufene Statuszugänge.
-- 3) Rollen/Rechte ausschließlich serverseitig; kein direkter öffentlicher DB-Zugriff.
-- 4) Backups, Restore-Test und unveränderliche Audit-Exportstrategie.
