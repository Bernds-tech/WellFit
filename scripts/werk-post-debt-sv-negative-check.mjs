import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {employeeRelief,postDebtCapacity,replacementCost} from './lib/werk-post-debt-sv.mjs';
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
check('First stage volume is not an individual 50 percent cut',()=>{close(out.first_stage.annual_gross_relief_target_bn,15.5);assert.equal(out.first_stage.individual_reduction_share,null);assert.equal(out.first_stage.full_abolition_is_current_program_target,false);const a=out.first_stage.financing_sensitivities.find(x=>x.tax_recapture_share===0);close(a.cumulative_net_need_bn[10],155);const b=out.first_stage.financing_sensitivities.find(x=>x.tax_recapture_share===.3);close(b.net_replacement_need_bn,10.85);close(b.cumulative_net_need_bn[5],54.25);});
check('Existing receipts cannot be booked twice',()=>{const r=out.existing_receipts_redirection;close(r.illustrative_redirected_existing_receipts_bn+r.displaced_recipient_receipts_bn,0);close(r.additional_external_revenue_bn,0);close(r.additional_debt_repayment_capacity_bn,0);});
check('19-bracket source total preserved',()=>{const s=JSON.parse(fs.readFileSync('werk-data/employee-payroll-withholding-2024.json','utf8'));assert.equal(s.brackets.length,19);assert.equal(s.totals.persons,4918470);assert.equal(s.totals.withheld_contributions_and_levies_thousand_eur,31952625);});
check('Work comparison is annual, not regular-month versus year',()=>{
  const r=out.work_nonwork_sensitivities.find(x=>x.monthly_gross_eur===3000&&x.assumed_nonwork_monthly_cash_eur===1500&&x.work_cost_and_lost_transfers_eur===300);
  close(r.current_monthly_work_advantage_eur,766.95,.011);close(r.reformed_monthly_work_advantage_eur,1205.65,.011);assert.equal(r.actual_ams_entitlement_eur,null);
});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-sv-negative-'));
try{
  const paths=[...Object.keys(out.source_sha256),'scripts/werk-post-debt-sv-contract.mjs','scripts/lib/werk-post-debt-sv.mjs','scripts/lib/werk-payroll-2026.mjs','scripts/lib/werk-calculation.mjs'];
  for(const p of paths){const dest=path.join(tmp,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(p,dest);}
  const run=()=>spawnSync(process.execPath,['scripts/werk-post-debt-sv-contract.mjs','--write'],{cwd:tmp,encoding:'utf8'});
  check('Clean isolated generation',()=>assert.equal(run().status,0));
  const p=path.join(tmp,'werk-data/post-debt-employee-sv-model.json'),raw=fs.readFileSync(p,'utf8');
  for(const [label,mutate] of [
    ['Invented individual first-stage percentage',s=>s.first_stage.individual_reduction_share=.5],
    ['Automatic full abolition after first stage',s=>s.first_stage.further_full_abolition_automatically_authorized=true],
    ['Double-booked existing contributions',s=>s.existing_receipts_accounting.redirection_creates_additional_revenue=true],
    ['Invented repayment from redirection',s=>s.existing_receipts_accounting.verified_additional_debt_repayment_bn=31.96],
    ['Premature activation',s=>s.activation.currently_active=true],
    ['Missing debt-free requirement',s=>s.activation.requires_debt_free_general_government=false],
    ['Fake funded cost',s=>s.funding_gate.verified_annual_replacement_cost_bn=1],
    ['Invalid 55 percent claim',s=>s.official_unemployment_rules.basic_replacement_pct=100],
    ['Unsupported equal-pay generalisation',s=>s.official_unemployment_rules.same_pay_as_work_general_claim_verified=true],
    ['Unverified employment booking',s=>s.funding_gate.employment_effect_persons=1]
  ]){const d=JSON.parse(raw);mutate(d);fs.writeFileSync(p,JSON.stringify(d));check(label,()=>assert.notEqual(run().status,0));fs.writeFileSync(p,raw);}
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`SV-01 countercheck OK: ${count} independent numerical and negative cases.`);
