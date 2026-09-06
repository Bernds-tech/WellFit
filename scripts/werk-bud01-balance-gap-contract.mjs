import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const fail = m => { throw new Error(m); };
const eq = (a,b,tol,msg) => { if(!Number.isFinite(a)||!Number.isFinite(b)||!Number.isFinite(tol)||tol<0||Math.abs(a-b)>tol) fail(`${msg}: ${a} != ${b}`); };
const sum = a => a.reduce((x,y)=>x+y,0);

const b = read('werk-data/budget-baseline-2026-2031.json');
const g = read('werk-data/bud01-balance-gap-2026-2031.json');

if(JSON.stringify(g.years)!==JSON.stringify(b.years)) fail('BUD balance-gap year universe drift');
const n=b.years.length;
const rounding=g.rounding_reconciliation;
if(!rounding||!Array.isArray(rounding.annual_gap_minus_primary_and_interest_bn)||rounding.annual_gap_minus_primary_and_interest_bn.length!==n) fail('Explicit rounding residuals missing');
for(const key of ['official_baseline_maastricht_balance_bn','balance_gap_to_zero_bn','official_baseline_primary_balance_bn','primary_gap_to_zero_bn','official_baseline_interest_expenditure_bn','official_baseline_debt_bn','official_baseline_debt_pct_gdp']){
  if(!Array.isArray(g[key])||g[key].length!==n||g[key].some(v=>!Number.isFinite(v))) fail(`Invalid balance-gap series ${key}`);
}
for(let i=0;i<n;i++){
  eq(g.official_baseline_maastricht_balance_bn[i],b.series.maastricht_balance_bn[i],0,`${g.years[i]} Maastricht baseline bridge`);
  eq(g.balance_gap_to_zero_bn[i],-b.series.maastricht_balance_bn[i],0,`${g.years[i]} balance gap`);
  eq(g.official_baseline_primary_balance_bn[i],b.series.primary_balance_bn[i],0,`${g.years[i]} primary baseline bridge`);
  eq(g.primary_gap_to_zero_bn[i],-b.series.primary_balance_bn[i],0,`${g.years[i]} primary gap`);
  eq(g.official_baseline_interest_expenditure_bn[i],b.series.interest_expenditure_bn[i],0,`${g.years[i]} interest bridge`);
  eq(g.official_baseline_debt_bn[i],b.series.maastricht_debt_bn[i],0,`${g.years[i]} debt bridge`);
  eq(g.official_baseline_debt_pct_gdp[i],b.series.maastricht_debt_pct_gdp[i],0,`${g.years[i]} debt-ratio bridge`);
  const residual=rounding.annual_gap_minus_primary_and_interest_bn[i];
  eq(residual,0,0.150000001,`${g.years[i]} maximum three rounded input residual`);
  eq(g.balance_gap_to_zero_bn[i],g.primary_gap_to_zero_bn[i]+g.official_baseline_interest_expenditure_bn[i]+residual,1e-9,`${g.years[i]} balance gap = primary gap + interest + published-input rounding residual`);
}
eq(g.derived.cumulative_baseline_deficits_2026_2031_bn,sum(g.balance_gap_to_zero_bn),0.001,'Cumulative baseline deficit arithmetic');
eq(g.derived.cumulative_primary_deficits_2026_2031_bn,sum(g.primary_gap_to_zero_bn),0.001,'Cumulative primary deficit arithmetic');
eq(g.derived.cumulative_interest_expenditure_2026_2031_bn,sum(g.official_baseline_interest_expenditure_bn),0.001,'Cumulative interest arithmetic');
eq(rounding.cumulative_gap_minus_primary_and_interest_bn,sum(rounding.annual_gap_minus_primary_and_interest_bn),1e-9,'Cumulative rounding residual');
eq(g.derived.cumulative_baseline_deficits_2026_2031_bn,g.derived.cumulative_primary_deficits_2026_2031_bn+g.derived.cumulative_interest_expenditure_2026_2031_bn+rounding.cumulative_gap_minus_primary_and_interest_bn,1e-9,'Cumulative deficit decomposition with explicit rounding residual');
eq(g.derived.debt_increase_2026_to_2031_bn,g.official_baseline_debt_bn.at(-1)-g.official_baseline_debt_bn[0],0.001,'Debt increase 2026-2031');
eq(g.derived['2031_balance_gap_bn'],g.balance_gap_to_zero_bn.at(-1),0,'2031 gap anchor');
eq(g.derived['2031_debt_bn'],g.official_baseline_debt_bn.at(-1),0,'2031 debt anchor');
eq(g.derived.simple_years_to_zero_at_10bn_from_2031_debt,g.derived['2031_debt_bn']/10,0.001,'Simple 10bn repayment horizon');

const rules=(g.accounting_rules||[]).join(' ');
for(const tokens of [['Balance-Lücke','Schuldentilgung','nicht addiert'],['10-Mrd.-Tilgungsziel','Überschuss'],['Regierungsmaßnahmen','nicht nochmals'],['Brutto-Sparpotenziale','Nettoeffekt'],['109,8','kein einmalig'],['74,3','nicht zusätzlich']]){
  if(!tokens.every(t=>rules.includes(t))) fail(`Missing BUD-01 accounting guard: ${tokens.join(' + ')}`);
}
if(!String(g.policy_interpretation?.no_42_year_promise).includes('nicht abgeleitet')) fail('Fixed 42-year promise guard missing');
if(g.coverage?.BUD_GAP_F_final_werk_measure_package!=='open'||g.coverage?.BUD_GAP_G_final_debt_free_horizon!=='open') fail('Final WERK package/debt horizon must remain open');

console.log(`BUD-01 gap contract OK: ${g.derived.cumulative_baseline_deficits_2026_2031_bn.toFixed(1)}bn = ${g.derived.cumulative_primary_deficits_2026_2031_bn.toFixed(1)}bn primary + ${g.derived.cumulative_interest_expenditure_2026_2031_bn.toFixed(1)}bn interest + ${rounding.cumulative_gap_minus_primary_and_interest_bn.toFixed(1)}bn rounding residual; final package remains open.`);
