-- IDEENWERK migration 015: Lookup-Indizes aus realem 100k-Staging-Test
-- Der erste 100k-Lauf erreichte den Statement-Timeout bei der Review-Task-Prüfabfrage,
-- nicht beim Erzeugen der Tasks. Diese Indizes beschleunigen Review-/Audit-Lookups und Test-Cleanup.

CREATE INDEX IF NOT EXISTS review_tasks_subject_lookup_idx
  ON review_tasks(subject_type, review_type, subject_id);

CREATE INDEX IF NOT EXISTS cluster_candidates_method_id_idx
  ON cluster_candidates(method, id);
