import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const fail = (m) => { throw new Error(m); };
const eq = (a, b, tol, msg) => { if (Math.abs(a - b) > tol) fail(`${msg}: ${a} != ${b}`); };

const g = read('werk-data/tax-expenditure-law-groups-2022-2024.json');
const p = read('werk-data/tax-expenditure-priority-2024.json');
const t = read('werk-data/tax-baseline-2022-2025.json');

if (JSON.stringify(g.years) !== JSON.stringify([2022, 2023, 2024])) fail('Law-group year universe mismatch');
if (!Array.isArray(g.groups) || g.groups.length !== 12) fail(`Expected 12 quantified law groups, got ${g.groups?.length}`);
if (!Array.isArray(g.unquantified_groups) || g.unquantified_groups.length !== 2) fail(`Expected 2 explicitly unquantified groups, got ${g.unquantified_groups?.length}`);

const ids = new Set();
const calcTotal = [0, 0, 0];
const calcFederal = [0, 0, 0];
for (const row of g.groups) {
  if (!row.id || ids.has(row.id)) fail(`Duplicate/missing law-group id ${row.id}`);
  ids.add(row.id);
  for (const key of ['total', 'federal']) {
    if (!Array.isArray(row[key]) || row[key].length !== 3 || row[key].some(v => !Number.isFinite(v) || v < 0)) fail(`${row.id}: invalid ${key} series`);
  }
  for (let i = 0; i < 3; i++) {
    if (row.federal[i] > row.total[i]) fail(`${row.id} ${g.years[i]}: federal amount exceeds total`);
    calcTotal[i] += row.total[i];
    calcFederal[i] += row.federal[i];
  }
}

for (let i = 0; i < 3; i++) {
  eq(calcTotal[i], g.calculated_group_sum_total[i], 0, `${g.years[i]} calculated law-group total`);
  eq(calcFederal[i], g.calculated_group_sum_federal[i], 0, `${g.years[i]} calculated federal law-group total`);
  eq(g.published_sum_row_total[i] - g.calculated_group_sum_total[i], g.published_vs_calculated_discrepancy_total[i], 0, `${g.years[i]} published-vs-calculated total discrepancy`);
  eq(g.published_sum_row_federal[i] - g.calculated_group_sum_federal[i], g.published_vs_calculated_discrepancy_federal[i], 0, `${g.years[i]} published-vs-calculated federal discrepancy`);
}

if (g.published_vs_calculated_discrepancy_total[0] !== 0 || g.published_vs_calculated_discrepancy_total[1] !== -1 || g.published_vs_calculated_discrepancy_total[2] !== 0) fail('Expected explicit 2023 one-million published sum discrepancy');
eq(g.calculated_group_sum_total[2], t.tax_expenditures_mio.quantified_indirect_subsidies[2], 0, '2024 law groups vs canonical tax expenditure aggregate');
eq(g.calculated_group_sum_total[1], t.tax_expenditures_mio.quantified_indirect_subsidies[1], 0, '2023 calculated law groups vs canonical tax expenditure aggregate');
eq(g.calculated_group_sum_total[0], t.tax_expenditures_mio.quantified_indirect_subsidies[0], 0, '2022 law groups vs canonical tax expenditure aggregate');

eq(g.calculated_group_sum_total[2] - g.calculated_group_sum_federal[2], g.states_municipalities_residual_2024_mio, 0, '2024 federal vs states/municipalities residual');
eq(g.calculated_group_sum_federal[2] / g.calculated_group_sum_total[2] * 100, g.federal_share_2024_pct, 0.1, '2024 federal share');

for (const row of g.unquantified_groups) if (row.status !== 'k.A.') fail(`${row.id}: unquantified law group must stay k.A.`);
if (!String(g.discrepancy_note).includes('25.395') || !String(g.discrepancy_note).includes('25.394')) fail('2023 discrepancy explanation missing both published/calculated values');
if (!String(g.residual_rule).includes('keine eigenständige zusätzliche Förderung')) fail('Federal/residual no-double-count guard missing');

// Hierarchy guard: selected measures are contained in law groups, not additive to them.
for (const m of p.measures) if (!ids.has(m.law_short)) fail(`Selected measure ${m.id} refers to unregistered law group ${m.law_short}`);
if (!(p.selected_measure_sum_mio < g.calculated_group_sum_total[2])) fail('Selected measures must remain a subset of 2024 law-group aggregate');
if (!String(g.accounting_rules.join(' ')).includes('dürfen nicht addiert werden')) fail('Law-group/measure hierarchy guard missing');
if (g.coverage?.TAX_I9_published_sum_reconciliation !== 'closed_with_2023_one_mio_discrepancy') fail('TAX-I law-group reconciliation coverage mismatch');
if (g.coverage?.full_93_measure_inventory !== 'open') fail('Full 93-measure inventory must remain open');

console.log(`Tax law-group contract OK: 12 quantified law groups reconcile to EUR ${(g.calculated_group_sum_total[2] / 1000).toFixed(3)}bn in 2024; 2023 calculated EUR ${(g.calculated_group_sum_total[1] / 1000).toFixed(3)}bn remains transparently 1m above the published sum row.`);
