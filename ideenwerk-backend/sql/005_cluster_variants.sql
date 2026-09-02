CREATE TABLE IF NOT EXISTS cluster_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  variant_id text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  review_status text NOT NULL DEFAULT 'cluster_review',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cluster_variant_members (
  variant_id uuid NOT NULL REFERENCES cluster_variants(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  similarity numeric(6,5),
  assignment_method text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (variant_id, submission_id)
);

ALTER TABLE cluster_candidates ADD COLUMN IF NOT EXISTS suggested_cluster_id uuid REFERENCES clusters(id) ON DELETE SET NULL;
ALTER TABLE cluster_candidates ADD COLUMN IF NOT EXISTS suggested_variant_id uuid REFERENCES cluster_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS cluster_variants_cluster_idx ON cluster_variants(cluster_id, created_at);
CREATE INDEX IF NOT EXISTS cluster_variant_members_submission_idx ON cluster_variant_members(submission_id);

CREATE OR REPLACE VIEW cluster_public_counts AS
SELECT
  c.id,
  c.cluster_id,
  c.title,
  c.topic,
  c.region_scope,
  c.review_status,
  count(DISTINCT cm.submission_id)::bigint AS submission_count,
  count(DISTINCT cv.id)::bigint AS variant_count
FROM clusters c
LEFT JOIN cluster_members cm ON cm.cluster_id=c.id
LEFT JOIN cluster_variants cv ON cv.cluster_id=c.id
GROUP BY c.id,c.cluster_id,c.title,c.topic,c.region_scope,c.review_status;

-- Politische Governance-Regel:
-- Ein Problemcluster darf mehrere konkurrierende Lösungsvarianten enthalten.
-- Originaleinreichungen bleiben in submissions unverändert erhalten.
-- Das Zusammenführen auf Problemebene darf niemals als Zustimmung zu einer bestimmten Variante interpretiert werden.
