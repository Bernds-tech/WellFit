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
  assert.deepEqual(list.query, ['limit', 'topic', 'region', 'status', 'cursor']);
  assert.deepEqual(list.response, ['clusters', 'next_cursor']);
  assert.match(edgeSource, /const allowed = new Set\(\['limit','topic','region','status','cursor'\]\)/);
  assert.match(edgeSource, /return json\(await publicClusterList\(limitNumber, filters, cursor\),200,origin\);/);
  assert.match(edgeSource, /return \{ clusters: publicClusters, next_cursor: nextCursor \};/);
  assert.match(edgeSource, /\.order\('updated_at',\{ascending:false\}\)\s*\.order\('cluster_id',\{ascending:false\}\)\s*\.limit\(limit \+ 1\)/s);
  assert.match(edgeSource, /\.neq\('review_status','quarantine'\)\s*\.neq\('review_status','removed'\)/s);
  assert.match(edgeSource, /from\('cluster_variants'\)\.select\('cluster_id'\)\.in\('cluster_id',ids\)\.neq\('review_status','quarantine'\)\.neq\('review_status','removed'\)/);
  assert.match(edgeSource, /if \(filters\.topic\) query = query\.eq\('topic', filters\.topic\);/);
  assert.match(edgeSource, /if \(filters\.region\) query = query\.eq\('region_scope', filters\.region\);/);
  assert.match(edgeSource, /if \(filters\.status\) query = query\.eq\('review_status', filters\.status\);/);
  assert.match(edgeSource, /decodeClusterCursor\(cursorRaw, filters\)/);
  assert.match(edgeSource, /INVALID_CLUSTER_QUERY/);
  assert.match(edgeSource, /INVALID_CURSOR/);
  assert.match(edgeSource, /Number\.isInteger\(limitNumber\).*limitNumber < 1.*limitNumber > 50/s);

  assert.equal(detail.implementation, 'staging-live');
  assert.deepEqual(detail.response, ['cluster', 'variants']);
  assert.match(edgeSource, /return json\(\{\s*cluster:\{/s);
  assert.match(edgeSource, /variants:variants\|\|\[\]/);
  assert.match(edgeSource, /from\('cluster_variants'\)\.select\('variant_id,title,summary,review_status,created_at,updated_at'\)\.eq\('cluster_id',cluster\.id\)\.neq\('review_status','quarantine'\)\.neq\('review_status','removed'\)\.order\('created_at',\{ascending:true\}\)/);

  assert.match(contract.http_rules.pagination, /cursor/i);
  assert.match(contract.http_rules.pagination, /updated_at/i);
  assert.match(contract.http_rules.pagination, /cluster_id/i);
});

test('cluster contract advertises only live public list extensions', async () => {
  const contract = await loadContract();
  const list = endpoint(contract, 'GET', '/clusters');
  const detail = endpoint(contract, 'GET', '/clusters/{cluster_id}');

  assert.ok(!list.query.includes('sort'), 'sort must stay non-live until Edge implements it');
  for (const supportedQuery of ['topic', 'region', 'status', 'cursor']) {
    assert.ok(list.query.includes(supportedQuery), `live cluster query parameter missing: ${supportedQuery}`);
  }

  assert.match(String(list.notes || ''), /Varianten.*quarantine|quarantined.*Varianten|Varianten.*removed/i, 'list contract must document hidden variants in variant_count');
  assert.match(String(detail.notes || ''), /Varianten.*quarantine|quarantined.*Varianten|Varianten.*removed/i, 'detail contract must document hidden variants');

  for (const unsupportedField of ['problem_cluster', 'solution_variants', 'attention_signals', 'quality_gates', 'linked_reforms', 'status_history_public']) {
    assert.ok(!detail.response.includes(unsupportedField), `non-live cluster detail field advertised: ${unsupportedField}`);
  }
});
