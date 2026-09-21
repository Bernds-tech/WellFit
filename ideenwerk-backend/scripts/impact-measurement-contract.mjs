import fs from 'node:fs';
import assert from 'node:assert/strict';

const baseSql=fs.readFileSync(new URL('../sql/042_werk_impact_measurement.sql',import.meta.url),'utf8');
const bindingSql=fs.readFileSync(new URL('../sql/043_werk_impact_authoritative_source_binding.sql',import.meta.url),'utf8');
const contract=JSON.parse(fs.readFileSync(new URL('../../werk-data/ideenwerk-impact-measurement.json',import.meta.url),'utf8'));
const bridge=JSON.parse(fs.readFileSync(new URL('../../werk-data/ideenwerk-impact-bridge.json',import.meta.url),'utf8'));

for(const token of [
  'werk_impact_measurement_plans','werk_impact_implementation_events','werk_impact_observations','werk_impact_reviews',
  'werk_record_impact_measurement_plan','werk_record_impact_implementation','werk_record_impact_observation','werk_record_impact_review',
  'werk_impact_measurement_snapshot','planned_no_implementation_evidence','implemented_awaiting_observation',
  'observation_available_attribution_not_established','arithmetic_deviation_not_causal_effect','not_established_by_system',
  'review_only_no_automatic_policy_change','WERK_IMPACT_EVIDENCE_APPEND_ONLY'
])assert.ok(baseSql.includes(token),`missing impact-measurement guard: ${token}`);

for(const table of ['werk_impact_measurement_plans','werk_impact_implementation_events','werk_impact_observations','werk_impact_reviews']){
  assert.ok(baseSql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`),`RLS missing: ${table}`);
  assert.ok(baseSql.includes(`REVOKE ALL ON TABLE public.${table} FROM PUBLIC,anon,authenticated`),`direct table revoke missing: ${table}`);
  assert.ok(!baseSql.includes(`GRANT UPDATE ON TABLE public.${table}`),`append-only table grants UPDATE: ${table}`);
  assert.ok(!baseSql.includes(`GRANT DELETE ON TABLE public.${table}`),`append-only table grants DELETE: ${table}`);
}

for(const token of [
  'werk_impact_validate_source_binding',
  'WERK_IMPACT_SOURCE_MAP_UNKNOWN',
  'WERK_IMPACT_SOURCE_REFORM_MISMATCH',
  'WERK_IMPACT_SOURCE_ARTIFACT_MISMATCH',
  'WERK_IMPACT_SOURCE_VERSION_STALE_OR_UNKNOWN',
  'current_authoritative_registry_tuple'
])assert.ok(bindingSql.includes(token),`missing authoritative source-binding guard: ${token}`);

const sourceToken=`impact-bridge=${bridge.version};reforms=${bridge.source_versions.reforms};data-contract-registry=${bridge.source_versions.data_contract_registry}`;
assert.ok(bindingSql.includes(sourceToken),'runtime source-version token is not bound to canonical Impact Bridge versions');

// The runtime validator is a compiled fail-closed view of the existing canonical
// Impact Bridge registry, not a second registry. Every current map/reform/artifact
// must therefore be present in the migration; canonical registry changes fail CI
// until the runtime validator is deliberately recompiled in the same change.
for(const mapping of bridge.mappings){
  assert.ok(bindingSql.includes(`WHEN '${mapping.map_id}'`),`runtime binding missing map ${mapping.map_id}`);
  for(const reformId of mapping.reform_ids)assert.ok(bindingSql.includes(`'${reformId}'`),`runtime binding missing reform ${mapping.map_id}/${reformId}`);
  for(const artifactRef of mapping.artifact_refs)assert.ok(bindingSql.includes(`'${artifactRef}'`),`runtime binding missing artifact ${mapping.map_id}/${artifactRef}`);
}

assert.equal(contract.version,'2026-09-21-v2');
assert.equal(contract.storage_contract.append_only_evidence,true);
assert.equal(contract.source_binding.authority,'werk-data/ideenwerk-impact-bridge.json');
assert.equal(contract.source_binding.fail_closed,true);
assert.equal(contract.source_binding.current_source_version,sourceToken);
assert.ok(contract.separation_rules.includes('observed value is not causal attribution'));
assert.equal(contract.snapshot_semantics.causal_effect,'never auto-derived');
assert.equal(contract.review_contract.boundary,'review-only; no automatic implementation, recommendation ranking, acceptance or rejection');
assert.ok(bridge.mappings.some(m=>m.map_id==='IMPACT-SV-EMPLOYEE'&&m.reform_ids.includes('SV-01')),'expected existing Impact Bridge reference missing');
console.log('Impact measurement contract guard: PASS');
