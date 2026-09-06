export const finite = (x, label = 'number') => {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error(`Invalid ${label}: ${x}`);
  return x;
};
export const nonnegative = (x, label) => {
  finite(x, label); if (x < 0) throw new Error(`Negative ${label}`); return x;
};
export const round = (x, digits = 6) => Number(finite(x).toFixed(digits));
export const sum = xs => xs.reduce((s, x) => s + finite(x), 0);
export function cashflow({gross, running, transition, ramp, discountPct = 3}) {
  finite(gross, 'gross'); nonnegative(running, 'running'); nonnegative(transition, 'transition');
  nonnegative(discountPct, 'discount rate');
  if (!Array.isArray(ramp) || !ramp.length) throw new Error('Missing ramp');
  let cumulative = -transition, npv = -transition;
  const rows = ramp.map((share, i) => {
    nonnegative(share, 'ramp'); if (share > 1) throw new Error('Ramp above one');
    const annualNet = gross * share - running;
    cumulative += annualNet; npv += annualNet / (1 + discountPct / 100) ** (i + 1);
    return {year: i + 1, gross_mio: round(gross * share), running_cost_mio: running,
      annual_net_mio: round(annualNet), cumulative_net_mio: round(cumulative), npv_mio: round(npv)};
  });
  // A first crossing is not sufficient if subsequent annual losses erase it.
  const stableBreakEven = rows.findIndex((r, i) => r.cumulative_net_mio >= 0 && rows.slice(i).every(x => x.cumulative_net_mio >= 0));
  return {transition_cost_mio: transition, rows, break_even_year_within_horizon: stableBreakEven < 0 ? null : stableBreakEven + 1};
}
export function repayment({debt, annualBase, ratePct, reinvestShare, years = 100}) {
  nonnegative(debt, 'debt'); nonnegative(annualBase, 'repayment'); nonnegative(ratePct, 'rate');
  nonnegative(reinvestShare, 'reinvestment');
  if (reinvestShare > 1 || !Number.isInteger(years) || years < 1) throw new Error('Invalid repayment settings');
  let remaining = debt, interestCumulative = 0, baseCumulative = 0, reinvestCumulative = 0;
  const rows = [];
  for (let year = 1; year <= years; year++) {
    const interest = (debt - remaining) * ratePct / 100;
    const base = Math.min(remaining, annualBase);
    const reinvested = Math.min(Math.max(0, remaining - base), interest * reinvestShare);
    remaining = Math.max(0, remaining - base - reinvested);
    interestCumulative += interest; baseCumulative += base; reinvestCumulative += reinvested;
    rows.push({year, remaining_debt_bn: round(remaining), base_repayment_bn: round(base),
      interest_benefit_bn: round(interest), reinvested_interest_bn: round(reinvested),
      cumulative_principal_reduction_bn: round(debt - remaining), cumulative_base_repayment_bn: round(baseCumulative),
      cumulative_interest_benefit_bn: round(interestCumulative), cumulative_reinvested_interest_bn: round(reinvestCumulative)});
  }
  return {starting_debt_bn: debt, annual_base_repayment_bn: annualBase, rate_pct: ratePct,
    reinvest_share: reinvestShare, repayment_complete_year: debt === 0 ? 0 : (rows.find(x => x.remaining_debt_bn === 0)?.year ?? null), rows};
}
export function fundingCredit(items, reformIds) {
  const seen = new Set(); let total = 0, verifiedCount = 0;
  for (const item of items) {
    if (seen.has(item.reform_id)) throw new Error('Duplicate funding reform'); seen.add(item.reform_id);
    if (item.reform_id !== 'OTHER' && !reformIds.includes(item.reform_id)) throw new Error(`Unknown reform ${item.reform_id}`);
    const v = item.verified_annual_net_eur_billion;
    if (v === null) continue;
    finite(v, 'verified net');
    if (item.reform_id === 'OTHER') throw new Error('Unallocated funding credit');
    // A newly credited effect requires a reviewed update to this calculation contract.
    if (!item.verification_evidence) throw new Error('Missing funding verification evidence');
    total += v; verifiedCount++;
  }
  return {verified_annual_net_bn: round(total), verified_count: verifiedCount};
}
