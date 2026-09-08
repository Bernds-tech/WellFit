import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fundingBridge,surplusForDebtReduction} from './lib/werk-sv-funding-bridge.mjs';
const out=JSON.parse(fs.readFileSync('werk-data/employee-sv-funding-bridge-results.json'));
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-7,`${a} != ${b}`);
// Countercheck from the PRIMARY balance side, rather than the contract's signed
// total balance equation. Reconstruct funded primary balance and debt movement.
for(const c of out.cases){
 const p=c.input,r=c.result,primary=p.balance_bn+p.interest_bn;
 const requiredPrimary=p.target_surplus_bn+p.interest_bn-p.avoided_interest_bn+p.relief_cost_bn;
 near(r.required_additional_primary_improvement_bn,Math.max(0,requiredPrimary-primary));
 near(r.achieved_balance_bn,primary+r.required_additional_primary_improvement_bn-p.relief_cost_bn-(p.interest_bn-p.avoided_interest_bn));
 near(r.debt_change_with_held_adjustment_bn,p.deficit_debt_adjustment_bn-r.achieved_balance_bn);
 assert.ok(r.achieved_balance_bn>=p.target_surplus_bn-1e-8);assert.equal(r.verified_budget_credit_bn,0);
 if(c.avoided_interest_share===1)assert.equal(p.target_surplus_bn,0);
}
const get=(year,cut,save,recapture,target)=>out.cases.find(c=>c.reference_year===year&&c.core_reduction_share===cut&&c.avoided_interest_share===save&&c.assumed_tax_recapture_share===recapture&&c.input.target_surplus_bn===target).result.required_additional_primary_improvement_bn;
for(const [args,value] of [[[2026,0,0,0,0],22.2],[[2026,0,0,0,10],32.2],[[2026,.5,0,0,10],47],[[2026,.5,1,0,0],27.6],[[2031,.5,1,0,0],17.4],[[2031,.5,1,.3,0],12.96]])near(get(...args),value);
near(out.official_debt_flow_totals.forecast_deficits_bn+out.official_debt_flow_totals.forecast_debt_adjustments_bn,out.official_debt_flow_totals.forecast_debt_increase_bn);
assert.equal(out.official_reconciliation.find(r=>r.year===2025).debt_identity_residual_bn,-.1);
assert.equal(out.official_reconciliation.find(r=>r.year===2025).adjustment_component_residual_bn,.1);
assert.equal(out.official_reconciliation.find(r=>r.year===2030).published_primary_residual_bn,-.1);
near(surplusForDebtReduction(10,2),12);near(surplusForDebtReduction(10,-2),8);near(surplusForDebtReduction(10,-20),0);
const p={balance_bn:-22.2,interest_bn:9.4,avoided_interest_bn:0,relief_cost_bn:14.8,target_surplus_bn:10,deficit_debt_adjustment_bn:0};
near(fundingBridge({...p,balance_bn:30}).required_additional_primary_improvement_bn,0);
const invalid=[...['balance_bn','interest_bn','avoided_interest_bn','relief_cost_bn','target_surplus_bn','deficit_debt_adjustment_bn'].map(k=>()=>fundingBridge({...p,[k]:null})),
 ()=>fundingBridge({...p,balance_bn:NaN}),()=>fundingBridge({...p,interest_bn:Infinity}),()=>fundingBridge({...p,avoided_interest_bn:9.41}),
 ()=>fundingBridge({...p,interest_bn:-1}),()=>fundingBridge({...p,avoided_interest_bn:-1}),()=>fundingBridge({...p,relief_cost_bn:-1}),
 ()=>fundingBridge({...p,target_surplus_bn:-1}),()=>surplusForDebtReduction(null,0),()=>surplusForDebtReduction(10,NaN)];
invalid.forEach(f=>assert.throws(f));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-funding-bridge-'));
let count=0;
try{
 const result='werk-data/employee-sv-funding-bridge-results.json',source='werk-data/debt-flow-reconciliation-2026-2031.json';
 for(const f of [...Object.keys(out.source_hashes),'scripts/werk-sv-funding-bridge-contract.mjs',result,'WERK_SV_FINANZIERUNGSBRUECKE.md']){fs.mkdirSync(path.dirname(path.join(tmp,f)),{recursive:true});fs.copyFileSync(f,path.join(tmp,f));}
 const run=()=>spawnSync(process.execPath,['scripts/werk-sv-funding-bridge-contract.mjs'],{cwd:tmp,encoding:'utf8'});assert.equal(run().status,0);
 for(const [file,mutate] of [[source,x=>x.series.deficit_debt_adjustment_bn[1]=2.1],[source,x=>x.series.statistical_accrual_adjustment_bn[0]=1.6],
 [source,x=>x.actual_avoided_interest_bn=9.4],[source,x=>x.reform_adjustments_identified=true],
 [result,x=>x.cases[0].result.required_additional_primary_improvement_bn=0],[result,x=>x.verified_budget_credit_bn=14.8],
 [result,x=>x.official_reconciliation[0].adjustment_component_residual_bn=0]]){
  const original=fs.readFileSync(file,'utf8'),x=JSON.parse(original);mutate(x);fs.writeFileSync(path.join(tmp,file),JSON.stringify(x,null,2)+'\n');assert.notEqual(run().status,0);fs.writeFileSync(path.join(tmp,file),original);count++;
 }
 const pdf='werk-data/sources/bmf-budget-beschluss-2027-2028.pdf';fs.appendFileSync(path.join(tmp,pdf),'corruption');assert.notEqual(run().status,0);count++;
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`SV funding counterchecks OK: 336 primary-side identities, 6 independent amounts, debt/rounding boundaries; ${invalid.length} invalid inputs and ${count} corruptions rejected.`);
