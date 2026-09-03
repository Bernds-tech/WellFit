-- IDEENWERK migration 014: Supabase Runtime-Fix nach Staging-Test
-- gen_random_bytes() liegt bei Supabase im Schema extensions.
-- Der feste search_path bleibt erhalten, wird aber um extensions ergänzt.

ALTER FUNCTION ideenwerk_enqueue_cluster_candidate_review()
  SET search_path = public, extensions, pg_temp;

-- Keine Lockerung der Ausführungsrechte: anon/authenticated bleiben weiterhin ausgesperrt.