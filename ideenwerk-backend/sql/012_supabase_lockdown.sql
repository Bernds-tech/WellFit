-- IDEENWERK migration 012: Supabase/PostgREST lockdown
-- Interne IDEENWERK-Tabellen dürfen nicht direkt über anon/authenticated erreichbar sein.
-- Der öffentliche Zugriff erfolgt später ausschließlich über explizit freigegebene API-Endpunkte.

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE structured_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE abuse_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_variant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Defense in depth: keine direkten PostgREST-Tabellenrechte für anonyme oder normale eingeloggte Nutzer.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Die öffentliche Zähl-View soll die Rechte/RLS des Aufrufers respektieren und ist vorerst nicht direkt freigegeben.
ALTER VIEW cluster_public_counts SET (security_invoker = true);
REVOKE ALL ON cluster_public_counts FROM anon, authenticated;

-- Fixierter search_path schützt die Funktionen vor Object-Hijacking über veränderbare Schemapfade.
ALTER FUNCTION ideenwerk_enqueue_cluster_candidate_review() SET search_path = public, pg_temp;
ALTER FUNCTION ideenwerk_validate_review_decision() SET search_path = public, pg_temp;
ALTER FUNCTION ideenwerk_close_review_task_after_decision() SET search_path = public, pg_temp;
ALTER FUNCTION ideenwerk_require_human_cluster_decision() SET search_path = public, pg_temp;
ALTER FUNCTION ideenwerk_validate_appeal_reviewer() SET search_path = public, pg_temp;
ALTER FUNCTION ideenwerk_take_rate_limit(text,text,integer,integer) SET search_path = public, pg_temp;
ALTER FUNCTION ideenwerk_cleanup_expired_rate_limits() SET search_path = public, pg_temp;

-- PostgreSQL vergibt EXECUTE auf Funktionen standardmäßig an PUBLIC. Für IDEENWERK wird das explizit geschlossen.
REVOKE EXECUTE ON FUNCTION ideenwerk_enqueue_cluster_candidate_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION ideenwerk_validate_review_decision() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION ideenwerk_close_review_task_after_decision() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION ideenwerk_require_human_cluster_decision() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION ideenwerk_validate_appeal_reviewer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION ideenwerk_take_rate_limit(text,text,integer,integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION ideenwerk_cleanup_expired_rate_limits() FROM PUBLIC, anon, authenticated;

-- Falls später eine Supabase Edge Function mit service_role genutzt wird, dürfen nur die dafür benötigten Betriebs-RPCs laufen.
GRANT EXECUTE ON FUNCTION ideenwerk_take_rate_limit(text,text,integer,integer) TO service_role;
GRANT EXECUTE ON FUNCTION ideenwerk_cleanup_expired_rate_limits() TO service_role;

-- Keine RLS-Policies werden hier angelegt: Default-Deny ist für die internen Tabellen beabsichtigt.
-- Ein späterer öffentlicher Read-Endpunkt wird bewusst über die WERK-API modelliert und nicht über direkte Tabellenfreigaben.