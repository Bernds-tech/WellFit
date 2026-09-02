-- IDEENWERK migration 008: Retention-/Erasure-Zustand
-- Bürgerideen werden NICHT automatisch aufgrund ihres Alters gelöscht.
-- Diese Migration schafft nur technische Zustände für geprüfte Privacy-Entscheidungen
-- und dokumentiert automatisierte Wartungsläufe.

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS restricted_at timestamptz,
  ADD COLUMN IF NOT EXISTS anonymized_at timestamptz,
  ADD COLUMN IF NOT EXISTS erased_at timestamptz,
  ADD COLUMN IF NOT EXISTS data_state text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS tombstone_reason_code text;

ALTER TABLE submissions
  DROP CONSTRAINT IF EXISTS submissions_data_state_check;
ALTER TABLE submissions
  ADD CONSTRAINT submissions_data_state_check
  CHECK (data_state IN ('active','restricted','anonymized','erased'));

-- Eine nach Prüfung bestätigte Löschung muss Inhalte technisch entfernen können,
-- während public_id/Audit-Metadaten je nach Rechtsgrundlage als Tombstone erhalten bleiben können.
ALTER TABLE submissions ALTER COLUMN original_text DROP NOT NULL;

CREATE TABLE IF NOT EXISTS retention_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL UNIQUE,
  mode text NOT NULL,
  policy_version text NOT NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS submissions_data_state_idx
  ON submissions(data_state, updated_at DESC);
CREATE INDEX IF NOT EXISTS retention_runs_started_idx
  ON retention_runs(started_at DESC);

COMMENT ON COLUMN submissions.data_state IS
  'Technischer Privacy-Zustand; Änderungen nur nach dokumentiertem Workflow. Kein automatisches Alters-Löschen von Bürgerideen.';
