import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {employeeRelief,postDebtCapacity,replacementCost,debtLinkedRelief} from './lib/werk-post-debt-sv.mjs';
const kernel=JSON.parse(fs.readFileSync('werk-data/payroll-employee-kernel-2026.json','utf8'));
const original=JSON.stringify(kernel);let count=0;
const check=(label,fn)=>{try{fn();count++;}catch(e){throw Error(label+': '+e.message);}};
const close=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
check('Independent 3000 gross anchor',()=>{
  const r=employeeRelief(kernel,{monthlyGross:3000});
  // 17.07% removed, 1% AK/WF remains; taxable running pay 2970.
  close(r.after.runningSvMonthly,30);close(r.after.runningWageTaxMonthly,437.45);
  close(r.ordinary_month_net_after_eur,2532.55);close(r.ordinary_month_net_after_eur-r.ordinary_month_net_before_eur,358.47);
  close(r.removed_annual_contributions_eur,7169.4);close(r.annual_net_gain_eur,5264.388);
});
check('Low earnings reduced AV preserved in baseline',()=>{
  const r=employeeRelief(kernel,{monthlyGross:2000});close(r.removed_annual_contributions_eur,3953.6);
});
check('Contribution ceilings are respected',()=>{
  const r=employeeRelief(kernel,{monthlyGross:10000});close(r.removed_annual_contributions_eur,16561.314);
});
check('Zero reform produces identical wages',()=>{const r=employeeRelief(kernel,{monthlyGross:3000,reductionShare:0});close(r.annual_net_gain_eur,0);assert.deepEqual(r.before,r.after);});
check('Vienna levies remain separately payable',()=>{const r=employeeRelief(kernel,{monthlyGross:3000,region:'vienna'});close(r.after.runningSvMonthly,37.5);});
check('Source kernel is never mutated',()=>assert.equal(JSON.stringify(kernel),original));
check('Fiscal identity under all relief stages',()=>{
  for(const share of [0,0.25,0.5,1]){const r=employeeRelief(kernel,{monthlyGross:4000,reductionShare:share});close(r.annual_net_gain_eur,r.removed_annual_contributions_eur-r.extra_annual_withheld_tax_eur);}
});
for(const args of [{monthlyGross:null},{monthlyGross:0},{monthlyGross:11000},{monthlyGross:3000,reductionShare:1.1},{monthlyGross:3000,reductionShare:NaN},{monthlyGross:3000,region:'unknown'}])check('Reject unreviewed payroll '+JSON.stringify(args),()=>assert.throws(()=>employeeRelief(kernel,args)));
check('Post-debt surplus and reserve arithmetic',()=>{
  const r=postDebtCapacity({startingDebt:525.2,baseRepayment:10,ratePct:2.5,reserveShare:.2});close(r.conditional_primary_surplus_bn,23.13);close(r.available_bn,18.504);
  close(replacementCost({grossLoss:30,taxRecaptureShare:.3}),21);
});
check('No saved interest at zero rate',()=>close(postDebtCapacity({startingDebt:525.2,baseRepayment:10,ratePct:0}).available_bn,10));
for(const args of [{startingDebt:null,baseRepayment:10,ratePct:2.5},{startingDebt:525,baseRepayment:10,ratePct:2.5,reserveShare:1.1}])check('Reject invalid capacity',()=>assert.throws(()=>postDebtCapacity(args)));
for(const args of [{grossLoss:30,taxRecaptureShare:1},{grossLoss:30,taxRecaptureShare:NaN},{grossLoss:-1,taxRecaptureShare:.3},{grossLoss:30,taxRecaptureShare:.3,runningCost:-1}])check('Reject invalid replacement cost',()=>assert.throws(()=>replacementCost(args)));
const out=JSON.parse(fs.readFileSync('werk-data/post-debt-employee-sv-results.json','utf8'));
check('No invented aggregate or activation',()=>{assert.equal(out.pure_employee_kv_pv_alv_total_bn,null);assert.equal(out.verified_reform_cost_bn,null);assert.equal(out.activation_year,null);close(out.broad_withholding_reference_bn,31.952625);});
check('Progressive target replaces post-debt fixed volume',()=>{close(out.progressive_target.employee_core_reduction_share,.5);assert.equal(out.progressive_target.verified_gross_cost_bn,null);assert.equal(out.progressive_target.target_financing_proven,false);});
check('Independent linked-path timing and single use',()=>{
 const p=debtLinkedRelief({debt:50,annualBase:10,ratePct:10,contributionBase:20});
 assert.equal(p.repayment_complete_year,5);close(p.annual_rows[0].realized_interest_saving_bn,0);close(p.annual_rows[1].realized_interest_saving_bn,1);close(p.annual_rows[4].gross_contribution_relief_bn,4);close(p.annual_rows[5].gross_contribution_relief_bn,5);close(p.annual_rows[4].cumulative_net_relief_cost_bn,10);
 assert.equal(p.target_reached_by_debt_freedom,false);close(p.target_financing_shortfall_after_full_interest_effect_bn,5);
});
check('Lag prevents spending future interest',()=>{const p=debtLinkedRelief({debt:50,annualBase:10,ratePct:10,contributionBase:20,lagYears:3});close(p.annual_rows[2].gross_contribution_relief_bn,0);close(p.annual_rows[3].gross_contribution_relief_bn,1);});
check('Reinvestment and relief are competing alternatives',()=>{
 const a={debt:525.2,annualBase:10,ratePct:2.5,contributionBase:31.952625};
 assert.equal(debtLinkedRelief({...a,interestToReliefShare:0}).repayment_complete_year,34);
 assert.equal(debtLinkedRelief({...a,interestToReliefShare:.5}).repayment_complete_year,41);
 assert.equal(debtLinkedRelief(a).repayment_complete_year,53);
 const r=debtLinkedRelief({...a,taxRecaptureShare:.3});assert.equal(r.target_reached_year,46);assert.equal(r.target_reached_by_debt_freedom,true);
});
check('Relief cap reserves excess interest and protects base',()=>{const p=debtLinkedRelief({debt:50,annualBase:10,ratePct:10,contributionBase:2});close(p.annual_rows[2].gross_contribution_relief_bn,1);close(p.annual_rows[2].unallocated_interest_bn,1);assert.equal(p.repayment_complete_year,5);});
check('Zero interest means no interest-funded relief',()=>{const p=debtLinkedRelief({debt:50,annualBase:10,ratePct:0,contributionBase:20});assert.ok(p.annual_rows.every(r=>r.gross_contribution_relief_bn===0));assert.equal(p.target_reached_year,null);});
check('No fabricated debt-free milestone outside horizon',()=>{const p=debtLinkedRelief({debt:50,annualBase:10,ratePct:10,contributionBase:20,maxYears:2});assert.equal(p.repayment_complete_year,null);assert.equal(p.target_reached_by_debt_freedom,null);});
for(const change of [{debt:null},{annualBase:0},{contributionBase:0},{ratePct:NaN},{interestToReliefShare:1.1},{taxRecaptureShare:1},{lagYears:0},{lagYears:1.5},{reductionTarget:1.1}])check('Reject unsafe linked input '+JSON.stringify(change),()=>assert.throws(()=>debtLinkedRelief({debt:50,annualBase:10,ratePct:10,contributionBase:20,...change})));
check('All generated annual allocations reconcile',()=>{for(const p of out.progressive_target.linked_debt_paths)for(const r of p.annual_rows){close(r.realized_interest_saving_bn,r.net_replacement_cost_bn+r.extra_repayment_bn+r.unallocated_interest_bn,.000003);close(r.gross_contribution_relief_bn-r.wage_tax_recapture_bn,r.net_replacement_cost_bn,.000003);assert.ok(r.modeled_contribution_reduction_pct<=50.000001);}});
check('Existing receipts cannot be booked twice',()=>{const r=out.existing_receipts_redirection;close(r.illustrative_redirected_existing_receipts_bn+r.displaced_recipient_receipts_bn,0);close(r.additional_external_revenue_bn,0);close(r.additional_debt_repayment_capacity_bn,0);});
check('19-bracket source total preserved',()=>{const s=JSON.parse(fs.readFileSync('werk-data/employee-payroll-withholding-2024.json','utf8'));assert.equal(s.brackets.length,19);assert.equal(s.totals.persons,4918470);assert.equal(s.totals.withheld_contributions_and_levies_thousand_eur,31952625);});
check('Work comparison is annual, not regular-month versus year',()=>{
  const r=out.work_nonwork_sensitivities.find(x=>x.monthly_gross_eur===3000&&x.assumed_nonwork_monthly_cash_eur===1500&&x.work_cost_and_lost_transfers_eur===300);
  close(r.current_monthly_work_advantage_eur,766.95,.011);close(r.reformed_monthly_work_advantage_eur,986.30,.011);assert.equal(r.actual_ams_entitlement_eur,null);
});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-sv-negative-'));
try{
  const paths=[...Object.keys(out.source_sha256),'scripts/werk-post-debt-sv-contract.mjs','scripts/lib/werk-post-debt-sv.mjs','scripts/lib/werk-annual-assessment-2026.mjs','scripts/lib/werk-payroll-2026.mjs','scripts/lib/werk-calculation.mjs'];
  for(const p of paths){const dest=path.join(tmp,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(p,dest);}
  const run=()=>spawnSync(process.execPath,['scripts/werk-post-debt-sv-contract.mjs','--write'],{cwd:tmp,encoding:'utf8'});
  check('Clean isolated generation',()=>assert.equal(run().status,0));
  const p=path.join(tmp,'werk-data/post-debt-employee-sv-model.json'),raw=fs.readFileSync(p,'utf8');
  for(const [label,mutate] of [
    ['Changed target without owner decision',s=>s.progressive_target.employee_core_reduction_share=1],
    ['Double use of interest',s=>s.progressive_target.same_interest_euro_may_fund_both_relief_and_extra_repayment=true],
    ['Double-booked existing contributions',s=>s.existing_receipts_accounting.redirection_creates_additional_revenue=true],
    ['Invented repayment from redirection',s=>s.existing_receipts_accounting.verified_additional_debt_repayment_bn=31.96],
    ['Premature activation',s=>s.activation.currently_active=true],
    ['Unfunded base repayment',s=>s.activation.requires_funded_base_debt_repayment=false],
    ['Spending unrealized interest',s=>s.activation.requires_realized_recurring_interest_savings=false],
    ['Unsupported target coverage',s=>s.progressive_target.end_target_financing_proven=true],
    ['Fake funded cost',s=>s.funding_gate.verified_annual_replacement_cost_bn=1],
    ['Invalid 55 percent claim',s=>s.official_unemployment_rules.basic_replacement_pct=100],
    ['Unsupported equal-pay generalisation',s=>s.official_unemployment_rules.same_pay_as_work_general_claim_verified=true],
    ['Unverified employment booking',s=>s.funding_gate.employment_effect_persons=1]
  ]){const d=JSON.parse(raw);mutate(d);fs.writeFileSync(p,JSON.stringify(d));check(label,()=>assert.notEqual(run().status,0));fs.writeFileSync(p,raw);}
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`SV-01 countercheck OK: ${count} independent numerical and negative cases.`);
