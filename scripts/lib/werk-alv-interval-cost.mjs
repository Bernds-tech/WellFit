import {contributionCalculator} from './werk-alv-transition.mjs';

const integer=(x,label)=>{if(!Number.isSafeInteger(x)||x<0)throw Error(`Invalid ${label}`);return x;};
const cents=(x,label)=>{if(!Number.isFinite(x)||Math.abs(x*100-Math.round(x*100))>1e-7)throw Error(`Invalid cent-valued ${label}`);return integer(Math.round(x*100),label);};
const max=(a,b)=>a>b?a:b,min=(a,b)=>a<b?a:b;

// Exact rational arithmetic for the gross incremental candidate loss, BEFORE
// contribution rounding. No tax recapture, population extrapolation or core-cut cost.
export function intervalCostBound(schedule,width,reductionShare,population) {
  contributionCalculator({...schedule,width,reductionShare});
  if(![0,.5].includes(reductionShare))throw Error('Unsupported core reduction share');
  if(population?.unit!=='eligible_separate_payment_records'||population.reference!=='conditional_scenario'||
    population.scope!=='standard_employee_same_rate_and_charge_base_employee_bears_dn'||
    population.payment_kind!=='ordinary'&&population.payment_kind!=='special')throw Error('Incompatible population scope/unit');
  const lo=cents(population.lower_eur,'lower'),hi=cents(population.upper_eur,'upper');
  const count=integer(population.count,'count');
  if(lo<150000||hi>350000||lo>hi)throw Error('Outside standard interval scope');
  const n=BigInt(count),w=BigInt(cents(width,'width')),factor=reductionShare===0?2n:1n;
  const thresholds=schedule.thresholds.map(t=>cents(t,'threshold'));
  const rates=schedule.rates.map(r=>cents(r,'rate in basis points'));
  const denominator=100n*10000n*w*2n;
  const loss=g=>{
    const i=thresholds.findIndex(t=>g>t&&BigInt(g-t)<w);
    return i<0?0n:BigInt(thresholds[i])*BigInt(rates[i+1]-rates[i])*(w-BigInt(g-thresholds[i]))*factor;
  };
  const points=new Set([lo,hi]);
  for(const t of thresholds)for(const g of [t,t+1,t+Number(w)-1,t+Number(w)])if(g>=lo&&g<=hi)points.add(g);
  const values=[...points].map(g=>({gross_cent:g,numerator:loss(g)}));
  let lower=values.reduce((a,b)=>min(a,b.numerator),values[0].numerator)*n;
  let upper=values.reduce((a,b)=>max(a,b.numerator),0n)*n;
  let sum=null,used=false;
  if(population.base_sum_eur!==null){
    sum=BigInt(cents(population.base_sum_eur,'base sum'));
    if(sum<n*BigInt(lo)||sum>n*BigInt(hi))throw Error('Infeasible interval count/sum');
    const ramp=thresholds.findIndex(t=>lo>t&&hi<=t+Number(w));
    if(ramp>=0){
      const t=BigInt(thresholds[ramp]);
      lower=upper=t*BigInt(rates[ramp+1]-rates[ramp])*(n*(t+w)-sum)*factor;used=true;
    }else if(lower===upper){used=true;}
  }
  const exact=lower===upper;
  const safe=x=>{if(x>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Result exceeds safe numeric presentation');return Number(x);};
  return {
    payment_records:count,lower_eur:Number(lower)/Number(denominator),upper_eur:Number(upper)/Number(denominator),
    lower_cent_outward:safe(lower*100n/denominator),upper_cent_outward:safe((upper*100n+denominator-1n)/denominator),
    exact_model_cost_eur:exact?Number(lower)/Number(denominator):null,
    base_sum_used:used,method:exact?'exact_affine_or_constant':'count_interval_extrema',
    sum_limitation:sum!==null&&!used?'Sum feasible but unused across changes of formula; split interval.':null,
    exact_rational_eur:{lower_numerator:String(lower),upper_numerator:String(upper),denominator:String(denominator)},
    national_cost_eur:null,employee_net_eur:null,verified_budget_credit_eur:0
  };
}

// A complete, non-overlapping cent grid for a requested schedule and width.
// Ordinary/special records and legal cohorts must be delivered in separate tables.
export function requestedIntervals(schedule,width) {
  contributionCalculator({...schedule,width,reductionShare:0});
  const edges=new Set([150000,350001]);
  for(const t of schedule.thresholds){const c=cents(t,'threshold');edges.add(c+1);edges.add(c+cents(width,'width'));}
  const a=[...edges].sort((x,y)=>x-y);
  return a.slice(0,-1).map((lo,i)=>({lower_eur:lo/100,upper_eur:(a[i+1]-1)/100}));
}

export function costIntervalTable(schedule,width,reductionShare,table) {
  if(!Array.isArray(table?.rows)||!table.rows.length)throw Error('Missing interval rows');
  integer(table.expected_payment_records,'expected payment records');
  const sorted=[...table.rows].sort((a,b)=>a.lower_eur-b.lower_eur);
  const results=sorted.map((row,i)=>{
    if(i&&row.lower_eur<=sorted[i-1].upper_eur)throw Error('Overlapping or duplicate intervals');
    return intervalCostBound(schedule,width,reductionShare,{...row,unit:table.unit,reference:table.reference,
      scope:table.scope,payment_kind:table.payment_kind});
  });
  const count=results.reduce((n,r)=>n+BigInt(r.payment_records),0n);
  if(count!==BigInt(table.expected_payment_records))throw Error('Payment count does not reconcile');
  const denominator=BigInt(results[0].exact_rational_eur.denominator);
  const lower=results.reduce((n,r)=>n+BigInt(r.exact_rational_eur.lower_numerator),0n);
  const upper=results.reduce((n,r)=>n+BigInt(r.exact_rational_eur.upper_numerator),0n);
  const lowerCent=lower*100n/denominator,upperCent=(upper*100n+denominator-1n)/denominator;
  if(upperCent>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Table exceeds safe numeric presentation');
  return {payment_records:Number(count),row_results:results,lower_eur:Number(lower)/Number(denominator),
    upper_eur:Number(upper)/Number(denominator),lower_cent_outward:Number(lowerCent),upper_cent_outward:Number(upperCent),
    exact_model_cost_eur:lower===upper?Number(lower)/Number(denominator):null,
    exact_rational_eur:{lower_numerator:String(lower),upper_numerator:String(upper),denominator:String(denominator)},
    national_cost_eur:null,employee_net_eur:null,verified_budget_credit_eur:0};
}
