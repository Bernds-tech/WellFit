import fs from 'node:fs';

const fail = msg => { throw new Error(msg); };
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const core = read('werk-data/core.json');
const map = read('werk-data/policy-field-map.json');
const work = read('werk-data/policy-field-workstate.json');
const reforms = read('werk-data/reforms.json');
const gaps = read('werk-data/analysis-data-closure-register.json');

if (!Array.isArray(work.fields) || work.fields.length !== 12) fail(`Expected 12 workstate fields, got ${work.fields?.length}`);
if (!Array.isArray(core.policy_fields) || core.policy_fields.length !== 12) fail('core policy fields != 12');
if (!Array.isArray(map.fields) || map.fields.length !== 12) fail('policy-field-map fields != 12');

const reformIds = new Set((reforms.reforms || []).map(r => r.id));
const gapIds = new Set((gaps.priority_1_data_gaps || []).map(g => g.id));
const coreById = new Map(core.policy_fields.map(f => [Number(f.id), f]));
const mapById = new Map(map.fields.map(f => [Number(f.id), f]));
const seen = new Set();
let fieldsWithReform = 0;
let explicitGaps = 0;

for (const f of work.fields) {
  const id = Number(f.id);
  if (!Number.isInteger(id) || id < 1 || id > 12) fail(`Invalid field id ${f.id}`);
  if (seen.has(id)) fail(`Duplicate workstate field id ${id}`);
  seen.add(id);
  const cf = coreById.get(id);
  const mf = mapById.get(id);
  if (!cf || !mf) fail(`Field ${id} missing in core or map`);
  if (f.name !== cf.name || f.name !== mf.name) fail(`Field ${id} name mismatch: ${f.name} / ${cf.name} / ${mf.name}`);
  for (const p of [...(f.analysis_artifacts || []), ...(f.canonical_data || [])]) {
    const full = `werk-data/${p}`;
    if (!fs.existsSync(full)) fail(`Field ${id} references missing artifact ${full}`);
  }
  for (const rid of f.reform_ids || []) if (!reformIds.has(rid)) fail(`Field ${id} references unknown reform ${rid}`);
  for (const gid of f.gap_ids || []) if (!gapIds.has(gid)) fail(`Field ${id} references unknown data gap ${gid}`);
  if ((f.reform_ids || []).length > 0) fieldsWithReform++;
  if (f.reform_gap === true) explicitGaps++;
  if (typeof f.work_status !== 'string' || !f.work_status.trim()) fail(`Field ${id} missing work_status`);
  if (!Array.isArray(f.next_work) || f.next_work.length === 0) fail(`Field ${id} missing next_work`);
}

if (seen.size !== 12) fail('Not all 12 field IDs represented');
if (work.summary?.fields_total !== 12) fail('summary.fields_total must be 12');
if (work.summary?.fields_with_at_least_one_reform !== fieldsWithReform) fail(`summary reform field count ${work.summary?.fields_with_at_least_one_reform} != ${fieldsWithReform}`);
if (work.summary?.fields_with_explicit_reform_gap !== explicitGaps) fail(`summary reform gap count ${work.summary?.fields_with_explicit_reform_gap} != ${explicitGaps}`);

console.log(`WERK policy workstate OK: 12 fields; ${fieldsWithReform} with reform records; ${explicitGaps} with explicit reform gaps; all artifact/reform/GAP references resolve.`);
