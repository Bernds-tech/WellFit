import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {annualTariff,annualCredits,assessedSpecialTax,standardAnnualAssessment,assessedRelief} from './lib/werk-annual-assessment-2026.mjs';
import {employeeRelief} from './lib/werk-post-debt-sv.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const rules=read('werk-data/payroll-annual-assessment-2026.json'),kernel=read('werk-data/payroll-employee-kernel-2026.json');
let count=0;
const check=(name,fn)=>{try{fn();count++;}catch(e){throw Error(`${name}: ${e.message}`);}};
const close=(a,b,tol=1e-6)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<tol,`${a} != ${b}`);
check('Annual tariff independent boundary totals',()=>{
  for(const [income,tax] of [[13539,0],[21992,1690.6],[36458,6030.4],[70365,19593.2],[104859,36150.32],[1000000,483720.82],[1000100,483775.82]])close(annualTariff(income,rules),tax);
});
check('Supplement full / middle / zero boundary',()=>{
  close(annualCredits(19761,5000,rules).traffic_supplement_eur,804);
  close(annualCredits(25010,5000,rules).traffic_supplement_eur,402);
  close(annualCredits(30259,5000,rules).traffic_supplement_eur,0);
});
check('Refund is capped by 55 percent of actual contributions',()=>close(annualCredits(12000,1000,rules).sv_refund_eur,550));
check('Refund cannot exceed combined annual credit ceiling',()=>close(annualCredits(12000,10000,rules).sv_refund_eur,1300));
check('Negative tax cap overrides 55 percent maximum',()=>close(annualCredits(15000,5000,rules).sv_refund_eur,1007.8));
check('No contributions means no SV refund',()=>close(annualCredits(12000,0,rules).sv_refund_eur,0));
check('Positive tax means no refund despite paid contributions',()=>close(annualCredits(30000,10000,rules).sv_refund_eur,0));
check('Special gross freigrenze, net cap threshold and floor',()=>{
  close(assessedSpecialTax(2615,0,rules),0);
  close(assessedSpecialTax(3000,510,rules),0);
  close(assessedSpecialTax(3000,423.6,rules),25.92);
  close(assessedSpecialTax(3000,211.8,rules),89.46);
  close(assessedSpecialTax(4000,564.8,rules),168.912);
});
check('Independent 1500 gross half-cut annual calculation',()=>{
  const p=employeeRelief(kernel,{monthlyGross:1500,reductionShare:.5}),a=assessedRelief(p,rules);
  close(a.before.annual_taxable_income_eur,15146.4);close(a.before.refund_contribution_base_eur,3145.2);
  close(a.before.sv_refund_eur,978.52);close(a.after.sv_refund_eur,724.36);
  close(a.before.annual_net_after_assessment_eur,18807.4);close(a.after.annual_net_after_assessment_eur,19972.3);
  close(a.annual_net_gain_eur,1164.9);close(a.extra_assessed_tax_including_refund_change_eur,317.7);
});
check('Zero relief survives full annual assessment',()=>close(assessedRelief(employeeRelief(kernel,{monthlyGross:3000,reductionShare:0}),rules).annual_net_gain_eur,0));
check('Credit taper reduces 2500 gross half-cut gain',()=>{
  const a=assessedRelief(employeeRelief(kernel,{monthlyGross:2500,reductionShare:.5}),rules);
  // Lost supplement = removed running contributions 2418 × 804 / 10498.
  close(a.gain_change_from_withholding_eur,-2418*804/10498);
});
check('High gross ceiling is retained after assessment',()=>{
  const p=employeeRelief(kernel,{monthlyGross:10000,reductionShare:.5});
  close(p.removed_annual_contributions_eur,8280.657);
  close(assessedRelief(p,rules).annual_net_gain_eur,4661.18718);
});
for(const bad of [null,NaN,Infinity,-1,'15000'])check('Reject invalid annual income '+bad,()=>assert.throws(()=>annualTariff(bad,rules)));
for(const bad of [null,NaN,-1])check('Reject invalid refund base '+bad,()=>assert.throws(()=>annualCredits(12000,bad,rules)));
const base=employeeRelief(kernel,{monthlyGross:3000}).before;
for(const change of [{monthlyGross:1499},{monthlyGross:10001},{region:'unknown'},{runningSvAnnual:NaN},{specialSvAnnual:-1},{annualGross:42001},{runningSvAnnual:40000}])
  check('Reject unsupported annual scope '+JSON.stringify(change),()=>assert.throws(()=>standardAnnualAssessment({...base,...change},rules)));
check('Reject mixed rule year',()=>assert.throws(()=>standardAnnualAssessment(base,{...rules,rule_year:2025})));
check('Reject high special pay beyond reviewed cap',()=>assert.throws(()=>assessedSpecialTax(25001,2000,rules)));
const out=read('werk-data/payroll-annual-assessment-results-2026.json');
check('All 48 cases reconcile without aggregate inference',()=>{
  assert.equal(out.rows.length,48);assert.equal(out.empirical_population_recapture_share,null);assert.equal(out.verified_budget_credit_bn,0);
  for(const r of out.rows){close(r.annual_assessed_gain_eur,r.removed_contributions_eur-r.extra_assessed_tax_including_refund_change_eur,3e-6);
    close(r.annual_assessed_gain_eur-r.annual_withholding_gain_eur,r.gain_change_from_withholding_eur,3e-6);}
});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-assessment-'));
try {
  for(const p of [...Object.keys(out.source_sha256),'scripts/werk-annual-assessment-contract.mjs',
    ...['annual-assessment-2026','post-debt-sv','payroll-2026','calculation'].map(n=>`scripts/lib/werk-${n}.mjs`)]) {
    const dest=path.join(tmp,p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(p,dest);
  }
  const run=()=>spawnSync(process.execPath,['scripts/werk-annual-assessment-contract.mjs','--write'],{cwd:tmp,encoding:'utf8'});
  check('Isolated clean generation succeeds',()=>assert.equal(run().status,0));
  for(const [name,mutate] of [
    ['Wrong indexed year amount',r=>r.annual_traffic_credit_eur=487],
    ['Confused gross and net special threshold',r=>r.special_recalculation.cap_base_threshold_after_contributions_eur=2615],
    ['Missing negative tax cap',r=>r.sv_refund.capped_by_negative_tariff_after_credits=false],
    ['False aggregate closure',r=>r.coverage.aggregate_employee_sv_cost='closed'],
    ['Nonfinite tariff',r=>r.annual_tariff_bands[1][1]=null]
  ]) {const r=structuredClone(rules);mutate(r);fs.writeFileSync(path.join(tmp,'werk-data/payroll-annual-assessment-2026.json'),JSON.stringify(r));check(name,()=>assert.notEqual(run().status,0));}
} finally {fs.rmSync(tmp,{recursive:true,force:true});}
console.log(`Annual assessment countercheck OK: ${count} independent numerical/scope/negative cases.`);
