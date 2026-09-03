-- IDEENWERK migration 013: Supabase Performance- und Extension-Härtung
-- 1) pg_trgm wird aus dem öffentlich exponierten Schema verschoben.
-- 2) Fehlende FK-Indizes werden vor Lasttests ergänzt.

ALTER EXTENSION pg_trgm SET SCHEMA extensions;

CREATE INDEX IF NOT EXISTS abuse_signals_submission_id_idx
  ON abuse_signals(submission_id);

CREATE INDEX IF NOT EXISTS appeals_original_decision_id_idx
  ON appeals(original_decision_id);

CREATE INDEX IF NOT EXISTS appeals_reviewer_operator_id_idx
  ON appeals(reviewer_operator_id);

CREATE INDEX IF NOT EXISTS cluster_candidates_candidate_submission_id_idx
  ON cluster_candidates(candidate_submission_id);

CREATE INDEX IF NOT EXISTS cluster_candidates_suggested_cluster_id_idx
  ON cluster_candidates(suggested_cluster_id);

CREATE INDEX IF NOT EXISTS cluster_candidates_suggested_variant_id_idx
  ON cluster_candidates(suggested_variant_id);

CREATE INDEX IF NOT EXISTS review_decisions_operator_id_idx
  ON review_decisions(operator_id);

CREATE INDEX IF NOT EXISTS review_tasks_assigned_operator_id_idx
  ON review_tasks(assigned_operator_id);

CREATE INDEX IF NOT EXISTS submissions_cluster_id_idx
  ON submissions(cluster_id);

-- Supabase-Staging hat search_path: "$user", public, extensions.
-- Der Worker wird zusätzlich auf explizite extensions.similarity()-Aufrufe umgestellt,
-- damit die Clusterpipeline nicht von einem veränderten Session-search_path abhängt.