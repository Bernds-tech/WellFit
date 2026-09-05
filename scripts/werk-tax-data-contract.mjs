import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const fail = m => { throw new Error(m); };
const eq = (a,b,tol,msg) => { if (Math.abs(a-b) > tol) fail(`${msg}: ${a} != ${b}`); };
const containsAll = (text,tokens) => tokens.every(t => text.toLowerCase().includes(t.toLowerCase()));

const t = read('werk-data/tax-baseline-2022-2025.json');
const b = read('werk-data/tax-social-contribution-branch-2024-2025.json');
const e = read('werk-data/tax-expenditure-priority-2024.json');
const gaps = read('werk-data/analysis-data-closure-register.json');

// TAX-A/B: S.13 and S.13+EU headline universes.
const s=t.general_government_s13_mrd;
if(JSON.stringify(s.years)!==JSON.stringify([2022,2023,2024,2025])) fail('S.13 year universe mismatch');
for(let i=0;i<s.years.length;i++){
  eq(s.tax_revenue[i]+s.social_contributions[i],s.taxes_plus_social_contributions[i],0.11,`${s.years[i]} S.13 taxes+social contributions`);
  if(!(s.total_government_revenue[i]>s.taxes_plus_social_contributions[i])) fail(`${s.years[i]} total government revenue must exceed taxes+social contributions`);
}
eq(s.tax_revenue[3],143.4,0.01,'2025 S.13 tax revenue anchor');
eq(s.social_contributions[3],83.0,0.01,'2025 S.13 social-contribution anchor');
eq(s.taxes_plus_social_contributions[3],226.4,0.01,'2025 S.13 taxes+social anchor');

const p=t.statistics_austria_tax_page_2025;
if(!(p.taxes_and_social_contributions_mrd>s.taxes_plus_social_contributions[3])) fail('S.13+S.212 total must remain above S.13-only anchor');
eq(p.taxes_and_social_contributions_mrd-s.taxes_plus_social_contributions[3],p.difference_vs_s13_mrd,0.01,'S.13+EU vs S.13 scope difference');
if(p.tax_ratio_pct_gdp!==44.3) fail('2025 tax-ratio anchor changed unexpectedly');
if(!String(p.reconciliation_rule).includes('nicht erzwungen gleichgesetzt')) fail('S.13/S.212 reconciliation guard missing');
if(p.freshness?.status!=='future_release_not_yet_available_as_of_2026-09-05') fail('2025 tax freshness gate must remain future as of check date');
if(!(Date.parse(p.freshness.next_publication)>Date.parse(t.checked_at))) fail('Next tax publication must be after checked_at');

// TAX-C: selected major S.13 tax items, explicitly incomplete.
const items=t.major_s13_tax_items_2023_2025_mrd;
const series=['social_insurance_contributions','value_added_tax','wage_tax','corporate_income_tax','employer_contributions_affb_flaf','assessed_income_tax','municipal_tax','mineral_oil_tax','co2_levy','energy_levy'];
for(const key of series) if(!Array.isArray(items[key])||items[key].length!==3||items[key].some(v=>!Number.isFinite(v))) fail(`Invalid selected S.13 series ${key}`);
const selected2025=series.filter(k=>k!=='social_insurance_contributions').reduce((sum,k)=>sum+items[k][2],0);
if(!(selected2025<s.tax_revenue[3])) fail('Selected 2025 tax items must remain incomplete subset');
if(!String(items.warning).includes('keine vollständige Zerlegung')) fail('Selected-tax incomplete-universe guard missing');

// TAX-D: federal UG16 result is not ESVG.
const u=t.federal_ug16_2025_mio;
eq(u.capital_yield_tax_dividends+u.capital_yield_tax_interest_and_other,u.capital_yield_tax_total,0.11,'UG16 capital-yield-tax identity');
if(Math.abs(u.wage_tax/1000-items.wage_tax[2])<0.05) fail('UG16 wage tax and S.13 wage tax must not be identical');
if(Math.abs(u.corporate_income_tax/1000-items.corporate_income_tax[2])<0.05) fail('UG16 KÖSt and S.13 KÖSt must not be identical');
if(!String(u.cross_universe_rule).includes('nicht mit ESVG-Werten gleichgesetzt')) fail('UG16/ESVG cross-universe guard missing');

// TAX-E: VAT advance-return base is not government VAT revenue.
const v=t.vat_advance_returns_2025_mio;
if(v.assessment_cases!==614879) fail('UVA 2025 assessment-case anchor mismatch');
eq(v.taxable_turnover-v.tax_exempt_turnover-v.taxable_turnover_20pct-v.taxable_turnover_10pct,v.published_columns_residual_mio,0.11,'UVA published-column residual');
if(!(v.vat_liability_or_credit_balance>0&&v.vat_liability_or_credit_balance<v.taxable_turnover)) fail('UVA liability/base relation invalid');
if(!String(v.residual_definition).includes('keine eigenständige Steuerkategorie')) fail('UVA residual non-category guard missing');
if(!String(v.note).includes('keine ESVG-Mehrwertsteuereinnahme')) fail('UVA/ESVG non-equivalence guard missing');

// TAX-F: aggregate tax expenditures.
const x=t.tax_expenditures_mio;
if(JSON.stringify(x.years)!==JSON.stringify([2022,2023,2024])) fail('Tax-expenditure year universe mismatch');
if(!x.quantified_indirect_subsidies.every((val,i,a)=>i===0||val>a[i-1])) fail('Tax-expenditure history expected increasing 2022-2024');
eq(x.quantified_indirect_subsidies[2]-x['2024_energy_crisis_temporary'],x['2024_crisis_adjusted_approx'],0,'2024 crisis-adjusted tax expenditure');
if(!(x.indirect_measures_in_federal_report>x.tax_savings_measures_in_transparency_database)) fail('Federal indirect-measure count must exceed TDB tax-savings count');
if(!String(x.coverage_warning).includes('nicht 1:1')) fail('Tax-expenditure non-collectability guard missing');

// TAX-H: branch reference bridge, deliberately non-identical to ESVG D.61.
if(JSON.stringify(b.years)!==JSON.stringify([2024,2025])) fail('Contribution-branch year universe mismatch');
const branchKeys=['pension_insurance_contributions_for_insured','health_insurance_contributions_for_insured','accident_insurance_contributions_for_insured','unemployment_insurance_contributions_federal_result'];
for(const key of branchKeys) if(!Array.isArray(b.branches_mio[key])||b.branches_mio[key].length!==2||b.branches_mio[key].some(v=>!Number.isFinite(v))) fail(`Invalid contribution branch ${key}`);
for(let i=0;i<2;i++){
  const sum=branchKeys.reduce((z,k)=>z+b.branches_mio[k][i],0);
  eq(sum,b.branch_reference_sum_mio[i],0.01,`${b.years[i]} branch-reference contribution sum`);
  eq(sum-b.esvg_s13_net_social_contributions_mio[i],b.difference_branch_reference_minus_esvg_mio[i],0.01,`${b.years[i]} branch-vs-ESVG difference`);
  if(Math.abs(sum-b.esvg_s13_net_social_contributions_mio[i])<100) fail(`${b.years[i]} branch sum must not be presented as ESVG identity`);
}
eq(b.esvg_s13_net_social_contributions_mio[0]/1000,s.social_contributions[2],0.01,'2024 branch bridge vs canonical S.13 social contributions');
eq(b.esvg_s13_net_social_contributions_mio[1]/1000,s.social_contributions[3],0.01,'2025 branch bridge vs canonical S.13 social contributions');
if(b.source_quality_by_year['2025'].pension!=='provisional'||b.source_quality_by_year['2025'].health!=='provisional'||b.source_quality_by_year['2025'].accident!=='provisional') fail('2025 PV/KV/UV must remain provisional');
if(b.coverage?.TAX_H3_branch_vs_esvg_scope_bridge!=='closed_as_non_identity_bridge') fail('Branch-vs-ESVG bridge status mismatch');
if(b.coverage?.TAX_H4_social_contributions_by_employer_employee_imputed_household_sector!=='open') fail('Employer/employee/imputed contribution split must remain open');
if(b.coverage?.TAX_H5_contribution_bases_by_branch_and_population_group!=='open') fail('Contribution-base detail must remain open');
if(!String(b.interpretation).includes('kein fehlender oder versteckter Beitragsposten')) fail('Branch-difference interpretation guard missing');

// TAX-I: selected verified high-volume measures, not a claimed full top-10.
if(e.status!=='selected-high-volume-measures-verified-not-full-93-ranking') fail('TAX-I status must reject full top-10 claim');
if(!Array.isArray(e.measures)||e.measures.length!==e.selected_measure_count||e.selected_measure_count!==10) fail('TAX-I selected-measure count mismatch');
const ids=new Set();let selectedSum=0;
for(const m of e.measures){
  if(!m.id||ids.has(m.id)) fail(`Duplicate/missing TAX-I measure id ${m.id}`);ids.add(m.id);
  if(!Number.isFinite(m.volume_2024_mio)||m.volume_2024_mio<=0) fail(`${m.id}: invalid 2024 volume`);
  if(!m.law||!m.legal_reference||!m.legal_reference_quality||!m.classification||!m.note) fail(`${m.id}: incomplete classification/legal fields`);
  selectedSum+=m.volume_2024_mio;
}
eq(selectedSum,e.selected_measure_sum_mio,0,'TAX-I selected measure sum');
eq(e.selected_measure_sum_mio+e.reconciliation.remaining_quantified_aggregate_mio,e.aggregate_anchor_mio,0,'TAX-I selected+remaining aggregate');
eq(e.selected_measure_sum_mio/e.aggregate_anchor_mio*100,e.selected_share_of_quantified_aggregate_pct,0.05,'TAX-I selected aggregate share');
eq(e.aggregate_anchor_mio,x.quantified_indirect_subsidies[2],0,'TAX-I aggregate vs canonical tax-expenditure anchor');
for(const required of ['TAXEXP-USTG-10','TAXEXP-GSBG','TAXEXP-ESTG-FAMILY','TAXEXP-ESTG-SEG-OT','TAXEXP-ESTG-RD']) if(!ids.has(required)) fail(`TAX-I required high-volume measure missing ${required}`);
if(!String(e.selection_rule).includes('Vollständige Rangbildung erfolgt erst')) fail('TAX-I no-full-ranking guard missing');
const prohibited=(e.prohibited_shortcuts||[]).join(' ');
for(const token of ['vollständig eintreibbares','WERK-Einsparung','dauerhafte Strukturwirkung','Top-10-Rangliste']) if(!prohibited.includes(token)) fail(`TAX-I prohibited-shortcut guard missing ${token}`);
if(!containsAll(prohibited,['Gesetzesgruppenwerte','Einzelmaßnahmen','addieren'])) fail('TAX-I double-counting guard must explicitly cover law-group values + contained individual measures + addition');
if(e.coverage?.TAX_I4_full_93_measure_inventory!=='open'||e.coverage?.TAX_I5_full_93_measure_ranking!=='open'||e.coverage?.TAX_I6_dynamic_net_revenue_models!=='open') fail('TAX-I full inventory/ranking/dynamic models must remain open');
if(e.coverage?.tax_i_status!=='partially_closed') fail('TAX-I status must remain partial');

// Global accounting guards and remaining TAX gates.
const rules=(t.accounting_rules||[]).join(' ');
for(const token of ['different scopes','different accounting universes','not government VAT revenue','not automatically collectable revenue','never multiplied mechanically','freshness gate']) if(!rules.toLowerCase().includes(token.toLowerCase())) fail(`Tax accounting guard missing ${token}`);
const bRules=(b.accounting_rules||[]).join(' ');
for(const token of ['not an ESVG identity','different institutional accounting views','general-government consolidation','cannot be multiplied','provisional']) if(!bRules.toLowerCase().includes(token.toLowerCase())) fail(`Contribution-branch guard missing ${token}`);
if(t.coverage?.TAX_G_esvg_detailed_tax_categories_by_collecting_sector!=='open_raw_ods_not_parsed') fail('Detailed ESVG tax/sector matrix must remain open');
if(t.coverage?.TAX_H_social_contributions_by_branch_and_sector!=='open') fail('Canonical TAX-H umbrella must remain open/partial');
if(t.coverage?.TAX_I_tax_expenditure_93_item_level_normalisation!=='open') fail('Canonical TAX-I umbrella must remain open until all 93 measures are normalised');
if(t.coverage?.TAX_K_2025_tax_revision_2026_09_30!=='future_release') fail('30 Sep tax revision must remain future-release gated');
if(t.coverage?.gap_tax_01_status!=='partially_closed'||b.coverage?.tax_h_status!=='partially_closed') fail('TAX baseline/branch status must remain partial');
const gap=(gaps.priority_1_data_gaps||[]).find(x=>x.id==='GAP-TAX-01');
if(!gap||gap.status!=='teilweise vorhanden') fail('GAP-TAX-01 closure register must remain partial');

console.log(`Tax core contract OK: S.13 2025 taxes+social EUR ${s.taxes_plus_social_contributions[3].toFixed(1)}bn; contribution branch remains non-identical to ESVG; ${e.selected_measure_count} selected tax expenditures EUR ${(e.selected_measure_sum_mio/1000).toFixed(3)}bn are reconciled to the quantified aggregate without treating law groups and contained measures as additive.`);
