import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const contractUrl = new URL('../../werk-data/ideenwerk-api-contract.json', import.meta.url);
const edgeUrl = new URL('../edge/werk-ideenwerk-api/index.ts', import.meta.url);

async function loadContract() {
  return JSON.parse(await readFile(contractUrl, 'utf8'));
}

function endpoint(contract, method, path) {
  const found = contract.endpoints.find((entry) => entry.method === method && entry.path === path);
  assert.ok(found, `missing API contract endpoint ${method} ${path}`);
  return found;
}

test('public cluster contract matches the staging Edge response envelope', async () => {
  const [contract, edgeSource] = await Promise.all([
    loadContract(),
    readFile(edgeUrl, 'utf8')
  ]);

  const list = endpoint(contract, 'GET', '/clusters');
  const detail = endpoint(contract, 'GET', '/clusters/{cluster_id}');

  assert.equal(list.implementation, 'staging-live');
  assert.deepEqual(list.query, ['limit']);
  assert.deepEqual(list.response, ['clusters']);
  assert.match(edgeSource, /return json\(\{clusters:await publicClusterList\(limit\)\},200,origin\);/);

  assert.equal(detail.implementation, 'staging-live');
  assert.deepEqual(detail.response, ['cluster', 'variants']);
  assert.match(edgeSource, /return json\(\{\s*cluster:\{/s);
  assert.match(edgeSource, /variants:variants\|\|\[\]/);

  assert.match(contract.http_rules.pagination, /limit/i);
  assert.doesNotMatch(contract.http_rules.pagination, /cursor-basiert/i);
});

test('cluster contract does not advertise extensions absent from Edge v5', async () => {
  const contract = await loadContract();
  const list = endpoint(contract, 'GET', '/clusters');
  const detail = endpoint(contract, 'GET', '/clusters/{cluster_id}');

  for (const unsupportedQuery of ['topic', 'region', 'status', 'sort', 'cursor']) {
    assert.ok(!list.query.includes(unsupportedQuery), `non-live cluster query parameter advertised: ${unsupportedQuery}`);
  }

  for (const unsupportedField of ['problem_cluster', 'solution_variants', 'attention_signals', 'quality_gates', 'linked_reforms', 'status_history_public']) {
    assert.ok(!detail.response.includes(unsupportedField), `non-live cluster detail field advertised: ${unsupportedField}`);
  }
});
