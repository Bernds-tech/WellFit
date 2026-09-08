import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {breakEven} from './lib/werk-tax-enforcement.mjs';
const out=JSON.parse(fs.readFileSync('werk-data/tax-enforcement-break-even-results.json'));
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,`${a} != ${b}`);
// Independent hand totals: t0=10, annual costs=20, five-year payable ramps .25+.75+1+1=3.
for(const [q,answer] of [[.5,220/3],[.75,440/9],[1,110/3]]){
 const c=out.cases.find(x=>x.horizon_years===5&&x.lag_years===1&&x.cash_share===q);
 near(c.required_steady_annual_assessment_mio,answer);
}
// Countercheck by forward cohort cash simulation, not by recomputing the threshold quotient.
for(const c of out.cases){
 if(c.required_steady_annual_assessment_mio===null){assert.equal(c.horizon_years,1);assert.ok(c.lag_years>=1);continue;}
 let balance=-10,npv=-10;
 for(let y=1;y<=c.horizon_years;y++){
  let receipt=0,pvReceipt=0;
  for(let origin=1;origin<=c.horizon_years;origin++)if(origin+c.lag_years===y){
   const ramp=origin===1?.25:origin===2?.75:1;
   receipt+=c.required_steady_annual_assessment_mio*ramp*c.cash_share;
   pvReceipt+=c.required_steady_annual_assessment_npv_mio*ramp*c.cash_share;
  }
  balance+=receipt-20;npv+=(pvReceipt-20)/1.03**y;
 }
 near(balance,0);near(npv,0);
}
assert.equal(out.evidence_reconciliation.heterogeneous_row_arithmetic_sum_eur,154051734);
assert.equal(out.evidence_reconciliation.appropriation_less_outlays_eur,1363233);
assert.ok(out.evidence_reconciliation.utilization_residual_percentage_points<-.06);
const p={annualCost:20,initialCost:10,ramp:[.25,.75,1,1,1],cashShare:.75,lag:1,horizon:5,discountPct:3};
const invalid=[...['annualCost','initialCost','cashShare','lag','horizon','discountPct'].map(k=>()=>breakEven({...p,[k]:null})),
 ()=>breakEven({...p,annualCost:Infinity}),()=>breakEven({...p,initialCost:-1}),()=>breakEven({...p,cashShare:0}),()=>breakEven({...p,cashShare:1.01}),()=>breakEven({...p,lag:1.5}),()=>breakEven({...p,horizon:0}),()=>breakEven({...p,discountPct:-1}),()=>breakEven({...p,ramp:[.25,NaN,1,1,1]}),()=>breakEven({...p,ramp:[1.01,1,1,1,1]}),()=>breakEven({...p,ramp:[1]})];
invalid.forEach(f=>assert.throws(f));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-tax-enforcement-'));let corruptions=0;
try{
 const evidence='werk-data/tax-enforcement-evidence-2025.json',model='werk-data/tax-enforcement-break-even-model.json',result='werk-data/tax-enforcement-break-even-results.json';
 const pdf=JSON.parse(fs.readFileSync(evidence)).original_path;
 for(const f of [...Object.keys(out.source_hashes),pdf,result,'WERK_STEUERVOLLZUG_RECHNUNG.md','scripts/werk-tax-enforcement-contract.mjs','scripts/lib/werk-tax-enforcement.mjs']){
  fs.mkdirSync(path.dirname(path.join(tmp,f)),{recursive:true});fs.copyFileSync(f,path.join(tmp,f));
 }
 const run=()=>spawnSync(process.execPath,['scripts/werk-tax-enforcement-contract.mjs'],{cwd:tmp,encoding:'utf8'});
 assert.equal(run().status,0);
 for(const [file,mutate] of [[evidence,x=>x.monetary_rows[0].stage='collected'],[evidence,x=>x.boundaries.tax_only_cash_total_eur=154000000],
 [evidence,x=>x.boundaries.source_budget_discrepancy='closed'],[evidence,x=>x.office_budget.actual_outlays_eur=x.office_budget.appropriation_eur],
 [model,x=>x.pilot_measurement_spec.gates.attributable_additional_cash_verified=true],[model,x=>x.pilot_measurement_spec.verified_annual_funding_credit_eur=1000000],
 [model,x=>x.government_overlap_exclusions.pop()],[result,x=>x.cases[0].required_steady_annual_assessment_mio=0],[result,x=>x.verified_annual_funding_credit_eur=154000000]]){
  const raw=fs.readFileSync(file),d=JSON.parse(raw);mutate(d);fs.writeFileSync(path.join(tmp,file),JSON.stringify(d));assert.notEqual(run().status,0);fs.writeFileSync(path.join(tmp,file),raw);corruptions++;
 }
 fs.appendFileSync(path.join(tmp,pdf),'corrupt');assert.notEqual(run().status,0);corruptions++;
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`TAX001 counterchecks: 3 hand thresholds, 27 timing cases, source residuals, ${invalid.length} invalid inputs and ${corruptions} corruptions passed`);
