export function createPayroll2026(kernel) {
  const si = kernel.social_insurance;
  const st = kernel.special_payment_tax;
  const wt = kernel.ordinary_monthly_wage_tax;

  const fail = m => { throw new Error(m); };

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
    if (!Number.isFinite(monthlyGross) || monthlyGross < 0) fail(`Invalid monthly gross: ${monthlyGross}`);
    const base = Math.min(monthlyGross, si.monthly_max_base_eur);
    const wf = region === 'vienna'
      ? si.employee_running_only_standard_rates_pct.housing_promotion_vienna
      : si.employee_running_only_standard_rates_pct.housing_promotion_outside_vienna;
    const ratePct = si.employee_core_rates_pct.health + si.employee_core_rates_pct.pension + employeeAvRate(monthlyGross) + si.employee_running_only_standard_rates_pct.workers_chamber + wf;
    return {base, ratePct, employeeSv: base * ratePct / 100};
  }

  function specialEmployeeSv(specialGross, specialBaseUsedYtd=0) {
    if (!Number.isFinite(specialGross) || specialGross < 0) fail(`Invalid special gross: ${specialGross}`);
    if (!Number.isFinite(specialBaseUsedYtd) || specialBaseUsedYtd < 0) fail(`Invalid special base YTD: ${specialBaseUsedYtd}`);
    const remaining = Math.max(0, si.annual_special_payment_max_base_eur - specialBaseUsedYtd);
    const base = Math.min(specialGross, remaining);
    const ratePct = si.employee_core_rates_pct.health + si.employee_core_rates_pct.pension + employeeAvRate(specialGross);
    return {base, ratePct, employeeSv: base * ratePct / 100, remainingAfter: remaining - base};
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
    if (remaining > 1e-9) fail('Special-payment fixed-rate amount exceeds implemented band universe');
    return tax;
  }

  function specialFixedRateTax({specialGrossWithinSixth, deductibleSpecialSv, jahressechstelValue, priorTaxableSpecialAfterSv=0}) {
    if (jahressechstelValue <= st.jahressechstel_freigrenze_eur) return 0;
    const currentTaxable = Math.max(0, specialGrossWithinSixth - deductibleSpecialSv);
    return cumulativeFixedBandTax(priorTaxableSpecialAfterSv + currentTaxable) - cumulativeFixedBandTax(priorTaxableSpecialAfterSv);
  }

  function ordinaryMonthlyWageTax(monthlyLohn, {familyBonusMonthly=0, avabAeabMonthly=0}={}) {
    if (!Number.isFinite(monthlyLohn) || monthlyLohn < 0) fail(`Invalid Monatslohn: ${monthlyLohn}`);
    if (!wt || !Array.isArray(wt.table)) fail('ordinary_monthly_wage_tax table missing');
    const band = wt.table.find(b => b.upper_inclusive_eur === null || monthlyLohn <= b.upper_inclusive_eur);
    if (!band) fail(`No wage-tax band for Monatslohn ${monthlyLohn}`);
    if (band.marginal_rate_pct === 0) return {band, wageTax:0};
    // Standard employer withholding: family bonus is applied first, then standard monthly credits.
    const raw = monthlyLohn * band.marginal_rate_pct / 100 - band.deduction_eur;
    const afterFamily = Math.max(0, raw - Math.max(0, familyBonusMonthly));
    const afterCredits = Math.max(0, afterFamily - wt.standard_monthly_traffic_tax_credit_eur - Math.max(0, avabAeabMonthly));
    return {band, wageTax:afterCredits};
  }

  function constantSalaryEmployerWithholding({monthlyGross, region='outside_vienna'}) {
    const runningSv = runningEmployeeSv(monthlyGross, region);
    const monthlyLohn = monthlyGross - runningSv.employeeSv;
    const runningTax = ordinaryMonthlyWageTax(monthlyLohn).wageTax;
    const js = jahressechstel(monthlyGross * 12, 12);
    let usedSpecialBase=0, priorTaxable=0, specialSvTotal=0, specialTaxTotal=0;
    for (let i=0;i<2;i++) {
      const sp = specialEmployeeSv(monthlyGross, usedSpecialBase);
      const tax = specialFixedRateTax({specialGrossWithinSixth:monthlyGross,deductibleSpecialSv:sp.employeeSv,jahressechstelValue:js,priorTaxableSpecialAfterSv:priorTaxable});
      usedSpecialBase += sp.base;
      priorTaxable += Math.max(0,monthlyGross-sp.employeeSv);
      specialSvTotal += sp.employeeSv;
      specialTaxTotal += tax;
    }
    const annualGross = monthlyGross * 14;
    const runningSvAnnual = runningSv.employeeSv * 12;
    const runningTaxAnnual = runningTax * 12;
    const payrollNetBeforeAssessment = annualGross - runningSvAnnual - runningTaxAnnual - specialSvTotal - specialTaxTotal;
    return {monthlyGross,region,monthlyLohn,runningSvMonthly:runningSv.employeeSv,runningWageTaxMonthly:runningTax,jahressechstel:js,specialSvAnnual:specialSvTotal,specialFixedTaxAnnual:specialTaxTotal,annualGross,runningSvAnnual,runningTaxAnnual,payrollNetBeforeAssessment};
  }

  return {employeeAvRate,runningEmployeeSv,specialEmployeeSv,jahressechstel,cumulativeFixedBandTax,specialFixedRateTax,ordinaryMonthlyWageTax,constantSalaryEmployerWithholding};
}
