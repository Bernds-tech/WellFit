import {employeeRelief} from './werk-post-debt-sv.mjs';
import {assessedRelief} from './werk-annual-assessment-2026.mjs';

export function thresholdCalculator(kernel,annualRules,{region,reductionShare}) {
  if(!['outside_vienna','vienna'].includes(region)||!Number.isFinite(reductionShare)||reductionShare<0||reductionShare>.5)
    throw Error('Outside threshold scenario scope');
  return gross=>{
    const relief=employeeRelief(kernel,{monthlyGross:gross,region,reductionShare});
    const assessed=assessedRelief(relief,annualRules).after;
    return {monthly_gross_eur:gross,annual_gross_eur:relief.after.annualGross,
      annual_contributions_eur:relief.after.runningSvAnnual+relief.after.specialSvAnnual,
      annual_assessed_tax_eur:assessed.annual_assessed_tax_eur,
      annual_net_eur:assessed.annual_net_after_assessment_eur};
  };
}

// Integer-cent binary search within the next uninterrupted contribution band.
// This is the first cent of monthly gross restoring ANNUAL model net, not a rounded payslip quote.
export function recoveryGross(calc,threshold,nextThreshold) {
  if(!Number.isFinite(threshold)||!Number.isFinite(nextThreshold)||threshold<1500||nextThreshold<=threshold||nextThreshold>10000)
    throw Error('Invalid recovery search bounds');
  const target=calc(threshold).annual_net_eur;
  if(!Number.isFinite(target))throw Error('Invalid net target');
  let low=Math.round(threshold*100)+1,high=Math.round(nextThreshold*100);
  const net=cents=>{const x=calc(cents/100).annual_net_eur;if(!Number.isFinite(x))throw Error('Invalid net calculation');return x;};
  if(net(high)<target)throw Error('Recovery not identified within next band');
  while(low<high){const mid=Math.floor((low+high)/2);if(net(mid)>=target)high=mid;else low=mid+1;}
  return low/100;
}
