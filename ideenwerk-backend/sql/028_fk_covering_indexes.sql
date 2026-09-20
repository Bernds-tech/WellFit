BEGIN;

-- WERK IDEENWERK migration 028: cover the two remaining foreign keys that the
-- Supabase performance advisor reports as unindexed. This is a pure query/
-- maintenance performance hardening; it does not change citizen data semantics.

CREATE INDEX IF NOT EXISTS citizen_clarifications_prompt_id_idx
  ON citizen_clarifications(clarification_prompt_id);

CREATE INDEX IF NOT EXISTS privacy_requests_assigned_operator_id_idx
  ON privacy_requests(assigned_operator_id);

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('fk_covering_index_contract','028_fk_covering_indexes',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now();
  END IF;
END;
$$;

COMMIT;
