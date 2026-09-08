import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {intervalCostBound,costIntervalTable,requestedIntervals} from './lib/werk-alv-interval-cost.mjs';
const out=JSON.parse(fs.readFileSync('werk-data/employee-alv-interval-results.json'));
const schedules=[{thresholds:[2225,2427,2630],rates:[0,1,2,2.95]},
 {thresholds:[2327,2539,2751],rates:[.5,1.5,2.5,2.95]},
 {thresholds:[2327,2539],rates:[1,2,2.95]}];
const p={unit:'eligible_separate_payment_records',reference:'conditional_scenario',scope:'standard_employee_same_rate_and_charge_base_employee_bears_dn',payment_kind:'ordinary',count:1000,lower_eur:2230,upper_eur:2250,base_sum_eur:null};
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,`${a} != ${b}`);
// Independent construction: interpolate the candidate CONTRIBUTION AMOUNT
// between the old amount at t and the new amount at t+w, subtract from baseline.
function oracle(s,w,share,g){
 const b=s.thresholds.filter(t=>g>t).length,t=s.thresholds[b-1];
 if(!b||g>=t+w)return 0;
 const u=(g-t)/w,candidate=(1-u)*t*s.rates[b-1]/100+u*(t+w)*s.rates[b]/100;
 return (g*s.rates[b]/100-candidate)*(1-share);
}
let centsChecked=0,intervalsChecked=0;
for(const s of schedules)for(const w of [50,100,150])for(const share of [0,.5]){
 const bands=requestedIntervals(s,w);
 assert.equal(bands[0].lower_eur,1500);assert.equal(bands.at(-1).upper_eur,3500);
 let last=149999;
 for(const b of bands){
  const lo=Math.round(b.lower_eur*100),hi=Math.round(b.upper_eur*100);assert.equal(lo,last+1);last=hi;
  let low=Infinity,high=-Infinity;
  for(let c=lo;c<=hi;c++){const v=oracle(s,w,share,c/100);low=Math.min(low,v);high=Math.max(high,v);centsChecked++;}
  const r=intervalCostBound(s,w,share,{...p,...b,count:1});near(r.lower_eur,low);near(r.upper_eur,high);
  const sum=intervalCostBound(s,w,share,{...p,...b,count:2,base_sum_eur:Math.round((b.lower_eur+b.upper_eur)*100)/100});
  near(sum.exact_model_cost_eur,oracle(s,w,share,b.lower_eur)+oracle(s,w,share,b.upper_eur));intervalsChecked++;
 }
 // A deliberately crossing interval: endpoints alone miss its interior peak.
 for(const t of s.thresholds){
  const cross=intervalCostBound(s,w,share,{...p,lower_eur:t,upper_eur:t+w,count:1});
  near(cross.lower_eur,0);near(cross.upper_eur,oracle(s,w,share,t+.01));
 }
}
const a=intervalCostBound(schedules[0],100,0,p);near(a.lower_eur,16687.5);near(a.upper_eur,21137.5);
const exact=intervalCostBound(schedules[0],100,0,{...p,base_sum_eur:2240000});near(exact.exact_model_cost_eur,18912.5);
near(intervalCostBound(schedules[0],100,.5,{...p,base_sum_eur:2240000}).exact_model_cost_eur,9456.25);
const cross=intervalCostBound(schedules[0],100,0,{...p,lower_eur:2225,upper_eur:2275,base_sum_eur:2250000});
assert.equal(cross.base_sum_used,false);assert.equal(cross.exact_model_cost_eur,null);assert.ok(cross.sum_limitation);
near(oracle(schedules[0],100,0,2250)*2,33.375);near(oracle(schedules[0],100,0,2225)+oracle(schedules[0],100,0,2275),11.125);
near(intervalCostBound(schedules[0],100,0,{...p,count:0,base_sum_eur:0}).exact_model_cost_eur,0);
for(const x of out.examples){
 const r=x.result,q=r.exact_rational_eur,lo=BigInt(q.lower_numerator)*100n,hi=BigInt(q.upper_numerator)*100n,d=BigInt(q.denominator);
 assert.ok(BigInt(r.lower_cent_outward)*d<=lo);assert.ok(BigInt(r.upper_cent_outward)*d>=hi);
 assert.ok((BigInt(r.lower_cent_outward)+1n)*d>lo);assert.ok((BigInt(r.upper_cent_outward)-1n)*d<hi||hi===0n);
 assert.equal(r.national_cost_eur,null);assert.equal(r.employee_net_eur,null);
}
for(const [index,s] of schedules.entries())for(const w of [50,100,150])for(const share of [0,.5]){
 const id=['2026','2027_existing_provisional','2027_new_provisional'][index];
 const ex=out.table_examples.find(e=>e.schedule_id===id&&e.width_eur===w&&e.reduction_share===share);
 const expected=ex.input.rows.reduce((v,b)=>v+oracle(s,w,share,b.lower_eur)+oracle(s,w,share,b.upper_eur),0);
 near(ex.result.exact_model_cost_eur,expected);assert.equal(ex.result.payment_records,ex.input.rows.length*2);
}
const table={...p,expected_payment_records:1000,rows:[{lower_eur:2230,upper_eur:2250,count:1000,base_sum_eur:null}]};
const badRows=[{count:null},{count:NaN},{count:Infinity},{count:-1},{count:.1},{count:'1000'},
 {lower_eur:1499.99},{upper_eur:3500.01},{lower_eur:2251},{lower_eur:2230.001},{lower_eur:null},
 {base_sum_eur:undefined},{base_sum_eur:2230000-.01},{base_sum_eur:2250000+.01},{base_sum_eur:2240000.001},
 {unit:'persons'},{reference:'observed_2024'},{scope:'altersteilzeit'},{scope:'employer_bears_dn'},{payment_kind:'bank_transfer'},{count:0,base_sum_eur:1}];
const invalid=badRows.map(b=>()=>intervalCostBound(schedules[0],100,0,{...p,...b}));
invalid.push(()=>intervalCostBound(schedules[0],100,.2,p),()=>intervalCostBound(schedules[0],0,0,p),
 ()=>costIntervalTable(schedules[0],100,0,{...table,expected_payment_records:999}),
 ()=>costIntervalTable(schedules[0],100,0,{...table,rows:[table.rows[0],table.rows[0]],expected_payment_records:2000}),
 ()=>costIntervalTable(schedules[0],100,0,{...table,rows:[]}),
 ()=>intervalCostBound(schedules[0],100,0,{...p,count:Number.MAX_SAFE_INTEGER}));
invalid.forEach(f=>assert.throws(f));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-alv-interval-'));
let mutations=0;
try{
 const result='werk-data/employee-alv-interval-results.json',spec='werk-data/employee-alv-interval-spec.json';
 for(const file of [...Object.keys(out.source_hashes),'scripts/werk-alv-interval-contract.mjs','scripts/lib/werk-payroll-2026.mjs','scripts/lib/werk-annual-assessment-2026.mjs','scripts/lib/werk-calculation.mjs',result,'WERK_SV_INTERVALLKOSTEN.md']){
  fs.mkdirSync(path.dirname(path.join(tmp,file)),{recursive:true});fs.copyFileSync(file,path.join(tmp,file));
 }
 const run=()=>spawnSync(process.execPath,['scripts/werk-alv-interval-contract.mjs'],{cwd:tmp,encoding:'utf8'});assert.equal(run().status,0);
 for(const [file,mutate] of [[spec,x=>x.actual_eligible_payment_records=1000],[spec,x=>x.standard_scope='all_employees'],[spec,x=>x.verified_budget_credit_eur=1],
 [result,x=>x.examples[0].result.upper_cent_outward-=1],[result,x=>x.examples[2].result.exact_model_cost_eur=null],
 [result,x=>x.national_annual_gross_cost_eur=18912.5],[result,x=>x.requested_partitions[0].bands[0].upper_eur+=.01],
 [result,x=>x.table_examples[0].result.payment_records+=1]]){
  const original=fs.readFileSync(file,'utf8'),x=JSON.parse(original);mutate(x);fs.writeFileSync(path.join(tmp,file),JSON.stringify(x,null,2)+'\n');assert.notEqual(run().status,0);fs.writeFileSync(path.join(tmp,file),original);mutations++;
 }
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`ALV interval counterchecks OK: ${centsChecked} independently interpolated cent payments, ${intervalsChecked} exhaustive interval extrema/sums, 18 aggregate reconciliations; ${invalid.length} invalid inputs and ${mutations} corruptions rejected.`);
