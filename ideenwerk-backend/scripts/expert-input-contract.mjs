import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql=fs.readFileSync(new URL('../sql/038_ideenwerk_expert_input.sql',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../../werk-assets/site-ideenwerk-expert.js',import.meta.url),'utf8');
const loader=fs.readFileSync(new URL('../../werk-assets/site-v71-loader.js',import.meta.url),'utf8');

for(const token of [
  'ideenwerk_expert_inputs',
  'ideenwerk_record_expert_input',
  "r.role='impact_reviewer'",
  'EXPERT_INPUT_SOURCE_BINDING_REQUIRED',
  'EXPERT_INPUT_RELATIONSHIP_DISCLOSURE_REQUIRED',
  'EXPERT_INPUT_IDEMPOTENCY_CONFLICT',
  'EXPERT_INPUT_APPEND_ONLY',
  'ideenwerk_expert_input_transparency',
  "'expert_inputs',v_expert_inputs",
  'evidence_input_only_no_veto_no_ranking_no_accept_reject'
]) assert.ok(sql.includes(token),`missing SQL guard: ${token}`);

assert.ok(/REVOKE ALL ON TABLE public\.ideenwerk_expert_inputs FROM PUBLIC,anon,authenticated/.test(sql),'expert table must be fail-closed');
assert.ok(!/GRANT (UPDATE|DELETE) ON TABLE public\.ideenwerk_expert_inputs TO service_role/.test(sql),'expert rows must stay append-only');
assert.ok(!/score|merit_score|accept_proposal|reject_proposal/i.test(sql),'expert contract must not introduce political scoring or proposal decisions');
assert.ok(ui.includes('Fach- & Betroffeneninput'),'citizen transparency rendering missing');
assert.ok(ui.includes('keine politische Wertung'),'citizen boundary text missing');
assert.ok(ui.includes('textContent'),'UI must use text nodes/textContent for untrusted expert content');
assert.ok(!ui.includes('innerHTML'),'expert UI must not interpolate untrusted content through innerHTML');
assert.ok(loader.includes('site-ideenwerk-expert.js?v=20260921-expert-v1'),'V71 loader must load expert module');

console.log('expert input contract guard: PASS');
