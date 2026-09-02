CREATE TABLE IF NOT EXISTS proposal_features (
  submission_id uuid PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model_version text NOT NULL,
  problem_signature text NOT NULL,
  solution_signature text NOT NULL,
  topic text,
  suggested_level text,
  region_scope text,
  open_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cluster_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  candidate_submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  relation text NOT NULL CHECK (relation IN ('same_problem_same_solution','same_problem_different_solution','possible_overlap','separate')),
  problem_similarity numeric(6,5) NOT NULL,
  solution_similarity numeric(6,5) NOT NULL,
  assignment_action text NOT NULL,
  method text NOT NULL,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','accepted','rejected','superseded')),
  rationale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(submission_id,candidate_submission_id,method)
);

CREATE INDEX IF NOT EXISTS proposal_features_topic_idx ON proposal_features(topic, region_scope);
CREATE INDEX IF NOT EXISTS proposal_features_problem_trgm_idx ON proposal_features USING gin (problem_signature gin_trgm_ops);
CREATE INDEX IF NOT EXISTS proposal_features_solution_trgm_idx ON proposal_features USING gin (solution_signature gin_trgm_ops);
CREATE INDEX IF NOT EXISTS cluster_candidates_pending_idx ON cluster_candidates(review_status, created_at);

-- Diese Stufe ist absichtlich providerneutral. Optional kann später pgvector ergänzt werden.
-- Ein semantischer Provider darf nur Merkmale liefern; die politische Entscheidung über Weiterverfolgung bleibt außerhalb des Providers.
