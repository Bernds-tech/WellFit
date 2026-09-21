import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql=fs.readFileSync(new URL('../sql/040_ideenwerk_ai_synthesis.sql',import.meta.url),'utf8');
const feedbackSql=fs.readFileSync(new URL('../sql/044_ideenwerk_impact_feedback.sql',import.meta.url),'utf8');
const provider=fs.readFileSync(new URL('../src/lib/synthesis-provider.js',import.meta.url),'utf8');
const runner=fs.readFileSync(new URL('./run-ai-synthesis.mjs',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../../werk-assets/site-ideenwerk-synthesis.js',import.meta.url),'utf8');
const loader=fs.readFileSync(new URL('../../werk-assets/site-v71-loader.js',import.meta.url),'utf8');
const contract=JSON.parse(fs.readFileSync(new URL('../../werk-data/ideenwerk-ai-synthesis.json',import.meta.url),'utf8'));
const feedbackContract=JSON.parse(fs.readFileSync(new URL('../../werk-data/ideenwerk-impact-feedback.json',import.meta.url),'utf8'));

for(const token of [
  'ideenwerk_ai_syntheses','ideenwerk_ai_synthesis_source_snapshot','ideenwerk_record_ai_synthesis','ideenwerk_current_ai_synthesis',
  'AI_SYNTHESIS_PREREQUISITES_NOT_CURRENT','AI_SYNTHESIS_SOURCE_SNAPSHOT_STALE','AI_SYNTHESIS_SOURCE_REF_NOT_CURRENT',
  'AI_SYNTHESIS_POLITICAL_RANKING_FORBIDDEN','AI_SYNTHESIS_NUMERIC_EFFECT_TEXT_FORBIDDEN','AI_SYNTHESIS_APPEND_ONLY',
  "'ai_synthesis',v_synthesis",'multiple_variants_no_ranking_no_accept_reject_no_new_fiscal_effect'
])assert.ok(sql.includes(token),`missing SQL guard: ${token}`);
assert.ok(/REVOKE ALL ON TABLE public\.ideenwerk_ai_syntheses FROM PUBLIC,anon,authenticated/.test(sql));
assert.ok(!/GRANT (UPDATE|DELETE) ON TABLE public\.ideenwerk_ai_syntheses TO service_role/.test(sql));

for(const token of [
  'ideenwerk_ai_feedback_context','werk_impact_validate_source_binding','impact_review_source_binding_stale',
  "'schema_version','2026-09-21-v2'","v_allowed_review","v_ref->>'kind'='impact_review'",
  'feedback_hypotheses_not_facts'
])assert.ok(feedbackSql.includes(token),`missing feedback integration guard: ${token}`);
assert.ok(feedbackSql.includes('jsonb_array_length(ir.uncertainties)>0'),'feedback requires explicit uncertainty');
assert.ok(feedbackSql.includes('jsonb_array_length(ir.source_refs)>0'),'feedback requires provenance refs');
assert.ok(feedbackSql.includes('jsonb_array_length(v_refs)>=12'),'feedback context must remain bounded');
assert.ok(/REVOKE ALL ON FUNCTION public\.ideenwerk_ai_feedback_context\(uuid\) FROM PUBLIC,anon,authenticated/.test(feedbackSql));

assert.ok(provider.includes("SYNTHESIS_PROVIDER||'disabled'"),'provider must default disabled');
assert.ok(provider.includes('werk_ideenwerk_synthesis'));
assert.ok(provider.includes('AI_SYNTHESIS_POLITICAL_RANKING_FORBIDDEN'));
assert.ok(provider.includes('impact_review_refs'));
assert.ok(provider.includes('impact_review'));
assert.ok(runner.includes('ideenwerk_ai_synthesis_source_snapshot'));
assert.ok(runner.includes('ideenwerk_ai_feedback_context'));
assert.ok(runner.includes('impact_review_refs'));
assert.ok(runner.includes('ideenwerk_record_ai_synthesis'));
assert.equal(contract.version,'2026-09-21-v2');
assert.equal(contract.provider_contract.default,'disabled; never manufacture fallback policy variants');
assert.equal(contract.storage_contract.append_only,true);
assert.ok(contract.variant_schema.source_ref_kinds.includes('impact_review'));
assert.ok(contract.prohibited_semantics.includes('political ranking'));
assert.ok(contract.prohibited_semantics.includes('manufactured fiscal effect'));
assert.ok(contract.prohibited_semantics.includes('impact-review hypothesis promoted to causal fact'));
assert.equal(feedbackContract.version,'2026-09-21-v1');
assert.equal(feedbackContract.ai_integration.provider_activation_required_for_contract,false);
assert.equal(feedbackContract.ai_integration.external_provider_activation,false);
assert.equal(feedbackContract.consumption.max_reviews,12);
assert.ok(feedbackContract.epistemic_boundaries.includes('attribution_hypothesis remains a hypothesis'));
assert.ok(ui.includes('KI-Synthese: Lösungsvarianten'));
assert.ok(ui.includes('WERK reiht sie nicht'));
assert.ok(ui.includes('textContent'));
assert.ok(!ui.includes('innerHTML'));
assert.ok(loader.includes('site-ideenwerk-synthesis.js?v=20260921-synthesis-v1'));
console.log('AI synthesis contract guard: PASS');
