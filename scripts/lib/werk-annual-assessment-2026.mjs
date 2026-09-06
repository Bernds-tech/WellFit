import {finite,nonnegative} from './werk-calculation.mjs';

// Full-year standard employee only; figures precede payslip cent and assessment
// whole-euro rounding. §41 keeps fixed-rate special pay outside tariff income.
export function annualTariff(income,rules) {
  nonnegative(income,'annual taxable income');
  let lower=0,tax=0;
  for(const [upper,rate] of rules.annual_tariff_bands) {
    tax+=Math.max(0,Math.min(income,upper??Infinity)-lower)*rate;
    if(upper===null||income<=upper)break;
    lower=upper;
  }
  return tax;
}

export function annualCredits(income,refundBase,rules) {
  nonnegative(income,'income');nonnegative(refundBase,'refund base');
  const s=rules.supplement,r=rules.sv_refund;
  const supplement=s.maximum_eur*Math.max(0,Math.min(1,
    (s.income_zero_from_eur-income)/(s.income_zero_from_eur-s.income_full_until_eur)));
  const tariff=annualTariff(income,rules);
  const afterCredits=tariff-rules.annual_traffic_credit_eur-supplement;
  // §33(8)(5): the 55% refund is additionally capped by negative tariff tax.
  const refund=Math.min(Math.max(0,-afterCredits),refundBase*r.rate,
    r.base_cap_eur+(supplement>0?r.bonus_cap_eur:0));
  return {tariff_eur:tariff,traffic_supplement_eur:supplement,
    sv_refund_eur:refund,ordinary_tax_after_refund_eur:Math.max(0,afterCredits)-refund};
}

export function assessedSpecialTax(gross,contributions,rules) {
  nonnegative(gross,'special gross');nonnegative(contributions,'special contributions');
  const s=rules.special_recalculation;
  if(contributions>gross||gross>s.max_sixth_for_cap_eur)throw Error('Special pay outside assessed standard scope');
  if(gross<=s.gross_freigrenze_eur)return 0;
  const base=gross-contributions;
  return Math.min(Math.max(0,base-s.free_amount_eur)*s.standard_rate,
    Math.max(0,base-s.cap_base_threshold_after_contributions_eur)*s.cap_rate);
}

export function standardAnnualAssessment(payroll,rules) {
  const p=payroll,s=rules.scope;
  for(const k of ['monthlyGross','annualGross','runningSvAnnual','specialSvAnnual',
    'runningTaxAnnual','specialFixedTaxAnnual','payrollNetBeforeAssessment'])finite(p[k],k);
  if(rules.rule_year!==2026||p.monthlyGross<s.monthly_gross_min_eur||p.monthlyGross>s.monthly_gross_max_eur||
    !s.regions.includes(p.region)||Math.abs(p.annualGross-p.monthlyGross*14)>1e-7)
    throw Error('Outside annual assessment scope');
  nonnegative(p.runningSvAnnual,'running contributions');nonnegative(p.specialSvAnnual,'special contributions');
  if(p.runningSvAnnual>p.monthlyGross*12)throw Error('Contributions exceed running gross');
  const income=Math.max(0,p.monthlyGross*12-p.runningSvAnnual-rules.annual_standard_expense_allowance_eur);
  const refundBase=p.runningSvAnnual+p.specialSvAnnual;
  const c=annualCredits(income,refundBase,rules);
  const special=assessedSpecialTax(p.monthlyGross*2,p.specialSvAnnual,rules);
  const tax=c.ordinary_tax_after_refund_eur+special;
  const net=p.annualGross-refundBase-tax;
  return {annual_taxable_income_eur:income,refund_contribution_base_eur:refundBase,...c,
    assessed_special_tax_eur:special,special_tax_correction_eur:p.specialFixedTaxAnnual-special,
    annual_assessed_tax_eur:tax,annual_net_after_assessment_eur:net,
    assessment_settlement_eur:net-p.payrollNetBeforeAssessment};
}

export function assessedRelief(relief,rules) {
  const before=standardAnnualAssessment(relief.before,rules),after=standardAnnualAssessment(relief.after,rules);
  const extraTax=after.annual_assessed_tax_eur-before.annual_assessed_tax_eur;
  return {before,after,annual_net_gain_eur:after.annual_net_after_assessment_eur-before.annual_net_after_assessment_eur,
    extra_assessed_tax_including_refund_change_eur:extraTax,
    gain_change_from_withholding_eur:after.assessment_settlement_eur-before.assessment_settlement_eur};
}
