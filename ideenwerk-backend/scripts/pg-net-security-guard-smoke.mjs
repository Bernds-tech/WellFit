import pg from 'pg';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

function assert(condition, message) {
  if (!condition) throw new Error(`[pg-net-security] ${message}`);
}

async function callGuardAs(role, headers, claims = null) {
  await client.query('BEGIN');
  try {
    await client.query(`SET LOCAL ROLE ${role}`);
    await client.query(
      `SELECT set_config('request.headers', $1, true), set_config('request.jwt.claims', $2, true)`,
      [JSON.stringify(headers), JSON.stringify(claims ?? { role })]
    );
    await client.query('SELECT public.werk_api_security_guard()');
    await client.query('ROLLBACK');
    return { blocked: false };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    return { blocked: error?.code === 'PGRST', error };
  }
}

await client.connect();
try {
  const fn = await client.query(`
    SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname = 'werk_api_security_guard'
  `);
  assert(fn.rowCount === 1, 'werk_api_security_guard must exist');

  const roles = await client.query(`
    SELECT rolname, rolcanlogin
      FROM pg_roles
     WHERE rolname IN ('anon', 'authenticated')
     ORDER BY rolname
  `);
  assert(roles.rowCount === 2, 'anon/authenticated roles must exist');
  for (const role of roles.rows) {
    assert(role.rolcanlogin === false, `${role.rolname} must remain NOLOGIN`);
  }

  const hook = await client.query(`
    WITH settings AS (
      SELECT unnest(COALESCE(r.rolconfig, ARRAY[]::text[])) AS cfg
        FROM pg_roles r
       WHERE r.rolname='authenticator'
      UNION ALL
      SELECT unnest(s.setconfig) AS cfg
        FROM pg_db_role_setting s
        JOIN pg_roles r ON r.oid=s.setrole
       WHERE r.rolname='authenticator'
    )
    SELECT cfg FROM settings WHERE cfg='pgrst.db_pre_request=public.werk_api_security_guard'
  `);
  assert(hook.rowCount >= 1, 'PostgREST pre-request guard must be configured');

  const unsafeWrappers = await client.query(`
    SELECT n.nspname, p.proname
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname NOT IN ('net', 'extensions', 'pg_catalog', 'information_schema')
       AND p.prosrc ~* 'net\\.(http_|wake|worker_|check_worker|_await|http_collect)'
       AND (
         has_function_privilege('anon', p.oid, 'EXECUTE')
         OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
       )
  `);
  assert(unsafeWrappers.rowCount === 0, 'no anon/authenticated WERK wrapper may expose pg_net routines');

  const normalAnon = await callGuardAs('anon', { 'accept-profile': 'public' });
  assert(!normalAnon.blocked && !normalAnon.error, 'ordinary anon public profile must remain available');

  const netAnon = await callGuardAs('anon', { 'accept-profile': 'net' });
  assert(netAnon.blocked, 'anon net profile must be denied by pre-request guard');

  const netAuthenticated = await callGuardAs('authenticated', { 'content-profile': 'net' });
  assert(netAuthenticated.blocked, 'authenticated net profile must be denied by pre-request guard');

  const netService = await callGuardAs('service_role', { 'accept-profile': 'net' }, { role: 'service_role' });
  assert(!netService.blocked && !netService.error, 'server-side service_role must not be broken by public/user guard');

  const netState = await client.query(`
    SELECT n.nspowner::regrole::text AS schema_owner,
           has_schema_privilege('anon','net','USAGE') AS anon_usage,
           has_schema_privilege('authenticated','net','USAGE') AS authenticated_usage,
           (
             SELECT count(*)::int
               FROM pg_proc p
               JOIN pg_namespace np ON np.oid=p.pronamespace
              WHERE np.nspname='net'
                AND (
                  has_function_privilege('anon', p.oid, 'EXECUTE')
                  OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
                )
           ) AS anon_auth_executable
      FROM pg_namespace n
     WHERE n.nspname='net'
  `);

  if (netState.rowCount === 1) {
    const state = netState.rows[0];
    const aclLocked = state.anon_usage === false
      && state.authenticated_usage === false
      && Number(state.anon_auth_executable) === 0;

    if (!aclLocked) {
      // Hosted Supabase owns pg_net/net as supabase_admin and can restore its
      // extension ACLs after lifecycle DDL. WERK cannot claim those managed
      // grants are revoked. The accepted fallback boundary is therefore:
      // NOLOGIN public roles + no WERK wrapper + enforced PostgREST pre-request
      // denial for the net profile. Any WERK-owned/public wrapper still fails.
      assert(state.schema_owner === 'supabase_admin', 'unlocked net ACL is only tolerated for Supabase-managed schema ownership');
      console.log('[pg-net-security] INFO platform-managed net ACL; WERK Data API guard is the enforced boundary');
    }
  }

  console.log('[pg-net-security] PASS');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
