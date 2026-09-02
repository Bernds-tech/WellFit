CREATE TABLE IF NOT EXISTS processing_jobs (
  id bigserial PRIMARY KEY,
  job_type text NOT NULL,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed','dead')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS processing_jobs_dedupe_active
  ON processing_jobs(job_type, subject_type, subject_id)
  WHERE status IN ('queued','running');

CREATE INDEX IF NOT EXISTS processing_jobs_claim_idx
  ON processing_jobs(status, available_at, id);

-- Worker claim pattern:
-- SELECT id ... FOR UPDATE SKIP LOCKED LIMIT 1;
-- Danach status='running', attempts=attempts+1, locked_by/locked_at setzen.
-- Fehler mit Backoff zurück auf 'queued'; nach max_attempts auf 'dead'.
