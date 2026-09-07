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

// Sensitivity, not a forecast: saved interest becomes available
// only after the repayment lag. Every saved euro has exactly one destination.
export function debtLinkedRelief({debt,annualBase,ratePct,contributionBase,reductionTarget=.5,
  interestToReliefShare=1,taxRecaptureShare=0,lagYears=1,maxYears=100,growthStress=null}) {
  for(const [k,v] of Object.entries({debt,annualBase,ratePct,contributionBase,reductionTarget,interestToReliefShare,taxRecaptureShare}))nonnegative(v,k);
  if(!debt||!annualBase||!contributionBase||reductionTarget>1||interestToReliefShare>1||taxRecaptureShare>=1||
    !Number.isInteger(lagYears)||lagYears<1||!Number.isInteger(maxYears)||maxYears<1)throw Error('Invalid linked debt/relief scenario');
  const growth=growthStress??{contributionGrowthPct:0,baseRepaymentGrowthPct:0,yearsAfterDebtFree:0};
  for(const k of ['contributionGrowthPct','baseRepaymentGrowthPct']) {
    nonnegative(growth[k],k);if(growth[k]>10)throw Error('Growth outside reviewed 0–10 percent stress range');
  }
  if(!Number.isInteger(growth.yearsAfterDebtFree)||growth.yearsAfterDebtFree<0||growth.yearsAfterDebtFree>50)
    throw Error('Invalid post-debt stress horizon');
  let remaining=debt,completeYear=null,targetYear=null,netTotal=0,grossTotal=0,interestTotal=0;
  let peakShare=0,firstHoldGapYear=null,firstTargetLostYear=null;
  const payments=[],rows=[],capacities=[];
  for(let year=1;year<=maxYears;year++) {
    const currentContributions=contributionBase*(1+growth.contributionGrowthPct/100)**(year-1);
    const scheduledBase=annualBase*(1+growth.baseRepaymentGrowthPct/100)**(year-1);
    finite(currentContributions,'grown contributions');finite(scheduledBase,'grown repayment');
    const effectivePrincipal=payments.slice(0,Math.max(0,year-lagYears)).reduce((a,b)=>a+b,0);
    const interest=effectivePrincipal*ratePct/100;
    const currentTargetNet=currentContributions*reductionTarget*(1-taxRecaptureShare);
    const netRelief=Math.min(currentTargetNet,interest*interestToReliefShare);
    const grossRelief=netRelief/(1-taxRecaptureShare);
    const base=Math.min(remaining,scheduledBase);
    const extra=Math.min(Math.max(0,remaining-base),interest*(1-interestToReliefShare));
    remaining=Math.max(0,remaining-base-extra);payments.push(base+extra);
    if(remaining<1e-9)remaining=0;
    if(completeYear===null&&remaining===0)completeYear=year;
    const achieved=grossRelief/currentContributions;
    const holdGap=Math.max(0,peakShare*currentContributions*(1-taxRecaptureShare)-interest*interestToReliefShare);
    if(holdGap>1e-9&&firstHoldGapYear===null)firstHoldGapYear=year;
    if(targetYear!==null&&achieved<reductionTarget-1e-10&&firstTargetLostYear===null)firstTargetLostYear=year;
    peakShare=Math.max(peakShare,achieved);capacities.push(achieved);
    if(targetYear===null&&achieved>=reductionTarget-1e-10)targetYear=year;
    netTotal+=netRelief;grossTotal+=grossRelief;interestTotal+=interest;
    rows.push({year,remaining_debt_bn:round(remaining),base_repayment_bn:round(base),extra_repayment_bn:round(extra),
      realized_interest_saving_bn:round(interest),gross_contribution_relief_bn:round(grossRelief),
      wage_tax_recapture_bn:round(grossRelief-netRelief),net_replacement_cost_bn:round(netRelief),
      unallocated_interest_bn:round(Math.max(0,interest-netRelief-extra)),
      modeled_contribution_reduction_pct:round(achieved*100),
      cumulative_net_relief_cost_bn:round(netTotal),cumulative_gross_relief_bn:round(grossTotal),
      cumulative_realized_interest_bn:round(interestTotal),
      ...(growthStress?{reference_contributions_at_unchanged_rates_bn:round(currentContributions),
        scheduled_funded_base_repayment_bn:round(scheduledBase),target_net_replacement_cost_bn:round(currentTargetNet),
        target_financing_shortfall_bn:round(Math.max(0,currentTargetNet-interest*interestToReliefShare)),
        additional_financing_to_hold_previous_peak_rate_bn:round(holdGap)}:{})});
    if(completeYear!==null&&year>=completeYear+Math.max(lagYears,growth.yearsAfterDebtFree))break;
  }
  // Backward minimum gives a nondecreasing affordable rate over the observed
  // horizon. It does not spend future interest and is not a perpetual guarantee.
  if(growthStress) {
    let suffixMinimum=reductionTarget;
    for(let i=rows.length-1;i>=0;i--) {
      suffixMinimum=Math.min(suffixMinimum,capacities[i]);
      const net=suffixMinimum*contributionBase*(1+growth.contributionGrowthPct/100)**i*(1-taxRecaptureShare);
      rows[i].fundable_nondecreasing_reduction_pct=round(suffixMinimum*100);
      rows[i].fundable_nondecreasing_net_cost_bn=round(net);
      rows[i].fundable_nondecreasing_unallocated_interest_bn=round(Math.max(0,
        rows[i].realized_interest_saving_bn-net-rows[i].extra_repayment_bn));
    }
  }
  const atDebtFree=rows.find(x=>x.year===completeYear)??null;
  const targetNet=contributionBase*reductionTarget*(1-taxRecaptureShare);
  return {inputs:{debt,annualBase,ratePct,contributionBase,reductionTarget,interestToReliefShare,taxRecaptureShare,lagYears,
      ...(growthStress?{growthStress,maxYears}:{})},
    repayment_complete_year:completeYear,target_reached_year:targetYear,
    target_reached_by_debt_freedom:completeYear===null?null:capacities[completeYear-1]>=reductionTarget-1e-10,
    reduction_pct_at_debt_freedom:atDebtFree?.modeled_contribution_reduction_pct??null,
    full_annual_interest_saving_bn:round(debt*ratePct/100),
    target_net_replacement_cost_bn:growthStress?null:round(targetNet),
    target_financing_shortfall_after_full_interest_effect_bn:growthStress?null:round(Math.max(0,targetNet-debt*ratePct/100*interestToReliefShare)),
    ...(growthStress?{horizon_end_year:rows.at(-1).year,
      required_post_debt_horizon_observed:completeYear!==null&&rows.at(-1).year>=completeYear+Math.max(lagYears,growth.yearsAfterDebtFree),
      first_year_previous_peak_rate_not_funded:firstHoldGapYear,first_target_lost_year:firstTargetLostYear,
      target_funded_at_debt_freedom_and_through_observed_horizon:completeYear===null?null:capacities.slice(completeYear-1).every(v=>v>=reductionTarget-1e-10),
      maximum_durable_reduction_pct_at_debt_freedom_through_horizon:atDebtFree?.fundable_nondecreasing_reduction_pct??null,
      perpetual_financing_verified:false,allocation_views_are_alternatives:true,
      policy_status:'capacity_stress_not_authorized_rate_reversals'}:{}),
    annual_rows:rows};
}
