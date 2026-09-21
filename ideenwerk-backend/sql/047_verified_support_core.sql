BEGIN;

-- Provider-neutral verified-support core.
-- No public endpoint and no real identity-provider activation in this migration.
-- A trusted future verifier produces an action-scoped pseudonym; the support ledger
-- never receives raw name, DOB, address, bPK/government identifier or provider token.

CREATE TABLE IF NOT EXISTS public.werk_identity_verification_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id text NOT NULL UNIQUE,
  verification_method text NOT NULL,
  provider_or_scheme text NOT NULL,
  assurance_level text,
  provider_assertion_hash char(64) NOT NULL,
  support_scope_id text NOT NULL,
  scope_pseudonym char(64) NOT NULL,
  eligibility_policy_version text NOT NULL,
  verified_at timestamptz NOT NULL,
  expires_at timestamptz,
  revoked_at timestamptz,
  idempotency_key text NOT NULL UNIQUE,
  payload_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (receipt_id ~ '^VREC-[A-Z0-9]{20}$'),
  CHECK (btrim(provider_assertion_hash) ~ '^[a-f0-9]{64}$'),
  CHECK (btrim(scope_pseudonym) ~ '^[a-f0-9]{64}$'),
  CHECK (support_scope_id ~ '^(cluster|cluster_variant|reform_candidate):[A-Za-z0-9._:-]{3,220}$'),
  CHECK (char_length(btrim(verification_method)) BETWEEN 2 AND 80),
  CHECK (char_length(btrim(provider_or_scheme)) BETWEEN 2 AND 120),
  CHECK (char_length(btrim(eligibility_policy_version)) BETWEEN 1 AND 120),
  CHECK (expires_at IS NULL OR expires_at > verified_at),
  CHECK (revoked_at IS NULL OR revoked_at >= verified_at)
);

ALTER TABLE public.werk_identity_verification_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.werk_identity_verification_receipts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON TABLE public.werk_identity_verification_receipts TO service_role;

ALTER TABLE public.supports
  ADD COLUMN IF NOT EXISTS verification_receipt_id uuid,
  ADD COLUMN IF NOT EXISTS eligibility_policy_version text,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.supports'::regclass AND conname='supports_target_type_check'
  ) THEN
    ALTER TABLE public.supports DROP CONSTRAINT supports_target_type_check;
  END IF;
  ALTER TABLE public.supports
    ADD CONSTRAINT supports_target_type_check
    CHECK (target_type IN ('cluster','cluster_variant','reform_candidate'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.supports'::regclass AND conname='supports_verification_receipt_fkey'
  ) THEN
    ALTER TABLE public.supports
      ADD CONSTRAINT supports_verification_receipt_fkey
      FOREIGN KEY (verification_receipt_id)
      REFERENCES public.werk_identity_verification_receipts(id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS supports_verified_idempotency_idx
  ON public.supports(idempotency_key)
  WHERE support_type='verified_support' AND idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS supports_verification_receipt_idx
  ON public.supports(verification_receipt_id)
  WHERE verification_receipt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS werk_identity_receipts_scope_idx
  ON public.werk_identity_verification_receipts(support_scope_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.werk_record_identity_verification_receipt(
  p_verification_method text,
  p_provider_or_scheme text,
  p_assurance_level text,
  p_provider_assertion_hash text,
  p_support_scope_id text,
  p_scope_pseudonym text,
  p_eligibility_policy_version text,
  p_verified_at timestamptz,
  p_expires_at timestamptz,
  p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public,extensions
AS $$
DECLARE
  v_payload jsonb;
  v_hash text;
  v_existing public.werk_identity_verification_receipts%ROWTYPE;
  v_id text;
BEGIN
  IF nullif(btrim(p_idempotency_key),'') IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 16 AND 128 THEN
    RAISE EXCEPTION 'WERK_IDENTITY_IDEMPOTENCY_INVALID';
  END IF;
  IF coalesce(p_provider_assertion_hash,'') !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'WERK_IDENTITY_ASSERTION_HASH_INVALID';
  END IF;
  IF coalesce(p_scope_pseudonym,'') !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'WERK_IDENTITY_SCOPE_PSEUDONYM_INVALID';
  END IF;
  IF coalesce(p_support_scope_id,'') !~ '^(cluster|cluster_variant|reform_candidate):[A-Za-z0-9._:-]{3,220}$' THEN
    RAISE EXCEPTION 'WERK_IDENTITY_SUPPORT_SCOPE_INVALID';
  END IF;
  IF p_verified_at IS NULL OR (p_expires_at IS NOT NULL AND p_expires_at <= p_verified_at) THEN
    RAISE EXCEPTION 'WERK_IDENTITY_VALIDITY_INVALID';
  END IF;

  v_payload:=jsonb_build_object(
    'verification_method',btrim(p_verification_method),
    'provider_or_scheme',btrim(p_provider_or_scheme),
    'assurance_level',nullif(btrim(coalesce(p_assurance_level,'')),''),
    'provider_assertion_hash',p_provider_assertion_hash,
    'support_scope_id',p_support_scope_id,
    'scope_pseudonym',p_scope_pseudonym,
    'eligibility_policy_version',btrim(p_eligibility_policy_version),
    'verified_at',p_verified_at,
    'expires_at',p_expires_at
  );
  v_hash:=md5(v_payload::text);

  SELECT * INTO v_existing
  FROM public.werk_identity_verification_receipts
  WHERE idempotency_key=p_idempotency_key
  LIMIT 1;
  IF FOUND THEN
    IF v_existing.payload_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'WERK_IDENTITY_IDEMPOTENCY_CONFLICT';
    END IF;
    RETURN jsonb_build_object(
      'receipt_id',v_existing.receipt_id,
      'support_scope_id',v_existing.support_scope_id,
      'replayed',true,
      'boundary','verification_receipt_only_no_support_counting_or_vote'
    );
  END IF;

  v_id:='VREC-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,20));
  INSERT INTO public.werk_identity_verification_receipts(
    receipt_id,verification_method,provider_or_scheme,assurance_level,
    provider_assertion_hash,support_scope_id,scope_pseudonym,
    eligibility_policy_version,verified_at,expires_at,idempotency_key,payload_hash
  ) VALUES(
    v_id,btrim(p_verification_method),btrim(p_provider_or_scheme),
    nullif(btrim(coalesce(p_assurance_level,'')),''),
    p_provider_assertion_hash,p_support_scope_id,p_scope_pseudonym,
    btrim(p_eligibility_policy_version),p_verified_at,p_expires_at,
    p_idempotency_key,v_hash
  );

  RETURN jsonb_build_object(
    'receipt_id',v_id,
    'support_scope_id',p_support_scope_id,
    'replayed',false,
    'boundary','verification_receipt_only_no_support_counting_or_vote'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.werk_record_identity_verification_receipt(text,text,text,text,text,text,text,timestamptz,timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_record_identity_verification_receipt(text,text,text,text,text,text,text,timestamptz,timestamptz,text) TO service_role;

CREATE OR REPLACE FUNCTION public.werk_record_verified_support(
  p_receipt_id text,
  p_target_type text,
  p_target_id text,
  p_idempotency_key text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receipt public.werk_identity_verification_receipts%ROWTYPE;
  v_existing public.supports%ROWTYPE;
  v_support_id uuid;
  v_scope text;
BEGIN
  IF p_target_type NOT IN ('cluster','cluster_variant','reform_candidate') THEN
    RAISE EXCEPTION 'WERK_SUPPORT_TARGET_TYPE_INVALID';
  END IF;
  IF nullif(btrim(p_target_id),'') IS NULL OR char_length(p_target_id) > 220 THEN
    RAISE EXCEPTION 'WERK_SUPPORT_TARGET_ID_INVALID';
  END IF;
  IF nullif(btrim(p_idempotency_key),'') IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 16 AND 128 THEN
    RAISE EXCEPTION 'WERK_SUPPORT_IDEMPOTENCY_INVALID';
  END IF;

  v_scope:=p_target_type||':'||p_target_id;
  SELECT * INTO v_receipt
  FROM public.werk_identity_verification_receipts
  WHERE receipt_id=p_receipt_id
  LIMIT 1;

  IF NOT FOUND THEN RAISE EXCEPTION 'WERK_SUPPORT_VERIFICATION_RECEIPT_UNKNOWN'; END IF;
  IF v_receipt.revoked_at IS NOT NULL THEN RAISE EXCEPTION 'WERK_SUPPORT_VERIFICATION_REVOKED'; END IF;
  IF v_receipt.expires_at IS NOT NULL AND v_receipt.expires_at <= now() THEN RAISE EXCEPTION 'WERK_SUPPORT_VERIFICATION_EXPIRED'; END IF;
  IF v_receipt.support_scope_id IS DISTINCT FROM v_scope THEN RAISE EXCEPTION 'WERK_SUPPORT_SCOPE_MISMATCH'; END IF;

  SELECT * INTO v_existing
  FROM public.supports
  WHERE support_type='verified_support' AND idempotency_key=p_idempotency_key
  LIMIT 1;
  IF FOUND THEN
    IF v_existing.target_type IS DISTINCT FROM p_target_type
       OR v_existing.target_id IS DISTINCT FROM p_target_id
       OR btrim(v_existing.verifier_subject_hash) IS DISTINCT FROM btrim(v_receipt.scope_pseudonym)
       OR v_existing.verification_receipt_id IS DISTINCT FROM v_receipt.id THEN
      RAISE EXCEPTION 'WERK_SUPPORT_IDEMPOTENCY_CONFLICT';
    END IF;
    RETURN jsonb_build_object('support_id',v_existing.id,'replayed',true,'counting_state','disabled_until_identity_activation');
  END IF;

  SELECT * INTO v_existing
  FROM public.supports
  WHERE target_type=p_target_type
    AND target_id=p_target_id
    AND support_type='verified_support'
    AND btrim(verifier_subject_hash)=btrim(v_receipt.scope_pseudonym)
  LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('support_id',v_existing.id,'replayed',true,'counting_state','disabled_until_identity_activation');
  END IF;

  INSERT INTO public.supports(
    target_type,target_id,support_type,verifier_subject_hash,
    verification_receipt_id,eligibility_policy_version,idempotency_key
  ) VALUES(
    p_target_type,p_target_id,'verified_support',v_receipt.scope_pseudonym,
    v_receipt.id,v_receipt.eligibility_policy_version,p_idempotency_key
  ) RETURNING id INTO v_support_id;

  INSERT INTO public.audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
  VALUES(
    'EVT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,24)),
    'verified_support',v_support_id::text,'verified_support_recorded',
    'system','identity_receipt_verified',
    jsonb_build_object(
      'support_id',v_support_id,
      'target_type',p_target_type,
      'target_id',p_target_id,
      'eligibility_policy_version',v_receipt.eligibility_policy_version,
      'boundary','no raw identity or scope pseudonym in audit payload; counting remains disabled'
    )
  );

  RETURN jsonb_build_object('support_id',v_support_id,'replayed',false,'counting_state','disabled_until_identity_activation');
END;
$$;

REVOKE ALL ON FUNCTION public.werk_record_verified_support(text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.werk_record_verified_support(text,text,text,text) TO service_role;

DO $
BEGIN
  IF to_regclass('public.ideenwerk_runtime_meta') IS NOT NULL THEN
    EXECUTE $meta$
      INSERT INTO public.ideenwerk_runtime_meta(key,value,updated_at)
      VALUES('verified_support_core_contract','047_verified_support_core_disabled',now())
      ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=EXCLUDED.updated_at
    $meta$;
  END IF;
END $;

COMMIT;
