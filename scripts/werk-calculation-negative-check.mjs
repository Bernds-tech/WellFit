import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {cashflow,repayment,fundingCredit,finite} from './lib/werk-calculation.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
let cases=0;
const check=(name,fn)=>{try{fn();cases++;}catch(e){throw new Error(`${name}: ${e.message}`);}};
check('Independent integer cashflow anchor',()=>{
  const c=cashflow({gross:100,running:20,transition:50,ramp:[0.25,0.75,1,1,1],discountPct:0});
  assert.deepEqual(c.rows.map(x=>x.cumulative_net_mio),[-45,10,90,170,250]);
  assert.equal(c.break_even_year_within_horizon,2); close(c.rows[4].npv_mio,250);
});
check('No false payback on a temporary crossing',()=>{
  assert.equal(cashflow({gross:100,running:20,transition:0,ramp:[1,0,0,0,0,0],discountPct:0}).break_even_year_within_horizon,null);
});
check('Future-year interest and last partial instalment',()=>{
  const d=repayment({debt:25,annualBase:10,ratePct:10,reinvestShare:0,years:4});
  assert.deepEqual(d.rows.map(x=>x.remaining_debt_bn),[15,5,0,0]);
  assert.deepEqual(d.rows.map(x=>x.interest_benefit_bn),[0,1,2,2.5]);
  assert.equal(d.rows[2].base_repayment_bn,5);assert.equal(d.repayment_complete_year,3);
});
check('Reinvestment reduces debt once only',()=>{
  const d=repayment({debt:25,annualBase:10,ratePct:10,reinvestShare:1,years:4});
  assert.deepEqual(d.rows.map(x=>x.remaining_debt_bn),[15,4,0,0]);
  for(const r of d.rows) close(r.cumulative_principal_reduction_bn,r.cumulative_base_repayment_bn+r.cumulative_reinvested_interest_bn);
});
check('Zero funded repayment cannot bootstrap itself',()=>assert.equal(repayment({debt:25,annualBase:0,ratePct:10,reinvestShare:1,years:10}).repayment_complete_year,null));
check('Zero debt starts complete',()=>assert.equal(repayment({debt:0,annualBase:10,ratePct:2.5,reinvestShare:1}).repayment_complete_year,0));
for(const bad of [NaN,Infinity,null,undefined,'1']) check(`Invalid scalar ${bad}`,()=>assert.throws(()=>finite(bad)));
for(const edit of [{gross:NaN},{running:null},{transition:-1},{ramp:[1.01]},{discountPct:-1}])
  check('Reject invalid cashflow '+JSON.stringify(edit),()=>assert.throws(()=>cashflow({gross:1,running:0,transition:0,ramp:[1],...edit})));
for(const edit of [{debt:-1},{annualBase:NaN},{ratePct:null},{reinvestShare:2},{years:1.5}])
  check('Reject invalid debt '+JSON.stringify(edit),()=>assert.throws(()=>repayment({debt:10,annualBase:1,ratePct:1,reinvestShare:0,...edit})));
check('Unknown funding is not zero effect',()=>assert.deepEqual(fundingCredit([{reform_id:'A',verified_annual_net_eur_billion:null}],['A']),{verified_annual_net_bn:0,verified_count:0}));
check('Reject unmapped funding ID',()=>assert.throws(()=>fundingCredit([{reform_id:'OLD',verified_annual_net_eur_billion:null}],['A'])));
check('Reject duplicated reform contribution',()=>assert.throws(()=>fundingCredit([{reform_id:'A',verified_annual_net_eur_billion:null},{reform_id:'A',verified_annual_net_eur_billion:null}],['A'])));
check('Reject unverified booked amount',()=>assert.throws(()=>fundingCredit([{reform_id:'A',verified_annual_net_eur_billion:1}],['A'])));

const result=JSON.parse(fs.readFileSync('werk-data/calculation-results-2026.json','utf8'));
check('Published budget anchors and interval reconciliation',()=>{
  close(result.budget.rows[0].improvement_to_target_bn,32.2);
  close(result.budget.cumulative[1].cumulative_deficit_bn,91.8);
  close(result.budget.cumulative[2].cumulative_deficit_bn,109.8);
  close(result.budget.end_2026_to_end_2031_debt_change_bn,87);
  close(result.budget.derived_stock_flow_and_rounding_residual_2027_2031_bn,-0.6);
});
check('Independent model magnitudes and combined ramp',()=>{
  close(result.default_modules[0].steady_annual_net_before_transition_mio,9.79);
  close(result.default_modules[1].steady_annual_net_before_transition_mio,39.3665);
  close(result.default_modules[2].steady_annual_net_before_transition_mio,-10);
  const c=result.combined_conditional_cases.find(x=>x.overlap_haircut===0&&x.transition_per_module_mio===25);
  close(c.rows[0].cumulative_net_mio,-87.710875);close(c.rows[4].cumulative_net_mio,51.626);close(c.rows[9].cumulative_net_mio,247.4085);
});
check('Survey hours arithmetic without budget conversion',()=>{
  const c=result.labour.conditional_hours_cases.find(x=>x.uptake_share===0.5&&x.weekly_extra_hours===10);
  close(c.fte_equivalent,13825);assert.equal(c.budget_effect_eur,null);assert.equal(result.labour.childcare.attending_non_vif,134105);
});

// End-to-end mutations in an isolated fixture: source files in the repository are never changed.
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-calc-negative-'));
try {
  for(const file of [...Object.keys(result.source_sha256),'scripts/werk-calculation-contract.mjs','scripts/lib/werk-calculation.mjs','scripts/lib/werk-payroll-2026.mjs','scripts/lib/werk-annual-assessment-2026.mjs']) {
    const dest=path.join(tmp,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest);
  }
  const run=()=>spawnSync(process.execPath,['scripts/werk-calculation-contract.mjs','--write'],{cwd:tmp,encoding:'utf8'});
  check('Clean generation in isolated fixture',()=>assert.equal(run().status,0));
  for(const [name,file,mutate] of [
    ['Null budget value','budget-baseline-2026-2031',d=>{d.series.government_revenue_bn[0]=null;}],
    ['Broken fiscal identity','budget-baseline-2026-2031',d=>{d.series.government_revenue_bn[0]+=1;}],
    ['Unknown funding alias','funding-matrix',d=>{d.items[0].reform_id='FISC-01';}],
    ['Zero FTE denominator','calculation-assumptions',d=>{d.labour.fte_weekly_hours=0;}],
    ['Impossible uptake','calculation-assumptions',d=>{d.labour.uptake_share_cases=[1.1];}],
    ['Unreviewed payroll region','calculation-assumptions',d=>{d.payroll.regions=['unknown'];}],
    ['Ramped loss cannot hide negative operating costs','tax-compliance-model',d=>{d.model.default_additional_enforcement_cost_eur_million=-1;}],
    ['Unproven labour effect','labour-time-care-constraints-2025',d=>{d.effect_gate.budget_effect_eur=1;}]
  ]) {
    const p=path.join(tmp,`werk-data/${file}.json`),original=fs.readFileSync(p,'utf8');
    try {const d=JSON.parse(original);mutate(d);fs.writeFileSync(p,JSON.stringify(d));check(name,()=>assert.notEqual(run().status,0));}
    finally {fs.writeFileSync(p,original);}
  }
  // The fiscal workflow formerly allowed undefined/NaN through Math.abs comparisons.
  const workflow=fs.readFileSync('.github/workflows/werk-fiscal-data-check.yml','utf8');
  const inline=workflow.split("node <<'NODE'\n")[1].split('\n          NODE')[0].replace(/^          /gm,'');
  for(const name of ['medium-term-fiscal-path','government-package-2025-2029','government-new-measures-2026-2031','analysis-data-closure-register'])
    fs.copyFileSync(`werk-data/${name}.json`,path.join(tmp,`werk-data/${name}.json`));
  const fiscalRun=()=>spawnSync(process.execPath,['-e',inline],{cwd:tmp,encoding:'utf8'});
  check('Existing fiscal workflow clean fixture',()=>assert.equal(fiscalRun().status,0));
  const p=path.join(tmp,'werk-data/government-baseline-2025-2031.json'),d=JSON.parse(fs.readFileSync(p,'utf8'));
  delete d.annual_consolidation_since_2025_mio.total_consolidation_since_2025[0];fs.writeFileSync(p,JSON.stringify(d));
  check('Fiscal workflow rejects missing aggregate',()=>assert.notEqual(fiscalRun().status,0));
  fs.copyFileSync('scripts/werk-bud01-balance-gap-contract.mjs',path.join(tmp,'scripts/werk-bud01-balance-gap-contract.mjs'));
  const gapPath=path.join(tmp,'werk-data/bud01-balance-gap-2026-2031.json');
  const gapRaw=fs.readFileSync('werk-data/bud01-balance-gap-2026-2031.json','utf8');
  fs.writeFileSync(gapPath,gapRaw);
  const gapRun=()=>spawnSync(process.execPath,['scripts/werk-bud01-balance-gap-contract.mjs'],{cwd:tmp,encoding:'utf8'});
  check('Explicit source-rounding residual reconciles',()=>assert.equal(gapRun().status,0));
  const gap=JSON.parse(gapRaw);gap.rounding_reconciliation.annual_gap_minus_primary_and_interest_bn[4]=0;
  fs.writeFileSync(gapPath,JSON.stringify(gap));
  check('Removing the 2030 rounding residual fails',()=>assert.notEqual(gapRun().status,0));
  const missing=JSON.parse(gapRaw);delete missing.derived.cumulative_baseline_deficits_2026_2031_bn;
  fs.writeFileSync(gapPath,JSON.stringify(missing));
  check('Missing cumulative amount cannot pass as NaN',()=>assert.notEqual(gapRun().status,0));
} finally {fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`Calculation countercheck OK: ${cases} independent anchors and negative cases.`);
