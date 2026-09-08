import {contributionCalculator} from './werk-alv-transition.mjs';

// A gross ALV-receipt bound for known comparable payment records, not persons.
// Cent-valued bases, exactly the uncapped standard transition scope (1500–3500).
export function paymentCostBound(schedule,width,reductionShare,population) {
  contributionCalculator({...schedule,width,reductionShare}); // validate schedule
  if(population?.unit!=='eligible_separate_payment_records'||population.reference!=='conditional_scenario'||
    !Number.isSafeInteger(population.count)||population.count<0)throw Error('Unidentified or incompatible payment population');
  const candidates=schedule.thresholds.map((t,i)=>({gross_eur:t+.01,
    loss_eur:t*(schedule.rates[i+1]-schedule.rates[i])/100*(1-.01/width)*(1-reductionShare)}));
  const peak=candidates.reduce((a,b)=>a.loss_eur>b.loss_eur?a:b);
  return {payment_records:population.count,lower_eur:0,upper_eur:peak.loss_eur*population.count,
    maximum_per_payment_eur:peak.loss_eur,binding_gross_eur:peak.gross_eur};
}

// Only gross contribution effects. Unequal months must never go through the
// existing constant-salary annual NET function.
export function annualContributionExample(schedule,width,reductionShare,ordinary,special,insuranceDays=360) {
  if(!Array.isArray(ordinary)||ordinary.length!==12||!Array.isArray(special)||special.length!==2||insuranceDays!==360)
    throw Error('Outside illustrative one-employer 12+2 payment scope');
  const calc=contributionCalculator({...schedule,width,reductionShare}),payments=[...ordinary,...special];
  if(payments.some(g=>!Number.isFinite(g)||Math.abs(g*100-Math.round(g*100))>1e-7))throw Error('Payments must have cent-valued gross');
  const values=payments.map(calc),sum=key=>values.reduce((a,x)=>a+x[key],0),gross=payments.reduce((a,x)=>a+x,0);
  return {annual_gross_eur:gross,insurance_days:insuranceDays,normalized_monthly_income_eur:gross/insuranceDays*30,
    annual_statutory_alv_eur:sum('statutory_eur'),annual_candidate_alv_eur:sum('candidate_eur'),
    annual_smoothing_contribution_loss_eur:sum('contribution_loss_eur'),annual_net_eur:null};
}
