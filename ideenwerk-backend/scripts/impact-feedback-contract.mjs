import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql=fs.readFileSync(new URL('../sql/044_ideenwerk_impact_feedback.sql',import.meta.url),'utf8');
const contract=JSON.parse(fs.readFileSync(new URL('../../werk-data/ideenwerk-impact-feedback.json',import.meta.url),'utf8'));
const aiContract=JSON.parse(fs.readFileSync(new URL('../../werk-data/ideenwerk-ai-synthesis.json',import.meta.url),'utf8'));
const provider=fs.readFileSync(new URL('../src/lib/synthesis-provider.js',import.meta.url),'utf8');
const runner=fs.readFileSync(new URL('./run-ai-synthesis.mjs',import.meta.url),'utf8');

for(const token of [
  'ideenwerk_ai_feedback_context','werk_impact_validate_source_binding','impact_review_source_binding_stale',
  'review_hypothesis_not_fact_or_causal_effect','impact_feedback_revalidation_required',
  "'schema_version','2026-09-21-v2'",'v_allowed_review',"v_ref->>'kind'='impact_review'"
])assert.ok(sql.includes(token),`missing feedback guard: ${token}`);
assert.ok(sql.includes('jsonb_array_length(ir.uncertainties)>0'),'uncertainty gate missing');
assert.ok(sql.includes('jsonb_array_length(ir.source_refs)>0'),'provenance gate missing');
assert.ok(sql.includes('jsonb_array_length(v_refs)>=12'),'feedback bound missing');
assert.ok(sql.includes("m->>'map_id'=r.impact_map_id"),'submission impact-map match missing');
assert.ok(sql.includes("rid=r.reform_id"),'submission reform match missing');
assert.ok(/REVOKE ALL ON FUNCTION public\.ideenwerk_ai_feedback_context\(uuid\) FROM PUBLIC,anon,authenticated/.test(sql));
assert.equal(contract.version,'2026-09-21-v1');
assert.equal(contract.consumption.max_reviews,12);
assert.equal(contract.ai_integration.provider_activation_required_for_contract,false);
assert.equal(contract.ai_integration.external_provider_activation,false);
assert.ok(contract.epistemic_boundaries.includes('observed KPI movement is not causal policy impact'));
assert.ok(contract.epistemic_boundaries.includes('improvement_hypothesis remains review material'));
assert.ok(contract.negative_guards.includes('feedback cannot bypass existing anti-ranking, anti-decision and anti-new-numeric-effect guards'));
assert.equal(aiContract.version,'2026-09-21-v2');
assert.ok(aiContract.variant_schema.source_ref_kinds.includes('impact_review'));
assert.ok(provider.includes('impact_review_refs'));
assert.ok(provider.includes('impact_feedback_is_hypothesis_only'));
assert.ok(provider.includes("SYNTHESIS_PROVIDER||'disabled'"));
assert.ok(runner.includes('ideenwerk_ai_feedback_context'));
assert.ok(runner.includes('impact_feedback'));
assert.ok(runner.includes('impact_review_refs'));
console.log('Impact feedback contract guard: PASS');
