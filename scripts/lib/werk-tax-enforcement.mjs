import assert from 'node:assert/strict';
const nonnegative=x=>{assert.ok(typeof x==='number'&&Number.isFinite(x)&&x>=0,'finite nonnegative number required');return x;};
export function breakEven({annualCost,initialCost,ramp,cashShare,lag,horizon,discountPct}) {
  [annualCost,initialCost,discountPct].forEach(nonnegative);
  assert.ok(Number.isInteger(horizon)&&horizon>=1&&horizon<=100);
  assert.ok(Number.isInteger(lag)&&lag>=0&&lag<=100);
  assert.ok(typeof cashShare==='number'&&Number.isFinite(cashShare)&&cashShare>0&&cashShare<=1);
  assert.ok(Array.isArray(ramp)&&ramp.length>=horizon);
  ramp.forEach(x=>{nonnegative(x);assert.ok(x<=1);});
  const rows=Array.from({length:horizon},(_,i)=>{
    const year=i+1, cohort=year-lag;
    return {year,assessment_cohort:cohort>0?cohort:null,cash_per_mio_steady_assessment:cohort>0?ramp[cohort-1]*cashShare:0,annual_cost_mio:annualCost,discount_factor:1/(1+discountPct/100)**year};
  });
  const cost=initialCost+horizon*annualCost, pvCost=initialCost+rows.reduce((s,r)=>s+r.annual_cost_mio*r.discount_factor,0);
  const factor=rows.reduce((s,r)=>s+r.cash_per_mio_steady_assessment,0),pvFactor=rows.reduce((s,r)=>s+r.cash_per_mio_steady_assessment*r.discount_factor,0);
  return {horizon_years:horizon,cash_share:cashShare,lag_years:lag,total_cost_mio:cost,pv_cost_mio:pvCost,receipt_factor:factor,pv_receipt_factor:pvFactor,
    required_steady_annual_assessment_mio:factor>0?cost/factor:null,required_steady_annual_assessment_npv_mio:pvFactor>0?pvCost/pvFactor:null,
    status:factor>0?'conditional_threshold':'no_receipts_within_horizon',steady_operating_break_even_assessment_mio:annualCost/cashShare,rows};
}
