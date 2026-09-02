const base = process.env.IDEENWERK_BASE_URL || 'http://localhost:8787';

function fail(message, extra) {
  console.error('[smoke] FAIL:', message, extra || '');
  process.exit(1);
}

const health = await fetch(`${base}/health`);
if (!health.ok) fail('health endpoint', await health.text());
console.log('[smoke] health OK');

const create = await fetch(`${base}/api/ideenwerk/v1/submissions`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'idempotency-key': `smoke-${Date.now()}`
  },
  body: JSON.stringify({
    text: 'Smoke-Test: Genehmigungsverfahren sollen verständlicher und digital nachvollziehbar werden.',
    region: 'Österreich',
    topic: 'Verwaltung',
    consent_public_anonymous: false
  })
});
if (create.status !== 201) fail('submission create', await create.text());
const created = await create.json();
if (!created.public_id || !created.status_token_once) fail('missing public_id/status token', created);
console.log('[smoke] submission OK', created.public_id);

const status = await fetch(`${base}${created.status_url}`, {
  headers: { authorization: `Bearer ${created.status_token_once}` }
});
if (!status.ok) fail('status fetch', await status.text());
const state = await status.json();
if (state.public_id !== created.public_id) fail('status public_id mismatch', state);
console.log('[smoke] private status OK', state.current_status);

console.log('[smoke] PASS');
