import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {thresholdCalculator,recoveryGross} from './lib/werk-alv-threshold.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const kernel=read('werk-data/payroll-employee-kernel-2026.json'),rules=read('werk-data/payroll-annual-assessment-2026.json');
const out=read('werk-data/employee-alv-threshold-results-2026.json');
// Independently pin externally reviewed gross thresholds and explicit contribution jumps.
for(const [i,threshold] of [2225,2427,2630].entries())for(const share of [0,.5]){
 const calc=thresholdCalculator(kernel,rules,{region:'outside_vienna',reductionShare:share});
 const a=calc(threshold),b=calc(threshold+.01),rates=[0,1,2,2.95];
 const expected=((14*(3.87+10.25+rates[i+1])*(1-share)+12)*.01+14*threshold*(rates[i+1]-rates[i])*(1-share))/100;
 assert.ok(Math.abs(b.annual_contributions_eur-a.annual_contributions_eur-expected)<1e-7);
 const row=out.rows.find(r=>r.region==='outside_vienna'&&r.employee_core_reduction_share===share&&r.threshold_monthly_gross_eur===threshold);
 assert.equal(row.recovery_monthly_gross_eur,(share===0?[2251.47,2456.22,2660.43]:[2237.14,2440.32,2643.78])[i]);
 // Brute-force first restoring cent is independent of production binary search.
 let cents=Math.round(threshold*100)+1;
 while(calc(cents/100).annual_net_eur<a.annual_net_eur)cents++;
 assert.equal(cents/100,row.recovery_monthly_gross_eur);
}
for(const row of out.rows){
 assert.ok(row.annual_net_loss_for_one_cent_raise_eur>0);
 assert.ok(row.steps.at(-1).annual_net_change_eur>0);
 assert.equal(row.steps[0].annual_gross_increase_eur,.14);
}
const invalid=[
 ()=>thresholdCalculator(kernel,rules,{region:'other',reductionShare:0}),
 ()=>thresholdCalculator(kernel,rules,{region:'vienna',reductionShare:NaN}),
 ()=>thresholdCalculator(kernel,rules,{region:'vienna',reductionShare:.51}),
 ()=>recoveryGross(()=>({annual_net_eur:NaN}),2225,2427),
 ()=>recoveryGross(x=>({annual_net_eur:-x}),2225,2427),
 ()=>recoveryGross(x=>({annual_net_eur:x}),2427,2225),
];
invalid.forEach(f=>assert.throws(f));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-alv-threshold-'));
try{
 const files=[...Object.keys(out.source_hashes),'scripts/lib/werk-calculation.mjs','scripts/werk-alv-threshold-contract.mjs',
  'werk-data/employee-alv-threshold-results-2026.json','WERK_SV_ARBEITSANREIZE.md'];
 for(const p of files){fs.mkdirSync(path.dirname(path.join(tmp,p)),{recursive:true});fs.copyFileSync(p,path.join(tmp,p));}
 const specPath='werk-data/employee-alv-threshold-model-2026.json',resultPath='werk-data/employee-alv-threshold-results-2026.json';
 const run=()=>spawnSync(process.execPath,['scripts/werk-alv-threshold-contract.mjs'],{cwd:tmp,encoding:'utf8'});
 assert.equal(run().status,0);
 for(const [file,mutate] of [
  [specPath,x=>x.rule_year=2027],
  [specPath,x=>x.actual_employee_alv_receipts_eur=4686000000],
  [specPath,x=>x.verified_budget_credit_eur=1],
  [resultPath,x=>x.rows[0].recovery_monthly_gross_eur-=.01],
  [resultPath,x=>x.rows[0].annual_net_loss_for_one_cent_raise_eur=null],
 ]){
  const original=fs.readFileSync(file,'utf8'),x=JSON.parse(original);mutate(x);
  fs.writeFileSync(path.join(tmp,file),JSON.stringify(x,null,2)+'\n');assert.notEqual(run().status,0);
  fs.writeFileSync(path.join(tmp,file),original);
 }
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log('ALV counterchecks OK: 6 independent contribution jumps and linear recovery scans, 24 gain checks, 6 invalid inputs and 5 corruptions.');
