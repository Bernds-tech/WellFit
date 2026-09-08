import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {contributionCalculator,transitionPayroll2026} from './lib/werk-alv-transition.mjs';
import {thresholdCalculator} from './lib/werk-alv-threshold.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const kernel=read('werk-data/payroll-employee-kernel-2026.json'),rules=read('werk-data/payroll-annual-assessment-2026.json');
const out=read('werk-data/employee-alv-transition-results.json');
const thresholds=[2225,2427,2630],rates=[0,1,2,2.95];
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,`${a} != ${b}`);
// Independent endpoint interpolation, not the production rebate formula.
for(const schedule of [{thresholds,rates},{thresholds:[2327,2539,2751],rates:[.5,1.5,2.5,2.95]},
 {thresholds:[2327,2539],rates:[1,2,2.95]}])for(const width of [50,100,150])for(const share of [0,.5]){
 const calc=contributionCalculator({...schedule,width,reductionShare:share});
 for(const [i,t] of schedule.thresholds.entries())for(const proportion of [0,.0001,.25,.5,.75,1]){
  const gross=t+width*proportion;
  const expected=((1-proportion)*t*schedule.rates[i]+proportion*(t+width)*schedule.rates[i+1])/100*(1-share);
  near(calc(gross).candidate_eur,expected);
 }
}
let increments=0,minNetIncrease=Infinity;
for(const row of out.rows){
 const options={width:row.width_eur,region:row.region,reductionShare:row.employee_core_reduction_share};
 const calc=transitionPayroll2026(kernel,rules,options),reference=thresholdCalculator(kernel,rules,options);
 const threshold=row.threshold_eur;
 let previous=calc(threshold-.01).candidate.annual_net_eur;
 for(let cents=0;cents<=row.width_eur*100+1;cents++){
  const p=calc(threshold+cents/100),gain=p.candidate.annual_net_eur-previous;
  assert.ok(gain>0,'Non-increasing local candidate net');
  assert.ok(p.annual_net_gain_eur>=-1e-7&&p.annual_contribution_loss_eur>=-1e-7);
  near(p.annual_contribution_loss_eur-p.annual_tax_recapture_eur,p.annual_net_gain_eur);
  minNetIncrease=Math.min(minNetIncrease,gain);previous=p.candidate.annual_net_eur;increments++;
 }
 for(const p of row.points){
  near(calc(p.monthly_gross_eur).baseline.annual_net_eur,reference(p.monthly_gross_eur).annual_net_eur);
  const i=thresholds.indexOf(threshold),offset=p.monthly_gross_increase_from_threshold_eur;
  // Direct annual contribution identity: 14 equal payments times removed amount.
  const expected=offset>0&&offset<row.width_eur?14*threshold*(rates[i+1]-rates[i])/100*(1-offset/row.width_eur)*(1-options.reductionShare):0;
  near(p.annual_contribution_loss_eur,expected);
 }
}
const valid={thresholds,rates,width:100};
const bad=[
 ()=>contributionCalculator({...valid,width:25}),
 ()=>contributionCalculator({...valid,width:NaN}),
 ()=>contributionCalculator({...valid,thresholds:[2225,2300,2630]}),
 ()=>contributionCalculator({...valid,rates:[0,1,NaN,2.95]}),
 ()=>contributionCalculator({...valid,rates:[0,1,.5,2.95]}),
 ()=>contributionCalculator({...valid,rates:[0,1,2]}),
 ()=>contributionCalculator({...valid,reductionShare:.51}),
 ()=>contributionCalculator({...valid,reductionShare:NaN}),
 ()=>contributionCalculator(valid)(Infinity),
 ()=>contributionCalculator(valid)(3500.01),
 ()=>transitionPayroll2026(kernel,{...rules,rule_year:2027},{region:'vienna',width:100}),
 ()=>transitionPayroll2026(kernel,rules,{region:'other',width:100}),
 ()=>transitionPayroll2026({...kernel,social_insurance:{...kernel.social_insurance,monthly_max_base_eur:7410}},rules,{region:'vienna',width:100}),
];
bad.forEach(f=>assert.throws(f));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-alv-transition-'));
try{
 const specPath='werk-data/employee-alv-transition-model.json',resultPath='werk-data/employee-alv-transition-results.json';
 for(const p of [...Object.keys(out.source_hashes),'scripts/werk-alv-transition-contract.mjs',resultPath,'WERK_SV_STETIGE_BEITRAEGE.md']){
  fs.mkdirSync(path.dirname(path.join(tmp,p)),{recursive:true});fs.copyFileSync(p,path.join(tmp,p));
 }
 const run=()=>spawnSync(process.execPath,['scripts/werk-alv-transition-contract.mjs'],{cwd:tmp,encoding:'utf8'});
 assert.equal(run().status,0);
 for(const [file,mutate] of [
  [specPath,x=>x.rule_year_for_net=2027],
  [specPath,x=>x.sources[1].status='final'],
  [specPath,x=>x.sources[1].new_from_2027_01_01.rates[0]=.5],
  [specPath,x=>x.verified_budget_credit_eur=1],
  [specPath,x=>x.aggregate_annual_net_fiscal_cost_eur=1000],
  [specPath,x=>x.benefits_preserved=false],
  [specPath,x=>x.government_baseline_revenue_is_additional_werk_revenue=true],
  [resultPath,x=>x.rows[0].points[1].annual_contribution_loss_eur=null],
  [resultPath,x=>x.provisional_2027_contribution_only.pop()],
 ]){
  const original=fs.readFileSync(file,'utf8'),x=JSON.parse(original);mutate(x);
  fs.writeFileSync(path.join(tmp,file),JSON.stringify(x,null,2)+'\n');assert.notEqual(run().status,0);
  fs.writeFileSync(path.join(tmp,file),original);
 }
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`ALV transition counterchecks OK: ${increments} positive cent increments (minimum annual net gain ${minNetIncrease.toFixed(8)} EUR), independent endpoint interpolation and baseline/14-payment reconciliation; ${bad.length} invalid inputs and 9 corruptions.`);
