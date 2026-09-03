import pg from 'pg';
import { createHash, randomBytes } from 'node:crypto';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
const nonce = randomBytes(8).toString('hex');
const subjectHash = createHash('sha256').update(`rate-smoke:${nonce}`).digest('hex');
const routeKey = `rate_smoke_${nonce}`;

function assert(condition, message) {
  if (!condition) throw new Error(`[distributed-rate-limit] ${message}`);
}

await client.connect();
try {
  await client.query('BEGIN');
  const take = async () => {
    const q = await client.query(
      'SELECT ideenwerk_take_rate_limit($1,$2,$3,$4) AS allowed',
      [subjectHash, routeKey, 2, 60]
    );
    return q.rows[0]?.allowed === true;
  };

  assert(await take(), 'first request should be allowed');
  assert(await take(), 'second request should be allowed');
  assert(!(await take()), 'third request should be denied');

  const bucket = await client.query(
    'SELECT hits,subject_hash,route_key FROM rate_limit_buckets WHERE subject_hash=$1 AND route_key=$2',
    [subjectHash, routeKey]
  );
  assert(bucket.rowCount === 1, 'exactly one shared bucket expected');
  assert(Number(bucket.rows[0].hits) === 2, 'denied request must not increase hits beyond limit');
  assert(bucket.rows[0].subject_hash === subjectHash, 'stored subject must be pseudonymous hash');

  console.log('[distributed-rate-limit] PASS');
  await client.query('ROLLBACK');
} catch (e) {
  try { await client.query('ROLLBACK'); } catch {}
  console.error(e);
  process.exitCode = 1;
} finally {
  await client.end();
}
