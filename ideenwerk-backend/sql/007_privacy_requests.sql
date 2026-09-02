CREATE TABLE IF NOT EXISTS privacy_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text NOT NULL UNIQUE,
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('export','correction','deletion','restriction','cluster_appeal')),
  details text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','reviewing','completed','partially_completed','rejected','cancelled')),
  decision_reason_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS privacy_requests_submission_idx ON privacy_requests(submission_id,created_at DESC);
CREATE INDEX IF NOT EXISTS privacy_requests_status_idx ON privacy_requests(status,created_at ASC);

-- Datenschutzprinzipien:
-- 1) Anfragezugang erfolgt über den bereits vorhandenen gehashten Status-Token.
-- 2) Keine zusätzliche E-Mail-Adresse ist für normale Privacy-Anfragen erforderlich.
-- 3) Löschung wird als prüfbarer Request geführt, nicht als sofortige irreversible Client-Aktion.
-- 4) Jede Entscheidung wird zusätzlich im Audit-Log dokumentiert.
-- 5) Konkrete Aufbewahrungsfristen werden erst nach juristischer Freigabe als Migration/Policy festgeschrieben.
