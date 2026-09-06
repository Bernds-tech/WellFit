import {createPayroll2026} from './werk-payroll-2026.mjs';
import {finite,nonnegative} from './werk-calculation.mjs';

export function employeeRelief(kernel,{monthlyGross,region='outside_vienna',reductionShare=1}) {
  nonnegative(monthlyGross,'gross');finite(reductionShare,'reduction');
  if(monthlyGross<1500||monthlyGross>10000||reductionShare<0||reductionShare>1||!['outside_vienna','vienna'].includes(region)) throw Error('Outside reviewed SV scenario scope');
  const changed=structuredClone(kernel), factor=1-reductionShare;
  for(const k of ['health','pension']) changed.social_insurance.employee_core_rates_pct[k]*=factor;
  for(const band of changed.social_insurance.employee_unemployment_rate_schedule) band.rate_pct*=factor;
  const before=createPayroll2026(kernel).constantSalaryEmployerWithholding({monthlyGross,region});
  const after=createPayroll2026(changed).constantSalaryEmployerWithholding({monthlyGross,region});
  const removedAnnual=before.runningSvAnnual+before.specialSvAnnual-after.runningSvAnnual-after.specialSvAnnual;
  const extraTax=after.runningTaxAnnual+after.specialFixedTaxAnnual-before.runningTaxAnnual-before.specialFixedTaxAnnual;
  return {before,after,removed_annual_contributions_eur:removedAnnual,extra_annual_withheld_tax_eur:extraTax,
    annual_net_gain_eur:after.payrollNetBeforeAssessment-before.payrollNetBeforeAssessment,
    ordinary_month_net_before_eur:monthlyGross-before.runningSvMonthly-before.runningWageTaxMonthly,
    ordinary_month_net_after_eur:monthlyGross-after.runningSvMonthly-after.runningWageTaxMonthly,
    accounting_rule:'Household cash gain = lost employee contribution revenue minus extra wage tax, before transfers/assessment and funding incidence.'};
}

export function postDebtCapacity({startingDebt,baseRepayment,ratePct,reserveShare=0}) {
  for(const [k,v] of Object.entries({startingDebt,baseRepayment,ratePct,reserveShare})) nonnegative(v,k);
  if(reserveShare>1)throw Error('Reserve exceeds capacity');
  const avoidedInterest=startingDebt*ratePct/100,primarySurplus=baseRepayment+avoidedInterest;
  return {avoided_annual_interest_bn:avoidedInterest,conditional_primary_surplus_bn:primarySurplus,available_bn:primarySurplus*(1-reserveShare)};
}

export function replacementCost({grossLoss,taxRecaptureShare,runningCost=0}) {
  nonnegative(grossLoss,'gross loss');finite(taxRecaptureShare,'tax recapture');nonnegative(runningCost,'running cost');
  if(taxRecaptureShare<0||taxRecaptureShare>=1)throw Error('Invalid tax recapture');
  return grossLoss*(1-taxRecaptureShare)+runningCost;
}
