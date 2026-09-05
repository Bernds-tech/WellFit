import fs from 'node:fs';
import { createPayroll2026 } from './lib/werk-payroll-2026.mjs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const fail = m => { throw new Error(m); };
const eq = (a,b,tol,msg) => { if (Math.abs(a-b) > tol) fail(`${msg}: ${a} != ${b}`); };
const p = read('werk-data/payroll-employee-kernel-2026.json');
const d = read('werk-data/distribution-baseline-2025-2026.json');
const payroll = createPayroll2026(p);
const si = p.social_insurance;
const st = p.special_payment_tax;
const wt = p.ordinary_monthly_wage_tax;

// Cross-artifact consistency: payroll core reuses, rather than forks, canonical distribution parameters.
eq(si.monthly_max_base_eur,d.social_insurance_parameters_2026.monthly_max_contribution_base_eur,0,'Monthly HBG vs distribution baseline');
eq(si.annual_special_payment_max_base_eur,d.social_insurance_parameters_2026.annual_special_payment_max_base_eur,0,'Special HBG vs distribution baseline');
for(const key of ['health','pension']) eq(si.employee_core_rates_pct[key],d.social_insurance_parameters_2026.regular_employee_rates_pct[key],0,`${key} employee rate vs distribution baseline`);
if(JSON.stringify(si.employee_unemployment_rate_schedule.map(x=>x.rate_pct))!==JSON.stringify(d.social_insurance_parameters_2026.employee_unemployment_rate_schedule.map(x=>x.rate_pct))) fail('AV rates drift from distribution baseline');
if(st.jahressechstel_freigrenze_eur!==2615) fail('2026 special-payment Freigrenze must be 2,615 EUR');
if(JSON.stringify(st.annual_fixed_rate_bands_after_deductible_contributions.map(x=>[x.amount_eur,x.rate_pct]))!==JSON.stringify([[620,0],[24380,6],[25000,27],[33333,35.75]])) fail('Special fixed-rate bands mismatch');

// Contribution-rate identities.
eq(si.standard_employee_running_rate_full_av_pct.outside_vienna,si.employee_core_rates_pct.health+si.employee_core_rates_pct.pension+2.95+0.50+0.50,1e-9,'Full-AV running rate outside Vienna');
eq(si.standard_employee_running_rate_full_av_pct.vienna,si.employee_core_rates_pct.health+si.employee_core_rates_pct.pension+2.95+0.50+0.75,1e-9,'Full-AV running rate Vienna');
eq(si.standard_employee_special_rate_full_av_pct,si.employee_core_rates_pct.health+si.employee_core_rates_pct.pension+2.95,1e-9,'Full-AV special rate');

// 2026 official monthly wage-tax table: exact boundaries/rates/deductions and employer traffic credit.
const expectedTable=[
  [1139.25,0,0],
  [1843.67,20,227.85],
  [3049.17,30,412.22],
  [5874.75,40,717.13],
  [8749.25,48,1187.11],
  [83344.33,50,1362.10],
  [null,55,5529.32]
];
if(JSON.stringify(wt.table.map(x=>[x.upper_inclusive_eur,x.marginal_rate_pct,x.deduction_eur]))!==JSON.stringify(expectedTable)) fail('2026 ordinary monthly wage-tax table drift');
eq(wt.standard_monthly_traffic_tax_credit_eur,41.33,0,'Monthly traffic tax credit');
eq(wt.standard_annual_traffic_tax_credit_eur,496,0,'Annual traffic tax credit');
eq(wt.traffic_credit_supplement_2026_eur_year,804,0,'Assessment-only traffic-credit supplement');
if(!String(wt.traffic_credit_supplement_rule).includes('nur im Rahmen der Veranlagung')) fail('Assessment-only supplement guard missing');
if(!String(wt.definition).includes('Werbungskostenpauschales')) fail('Wage-tax-table Werbungskostenpauschale definition guard missing');
for(const tc of wt.test_vectors){
  const out=payroll.ordinaryMonthlyWageTax(tc.monthly_lohn_eur);
  eq(out.wageTax,tc.expected_wage_tax_eur,0.011,`Monthly wage tax vector ${tc.monthly_lohn_eur}`);
  if(out.band.marginal_rate_pct!==tc.band_rate_pct) fail(`Monthly wage tax band mismatch ${tc.monthly_lohn_eur}: ${out.band.marginal_rate_pct} != ${tc.band_rate_pct}`);
}
// Independent BMF-style formula anchor.
eq(payroll.ordinaryMonthlyWageTax(1983.84).wageTax,141.60,0.011,'Official-style 1,983.84 monthly-lohn anchor');

// Payroll standard cases: SV, wage-tax withholding, special payments and annual cash-net before assessment.
for(const tc of p.deterministic_test_vectors.cases){
  const m=tc.monthly_gross_eur;
  const reg=payroll.runningEmployeeSv(m,tc.region);
  const js=payroll.jahressechstel(m*12,12);
  eq(js,tc.expected_jahressechstel_eur,0.001,`${tc.id}: Jahressechstel`);
  if(tc.expected_regular_av_rate_pct!==undefined) eq(payroll.employeeAvRate(m),tc.expected_regular_av_rate_pct,0,`${tc.id}: running AV rate`);
  if(tc.expected_running_contribution_base_eur!==undefined) eq(reg.base,tc.expected_running_contribution_base_eur,0,`${tc.id}: running contribution base`);
  if(tc.expected_running_employee_sv_month_eur!==undefined) eq(reg.employeeSv,tc.expected_running_employee_sv_month_eur,0.011,`${tc.id}: monthly employee SV`);
  const withholding=payroll.constantSalaryEmployerWithholding({monthlyGross:m,region:tc.region});
  if(tc.expected_running_wage_tax_month_eur!==undefined) eq(withholding.runningWageTaxMonthly,tc.expected_running_wage_tax_month_eur,0.011,`${tc.id}: monthly running wage tax`);
  if(tc.expected_special_fixed_rate_tax_year_eur!==undefined) eq(withholding.specialFixedTaxAnnual,tc.expected_special_fixed_rate_tax_year_eur,0.011,`${tc.id}: annual special fixed tax`);
  if(tc.expected_special_employee_sv_year_eur!==undefined) eq(withholding.specialSvAnnual,tc.expected_special_employee_sv_year_eur,0.011,`${tc.id}: annual special employee SV`);
  if(tc.expected_special_contribution_base_year_eur!==undefined){
    const sp1=payroll.specialEmployeeSv(m,0);const sp2=payroll.specialEmployeeSv(m,sp1.base);
    eq(sp1.base+sp2.base,tc.expected_special_contribution_base_year_eur,0.001,`${tc.id}: annual special contribution base`);
  }
  if(tc.expected_special_employee_sv_each_eur!==undefined){
    const sp=payroll.specialEmployeeSv(m,0);
    eq(sp.employeeSv,tc.expected_special_employee_sv_each_eur,0.011,`${tc.id}: first special-payment employee SV`);
  }
  if(tc.expected_payroll_net_before_assessment_eur!==undefined) eq(withholding.payrollNetBeforeAssessment,tc.expected_payroll_net_before_assessment_eur,0.011,`${tc.id}: payroll net before assessment`);
}

// Independent AV treatment for running and special pay.
if(payroll.employeeAvRate(2450)!==2||payroll.employeeAvRate(2380)!==1) fail('Independent AV bracket example 2,450 running / 2,380 special failed');
const high=payroll.runningEmployeeSv(8000,'outside_vienna');
eq(high.base,6930,0,'High salary running HBG cap');
const sp1=payroll.specialEmployeeSv(8000,0),sp2=payroll.specialEmployeeSv(8000,sp1.base);
eq(sp1.base+sp2.base,13860,0,'High salary annual special HBG cap');

// Scope/gate integrity: employer withholding is verified, final annual assessment and marginal burden are not.
if(!p.scope.excluded.includes('Dienstgeberwechsel und Kontrollsechstel-Aufrollung')) fail('Control-sixth/dienstgeber-change exclusion guard missing');
if(p.coverage?.PAY_F_ordinary_running_wage_tax_employer_withholding!=='closed_standard_scope') fail('PAY-F must be closed only for standard employer-withholding scope');
if(p.coverage?.PAY_H_constant_salary_14_payment_employer_withholding!=='closed_standard_scope_before_assessment') fail('PAY-H standard employer-withholding gate mismatch');
if(p.coverage?.PAY_I_final_annual_tax_after_employee_assessment!=='open'||p.coverage?.PAY_J_effective_marginal_burden_engine!=='open') fail('Final assessment/marginal-burden gates must remain open');
if(!String(wt.scope_warning).includes('nicht ident mit endgültiger Jahressteuer')) fail('Employer-withholding vs final-assessment guard missing');

console.log(`Payroll kernel contract OK: reusable module validates 2026 running/SZ SV, ${wt.table.length} wage-tax bands, ${wt.test_vectors.length} wage-tax vectors and ${p.deterministic_test_vectors.cases.length} annual standard payroll cases; employer withholding is verified while final assessment and marginal burden remain open.`);
