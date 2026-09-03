-- IDEENWERK: verteilter Rate-Limit-Layer für mehrere API-Instanzen.
-- Es wird nur ein HMAC-pseudonymisierter Subject-Key gespeichert, niemals die Roh-IP.

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  subject_hash char(64) NOT NULL,
  route_key text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits > 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY(subject_hash, route_key, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limit_buckets_expiry_idx ON rate_limit_buckets(expires_at);

CREATE OR REPLACE FUNCTION ideenwerk_take_rate_limit(
  p_subject_hash text,
  p_route_key text,
  p_limit integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_window_start timestamptz;
  v_hits integer;
BEGIN
  IF p_subject_hash IS NULL OR length(p_subject_hash) <> 64 THEN
    RAISE EXCEPTION 'invalid rate-limit subject hash';
  END IF;
  IF p_route_key IS NULL OR p_route_key = '' THEN
    RAISE EXCEPTION 'invalid rate-limit route key';
  END IF;
  IF p_limit < 1 OR p_window_seconds < 1 THEN
    RAISE EXCEPTION 'invalid rate-limit configuration';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO rate_limit_buckets(subject_hash,route_key,window_start,hits,expires_at)
  VALUES(
    p_subject_hash,
    p_route_key,
    v_window_start,
    1,
    v_window_start + make_interval(secs => p_window_seconds * 2)
  )
  ON CONFLICT(subject_hash,route_key,window_start)
  DO UPDATE SET hits = rate_limit_buckets.hits + 1
  WHERE rate_limit_buckets.hits < p_limit
  RETURNING hits INTO v_hits;

  RETURN v_hits IS NOT NULL;
END;
$$;

-- Kurzlebige technische Buckets dürfen automatisch bereinigt werden.
CREATE OR REPLACE FUNCTION ideenwerk_cleanup_expired_rate_limits()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM rate_limit_buckets WHERE expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Architekturregel: Ein lokales Prozesslimit darf zusätzlich bestehen bleiben.
-- Der PostgreSQL-Layer ist der gemeinsame zweite Schutz für Multi-Instance-Betrieb.
