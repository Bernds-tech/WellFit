import {createPayroll2026} from './werk-payroll-2026.mjs';
import {standardAnnualAssessment} from './werk-annual-assessment-2026.mjs';

// Candidate, not enacted law. Smooth contribution AMOUNTS to the right of each
// threshold. This leaves every contribution <= its same-year statutory baseline.
export function contributionCalculator({thresholds,rates,width,reductionShare=0}) {
  if(!Array.isArray(thresholds)||!Array.isArray(rates)||rates.length!==thresholds.length+1||!thresholds.length||
    ![50,100,150].includes(width)||!Number.isFinite(reductionShare)||reductionShare<0||reductionShare>.5||
    thresholds.some((t,i)=>!Number.isFinite(t)||t<1500||t+width>3500||(i>0&&t-thresholds[i-1]<=width))||
    rates.some((r,i)=>!Number.isFinite(r)||r<0||r>2.95||(i>0&&r<rates[i-1])))throw Error('Invalid transition specification');
  return gross=>{
    if(!Number.isFinite(gross)||gross<1500||gross>3500)throw Error('Outside uncapped transition scope');
    const band=thresholds.filter(t=>gross>t).length;
    const step=gross*rates[band]/100;
    const t=thresholds[band-1];
    const rebate=band>0&&gross<t+width?t*(rates[band]-rates[band-1])/100*(1-(gross-t)/width):0;
    return {statutory_eur:step*(1-reductionShare),candidate_eur:(step-rebate)*(1-reductionShare),
      contribution_loss_eur:rebate*(1-reductionShare)};
  };
}

export function transitionPayroll2026(kernel,rules,{region,width,reductionShare=0}) {
  if(kernel.social_insurance?.monthly_max_base_eur!==6930||rules.rule_year!==2026||!['outside_vienna','vienna'].includes(region))throw Error('Outside 2026 annual-net scope');
  const schedule=kernel.social_insurance.employee_unemployment_rate_schedule;
  if(JSON.stringify(schedule.slice(0,-1).map(x=>x.gross_upper_eur))!=='[2225,2427,2630]'||
    JSON.stringify(schedule.map(x=>x.rate_pct))!=='[0,1,2,2.95]')throw Error('Not the 2026 reference schedule');
  const av=contributionCalculator({thresholds:schedule.slice(0,-1).map(x=>x.gross_upper_eur),rates:schedule.map(x=>x.rate_pct),width,reductionShare});
  const reduced=structuredClone(kernel);
  for(const key of ['health','pension'])reduced.social_insurance.employee_core_rates_pct[key]*=1-reductionShare;
  // Flat effective AV rate is valid only for this model's 14 EQUAL payments.
  const calculate=(gross,amount)=>{
    const k={...reduced,social_insurance:{...reduced.social_insurance,employee_unemployment_rate_schedule:[{gross_upper_eur:null,rate_pct:amount/gross*100}]}};
    const p=createPayroll2026(k).constantSalaryEmployerWithholding({monthlyGross:gross,region});
    const a=standardAnnualAssessment(p,rules);
    return {annual_contributions_eur:p.runningSvAnnual+p.specialSvAnnual,annual_tax_eur:a.annual_assessed_tax_eur,annual_net_eur:a.annual_net_after_assessment_eur};
  };
  return gross=>{
    const amounts=av(gross),baseline=calculate(gross,amounts.statutory_eur),candidate=calculate(gross,amounts.candidate_eur);
    return {monthly_gross_eur:gross,baseline,candidate,
      annual_contribution_loss_eur:baseline.annual_contributions_eur-candidate.annual_contributions_eur,
      annual_tax_recapture_eur:candidate.annual_tax_eur-baseline.annual_tax_eur,
      annual_net_gain_eur:candidate.annual_net_eur-baseline.annual_net_eur};
  };
}
