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

  const netSchema = await client.query(`SELECT 1 FROM pg_namespace WHERE nspname='net'`);
  if (netSchema.rowCount === 1) {
    const usage = await client.query(`
      SELECT
        has_schema_privilege('anon','net','USAGE') AS anon_usage,
        has_schema_privilege('authenticated','net','USAGE') AS authenticated_usage
    `);
    assert(usage.rows[0].anon_usage === false, 'anon must not have live USAGE on net after hardening');
    assert(usage.rows[0].authenticated_usage === false, 'authenticated must not have live USAGE on net after hardening');

    const executable = await client.query(`
      SELECT p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='net'
         AND (
           has_function_privilege('anon', p.oid, 'EXECUTE')
           OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
         )
       ORDER BY p.proname
    `);
    assert(executable.rowCount === 0, 'anon/authenticated must not have live EXECUTE on net routines after hardening');
  }

  console.log('[pg-net-security] PASS');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
