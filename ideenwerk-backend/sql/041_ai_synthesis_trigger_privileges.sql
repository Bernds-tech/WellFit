BEGIN;

-- Supabase advisor hardening for migration 040.
-- Trigger functions do not need to be directly callable through PostgREST.
REVOKE ALL ON FUNCTION public.ideenwerk_ai_synthesis_append_only() FROM PUBLIC,anon,authenticated;

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('ai_synthesis_trigger_acl','041_ai_synthesis_trigger_privileges',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
