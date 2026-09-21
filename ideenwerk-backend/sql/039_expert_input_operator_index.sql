BEGIN;

-- Performance hardening discovered by the post-DDL Supabase advisor after migration 038.
-- This index covers the operator FK without changing the expert-input data contract.
CREATE INDEX IF NOT EXISTS ideenwerk_expert_inputs_recorded_by_operator_idx
  ON public.ideenwerk_expert_inputs(recorded_by_operator_id);

DO $$
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
    VALUES('expert_input_operator_index','039_expert_input_operator_index',now())
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;
  END IF;
END;
$$;

COMMIT;
