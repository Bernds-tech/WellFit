import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cashflow, repayment, fundingCredit, finite, round, sum} from './lib/werk-calculation.mjs';
import {createPayroll2026} from './lib/werk-payroll-2026.mjs';

const sourceHashes = {};
const read = name => {
  const path = `werk-data/${name}.json`, raw = fs.readFileSync(path, 'utf8');
  sourceHashes[path] = createHash('sha256').update(raw).digest('hex'); return JSON.parse(raw);
};
const a = read('calculation-assumptions'), b = read('budget-baseline-2026-2031');
const funding = read('funding-matrix'), reforms = read('reforms').reforms;
const adm = read('admin-model'), tax = read('tax-compliance-model'), game = read('gambling-model');
const debt = read('debt-model'), labour = read('labour-time-care-constraints-2025');
const kernel = read('payroll-employee-kernel-2026'), gov = read('government-baseline-2025-2031');
const pension = read('pension-baseline-2024-2031'), health = read('health-baseline-2024-2031'), care = read('care-baseline-2024-2050');
const historical = read('fiscal-model');
const eq = (x,y,tol=1e-6) => assert.ok(Math.abs(finite(x)-finite(y)) <= tol, `${x} != ${y}`);
assert.deepEqual(a.horizons_years, [1,5,10]); assert.equal(a.gross_effect_ramp.length,10);
assert.ok(a.payroll.fulltime_weekly_hours>0); finite(a.payroll.fulltime_weekly_hours);
assert.ok(a.labour.fte_weekly_hours>0); finite(a.labour.fte_weekly_hours);
for(const u of a.labour.uptake_share_cases) { finite(u); assert.ok(u>=0&&u<=1); }
for(const h of a.labour.additional_weekly_hours_cases) { finite(h); assert.ok(h>=0); }
assert.deepEqual(a.payroll.regions,['outside_vienna','vienna']);
for(const h of a.payroll.weekly_hours_cases) { finite(h); assert.ok(h>0&&h<=a.payroll.fulltime_weekly_hours); }
for(const g of a.payroll.fulltime_monthly_gross_eur_cases) { finite(g); assert.ok(g>=3000&&g<=5000,'Payroll examples stay within reviewed gross scope'); }
assert.deepEqual(b.years,[2026,2027,2028,2029,2030,2031]);
for (const [k, values] of Object.entries(b.series)) {
  assert.equal(values.length,6,k); values.forEach(v=>finite(v,k));
}
assert.equal(new Set(reforms.map(x=>x.id)).size,reforms.length);
const credit = fundingCredit(funding.items,reforms.map(x=>x.id));
const target = finite(historical.default_target.annual_general_government_surplus_eur_billion);
const budgetRows = b.years.map((year,i)=>{
  const s=b.series, balance=s.maastricht_balance_bn[i];
  eq(s.government_revenue_bn[i]-s.government_expenditure_bn[i],balance,0.20000001);
  eq(s.primary_balance_bn[i]-s.interest_expenditure_bn[i],balance,0.20000001);
  const need=target-balance;
  return {year,revenue_bn:s.government_revenue_bn[i],expenditure_bn:s.government_expenditure_bn[i],
    interest_bn:s.interest_expenditure_bn[i],primary_balance_bn:s.primary_balance_bn[i],balance_bn:balance,
    gap_to_balance_bn:round(Math.max(0,-balance)),improvement_to_target_bn:round(need),
    remaining_target_gap_after_verified_effects_bn:round(Math.max(0,need-credit.verified_annual_net_bn)),
    debt_bn:s.maastricht_debt_bn[i],debt_ratio_pct:s.maastricht_debt_pct_gdp[i],
    revenue_expenditure_balance_rounding_residual_bn:round(s.government_revenue_bn[i]-s.government_expenditure_bn[i]-balance),
    primary_interest_balance_rounding_residual_bn:round(s.primary_balance_bn[i]-s.interest_expenditure_bn[i]-balance)};
});
const cumulativeBudget = [1,5,6].map(years=>({years,from:2026,to:2025+years,
  cumulative_deficit_bn:round(-sum(budgetRows.slice(0,years).map(x=>x.balance_bn))),
  cumulative_interest_bn:round(sum(budgetRows.slice(0,years).map(x=>x.interest_bn))),
  cumulative_primary_deficit_bn:round(-sum(budgetRows.slice(0,years).map(x=>x.primary_balance_bn))),
  cumulative_improvement_to_annual_target_bn:round(sum(budgetRows.slice(0,years).map(x=>x.improvement_to_target_bn)))}));
const modules = [
  {id:'ADM-01/ADM-02',source:'admin-model.json',base_year:2026,
    assumption:`${adm.model.default_efficiency_gain_pct}% von ${adm.model.default_addressable_base_eur_billion} Mrd. EUR`,
    gross_mio:adm.model.default_addressable_base_eur_billion*1000*adm.model.default_efficiency_gain_pct/100,
    running_mio:adm.model.default_additional_annual_operating_cost_eur_million},
  {id:'TAX-02',source:'tax-compliance-model.json',base_year:2025,
    assumption:`${tax.model.default_incremental_corporate_tax_yield_pct_of_2025_revenue}% zusätzlich auf KÖSt-Basis 2025`,
    gross_mio:tax.baseline.corporate_tax_revenue_2025_eur_billion*1000*tax.model.default_incremental_corporate_tax_yield_pct_of_2025_revenue/100,
    running_mio:tax.model.default_additional_enforcement_cost_eur_million},
  {id:'GAME-01',source:'gambling-model.json',base_year:2025,
    assumption:`Markt ${game.model.default_legal_market_revenue_change_pct}%, Abgabenwirkung ${game.model.default_effective_tax_yield_change_pct}%`,
    gross_mio:game.baseline.gambling_act_revenue_2025_eur_million*((1+game.model.default_legal_market_revenue_change_pct/100)*(1+game.model.default_effective_tax_yield_change_pct/100)-1),
    running_mio:game.model.default_additional_enforcement_cost_eur_million}
].map(m=>{
  finite(m.gross_mio); finite(m.running_mio);
  const annual=m.gross_mio-m.running_mio;
  return {...m,gross_mio:round(m.gross_mio),steady_annual_net_before_transition_mio:round(annual),verified_net_mio:null,
    actual_transition_cost_mio:null,
    immediate_full_effect_cumulative_before_transition_mio:Object.fromEntries(a.horizons_years.map(y=>[y,round(annual*y)])),
    transition_scenarios:a.transition_cost_per_module_mio_cases.map(transition=>cashflow({gross:m.gross_mio,running:m.running_mio,transition,ramp:a.gross_effect_ramp,discountPct:a.discount_rate_pct}))};
});
const sensitivityRows = [
  ...a.sensitivity_inputs.administration_efficiency_pct.map(p=>({module:'ADM-01/ADM-02',input_pct:p,gross_mio:round(adm.model.default_addressable_base_eur_billion*1000*p/100),net_before_transition_mio:round(adm.model.default_addressable_base_eur_billion*1000*p/100-modules[0].running_mio)})),
  ...a.sensitivity_inputs.incremental_corporate_tax_yield_pct.map(p=>({module:'TAX-02',input_pct:p,gross_mio:round(tax.baseline.corporate_tax_revenue_2025_eur_billion*1000*p/100),net_before_transition_mio:round(tax.baseline.corporate_tax_revenue_2025_eur_billion*1000*p/100-modules[1].running_mio)})),
  ...a.sensitivity_inputs.gambling_market_and_yield_pct_pairs.map(([m,t])=>({module:'GAME-01',market_pct:m,yield_pct:t,gross_mio:round(game.baseline.gambling_act_revenue_2025_eur_million*((1+m/100)*(1+t/100)-1)),net_before_transition_mio:round(game.baseline.gambling_act_revenue_2025_eur_million*((1+m/100)*(1+t/100)-1)-modules[2].running_mio)}))
];
const gross=sum(modules.map(x=>x.gross_mio)), running=sum(modules.map(x=>x.running_mio));
const combined = a.combined_overlap_haircuts_on_gross.flatMap(haircut=>{
  assert.ok(haircut>=0&&haircut<=1); finite(haircut);
  return a.transition_cost_per_module_mio_cases.map(c=>({overlap_haircut:haircut,transition_per_module_mio:c,
    ...cashflow({gross:gross*(1-haircut),running,transition:c*modules.length,ramp:a.gross_effect_ramp,discountPct:a.discount_rate_pct})}));
});
const debtCases = ['general_government','adopted_policy_projection_2031'].flatMap(baseline=>
  a.debt.annual_base_repayment_bn_cases.flatMap(annualBase=>a.debt.avoided_refinancing_rate_pct_cases.flatMap(ratePct=>
    a.debt.reinvest_interest_share_cases.map(reinvestShare=>{
      const c=repayment({debt:debt.baselines[baseline].debt_eur_billion,annualBase,ratePct,reinvestShare});
      const {rows,...meta}=c;
      return {baseline,...meta,rows:rows.filter(x=>a.horizons_years.includes(x.year)||x.year===c.repayment_complete_year)};
    }))));
const wish=labour.working_time_wishes.find(x=>x.sex==='all'&&x.dimension==='total').metrics;
const available=finite(wish.available_within_two_weeks.value)*1000,wants=finite(wish.wants_more.value)*1000;
assert.ok(available<=wants); assert.equal(labour.effect_gate.budget_effect_eur,null);
const labourCases=a.labour.uptake_share_cases.flatMap(u=>a.labour.additional_weekly_hours_cases.map(hours=>({
  uptake_share:u,weekly_extra_hours:hours,assumed_participating_persons:round(available*u),
  weekly_hours_equivalent:round(available*u*hours),fte_equivalent:round(available*u*hours/a.labour.fte_weekly_hours),
  proven_employment_effect:null,budget_effect_eur:null})));
const childcare=labour.childcare_opening_categories.filter(x=>x.region==='Österreich');
const childTotal=sum(childcare.map(x=>x.children.total)), vif=sum(childcare.map(x=>x.children.vif));
const payroll=createPayroll2026(kernel);
const payrollRows=a.payroll.regions.flatMap(region=>a.payroll.fulltime_monthly_gross_eur_cases.flatMap(fulltimeGross=>{
  const base=payroll.constantSalaryEmployerWithholding({monthlyGross:fulltimeGross*20/a.payroll.fulltime_weekly_hours,region});
  return a.payroll.weekly_hours_cases.map(hours=>{
    const r=payroll.constantSalaryEmployerWithholding({monthlyGross:fulltimeGross*hours/a.payroll.fulltime_weekly_hours,region});
    const extraGross=r.annualGross-base.annualGross,extraNet=r.payrollNetBeforeAssessment-base.payrollNetBeforeAssessment;
    return {region,fulltime_monthly_gross_eur:fulltimeGross,weekly_hours:hours,monthly_gross_eur:r.monthlyGross,
      ordinary_month_net_eur:round(r.monthlyGross-r.runningSvMonthly-r.runningWageTaxMonthly,2),
      annual_net_before_assessment_eur:round(r.payrollNetBeforeAssessment,2),annual_gross_eur:r.annualGross,
      extra_annual_net_vs_20h_eur:round(extraNet,2),extra_net_per_calendar_month_vs_20h_eur:round(extraNet/12,2),
      incremental_employee_tax_sv_share_pct:extraGross===0?null:round((1-extraNet/extraGross)*100,2)};
  });
}));
const p=pension.combined_federal_budget_view;
const pi=p.years.indexOf(2026), pe=p.years.indexOf(2031);
const reformCoverage=reforms.map(r=>({id:r.id,title:r.title,cost_description:r.costs,
  scenario_module:modules.find(m=>m.id.split('/').includes(r.id))?.id??null,
  verified_annual_net_bn:funding.items.find(x=>x.reform_id===r.id)?.verified_annual_net_eur_billion??null,
  verified_cumulative_net_bn:{1:null,5:null,10:null},
  status:['BUD-01','BUD-02','DEBT-01','DEBT-02'].includes(r.id)?'budget_or_debt_target_not_independent_funding_source':'full_reform_costing_open'}));
const result={version:'2026-09-06-v1',status:'audited_arithmetic_conditional_scenarios_not_funded_program',
  assumptions_artifact:'werk-data/calculation-assumptions.json',source_sha256:sourceHashes,
  coverage:{registered_reforms:reforms.length,distinct_default_scenario_modules:modules.length,verified_funding:credit,
    rule:'Null means unknown, not zero effect. Zero funding credit means no verified amount is currently booked.'},
  budget:{unit:'billion_eur',target_annual_surplus_bn:target,rows:budgetRows,cumulative:cumulativeBudget,
    official_ten_year_projection:null,reason:'Official reference ends in 2031; no unlabelled extrapolation to 2035.',
    end_2026_to_end_2031_debt_change_bn:round(budgetRows.at(-1).debt_bn-budgetRows[0].debt_bn),
    deficits_2027_2031_bn:round(-sum(budgetRows.slice(1).map(x=>x.balance_bn))),
    derived_stock_flow_and_rounding_residual_2027_2031_bn:round(budgetRows.at(-1).debt_bn-budgetRows[0].debt_bn+sum(budgetRows.slice(1).map(x=>x.balance_bn))),
    historical_calculator_base:{year:historical.baseline.year,bridge_bn:historical.derived_baseline.balance_improvement_needed_eur_billion},
    already_in_reference_government_consolidation:gov.annual_consolidation_since_2025_mio},
  default_modules:modules,sensitivity_rows:sensitivityRows,combined_conditional_cases:combined,
  combined_steady_net_before_transition_mio:round(gross-running),
  conditional_scale_comparison:{share_of_2026_target_gap_pct:round((gross-running)/1000/budgetRows[0].improvement_to_target_bn*100),
    warning:'Scale comparison only; no funding credit and no proven independence between modules.'},
  operating_break_even:{admin_efficiency_pct:round(modules[0].running_mio/(adm.model.default_addressable_base_eur_billion*1000)*100),
    tax_incremental_yield_pct:round(modules[1].running_mio/(tax.baseline.corporate_tax_revenue_2025_eur_billion*1000)*100),
    gambling_combined_yield_change_pct:round(modules[2].running_mio/game.baseline.gambling_act_revenue_2025_eur_million*100)},
  debt_cases:debtCases,
  labour:{wants_more_persons:wants,available_persons:available,not_available_within_two_weeks_difference_persons:wants-available,
    available_share_of_wishers_pct:round(available/wants*100),conditional_hours_cases:labourCases,
    childcare:{attending_under_six:childTotal,vif_children:vif,attending_non_vif:childTotal-vif,vif_share_pct:round(vif/childTotal*100),free_places:null}},
  payroll_examples:payrollRows,
  non_additive_sector_changes:{
    federal_pension_budget:{from:2026,to:2031,from_mio:p.ug22_plus_ug23_outflows_mio[pi],to_mio:p.ug22_plus_ug23_outflows_mio[pe],change_mio:p.ug22_plus_ug23_outflows_mio[pe]-p.ug22_plus_ug23_outflows_mio[pi],scope:p.note},
    public_current_health:{from:2024,to:2025,from_mio:health.sha_headline_mio.public_current[0],to_mio:health.sha_headline_mio.public_current[1],change_mio:health.sha_headline_mio.public_current[1]-health.sha_headline_mio.public_current[0],scope:'SHA public current spending; 2025 preliminary; not additional to consolidated government spending.'},
    care_real_cost:{from:2021,to:2050,from_bn:care.public_service_cost_projection_constant_2021_prices_mrd.net_cost[0],to_bn:care.public_service_cost_projection_constant_2021_prices_mrd.net_cost[2],change_bn:round(care.public_service_cost_projection_constant_2021_prices_mrd.net_cost[2]-care.public_service_cost_projection_constant_2021_prices_mrd.net_cost[0]),scope:care.public_service_cost_projection_constant_2021_prices_mrd.scope,prices:'constant 2021 prices, source scenario; overlaps health, not additive'}},
  reform_coverage:reformCoverage,
  excluded_from_funding:['Already legislated government consolidation','Existing ABB/customs collection','Gross subsidies and tax expenditures','Intergovernmental transfers and ownership cash flows','Unspent digital fund allocation','ADM-01/ADM-02 double counting','Hypothetical labour availability and payroll population extrapolation','Debt interest benefit already reinvested in repayment','Political/party organisation budgets without a public-finance perimeter'],
  known_findings:['Funding aliases FISC-01/GMBL-01 corrected to SUB-01/GAME-01.',
    'Legacy fiscal-model and funding-matrix use explicitly historical 2025 baseline; this calculation uses official 2026–2031 reference.',
    'Legacy administration UI uses 15m DADEX baseline as illustrative transition input; it is not a verified additional WERK transformation cost.',
    'Registry contains 15 reform dossiers; technical completeness is not fiscal coverage.']};

const f=(x,d=2)=>x===null?'offen':new Intl.NumberFormat('de-AT',{minimumFractionDigits:d,maximumFractionDigits:d}).format(x);
const table=(heads,rows)=>'| '+heads.join(' | ')+' |\n| '+heads.map(()=>'---').join(' | ')+' |\n'+rows.map(r=>'| '+r.join(' | ')+' |').join('\n')+'\n';
const chosen=combined.find(x=>x.overlap_haircut===0&&x.transition_per_module_mio===25);
let md=`# WERK Gesamtrechnung – 6. September 2026\n\nReproduzierbar aus ${Object.keys(sourceHashes).length} versionierten Eingabedateien. Alle Beträge nominal, sofern anders bezeichnet. **${reforms.length} Reformakten, ${modules.length} unterschiedliche Sensitivitätsmodelle, ${credit.verified_count} verifizierte Finanzierungsbeiträge.** Das Programm ist noch nicht durchfinanziert.\n\n## 1. Haushalt und Finanzierungsbedarf\n\nAmtlicher BMF-Referenzpfad einschließlich beschlossener Politik; keine WERK-Wirkungsprognose. Quelle: [BMF, Tabelle 22, Seite 67](https://www.bmf.gv.at/dam/jcr:a5d69691-da87-4741-8e82-f4db29cc889b/Strategiebericht_2027-2030_2028-2031_Budgetbericht_2027_2028_Beschluss.pdf), am 06.09.2026 erneut abgeglichen.\n\n`;
md+=table(['Jahr','Saldo Mrd. €','Zinsen Mrd. €','Lücke zu null','Verbesserung zu +10','Schulden Mrd. €'],budgetRows.map(x=>[x.year,f(x.balance_bn,1),f(x.interest_bn,1),f(x.gap_to_balance_bn,1),f(x.improvement_to_target_bn,1),f(x.debt_bn,1)]));
md+=`\n2026–2030 summieren sich die Defizite auf **${f(cumulativeBudget[1].cumulative_deficit_bn,1)} Mrd. €**, 2026–2031 auf **${f(cumulativeBudget[2].cumulative_deficit_bn,1)} Mrd. €**. Sechs Jahre mit je +10 Mrd. € statt dieser Defizite verlangten kumuliert ${f(cumulativeBudget[2].cumulative_improvement_to_annual_target_bn,1)} Mrd. € zusätzliche Saldoverbesserung. Das ist ein bedingter Zielabstand, kein Einsparnachweis.\n\nPrimärdefizite ${f(cumulativeBudget[2].cumulative_primary_deficit_bn,1)} plus Zinsen ${f(cumulativeBudget[2].cumulative_interest_bn,1)} weichen rundungsbedingt um 0,1 Mrd. € vom publizierten Gesamtsaldo ab. Die Schulden steigen von Ende 2026 bis Ende 2031 um ${f(result.budget.end_2026_to_end_2031_debt_change_bn,1)} Mrd. €; dazu gehören die Defizite **2027–2031** von ${f(result.budget.deficits_2027_2031_bn,1)} Mrd. €. Der abgeleitete Rest beträgt ${f(result.budget.derived_stock_flow_and_rounding_residual_2027_2031_bn,1)} Mrd. € einschließlich Stock-Flow- und Rundungseffekten. Ein amtlicher Zehnjahrespfad liegt hier nicht vor.\n\nDie ältere 31,5-Mrd.-Brücke im Rechner bezieht sich auf **2025**. 2026 lautet sie 32,2 Mrd. €. Unterschiedliche Referenzjahre dürfen nicht vermischt werden. Bereits eingerechnete Regierungskonsolidierung bleibt aus WERK-Beiträgen ausgeschlossen.\n\n## 2. Bestehende Szenariomodelle vollständig gerechnet\n\nVolle Wirkung sofort; nominal konstante Basis; nach zusätzlichen laufenden Kosten, **vor unbekannten einmaligen Kosten**. Kumulierte Werte sind weder verifiziert noch diskontiert. ADM-01 und ADM-02 werden gemeinsam nur einmal gerechnet.\n\n`;
md+=table(['Modul','Brutto/Jahr Mio. €','Laufende Kosten/Jahr','1 Jahr vor Anlaufkosten','5 Jahre vor Anlaufkosten','10 Jahre vor Anlaufkosten'],modules.map(m=>[m.id,f(m.gross_mio),f(m.running_mio),...a.horizons_years.map(y=>f(m.immediate_full_effect_cumulative_before_transition_mio[y]))]));
md+='\n'+modules.map(m=>`- ${m.id}: ${m.assumption}; statische Basis ${m.base_year}.`).join('\n')+'\n';
md+=`\nDie rein bedingte Summe beträgt **${f(gross-running,3)} Mio. €/Jahr**, entsprechend ${f(result.conditional_scale_comparison.share_of_2026_target_gap_pct,3)} % des 2026-Zielabstands. **Verifiziert angerechnet: ${f(credit.verified_annual_net_bn,1)} Mrd. €**. Unbekannte Wirkungen bleiben unbekannt. Steuerkontrolle muss vor Anlaufkosten mehr als ${f(result.operating_break_even.tax_incremental_yield_pct,3)} % zusätzliches KÖSt-Aufkommen erbringen; Glücksspiel braucht ${f(result.operating_break_even.gambling_combined_yield_change_pct,3)} % kombinierte Aufkommenssteigerung, um allein die angenommenen laufenden Kosten zu decken.\n\nWeitere Sensitivitäten (laufende Kosten wie oben; kein Wirkungsnachweis):\n\n`;
md+=table(['Modul','Annahme in %','Jahresnetto vor Anlaufkosten Mio. €'],sensitivityRows.map(x=>[x.module,x.input_pct??`${x.market_pct} Markt / ${x.yield_pct} Wirkung`,f(x.net_before_transition_mio)]));
md+=`\n## 3. Anlauf, Übergangskosten und Wechselwirkungen\n\nExplizite Rechenannahme: Bruttowirkung Jahr 1 = 25 %, Jahr 2 = 75 %, danach 100 %. Laufende Kosten ab Jahr 1 vollständig. Je Modul angenommene Einmalkosten 0/10/25/50 Mio. € zu Beginn; **0 ist eine Sensitivität, kein Nachweis kostenloser Umsetzung**. Keine dieser Kostenzahlen wurde als tatsächlicher Projektpreis erhoben.\n\n`;
md+=table(['Einmalkosten je Modul Mio. €','Abzug auf Bruttowirkung','Kumuliert 1 Jahr','5 Jahre','10 Jahre','Amortisation bis Jahr 10'],combined.map(c=>[f(c.transition_per_module_mio,0),f(c.overlap_haircut*100,0)+' %',...a.horizons_years.map(y=>f(c.rows[y-1].cumulative_net_mio)),c.break_even_year_within_horizon??'nicht erreicht']));
md+=`\nEin Beispiel mit insgesamt 75 Mio. € Einmalkosten und ohne Wechselwirkungsabzug ergibt ${f(chosen.rows[0].cumulative_net_mio)} / ${f(chosen.rows[4].cumulative_net_mio)} / ${f(chosen.rows[9].cumulative_net_mio)} Mio. € nach 1/5/10 Jahren. Kapitalwert bei angenommenen ${a.discount_rate_pct} %: ${f(chosen.rows[9].npv_mio)} Mio. € nach zehn Jahren. Bei 25 % Abzug auf die gemeinsame Bruttowirkung bleiben nach zehn Jahren ${f(combined.find(x=>x.overlap_haircut===0.25&&x.transition_per_module_mio===25).rows[9].cumulative_net_mio)} Mio. €. Vollständige Jahresreihen und Einzelmodulrechnungen stehen im JSON.\n\n## 4. Schuldentilgung\n\nNur ab Beginn einer tatsächlich finanzierten Tilgungsphase. Kein Kalenderdatum und keine bis dahin eingefrorene Verschuldung. 431,4 Mrd. € ist der Ist-Anker Q1 2026; 525,2 Mrd. € die amtliche Projektion 2031. Der Bundes-Schuldenstand wird nicht mit der Gesamtstaatsschuld vermischt. Konstante Basisüberschüsse, keine neuen Defizite/Stock-Flow-Effekte. Ein Zinsvorteil entsteht erst im Folgejahr; angenommener Vermeidungssatz ist keine Zinsprognose.\n\n`;
md+=table(['Startschuld Mrd. €','Basis-Tilgung/Jahr','Jahre ohne Zinsreinvestition','Jahre mit 100 % Reinvestition bei 2,5 %'],[431.4,525.2].flatMap(d=>[10,15,20].map(t=>[f(d,1),f(t,0),debtCases.find(c=>c.starting_debt_bn===d&&c.annual_base_repayment_bn===t&&c.rate_pct===2.5&&c.reinvest_share===0).repayment_complete_year,debtCases.find(c=>c.starting_debt_bn===d&&c.annual_base_repayment_bn===t&&c.rate_pct===2.5&&c.reinvest_share===1).repayment_complete_year])));
md+=`\nJahresendzahlungen einschließlich kleinerer letzter Rate. Bei 10 Mrd. € Basistilgung ohne Reinvestition sind nach 1/5/10 Jahren 10/50/100 Mrd. € getilgt; die kumulierten rechnerischen Zinsvorteile bei 2,5 % betragen 0/2,5/11,25 Mrd. €. Reinvestierte Zinsvorteile sind bereits in der höheren Tilgung enthalten und werden nicht nochmals hinzuaddiert. Das JSON enthält ${debtCases.length} Fälle, einschließlich 0/1/2,5/4 % Vermeidungssatz.\n\n## 5. Arbeitszeit und Betreuung\n\n2025: ${f(wants,0)} Teilzeitbeschäftigte wünschen Mehrstunden, ${f(available,0)} davon wären binnen zwei Wochen verfügbar (${f(available/wants*100,1)} %). Die Differenz von ${f(wants-available,0)} ist keine neue Aktivierungsgruppe. Quelle: gespeicherte Statistik-Austria-Arbeitskräfteerhebung, R3 E9/G9.\n\nNur rechnerische Stundenäquivalente; 40 Wochenstunden je VZÄ:\n\n`;
md+=table(['Angenommene Teilnahme','Zusatzstunden/Woche','VZÄ-Äquivalent'],labourCases.map(x=>[f(x.uptake_share*100,0)+' %',x.weekly_extra_hours,f(x.fte_equivalent,1)]));
md+=`\nKein Beschäftigungs- oder Budgeteffekt: gewünschte Stundenhöhe, passende Stellen und Arbeitsbedingungen sind nicht gemeinsam beobachtet. Von ${f(childTotal,0)} betreuten Kindern unter sechs Jahren besuchen ${f(vif,0)} eine VIF-kompatible Einrichtung. ${f(childTotal-vif,0)} besuchen andere Öffnungskategorien; daraus folgen weder fehlende noch freie Plätze. Betreuungsjahr 2024/25 und Arbeitskräftejahr 2025 bleiben getrennt.\n\n## 6. Konkrete Mehrarbeitsrechnung\n\nVorhandener Payroll-Regelkern 2026, konstante Beschäftigung über das ganze Jahr, gleichbleibender Stundenlohn; 14 Bruttobezüge. Standard-ASVG, ohne Pendler-/Familienfälle. **Netto nach Arbeitgeber-Einbehaltung, vor Arbeitnehmerveranlagung und ohne Transferentzug, Betreuung oder Fahrtkosten.** Tabelle außerhalb Wiens; Wien-Variante ebenfalls im JSON. Mehrnetto pro Kalendermonat ist Jahresdifferenz geteilt durch zwölf und enthält Sonderzahlungen.\n\n`;
md+=table(['Vollzeit-Brutto/Monat','Wochenstunden','Teilzeit-Brutto/Monat','Netto/Jahr','Mehrnetto/Monat gegenüber 20 h'],payrollRows.filter(x=>x.region==='outside_vienna').map(x=>[f(x.fulltime_monthly_gross_eur,0),x.weekly_hours,f(x.monthly_gross_eur,0),f(x.annual_net_before_assessment_eur),f(x.extra_net_per_calendar_month_vs_20h_eur)]));
md+=`\nDas Mehrnetto ist zugleich die maximale Summe aus zusätzlichen Betreuungskosten, Fahrtkosten und wegfallenden Transfers, bevor der unmittelbare Geldvorteil aufgebraucht wäre; Veränderungen durch die Arbeitnehmerveranlagung bleiben offen. Es wird nicht mit 110.600 Personen multipliziert.\n\n## 7. Große Ausgabenfelder\n\n- Bundesbudget UG22+UG23: ${f(p.ug22_plus_ug23_outflows_mio[pi]/1000,3)} Mrd. € 2026 auf ${f(p.ug22_plus_ug23_outflows_mio[pe]/1000,3)} Mrd. € 2031: **+${f(result.non_additive_sector_changes.federal_pension_budget.change_mio/1000,3)} Mrd. €**. Enthält UG23-Pflegegeld; keine gesamtstaatliche Pensionssumme.\n- Laufende öffentliche Gesundheitsausgaben SHA: 43,793 auf 46,384 Mrd. € 2024–2025: **+2,591 Mrd. €**, 2025 vorläufig.\n- Pflege-Sachleistungen Länder/Gemeinden im Quellszenario: 2,71 Mrd. € 2021 auf 10,70 Mrd. € 2050, **+7,99 Mrd. € in konstanten Preisen 2021**. Keine nominale Jahresprognose.\n\nDiese Sichtweisen werden weder untereinander noch auf die Gesamtausgaben addiert. Für Pensionen, Gesundheit und Pflege liegen noch keine vollständig bezifferten WERK-Reformkosten vor. Bruttobudgets sind keine realisierbaren Einsparungen.\n\n## 8. Alle Reformakten\n\n`;
md+=table(['ID','Reform','Rechenzuordnung','Verifiziert netto 1/5/10 Jahre'],reformCoverage.map(x=>[x.id,x.title,x.scenario_module??(x.status.startsWith('budget_')?'Haushalts-/Tilgungsrechnung, kein eigener Ertrag':'Kosten-/Wirkungsmodell offen'),'offen / offen / offen']));
md+=`\nBei SUB-01 fehlen programmweise zusätzliche Nettoeffekte; bei PART-01 unternehmensspezifische zusätzliche Maastricht-Effekte; bei EU-01 Kosten und Periodisierung des RRF-Nachlaufs; bei TAX-01 Verhaltens-/Investitionssimulation; bei REG-01 Übergangskosten je Kompetenz; bei DIR-01 und ORG-01 Infrastruktur-/Betriebskosten und der passende private/öffentliche Finanzierungsumfang. DEBT-02 ist eine Tilgungsorganisation und kein zusätzlicher Sparbeitrag.\n\n## Reproduzieren\n\n\`node scripts/werk-calculation-contract.mjs --write\` erzeugt Bericht und JSON; ohne \`--write\` wird die bytegleiche Neuberechnung geprüft. \`node scripts/werk-calculation-negative-check.mjs\` prüft unabhängige Rechenbeispiele und Fehlerfälle. Alle Eingaben sind über SHA-256 gebunden. Das zentrale Freigabegate für eine finanzierte BUD-01-Endrechnung bleibt offen.\n`;
const outputs={'werk-data/calculation-results-2026.json':JSON.stringify(result,null,2)+'\n','WERK_GESAMTRECHNUNG.md':md};
for(const [path,content] of Object.entries(outputs)) {
  if(process.argv.includes('--write')) fs.writeFileSync(path,content);
  else assert.equal(fs.readFileSync(path,'utf8'),content,`${path}: regenerate calculation`);
}
console.log(`Calculation contract OK: ${reforms.length} reforms, ${modules.length} modules, ${combined.length} cost/overlap cases, ${debtCases.length} debt cases, ${payrollRows.length} payroll examples; verified credit ${credit.verified_annual_net_bn} bn.`);
