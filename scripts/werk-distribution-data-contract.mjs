import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const fail = m => { throw new Error(m); };
const eq = (a,b,tol,msg) => { if (Math.abs(a-b) > tol) fail(`${msg}: ${a} != ${b}`); };
const d = read('werk-data/distribution-baseline-2025-2026.json');
const framework = read('werk-data/bud01-distribution-model-framework.json');
const gaps = read('werk-data/analysis-data-closure-register.json');

const silc = d.silc_income_2025;
if (silc.households_thousand !== 4181 || silc.persons_thousand !== 9041) fail('EU-SILC population/household anchor mismatch');
for (const row of [silc.overall_household_net_income_eur_year, silc.overall_equivalised_net_income_eur_year, ...silc.household_types, ...silc.equivalised_household_type_medians_eur_year]) {
  if (![row.q25,row.median,row.q75].every(Number.isFinite)) fail(`Invalid income quartiles ${row.id||'overall'}`);
  if (!(row.q25 <= row.median && row.median <= row.q75)) fail(`Income quartile ordering failed ${row.id||'overall'}`);
}
const byId = new Map(silc.household_types.map(x=>[x.id,x]));
eq(byId.get('single_male_pension').households_thousand + byId.get('single_female_pension').households_thousand + byId.get('multi_pension').households_thousand, byId.get('pension_households').households_thousand, 0, 'Pension household subtype total');
eq(byId.get('single_male_non_pension').households_thousand + byId.get('single_female_non_pension').households_thousand + byId.get('multi_no_children_non_pension').households_thousand + byId.get('households_with_children').households_thousand, byId.get('non_pension_households').households_thousand, 0, 'Non-pension household subtype total');
eq(byId.get('single_parent').households_thousand + byId.get('multi_one_child').households_thousand + byId.get('multi_two_children').households_thousand + byId.get('multi_three_plus_children').households_thousand, byId.get('households_with_children').households_thousand, 0, 'Households-with-children subtype total');
eq(byId.get('pension_households').households_thousand + byId.get('non_pension_households').households_thousand, silc.households_thousand, 1, 'Pension/non-pension total with published rounding');
const w=silc.eu_equivalence_scale;
if (!(w.first_adult===1 && w.additional_person_14_plus===0.5 && w.child_under_14===0.3)) fail('EU equivalence scale mismatch');

const p=d.poverty_social_inclusion_2025;
if (p.current_revised.arope_pct !== 18.6 || p.current_revised.at_risk_of_poverty_pct !== 15.9) fail('Current revised poverty indicators mismatch');
if (p.initial_release_2026_04_29.arope_pct !== 18.8 || p.initial_release_2026_04_29.at_risk_of_poverty_pct !== 16.0) fail('Initial poverty release history mismatch');
if (p.current_revised.arope_pct === p.initial_release_2026_04_29.arope_pct) fail('Revision history collapsed into current value');
eq(p.current_revised.poverty_threshold_single_eur_year / 12, p.current_revised.poverty_threshold_single_eur_month_rounded, 0.5, 'Current poverty monthly/year threshold rounding');
if (!String(p.revision_rule).includes('Current revised values are canonical')) fail('Poverty revision precedence guard missing');

const c=d.consumption_2024_25;
const avgShare=Object.values(c.average_household_shares_pct).reduce((a,b)=>a+b,0);
eq(avgShare,100,0.2,'Average consumption shares');
for (const key of ['monthly_household_expenditure_decile_boundaries_eur','monthly_equivalised_expenditure_decile_boundaries_eur']) {
  const a=c[key];
  if (!Array.isArray(a)||a.length!==9||a.some(v=>!Number.isFinite(v))) fail(`${key} invalid`);
  for (let i=1;i<a.length;i++) if (!(a[i]>a[i-1])) fail(`${key} not strictly increasing at ${i}`);
}
for (const [id,row] of Object.entries(c.selected_equivalised_expenditure_structure_pct)) eq(Object.values(row).reduce((a,b)=>a+b,0),100,0.2,`${id} selected expenditure shares`);
if (!String(c.interpretation).includes('keine Einkommensdezile')) fail('Consumption-vs-income decile scope guard missing');

const h=d.housing_costs_2025;
if (h.households_thousand !== silc.households_thousand) fail('Housing/SILC household universe mismatch');
if (!(h.average_housing_cost_share_income_pct > h.average_energy_cost_share_income_pct)) fail('Housing/energy burden relationship unexpected');
if (!(h.tenure_overburden_pct.other_main_rental > h.tenure_overburden_pct.house_ownership)) fail('Housing tenure burden anchor failed');
if (!(h.household_type_median_housing_share_pct.single_parent > h.household_type_median_housing_share_pct.multi_with_children)) fail('Single-parent housing burden anchor failed');

const tax=d.tax_parameters_2026;
const tariff=tax.income_tax_tariff;
if (!Array.isArray(tariff)||tariff.length!==7) fail('2026 tariff must have 7 bands');
const expectedRates=[0,20,30,40,48,50,55];
tariff.forEach((r,i)=>{ if(r.marginal_rate_pct!==expectedRates[i]) fail(`Tariff rate mismatch band ${i}`); if(i>0 && r.lower_exclusive!==tariff[i-1].upper_inclusive) fail(`Tariff boundary gap/overlap band ${i}`); });
if (tariff[0].upper_inclusive !== 13539 || tariff[5].upper_inclusive !== 1000000 || tariff[6].upper_inclusive !== null) fail('Key 2026 tax boundaries mismatch');
if (!(tax.employee_minimum_tax_free_income_before_special_payments_eur > tariff[0].upper_inclusive)) fail('Employee tax-free minimum must remain distinct from zero-rate tariff threshold');
if (!(tax.traffic_supplement_full_to_income_eur < tax.traffic_supplement_taper_to_income_eur)) fail('Traffic-credit taper limits invalid');

const sv=d.social_insurance_parameters_2026;
if (sv.monthly_max_contribution_base_eur!==6930 || sv.annual_special_payment_max_base_eur!==13860 || sv.monthly_marginal_employment_limit_eur!==551.10) fail('Core 2026 SV thresholds mismatch');
const av=sv.employee_unemployment_rate_schedule;
if (!Array.isArray(av)||av.length!==4) fail('AV schedule length mismatch');
const avRates=[0,1,2,2.95];
av.forEach((r,i)=>{ if(r.rate_pct!==avRates[i]) fail(`AV rate mismatch ${i}`); if(i>0 && r.monthly_gross_lower_exclusive_eur!==av[i-1].monthly_gross_upper_eur) fail(`AV threshold gap/overlap ${i}`); });
if (av[3].monthly_gross_upper_eur!==null) fail('Top AV band must be open ended');
if (!(sv.contribution_income_anchor_2024_eur_month_including_special_payments.men > sv.contribution_income_anchor_2024_eur_month_including_special_payments.women)) fail('Contribution-income sex anchor unexpected');

const f=d.family_parameters_2026;
const fa=f.family_allowance_eur_month_by_child_age;
if (!Array.isArray(fa)||fa.length!==4) fail('Family allowance age bands missing');
for(let i=1;i<fa.length;i++) if(!(fa[i].from_age>fa[i-1].from_age && fa[i].amount>=fa[i-1].amount)) fail('Family allowance age/amount ordering invalid');
if (f.child_tax_credit_cash_eur_month!==70.90 || f.family_bonus_plus_eur_year.under_18!==2000 || f.family_bonus_plus_eur_year.after_month_of_18th_birthday!==700) fail('Family core parameter mismatch');
if (!String(f.rule).includes('Steuerabsetzbetrag')) fail('Family cash-vs-tax-credit guard missing');

const requiredBoundaries=['observed_net_income','taxable_income','gross_payroll','consumption','housing','cash_transfer','in_kind'];
for(const k of requiredBoundaries) if(!d.model_boundaries?.[k]) fail(`Missing distribution model boundary ${k}`);
const prohibited=(d.prohibited_shortcuts||[]).join(' ');
for(const token of ['EU-SILC','Ausgabendezile','Armuts-Erstmeldung','Bruttogehalt','13./14.','Sozialversicherung','Familienbonus','Landes-/Gemeindetransfers']) if(!prohibited.includes(token)) fail(`Distribution prohibited-shortcut guard missing ${token}`);

for(const closed of ['DIST_A_silc_household_income_quartiles_2025','DIST_B_current_poverty_and_revision_history_2025','DIST_C_consumption_average_and_decile_boundaries_2024_25','DIST_D_housing_cost_burdens_2025']) if(!String(d.coverage?.[closed]).startsWith('closed')) fail(`Expected closed input gate ${closed}`);
for(const open of ['DIST_H_full_federal_state_municipal_transfer_rules','DIST_I_employee_net_income_engine_14_payments','DIST_J_effective_marginal_burden_engine','DIST_K_household_archetype_microsimulation','DIST_L_decile_reweighting_and_budget_reconciliation','DIST_M_in_kind_service_valuation']) if(d.coverage?.[open]!=='open') fail(`Distribution downstream gate must remain open: ${open}`);
if(d.coverage?.gap_tax_02_status!=='partially_closed_input_layer'||d.coverage?.gap_dist_01_status!=='partially_closed_input_layer') fail('Distribution/TAX-02 aggregate status must remain partial');

const gapIds=new Set((gaps.priority_1_data_gaps||[]).map(x=>x.id));
for(const id of ['GAP-TAX-02','GAP-DIST-01']) if(!gapIds.has(id)) fail(`Closure register missing ${id}`);
if(!Array.isArray(framework.mandatory_outputs_per_reform)||framework.mandatory_outputs_per_reform.length<8) fail('Distribution framework mandatory outputs unexpectedly incomplete');

console.log(`Distribution input contract OK: ${silc.households_thousand}k households, ${silc.persons_thousand}k persons, revised AROPE ${p.current_revised.arope_pct}%, ${c.monthly_equivalised_expenditure_decile_boundaries_eur.length+1} consumption deciles and 2026 tax/SV/family parameters are scope-separated; payroll, transfer and microsimulation gates remain open.`);
