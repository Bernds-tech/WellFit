-- IDEENWERK migration 016: internes pg_net für Staging-/Betriebschecks
-- Kein öffentlicher Zugriff: HTTP-Aufrufe aus Postgres bleiben ausschließlich serverseitigen Rollen vorbehalten.

CREATE EXTENSION IF NOT EXISTS pg_net;

REVOKE USAGE ON SCHEMA net FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM PUBLIC, anon, authenticated;

-- service_role wird nicht pauschal freigegeben. Interne DB-/Betriebsjobs laufen über privilegierte Serverrollen.
-- Falls später ein konkreter service_role-Use-Case nötig wird, erfolgt eine enge Einzel-Freigabe per eigener Migration.