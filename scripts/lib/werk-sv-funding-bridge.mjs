const money=(x,name,negative=false)=>{
  if(!Number.isFinite(x)||Math.abs(x)>1e6||(!negative&&x<0))throw Error(`Invalid ${name}`);
  return x;
};
const rounded=x=>Math.round(x*1e10)/1e10;

// Annual consolidated accounting bridge, not a debt trajectory or cash release.
// The contribution loss must be NET of any separately evidenced tax recapture.
export function fundingBridge({balance_bn,interest_bn,avoided_interest_bn,relief_cost_bn,
  target_surplus_bn,deficit_debt_adjustment_bn}) {
  money(balance_bn,'signed balance',true);money(interest_bn,'interest');
  money(avoided_interest_bn,'avoided interest');money(relief_cost_bn,'relief cost');
  money(target_surplus_bn,'target surplus');money(deficit_debt_adjustment_bn,'debt adjustment',true);
  if(avoided_interest_bn>interest_bn)throw Error('Savings exceed reference interest');
  const before=balance_bn+avoided_interest_bn-relief_cost_bn;
  const improvement=Math.max(0,target_surplus_bn-before),after=before+improvement;
  return Object.fromEntries(Object.entries({
    balance_after_saving_and_relief_bn:before,required_additional_primary_improvement_bn:improvement,
    achieved_balance_bn:after,remaining_interest_bn:interest_bn-avoided_interest_bn,
    resulting_primary_balance_bn:after+interest_bn-avoided_interest_bn,
    debt_change_with_held_adjustment_bn:-after+deficit_debt_adjustment_bn,
    debt_adjustment_is_conditional_reference:true,verified_budget_credit_bn:0
  }).map(([k,v])=>[k,typeof v==='number'?rounded(v):v]));
}

export function surplusForDebtReduction(netReduction,adjustment) {
  money(netReduction,'net reduction');money(adjustment,'debt adjustment',true);
  return rounded(Math.max(0,netReduction+adjustment));
}
