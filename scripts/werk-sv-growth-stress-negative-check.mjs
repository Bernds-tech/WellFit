import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {debtLinkedRelief} from './lib/werk-post-debt-sv.mjs';
let count=0;
const check=(name,fn)=>{try{fn();count++;}catch(e){throw Error(`${name}: ${e.message}`);}};
const close=(a,b,tol=.000003)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<tol,`${a} != ${b}`);
const args={debt:50,annualBase:10,ratePct:10,contributionBase:4};
const growth={contributionGrowthPct:10,baseRepaymentGrowthPct:0,yearsAfterDebtFree:10};
check('Zero growth preserves all existing constant-case annual values',()=>{
  const old=debtLinkedRelief(args),now=debtLinkedRelief({...args,growthStress:{...growth,contributionGrowthPct:0}});
  for(let i=0;i<old.annual_rows.length;i++)for(const [k,v] of Object.entries(old.annual_rows[i]))assert.equal(now.annual_rows[i][k],v,k);
});
check('Compound contribution growth begins in year two',()=>{
  const p=debtLinkedRelief({...args,growthStress:growth});
  close(p.annual_rows[0].reference_contributions_at_unchanged_rates_bn,4);
  close(p.annual_rows[2].reference_contributions_at_unchanged_rates_bn,4.84);
  close(p.annual_rows[1].realized_interest_saving_bn,1);
});
check('Post-debt target loss is detected despite earlier success',()=>{
  const p=debtLinkedRelief({...args,growthStress:growth});
  assert.equal(p.repayment_complete_year,5);assert.equal(p.target_reached_year,4);
  assert.equal(p.target_reached_by_debt_freedom,true);assert.equal(p.first_target_lost_year,11);
  assert.equal(p.first_year_previous_peak_rate_not_funded,11);
  assert.equal(p.target_funded_at_debt_freedom_and_through_observed_horizon,false);
  close(p.annual_rows[10].additional_financing_to_hold_previous_peak_rate_bn,4*1.1**10*.5-5);
});
check('Historical target hit is not target coverage at debt freedom',()=>{
  const p=debtLinkedRelief({...args,annualBase:1,contributionBase:.5,growthStress:growth});
  assert.ok(p.target_reached_year<p.repayment_complete_year);assert.ok(p.first_target_lost_year<p.repayment_complete_year);
  assert.equal(p.target_reached_by_debt_freedom,false);
});
check('Backward-minimum path holds affordable rates without future spending',()=>{
  const p=debtLinkedRelief({...args,growthStress:growth});
  close(p.maximum_durable_reduction_pct_at_debt_freedom_through_horizon,5/(4*1.1**14)*100);
  let previous=0;
  for(const r of p.annual_rows){assert.ok(r.fundable_nondecreasing_reduction_pct>=previous);previous=r.fundable_nondecreasing_reduction_pct;
    assert.ok(r.fundable_nondecreasing_net_cost_bn<=r.realized_interest_saving_bn+.000003);}
});
check('Funded growing repayments match independent geometric series',()=>{
  const p=debtLinkedRelief({...args,debt:525.2,annualBase:10,ratePct:2.5,growthStress:{...growth,baseRepaymentGrowthPct:2}});
  const n=Math.ceil(Math.log(1+525.2*.02/10)/Math.log(1.02));assert.equal(n,37);assert.equal(p.repayment_complete_year,n);
  close(p.annual_rows[n-1].base_repayment_bn,525.2-10*(1.02**(n-1)-1)/.02);
  close(p.annual_rows.reduce((sum,r)=>sum+r.base_repayment_bn,0),525.2,.00003);
});
check('Three-year lag cannot finance relief from future savings',()=>{
  const p=debtLinkedRelief({...args,lagYears:3,growthStress:growth});
  assert.ok(p.annual_rows.slice(0,3).every(r=>r.net_replacement_cost_bn===0));close(p.annual_rows[3].realized_interest_saving_bn,1);
});
check('Recapture reduces net cost, not gross insurance replacement',()=>{
  const p=debtLinkedRelief({...args,taxRecaptureShare:.3,growthStress:growth});
  const r=p.annual_rows[1];close(r.gross_contribution_relief_bn,1/.7);close(r.net_replacement_cost_bn,1);
  close(r.wage_tax_recapture_bn,1/.7-1);
});
check('Explicit zero rate never produces interest-funded relief',()=>{
  const p=debtLinkedRelief({...args,ratePct:0,growthStress:growth});assert.ok(p.annual_rows.every(r=>r.fundable_nondecreasing_reduction_pct===0));
});
check('Truncated horizon cannot be passed off as ten-year durability',()=>{
  const p=debtLinkedRelief({...args,maxYears:7,growthStress:growth});assert.equal(p.required_post_debt_horizon_observed,false);
  assert.equal(p.horizon_end_year,7);assert.equal(p.perpetual_financing_verified,false);
});
check('Unfinished debt horizon has no fabricated milestone',()=>{
  const p=debtLinkedRelief({...args,maxYears:2,growthStress:growth});assert.equal(p.repayment_complete_year,null);
  assert.equal(p.maximum_durable_reduction_pct_at_debt_freedom_through_horizon,null);
  assert.equal(p.target_reached_by_debt_freedom,null);
});
for(const change of [{contributionGrowthPct:null},{contributionGrowthPct:NaN},{contributionGrowthPct:-1},{contributionGrowthPct:11},
  {baseRepaymentGrowthPct:Infinity},{baseRepaymentGrowthPct:'2'},{yearsAfterDebtFree:1.5},{yearsAfterDebtFree:-1},{yearsAfterDebtFree:51}])
  check('Reject invalid growth or horizon '+JSON.stringify(change),()=>assert.throws(()=>debtLinkedRelief({...args,growthStress:{...growth,...change}})));
const out=JSON.parse(fs.readFileSync('werk-data/employee-sv-growth-stress-results.json','utf8'));
check('All 36 scenario paths conserve debt and allocated interest',()=>{
  assert.equal(out.paths.length,36);assert.equal(out.activation_allowed,false);assert.equal(out.current_budget_credit_bn,0);
  for(const p of out.paths){let paid=0;for(const r of p.annual_rows){paid+=r.base_repayment_bn+r.extra_repayment_bn;
    close(paid+r.remaining_debt_bn,p.inputs.debt,.00004);
    close(r.realized_interest_saving_bn,r.net_replacement_cost_bn+r.extra_repayment_bn+r.unallocated_interest_bn);
    close(r.realized_interest_saving_bn,r.fundable_nondecreasing_net_cost_bn+r.extra_repayment_bn+r.fundable_nondecreasing_unallocated_interest_bn);
    close(r.gross_contribution_relief_bn-r.wage_tax_recapture_bn,r.net_replacement_cost_bn);
  }}
});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-sv-growth-'));
try {
  const files=new Set([...Object.keys(out.source_sha256),'scripts/werk-sv-growth-stress-contract.mjs','scripts/lib/werk-payroll-2026.mjs']);
  for(const p of files){const dest=path.join(tmp,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(p,dest);}
  const run=()=>spawnSync(process.execPath,['scripts/werk-sv-growth-stress-contract.mjs','--write'],{cwd:tmp,encoding:'utf8'});
  check('Isolated clean source generation succeeds',()=>assert.equal(run().status,0));
  const file=path.join(tmp,'werk-data/employee-sv-growth-stress-model.json'),raw=fs.readFileSync(file,'utf8');
  for(const [name,mutate] of [
    ['Invented pure contribution total',s=>s.funding_boundary.verified_pure_employee_contribution_base_bn=31.95],
    ['Assumed recapture declared empirical',s=>s.funding_boundary.empirical_tax_recapture_share=.3],
    ['Future base declared funded',s=>s.funding_boundary.funded_base_repayment_verified=true],
    ['Perpetual coverage from finite horizon',s=>s.funding_boundary.perpetual_financing_verified=true],
    ['Premature budget credit',s=>s.funding_boundary.current_budget_credit_bn=1],
    ['Missing post-debt review',s=>s.inputs.years_after_debt_freedom=0]
  ]){const s=JSON.parse(raw);mutate(s);fs.writeFileSync(file,JSON.stringify(s));check(name,()=>assert.notEqual(run().status,0));fs.writeFileSync(file,raw);}
} finally {fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`SV growth countercheck OK: ${count} independent numerical, regression and negative cases.`);
