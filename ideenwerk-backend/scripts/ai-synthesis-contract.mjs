import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql=fs.readFileSync(new URL('../sql/040_ideenwerk_ai_synthesis.sql',import.meta.url),'utf8');
const provider=fs.readFileSync(new URL('../src/lib/synthesis-provider.js',import.meta.url),'utf8');
const runner=fs.readFileSync(new URL('./run-ai-synthesis.mjs',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../../werk-assets/site-ideenwerk-synthesis.js',import.meta.url),'utf8');
const loader=fs.readFileSync(new URL('../../werk-assets/site-v71-loader.js',import.meta.url),'utf8');
const contract=JSON.parse(fs.readFileSync(new URL('../../werk-data/ideenwerk-ai-synthesis.json',import.meta.url),'utf8'));

for(const token of [
  'ideenwerk_ai_syntheses','ideenwerk_ai_synthesis_source_snapshot','ideenwerk_record_ai_synthesis','ideenwerk_current_ai_synthesis',
  'AI_SYNTHESIS_PREREQUISITES_NOT_CURRENT','AI_SYNTHESIS_SOURCE_SNAPSHOT_STALE','AI_SYNTHESIS_SOURCE_REF_NOT_CURRENT',
  'AI_SYNTHESIS_POLITICAL_RANKING_FORBIDDEN','AI_SYNTHESIS_NUMERIC_EFFECT_TEXT_FORBIDDEN','AI_SYNTHESIS_APPEND_ONLY',
  "'ai_synthesis',v_synthesis",'multiple_variants_no_ranking_no_accept_reject_no_new_fiscal_effect'
])assert.ok(sql.includes(token),`missing SQL guard: ${token}`);
assert.ok(/REVOKE ALL ON TABLE public\.ideenwerk_ai_syntheses FROM PUBLIC,anon,authenticated/.test(sql));
assert.ok(!/GRANT (UPDATE|DELETE) ON TABLE public\.ideenwerk_ai_syntheses TO service_role/.test(sql));
assert.ok(provider.includes("SYNTHESIS_PROVIDER||'disabled'"),'provider must default disabled');
assert.ok(provider.includes('werk_ideenwerk_synthesis'));
assert.ok(provider.includes('AI_SYNTHESIS_POLITICAL_RANKING_FORBIDDEN'));
assert.ok(runner.includes('ideenwerk_ai_synthesis_source_snapshot'));
assert.ok(runner.includes('ideenwerk_record_ai_synthesis'));
assert.equal(contract.version,'2026-09-21-v1');
assert.equal(contract.provider_contract.default,'disabled; never manufacture fallback policy variants');
assert.equal(contract.storage_contract.append_only,true);
assert.ok(contract.prohibited_semantics.includes('political ranking'));
assert.ok(contract.prohibited_semantics.includes('manufactured fiscal effect'));
assert.ok(ui.includes('KI-Synthese: Lösungsvarianten'));
assert.ok(ui.includes('WERK reiht sie nicht'));
assert.ok(ui.includes('textContent'));
assert.ok(!ui.includes('innerHTML'));
assert.ok(loader.includes('site-ideenwerk-synthesis.js?v=20260921-synthesis-v1'));
console.log('AI synthesis contract guard: PASS');
