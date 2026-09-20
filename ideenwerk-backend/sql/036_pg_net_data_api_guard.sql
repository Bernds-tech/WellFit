-- IDEENWERK migration 036: durable Data-API boundary for Supabase-managed pg_net.
--
-- Supabase may restore grants on the extension-owned `net` schema during pg_net
-- lifecycle DDL. WERK therefore uses two layers:
--   1) keep the currently observed anon/authenticated ACLs revoked; and
--   2) block the `net` profile at PostgREST pre-request time for public/user roles.
--
-- This migration never invokes net.http_* and does not move/drop/reinstall pg_net.

CREATE OR REPLACE FUNCTION public.werk_api_security_guard()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
DECLARE
  v_headers jsonb := COALESCE(NULLIF(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  v_claims jsonb := COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
  v_role text := COALESCE(NULLIF(v_claims->>'role', ''), current_user);
  v_accept_profile text := lower(COALESCE(v_headers->>'accept-profile', ''));
  v_content_profile text := lower(COALESCE(v_headers->>'content-profile', ''));
BEGIN
  IF v_role IN ('anon', 'authenticated')
     AND (v_accept_profile = 'net' OR v_content_profile = 'net') THEN
    RAISE SQLSTATE 'PGRST'
      USING MESSAGE = json_build_object(
              'code', 'WERK_INTERNAL_SCHEMA',
              'message', 'Internal schema is not available through the Data API',
              'details', NULL,
              'hint', NULL
            )::text,
            DETAIL = json_build_object(
              'status', 403,
              'headers', json_build_object('Content-Type', 'application/json')
            )::text;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.werk_api_security_guard() FROM PUBLIC;
-- PostgREST executes the pre-request hook after assuming the request role.
-- service_role is allowed to execute the guard but is not denied by it; WERK's
-- public/user boundary is anon/authenticated. The current WERK runtime has no
-- direct net.http_* dependency.
GRANT EXECUTE ON FUNCTION public.werk_api_security_guard()
  TO authenticator, anon, authenticated, service_role;

-- Fail closed instead of silently overwriting a future unrelated pre-request
-- hook. Idempotent re-application of this exact WERK hook remains allowed.
DO $$
DECLARE
  v_existing text;
BEGIN
  SELECT split_part(cfg, '=', 2)
    INTO v_existing
    FROM (
      SELECT unnest(COALESCE(r.rolconfig, ARRAY[]::text[])) AS cfg
        FROM pg_roles r
       WHERE r.rolname = 'authenticator'
      UNION ALL
      SELECT unnest(s.setconfig) AS cfg
        FROM pg_db_role_setting s
        JOIN pg_roles r ON r.oid = s.setrole
       WHERE r.rolname = 'authenticator'
    ) settings
   WHERE cfg LIKE 'pgrst.db_pre_request=%'
   LIMIT 1;

  IF v_existing IS NOT NULL
     AND v_existing <> 'public.werk_api_security_guard' THEN
    RAISE EXCEPTION 'existing pgrst.db_pre_request must be reconciled first: %', v_existing;
  END IF;
END;
$$;

ALTER ROLE authenticator
  SET pgrst.db_pre_request = 'public.werk_api_security_guard';

-- Restore the intended least-privilege ACL now. A later pg_net extension DDL
-- can be platform-managed and may re-grant privileges; the pre-request guard
-- remains in place, and WERK evidence policy requires revalidation after such
-- extension/schema changes.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'net') THEN
    REVOKE USAGE ON SCHEMA net FROM PUBLIC, anon, authenticated;
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM PUBLIC, anon, authenticated;
  END IF;
END;
$$;

NOTIFY pgrst, 'reload config';
