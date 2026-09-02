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

const auth = { authorization: `Bearer ${created.status_token_once}` };

const status = await fetch(`${base}${created.status_url}`, { headers: auth });
if (!status.ok) fail('status fetch', await status.text());
const state = await status.json();
if (state.public_id !== created.public_id) fail('status public_id mismatch', state);
console.log('[smoke] private status OK', state.current_status);

const deniedExport = await fetch(`${base}/api/ideenwerk/v1/privacy/export/${created.public_id}`);
if (deniedExport.status !== 401) fail('privacy export should require token', { status: deniedExport.status, body: await deniedExport.text() });
console.log('[smoke] privacy export rejects missing token OK');

const exportRes = await fetch(`${base}/api/ideenwerk/v1/privacy/export/${created.public_id}`, { headers: auth });
if (!exportRes.ok) fail('privacy export', await exportRes.text());
const exportData = await exportRes.json();
if (exportData.submission?.public_id !== created.public_id) fail('privacy export public_id mismatch', exportData);
console.log('[smoke] private export OK');

const privacyReq = await fetch(`${base}/api/ideenwerk/v1/privacy/requests/${created.public_id}`, {
  method: 'POST',
  headers: { ...auth, 'content-type': 'application/json' },
  body: JSON.stringify({ request_type: 'correction', details: 'Smoke-Test: Korrekturworkflow prüfen.' })
});
if (privacyReq.status !== 201) fail('privacy request create', await privacyReq.text());
const requestData = await privacyReq.json();
if (!requestData.request_id) fail('privacy request id missing', requestData);
console.log('[smoke] privacy request OK', requestData.request_id);

const privacyList = await fetch(`${base}/api/ideenwerk/v1/privacy/requests/${created.public_id}`, { headers: auth });
if (!privacyList.ok) fail('privacy request list', await privacyList.text());
const listData = await privacyList.json();
if (!Array.isArray(listData.requests) || !listData.requests.some(x=>x.request_id===requestData.request_id)) fail('privacy request not listed', listData);
console.log('[smoke] privacy request list OK');

console.log('[smoke] PASS');
