import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(process.cwd(),'..');
const bridge=JSON.parse(fs.readFileSync(path.join(root,'werk-data/ideenwerk-impact-bridge.json'),'utf8'));
const reforms=JSON.parse(fs.readFileSync(path.join(root,'werk-data/reforms.json'),'utf8'));
const contracts=JSON.parse(fs.readFileSync(path.join(root,'werk-data/data-contract-registry.json'),'utf8'));

assert.equal(bridge.version,'2026-09-21-v1');
assert.equal(bridge.source_versions.reforms,reforms.version);
assert.equal(bridge.source_versions.data_contract_registry,contracts.version);

const reformIds=new Set(reforms.reforms.map(x=>x.id));
const contractIds=new Set(contracts.contracts.map(x=>x.id));
const mapIds=new Set();

for(const map of bridge.mappings){
  assert.match(map.map_id,/^IMPACT-[A-Z0-9-]+$/);
  assert.ok(!mapIds.has(map.map_id),`duplicate map ${map.map_id}`);
  mapIds.add(map.map_id);
  assert.ok(map.reform_ids.length>0);
  for(const id of map.reform_ids) assert.ok(reformIds.has(id),`unknown reform ${id}`);
  assert.ok(map.data_contract_ids.length>0);
  for(const id of map.data_contract_ids) assert.ok(contractIds.has(id),`unknown data contract ${id}`);
  assert.ok(map.gate_refs.length>0);
  for(const ref of map.artifact_refs) assert.ok(fs.existsSync(path.join(root,ref)),`missing artifact ${ref}`);
  const encoded=JSON.stringify(map).toLowerCase();
  for(const forbidden of ['verified_effect','annual_saving_eur','effect_eur','calculated_cost_eur','political_score','acceptance_decision']) {
    assert.ok(!encoded.includes(forbidden),`forbidden field ${forbidden}`);
  }
}

const sql=fs.readFileSync(path.join(process.cwd(),'sql/037_ideenwerk_impact_bridge.sql'),'utf8');
const runtime=[...sql.matchAll(/^-- IMPACT_BRIDGE_RUNTIME_MAP (\{.*\})$/gm)].map(m=>JSON.parse(m[1]));
assert.equal(runtime.length,bridge.mappings.length,'runtime map count drift');
for(const r of runtime){
  const c=bridge.mappings.find(x=>x.map_id===r.map_id);
  assert.ok(c,`runtime map not canonical ${r.map_id}`);
  assert.deepEqual(r.reform_ids,c.reform_ids);
  assert.deepEqual(r.data_contract_ids,c.data_contract_ids);
  assert.deepEqual(r.gate_refs,c.gate_refs);
}
assert.match(sql,/no_new_effect_or_political_decision/);
assert.match(sql,/revalidation_required/);
assert.match(sql,/no_known_mapping/);
console.log(`impact bridge contract: PASS (${bridge.mappings.length} version-bound maps)`);
