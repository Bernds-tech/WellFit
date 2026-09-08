import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {paymentCostBound,annualContributionExample} from './lib/werk-alv-cost-bounds.mjs';
import {contributionCalculator} from './lib/werk-alv-transition.mjs';
const out=JSON.parse(fs.readFileSync('werk-data/employee-alv-cost-bounds.json'));
const schedules=[{thresholds:[2225,2427,2630],rates:[0,1,2,2.95]},
 {thresholds:[2327,2539,2751],rates:[.5,1.5,2.5,2.95]},
 {thresholds:[2327,2539],rates:[1,2,2.95]}];
const p={unit:'eligible_separate_payment_records',reference:'conditional_scenario',count:1};
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,`${a} != ${b}`);
// Independent exhaustive cent search confirms both the upper bound and attainability.
let checked=0;
for(const [index,s] of schedules.entries())for(const width of [50,100,150])for(const share of [0,.5]){
 const bound=paymentCostBound(s,width,share,p),calc=contributionCalculator({...s,width,reductionShare:share});
 let max=0;
 for(let cents=150000;cents<=350000;cents++){
  const loss=calc(cents/100).contribution_loss_eur;
  assert.ok(loss>=-1e-8&&loss<=bound.upper_eur+1e-8);max=Math.max(max,loss);checked++;
 }
 near(max,bound.upper_eur);near(calc(3500).contribution_loss_eur,0);
 if(width===100)near(max,[24.9825015,25.387461,24.11808795][index]*(1-share));
 near(paymentCostBound(s,width,share,{...p,count:14000}).upper_eur,max*14000);
 near(paymentCostBound(s,width,share,{...p,count:0}).upper_eur,0);
}
for(const x of out.non_identification_examples){
 near(x.fixed.annual_gross_eur,x.variable.annual_gross_eur);
 assert.equal(x.fixed.insurance_days,x.variable.insurance_days);
 assert.equal(x.fixed.annual_net_eur,null);assert.equal(x.variable.annual_net_eur,null);
 near(x.fixed.annual_statutory_alv_eur-x.fixed.annual_candidate_alv_eur,x.fixed.annual_smoothing_contribution_loss_eur);
 near(x.variable.annual_statutory_alv_eur-x.variable.annual_candidate_alv_eur,x.variable.annual_smoothing_contribution_loss_eur);
}
const example=out.non_identification_examples.find(x=>x.threshold_eur===2225&&x.width_eur===100&&x.reduction_share===0);
near(example.fixed.annual_gross_eur,31500);near(example.fixed.normalized_monthly_income_eur,2625);
near(example.fixed.annual_smoothing_contribution_loss_eur,233.625);near(example.variable.annual_smoothing_contribution_loss_eur,66.75);
const invalid=[
 ()=>paymentCostBound(schedules[0],100,0,{...p,count:null}),
 ()=>paymentCostBound(schedules[0],100,0,{...p,count:-1}),
 ()=>paymentCostBound(schedules[0],100,0,{...p,count:1.1}),
 ()=>paymentCostBound(schedules[0],100,0,{...p,count:Infinity}),
 ()=>paymentCostBound(schedules[0],100,0,{...p,unit:'persons'}),
 ()=>paymentCostBound(schedules[0],100,0,{...p,unit:'person_annual_contributions_normalized_to_30_insurance_days'}),
 ()=>paymentCostBound(schedules[0],100,0,{...p,reference:'observed_2024'}),
 ()=>annualContributionExample(schedules[0],100,0,[2250],[2250,2250]),
 ()=>annualContributionExample(schedules[0],100,0,Array(12).fill(2250),[2250,2250],365),
 ()=>annualContributionExample(schedules[0],100,0,Array(12).fill(2250.001),[2250,2250]),
];invalid.forEach(f=>assert.throws(f));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-alv-cost-'));
try{
 const result='werk-data/employee-alv-cost-bounds.json',data='werk-data/employee-contribution-distribution-2024.json';
 for(const file of [...Object.keys(out.source_hashes),'scripts/werk-alv-cost-bounds-contract.mjs','scripts/lib/werk-payroll-2026.mjs','scripts/lib/werk-annual-assessment-2026.mjs','scripts/lib/werk-calculation.mjs',result,'WERK_SV_VERTEILUNG_KOSTENGRENZEN.md']){
  fs.mkdirSync(path.dirname(path.join(tmp,file)),{recursive:true});fs.copyFileSync(file,path.join(tmp,file));
 }
 const run=()=>spawnSync(process.execPath,['scripts/werk-alv-cost-bounds-contract.mjs'],{cwd:tmp,encoding:'utf8'});
 assert.equal(run().status,0);
 for(const [file,mutate] of [[data,x=>x.actual_monthly_payment_distribution=true],[data,x=>x.person_count=1000],
  [data,x=>x.national_transition_cost_identified=true],[result,x=>x.national_annual_gross_cost_eur=349755.021],
  [result,x=>x.bounds[0].scaled_bounds[0].upper_eur=null],[result,x=>x.non_identification_examples[0].variable.annual_net_eur=20000]]){
  const original=fs.readFileSync(file,'utf8'),x=JSON.parse(original);mutate(x);fs.writeFileSync(path.join(tmp,file),JSON.stringify(x,null,2)+'\n');assert.notEqual(run().status,0);fs.writeFileSync(path.join(tmp,file),original);
 }
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`ALV bound counterchecks OK: ${checked} enumerated cent payments, sharp upper/lower bounds and independently pinned equal-income costs; ${invalid.length} invalid inputs, 6 corruptions.`);
