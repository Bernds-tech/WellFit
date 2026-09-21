import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql=fs.readFileSync(new URL('../sql/042_werk_impact_measurement.sql',import.meta.url),'utf8');
const contract=JSON.parse(fs.readFileSync(new URL('../../werk-data/ideenwerk-impact-measurement.json',import.meta.url),'utf8'));
const bridge=JSON.parse(fs.readFileSync(new URL('../../werk-data/ideenwerk-impact-bridge.json',import.meta.url),'utf8'));

for(const token of [
  'werk_impact_measurement_plans','werk_impact_implementation_events','werk_impact_observations','werk_impact_reviews',
  'werk_record_impact_measurement_plan','werk_record_impact_implementation','werk_record_impact_observation','werk_record_impact_review',
  'werk_impact_measurement_snapshot','planned_no_implementation_evidence','implemented_awaiting_observation',
  'observation_available_attribution_not_established','arithmetic_deviation_not_causal_effect','not_established_by_system',
  'review_only_no_automatic_policy_change','WERK_IMPACT_EVIDENCE_APPEND_ONLY'
])assert.ok(sql.includes(token),`missing impact-measurement guard: ${token}`);

for(const table of ['werk_impact_measurement_plans','werk_impact_implementation_events','werk_impact_observations','werk_impact_reviews']){
  assert.ok(sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`),`RLS missing: ${table}`);
  assert.ok(sql.includes(`REVOKE ALL ON TABLE public.${table} FROM PUBLIC,anon,authenticated`),`direct table revoke missing: ${table}`);
  assert.ok(!sql.includes(`GRANT UPDATE ON TABLE public.${table}`),`append-only table grants UPDATE: ${table}`);
  assert.ok(!sql.includes(`GRANT DELETE ON TABLE public.${table}`),`append-only table grants DELETE: ${table}`);
}
assert.equal(contract.version,'2026-09-21-v1');
assert.equal(contract.storage_contract.append_only_evidence,true);
assert.ok(contract.separation_rules.includes('observed value is not causal attribution'));
assert.equal(contract.snapshot_semantics.causal_effect,'never auto-derived');
assert.equal(contract.review_contract.boundary,'review-only; no automatic implementation, recommendation ranking, acceptance or rejection');
assert.ok(bridge.mappings.some(m=>m.map_id==='IMPACT-SV-EMPLOYEE'&&m.reform_ids.includes('SV-01')),'expected existing Impact Bridge reference missing');
console.log('Impact measurement contract guard: PASS');
