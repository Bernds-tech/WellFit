import { randomBytes } from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;

const base = String(process.env.WERK_STAGING_EDGE_URL || '').replace(/\/$/, '');
const databaseUrl = process.env.DATABASE_URL;

if (!base || !/^https:\/\//.test(base)) {
  console.error('[clusters-http-e2e] WERK_STAGING_EDGE_URL must be an https URL to the deployed werk-ideenwerk-api function');
  process.exit(2);
}
if (!databaseUrl) {
  console.error('[clusters-http-e2e] DATABASE_URL is required for staging seed assertions and cleanup');
  process.exit(2);
}

const runId = `CLUSTER-HTTP-E2E-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${randomBytes(4).toString('hex')}`;
const topic = `E2E-${runId}`;
const prefix = randomBytes(6).toString('hex').toUpperCase();
const clusterId = n => `CLU-${prefix}${n.toString(16).toUpperCase().padStart(4, '0')}`;
const now = Date.now();
const fixtures = [
  { id: clusterId(1), title: `${runId} A`, region: 'Bund', status: 'clustered', updated: new Date(now - 60_000) },
  { id: clusterId(2), title: `${runId} B`, region: 'Wien', status: 'clustered', updated: new Date(now - 120_000) },
  { id: clusterId(3), title: `${runId} C`, region: 'Wien', status: 'clustered', updated: new Date(now - 180_000) },
  { id: clusterId(4), title: `${runId} D`, region: 'Österreich', status: 'implemented_elsewhere', updated: new Date(now - 240_000) },
  { id: clusterId(5), title: `${runId} HIDDEN`, region: 'Bund', status: 'quarantine', updated: new Date(now) }
];

const pool = new Pool({ connectionString: databaseUrl });

function assert(condition, message, detail) {
  if (!condition) {
    const error = new Error(message);
    error.detail = detail;
    throw error;
  }
}

async function jsonResponse(response) {
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { response, data };
}

function url(path, params = {}) {
  const target = new URL(`${base}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) target.searchParams.set(key, String(value));
  }
  return target;
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of fixtures) {
      await client.query(
        `INSERT INTO clusters (cluster_id,title,topic,region_scope,review_status,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$6)`,
        [row.id, row.title, topic, row.region, row.status, row.updated]
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function cleanup() {
  await pool.query('DELETE FROM clusters WHERE cluster_id = ANY($1::text[])', [fixtures.map(row => row.id)]);
}

try {
  await seed();

  const page1 = await jsonResponse(await fetch(url('/clusters', { limit: 2, topic })));
  assert(page1.response.status === 200, 'first cluster page must return 200', page1.data);
  assert(Array.isArray(page1.data?.clusters) && page1.data.clusters.length === 2, 'first page must contain two visible clusters', page1.data);
  assert(page1.data.clusters[0]?.cluster_id === fixtures[0].id, 'hidden newest cluster must not consume public page capacity', page1.data);
  assert(page1.data.clusters[1]?.cluster_id === fixtures[1].id, 'stable updated_at order mismatch on first page', page1.data);
  assert(typeof page1.data?.next_cursor === 'string' && page1.data.next_cursor.length > 10, 'first page must issue an opaque cursor', page1.data);
  assert(!page1.data.clusters.some(row => row.cluster_id === fixtures[4].id), 'quarantined cluster must never be exposed', page1.data);

  const page2 = await jsonResponse(await fetch(url('/clusters', { limit: 2, topic, cursor: page1.data.next_cursor })));
  assert(page2.response.status === 200, 'second cluster page must return 200', page2.data);
  assert(page2.data?.clusters?.map(row => row.cluster_id).join(',') === [fixtures[2].id, fixtures[3].id].join(','), 'cursor continuation order mismatch', page2.data);
  assert(page2.data?.next_cursor === null, 'final page must expose next_cursor=null', page2.data);

  const region = await jsonResponse(await fetch(url('/clusters', { limit: 10, topic, region: 'Wien' })));
  assert(region.response.status === 200, 'region filter must return 200', region.data);
  assert(region.data?.clusters?.map(row => row.cluster_id).join(',') === [fixtures[1].id, fixtures[2].id].join(','), 'region filter mismatch', region.data);

  const status = await jsonResponse(await fetch(url('/clusters', { limit: 10, topic, status: 'implemented_elsewhere' })));
  assert(status.response.status === 200, 'status filter must return 200', status.data);
  assert(status.data?.clusters?.length === 1 && status.data.clusters[0]?.cluster_id === fixtures[3].id, 'status filter mismatch', status.data);

  const mismatch = await jsonResponse(await fetch(url('/clusters', { limit: 2, topic, region: 'Wien', cursor: page1.data.next_cursor })));
  assert(mismatch.response.status === 400 && mismatch.data?.code === 'INVALID_CURSOR', 'cursor must be bound to its filter combination', mismatch.data);

  const unknown = await jsonResponse(await fetch(url('/clusters', { limit: 2, topic, sort: 'updated_desc' })));
  assert(unknown.response.status === 400 && unknown.data?.code === 'INVALID_CLUSTER_QUERY', 'unknown cluster query parameters must fail closed', unknown.data);

  const hiddenStatus = await jsonResponse(await fetch(url('/clusters', { limit: 2, topic, status: 'quarantine' })));
  assert(hiddenStatus.response.status === 400 && hiddenStatus.data?.code === 'INVALID_CLUSTER_QUERY', 'non-public status filter must fail closed', hiddenStatus.data);

  console.log(JSON.stringify({
    run_id: runId,
    page1: page1.data.clusters.map(row => row.cluster_id),
    page2: page2.data.clusters.map(row => row.cluster_id),
    region_filter: region.data.clusters.map(row => row.cluster_id),
    status_filter: status.data.clusters.map(row => row.cluster_id),
    cursor_filter_binding: 'PASS',
    hidden_visibility: 'PASS'
  }, null, 2));
} finally {
  try {
    await cleanup();
    const residue = await pool.query('SELECT count(*)::int AS count FROM clusters WHERE cluster_id = ANY($1::text[])', [fixtures.map(row => row.id)]);
    assert(residue.rows[0]?.count === 0, 'synthetic cluster HTTP E2E residue remains after cleanup', residue.rows[0]);
  } finally {
    await pool.end();
  }
}
