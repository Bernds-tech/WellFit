CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS submissions_original_text_trgm_idx
  ON submissions USING gin (original_text gin_trgm_ops);

-- Stufe 1 der Clusterpipeline:
-- Nur sehr hohe Textähnlichkeit / Copy-Paste-Varianten vorbündeln.
-- Semantisch ähnliche, aber unterschiedlich formulierte Ideen werden später
-- über einen getrennt evaluierten Embedding-/Clusterpfad verarbeitet.
--
-- Beispielabfrage:
-- SELECT public_id, similarity(original_text, $1) AS sim
-- FROM submissions
-- WHERE similarity(original_text, $1) >= 0.90
-- ORDER BY sim DESC
-- LIMIT 10;
