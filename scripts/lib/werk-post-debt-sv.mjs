import {createPayroll2026} from './werk-payroll-2026.mjs';
import {finite,nonnegative,round} from './werk-calculation.mjs';

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

// Constant nominal sensitivity, not a forecast: saved interest becomes available
// only after the repayment lag. Every saved euro has exactly one destination.
export function debtLinkedRelief({debt,annualBase,ratePct,contributionBase,reductionTarget=.5,
  interestToReliefShare=1,taxRecaptureShare=0,lagYears=1,maxYears=100}) {
  for(const [k,v] of Object.entries({debt,annualBase,ratePct,contributionBase,reductionTarget,interestToReliefShare,taxRecaptureShare}))nonnegative(v,k);
  if(!debt||!annualBase||!contributionBase||reductionTarget>1||interestToReliefShare>1||taxRecaptureShare>=1||
    !Number.isInteger(lagYears)||lagYears<1||!Number.isInteger(maxYears)||maxYears<1)throw Error('Invalid linked debt/relief scenario');
  let remaining=debt,completeYear=null,targetYear=null,netTotal=0,grossTotal=0,interestTotal=0;
  const payments=[],rows=[];
  for(let year=1;year<=maxYears;year++) {
    const effectivePrincipal=payments.slice(0,Math.max(0,year-lagYears)).reduce((a,b)=>a+b,0);
    const interest=effectivePrincipal*ratePct/100;
    const netRelief=Math.min(contributionBase*reductionTarget*(1-taxRecaptureShare),interest*interestToReliefShare);
    const grossRelief=netRelief/(1-taxRecaptureShare);
    const base=Math.min(remaining,annualBase);
    const extra=Math.min(Math.max(0,remaining-base),interest*(1-interestToReliefShare));
    remaining=Math.max(0,remaining-base-extra);payments.push(base+extra);
    if(remaining<1e-9)remaining=0;
    if(completeYear===null&&remaining===0)completeYear=year;
    const achieved=grossRelief/contributionBase;
    if(targetYear===null&&achieved>=reductionTarget-1e-10)targetYear=year;
    netTotal+=netRelief;grossTotal+=grossRelief;interestTotal+=interest;
    rows.push({year,remaining_debt_bn:round(remaining),base_repayment_bn:round(base),extra_repayment_bn:round(extra),
      realized_interest_saving_bn:round(interest),gross_contribution_relief_bn:round(grossRelief),
      wage_tax_recapture_bn:round(grossRelief-netRelief),net_replacement_cost_bn:round(netRelief),
      unallocated_interest_bn:round(Math.max(0,interest-netRelief-extra)),
      modeled_contribution_reduction_pct:round(achieved*100),
      cumulative_net_relief_cost_bn:round(netTotal),cumulative_gross_relief_bn:round(grossTotal),
      cumulative_realized_interest_bn:round(interestTotal)});
    if(completeYear!==null&&year>=completeYear+lagYears)break;
  }
  const atDebtFree=rows.find(x=>x.year===completeYear)??null;
  const targetNet=contributionBase*reductionTarget*(1-taxRecaptureShare);
  return {inputs:{debt,annualBase,ratePct,contributionBase,reductionTarget,interestToReliefShare,taxRecaptureShare,lagYears},
    repayment_complete_year:completeYear,target_reached_year:targetYear,
    target_reached_by_debt_freedom:completeYear===null?null:targetYear!==null&&targetYear<=completeYear,
    reduction_pct_at_debt_freedom:atDebtFree?.modeled_contribution_reduction_pct??null,
    full_annual_interest_saving_bn:round(debt*ratePct/100),
    target_net_replacement_cost_bn:round(targetNet),
    target_financing_shortfall_after_full_interest_effect_bn:round(Math.max(0,targetNet-debt*ratePct/100*interestToReliefShare)),
    annual_rows:rows};
}
