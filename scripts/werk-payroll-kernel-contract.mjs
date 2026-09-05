import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const fail = m => { throw new Error(m); };
const eq = (a,b,tol,msg) => { if (Math.abs(a-b) > tol) fail(`${msg}: ${a} != ${b}`); };
const p = read('werk-data/payroll-employee-kernel-2026.json');
const d = read('werk-data/distribution-baseline-2025-2026.json');

const si = p.social_insurance;
const st = p.special_payment_tax;

function employeeAvRate(gross) {
  if (!Number.isFinite(gross) || gross < 0) fail(`Invalid gross for AV rate: ${gross}`);
  for (const band of si.employee_unemployment_rate_schedule) {
    const lowerOk = band.gross_lower_exclusive_eur === undefined || gross > band.gross_lower_exclusive_eur;
    const upperOk = band.gross_upper_eur === null || gross <= band.gross_upper_eur;
    if (lowerOk && upperOk) return band.rate_pct;
  }
  fail(`No AV band for gross ${gross}`);
}

function runningEmployeeSv(monthlyGross, region='outside_vienna') {
  const base = Math.min(monthlyGross, si.monthly_max_base_eur);
  const wf = region === 'vienna'
    ? si.employee_running_only_standard_rates_pct.housing_promotion_vienna
    : si.employee_running_only_standard_rates_pct.housing_promotion_outside_vienna;
  const rate = si.employee_core_rates_pct.health + si.employee_core_rates_pct.pension + employeeAvRate(monthlyGross) + si.employee_running_only_standard_rates_pct.workers_chamber + wf;
  return {base, ratePct: rate, employeeSv: base * rate / 100};
}

function specialEmployeeSv(specialGross, specialBaseUsedYtd=0) {
  const remaining = Math.max(0, si.annual_special_payment_max_base_eur - specialBaseUsedYtd);
  const base = Math.min(specialGross, remaining);
  const rate = si.employee_core_rates_pct.health + si.employee_core_rates_pct.pension + employeeAvRate(specialGross);
  return {base, ratePct: rate, employeeSv: base * rate / 100, remainingAfter: remaining - base};
}

function jahressechstel(runningGrossReceivedYtd, elapsedCalendarMonths) {
  if (!Number.isFinite(runningGrossReceivedYtd) || runningGrossReceivedYtd < 0) fail('Invalid running gross YTD');
  if (!Number.isInteger(elapsedCalendarMonths) || elapsedCalendarMonths < 1 || elapsedCalendarMonths > 12) fail('Invalid elapsed calendar months');
  return runningGrossReceivedYtd / elapsedCalendarMonths * 2;
}

function cumulativeFixedBandTax(taxableAfterSv) {
  let remaining = Math.max(0, taxableAfterSv);
  let tax = 0;
  for (const band of st.annual_fixed_rate_bands_after_deductible_contributions) {
    const take = Math.min(remaining, band.amount_eur);
    tax += take * band.rate_pct / 100;
    remaining -= take;
    if (remaining <= 0) break;
  }
  if (remaining > 1e-9) fail('Special-payment fixed-rate amount exceeds v1 implemented band universe');
  return tax;
}

function specialFixedRateTax({specialGrossWithinSixth, deductibleSpecialSv, jahressechstelValue, priorTaxableSpecialAfterSv=0}) {
  if (jahressechstelValue <= st.jahressechstel_freigrenze_eur) return 0;
  const currentTaxable = Math.max(0, specialGrossWithinSixth - deductibleSpecialSv);
  const before = cumulativeFixedBandTax(priorTaxableSpecialAfterSv);
  const after = cumulativeFixedBandTax(priorTaxableSpecialAfterSv + currentTaxable);
  return after - before;
}

// Cross-artifact consistency: payroll core must reuse, not fork, the canonical distribution parameters.
eq(si.monthly_max_base_eur, d.social_insurance_parameters_2026.monthly_max_contribution_base_eur, 0, 'Monthly HBG vs distribution baseline');
eq(si.annual_special_payment_max_base_eur, d.social_insurance_parameters_2026.annual_special_payment_max_base_eur, 0, 'Special HBG vs distribution baseline');
for (const key of ['health','pension']) eq(si.employee_core_rates_pct[key], d.social_insurance_parameters_2026.regular_employee_rates_pct[key], 0, `${key} employee rate vs distribution baseline`);
if (JSON.stringify(si.employee_unemployment_rate_schedule.map(x=>x.rate_pct)) !== JSON.stringify(d.social_insurance_parameters_2026.employee_unemployment_rate_schedule.map(x=>x.rate_pct))) fail('AV rates drift from distribution baseline');
if (st.jahressechstel_freigrenze_eur !== 2615) fail('2026 special-payment Freigrenze must be 2,615 EUR');
if (JSON.stringify(st.annual_fixed_rate_bands_after_deductible_contributions.map(x=>[x.amount_eur,x.rate_pct])) !== JSON.stringify([[620,0],[24380,6],[25000,27],[33333,35.75]])) fail('Special fixed-rate bands mismatch');

// Contribution-rate identities.
eq(si.standard_employee_running_rate_full_av_pct.outside_vienna, si.employee_core_rates_pct.health + si.employee_core_rates_pct.pension + 2.95 + 0.50 + 0.50, 1e-9, 'Full-AV running rate outside Vienna');
eq(si.standard_employee_running_rate_full_av_pct.vienna, si.employee_core_rates_pct.health + si.employee_core_rates_pct.pension + 2.95 + 0.50 + 0.75, 1e-9, 'Full-AV running rate Vienna');
eq(si.standard_employee_special_rate_full_av_pct, si.employee_core_rates_pct.health + si.employee_core_rates_pct.pension + 2.95, 1e-9, 'Full-AV special rate');

for (const tc of p.deterministic_test_vectors.cases) {
  const m = tc.monthly_gross_eur;
  const reg = runningEmployeeSv(m, tc.region);
  const js = jahressechstel(m * 12, 12);
  eq(js, tc.expected_jahressechstel_eur, 0.001, `${tc.id}: Jahressechstel`);
  if (tc.expected_regular_av_rate_pct !== undefined) eq(employeeAvRate(m), tc.expected_regular_av_rate_pct, 0, `${tc.id}: running AV rate`);
  if (tc.expected_running_contribution_base_eur !== undefined) eq(reg.base, tc.expected_running_contribution_base_eur, 0, `${tc.id}: running contribution base`);
  if (tc.expected_running_employee_sv_month_eur !== undefined) eq(reg.employeeSv, tc.expected_running_employee_sv_month_eur, 0.011, `${tc.id}: monthly employee SV`);

  let used = 0;
  let specialSvYear = 0;
  let specialTaxYear = 0;
  let priorTaxable = 0;
  for (let i=0;i<2;i++) {
    const sp = specialEmployeeSv(m, used);
    if (tc.expected_special_av_rate_pct !== undefined) eq(employeeAvRate(m), tc.expected_special_av_rate_pct, 0, `${tc.id}: special AV rate`);
    if (tc.expected_special_employee_sv_each_eur !== undefined) eq(sp.employeeSv, tc.expected_special_employee_sv_each_eur, 0.011, `${tc.id}: special employee SV payment ${i+1}`);
    const tax = specialFixedRateTax({specialGrossWithinSixth:m,deductibleSpecialSv:sp.employeeSv,jahressechstelValue:js,priorTaxableSpecialAfterSv:priorTaxable});
    specialTaxYear += tax;
    priorTaxable += Math.max(0,m-sp.employeeSv);
    specialSvYear += sp.employeeSv;
    used += sp.base;
  }
  if (tc.expected_special_contribution_base_year_eur !== undefined) eq(used, tc.expected_special_contribution_base_year_eur, 0.001, `${tc.id}: annual special contribution base`);
  if (tc.expected_special_employee_sv_year_eur !== undefined) eq(specialSvYear, tc.expected_special_employee_sv_year_eur, 0.011, `${tc.id}: annual special employee SV`);
  if (tc.expected_special_fixed_rate_tax_year_eur !== undefined) eq(specialTaxYear, tc.expected_special_fixed_rate_tax_year_eur, 0.011, `${tc.id}: annual special fixed-rate tax`);
}

// Independent AV treatment for running and special pay: official 2026 example principle.
if (employeeAvRate(2450)!==2 || employeeAvRate(2380)!==1) fail('Independent AV bracket example 2,450 running / 2,380 special failed');
const high = runningEmployeeSv(8000,'outside_vienna');
eq(high.base,6930,0,'High salary running HBG cap');
const sp1=specialEmployeeSv(8000,0), sp2=specialEmployeeSv(8000,sp1.base);
eq(sp1.base+sp2.base,13860,0,'High salary annual special HBG cap');
if (!p.scope.excluded.includes('Dienstgeberwechsel und Kontrollsechstel-Aufrollung')) fail('Control-sixth/dienstgeber-change exclusion guard missing');
if (p.coverage?.PAY_H_full_14_payment_net_income_engine!=='open' || p.coverage?.PAY_I_effective_marginal_burden_engine!=='open') fail('Payroll downstream gates must remain open');

console.log(`Payroll kernel contract OK: 2026 running/SZ SV, independent AV brackets, Vienna WF, Jahressechstel, EUR ${st.jahressechstel_freigrenze_eur} Freigrenze and fixed-rate special-pay bands validated across ${p.deterministic_test_vectors.cases.length} deterministic cases; ordinary wage-tax/full-net engines remain open.`);
