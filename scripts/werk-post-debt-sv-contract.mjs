import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {employeeRelief,postDebtCapacity,replacementCost,debtLinkedRelief} from './lib/werk-post-debt-sv.mjs';
import {round,finite} from './lib/werk-calculation.mjs';
const hashes={};
const read=n=>{const p=`werk-data/${n}.json`,s=fs.readFileSync(p,'utf8');hashes[p]=createHash('sha256').update(s).digest('hex');return JSON.parse(s);};
const spec=read('post-debt-employee-sv-model'),kernel=read('payroll-employee-kernel-2026'),debt=read('debt-model'),source=read('employee-payroll-withholding-2024');
const reforms=read('reforms').reforms;
assert.ok(reforms.some(x=>x.id==='SV-01'));assert.equal(spec.reform_id,'SV-01');
for(const k of ['requires_funded_base_debt_repayment','requires_realized_recurring_interest_savings','requires_sustainable_replacement_financing','requires_preserved_insurance_entitlements','requires_household_distribution_review'])assert.equal(spec.activation[k],true);
assert.equal(spec.activation.currently_active,false);assert.equal(spec.activation.calendar_year,null);
assert.equal(spec.activation.requires_debt_free_general_government,false);
assert.equal(spec.progressive_target.employee_core_reduction_share,.5);
assert.equal(spec.progressive_target.same_interest_euro_may_fund_both_relief_and_extra_repayment,false);
assert.equal(spec.progressive_target.end_target_financing_proven,false);
assert.equal(spec.progressive_target.verified_annual_gross_target_bn,null);
assert.equal(spec.progressive_target.full_abolition_automatically_authorized,false);
assert.equal(debt.employee_relief_link.target_employee_contribution_reduction_share,.5);
assert.equal(spec.funding_gate.status,'blocked');assert.equal(spec.funding_gate.verified_annual_replacement_cost_bn,null);
assert.equal(spec.funding_gate.verified_annual_replacement_financing_bn,null);assert.equal(spec.funding_gate.employment_effect_persons,null);assert.equal(spec.funding_gate.current_budget_credit_bn,0);
assert.equal(source.pure_employee_kv_pv_alv_total_eur,null);
assert.equal(spec.existing_receipts_accounting.already_collected,true);
assert.equal(spec.existing_receipts_accounting.redirection_creates_additional_revenue,false);
assert.equal(spec.existing_receipts_accounting.existing_services_and_entitlements_preserved,true);
assert.equal(spec.existing_receipts_accounting.verified_additional_debt_repayment_bn,0);
assert.equal(spec.official_unemployment_rules.basic_replacement_pct,55);
assert.equal(spec.official_unemployment_rules.supplement_cap_without_family_pct,60);
assert.equal(spec.official_unemployment_rules.supplement_cap_with_family_pct,80);
assert.equal(spec.official_unemployment_rules.same_pay_as_work_general_claim_verified,false);
const payrollRows=spec.payroll_scenarios.regions.flatMap(region=>spec.payroll_scenarios.monthly_gross_eur.flatMap(monthlyGross=>
  spec.payroll_scenarios.employee_core_reduction_shares.map(reductionShare=>{
    const r=employeeRelief(kernel,{monthlyGross,region,reductionShare});
    assert.ok(Math.abs(r.annual_net_gain_eur-(r.removed_annual_contributions_eur-r.extra_annual_withheld_tax_eur))<1e-7);
    return {region,monthly_gross_eur:monthlyGross,reduction_share:reductionShare,
      ordinary_month_net_before_eur:round(r.ordinary_month_net_before_eur,2),ordinary_month_net_after_eur:round(r.ordinary_month_net_after_eur,2),
      ordinary_month_net_gain_eur:round(r.ordinary_month_net_after_eur-r.ordinary_month_net_before_eur,2),
      annual_net_before_eur:round(r.before.payrollNetBeforeAssessment,2),annual_net_after_eur:round(r.after.payrollNetBeforeAssessment,2),
      annual_net_gain_eur:round(r.annual_net_gain_eur,2),average_calendar_month_net_gain_eur:round(r.annual_net_gain_eur/12,2),
      removed_annual_contributions_eur:round(r.removed_annual_contributions_eur,2),extra_annual_withheld_tax_eur:round(r.extra_annual_withheld_tax_eur,2),
      final_assessment_gain_eur:null};
  })));
const f=spec.post_debt_financing_scenarios;
const D=debt.baselines[f.starting_debt_baseline].debt_eur_billion;
assert.equal(D,525.2,'Rebase reviewed report illustrations if official start reference changes');
assert.equal(f.base_annual_net_repayment_bn,10);
assert.ok(f.avoided_interest_pct.includes(2.5)&&f.reserve_shares.includes(0.2)&&f.assumed_tax_recapture_shares.includes(0.3));
assert.equal(f.annual_new_operating_cost_bn,0,'Report currently illustrates a zero-extra-cost capacity bound');
assert.equal(f.oneoff_transition_cost_bn,0,'Report currently illustrates a zero-transition-cost capacity bound');
const capacityRows=f.avoided_interest_pct.flatMap(rate=>f.reserve_shares.flatMap(reserve=>f.assumed_tax_recapture_shares.map(recapture=>{
  const c=postDebtCapacity({startingDebt:D,baseRepayment:f.base_annual_net_repayment_bn,ratePct:rate,reserveShare:reserve});
  replacementCost({grossLoss:1,taxRecaptureShare:recapture,runningCost:f.annual_new_operating_cost_bn});
  return {starting_debt_bn:D,base_repayment_bn:f.base_annual_net_repayment_bn,interest_pct:rate,reserve_share:reserve,tax_recapture_share:recapture,
    conditional_primary_surplus_bn:round(c.conditional_primary_surplus_bn),available_bn:round(c.available_bn),
    affordable_gross_loss_bn:round(Math.max(0,c.available_bn-f.annual_new_operating_cost_bn)/(1-recapture))};
})));
const broadBenchmark=source.totals.withheld_contributions_and_levies_thousand_eur/1e6;
const fundingRows=[...f.annual_gross_contribution_loss_bn_cases,broadBenchmark].flatMap(grossLoss=>f.assumed_tax_recapture_shares.map(recapture=>{
  const net=replacementCost({grossLoss,taxRecaptureShare:recapture,runningCost:f.annual_new_operating_cost_bn});
  return {gross_loss_bn:grossLoss,tax_recapture_share:recapture,net_replacement_need_bn:round(net),
    basis:grossLoss===broadBenchmark?'2024_broad_payroll_reference_not_pure_SV01_cost':'hypothetical_gross_loss',
    cumulative_net_need_bn:Object.fromEntries([1,5,10].map(y=>[y,round(net*y+f.oneoff_transition_cost_bn)]))};
}));
const target=broadBenchmark*spec.progressive_target.employee_core_reduction_share;

const comparisons=spec.work_vs_nonwork_scenarios.monthly_gross_eur.flatMap(gross=>{
  const r=employeeRelief(kernel,{monthlyGross:gross,reductionShare:.5});
  return spec.work_vs_nonwork_scenarios.assumed_monthly_cash_benefits_eur.flatMap(benefit=>
    spec.work_vs_nonwork_scenarios.additional_monthly_work_costs_and_transfer_losses_eur.map(cost=>{
      assert.ok(finite(benefit)>=0&&finite(cost)>=0);
      return {monthly_gross_eur:gross,assumed_nonwork_monthly_cash_eur:benefit,work_cost_and_lost_transfers_eur:cost,
        current_monthly_work_advantage_eur:round(r.before.payrollNetBeforeAssessment/12-benefit-cost,2),
        reformed_monthly_work_advantage_eur:round(r.after.payrollNetBeforeAssessment/12-benefit-cost,2),
        actual_ams_entitlement_eur:null,actual_household_gain_eur:null};
    }));
});
const linkedSpec=spec.linked_debt_scenarios;
assert.equal(linkedSpec.annual_base_repayment_bn,10);
assert.equal(linkedSpec.lag_years_default,1);assert.equal(linkedSpec.lag_years_stress,3);
assert.equal(linkedSpec.default_interest_to_relief_share,1);
assert.equal(linkedSpec.default_tax_recapture_share,0);
const inputs=[];
for(const ratePct of linkedSpec.rate_pct_cases)for(const interestToReliefShare of linkedSpec.interest_to_relief_share_cases)
  inputs.push({debt:D,ratePct,interestToReliefShare,taxRecaptureShare:0,lagYears:1});
for(const taxRecaptureShare of [.2,.3,.4])inputs.push({debt:D,ratePct:2.5,interestToReliefShare:1,taxRecaptureShare,lagYears:1});
for(const taxRecaptureShare of [0,.3])inputs.push({debt:debt.baselines.general_government.debt_eur_billion,ratePct:2.5,interestToReliefShare:1,taxRecaptureShare,lagYears:1});
for(const taxRecaptureShare of [0,.3])inputs.push({debt:D,ratePct:2.5,interestToReliefShare:1,taxRecaptureShare,lagYears:3});
const linkedPaths=inputs.map(i=>debtLinkedRelief({...i,annualBase:linkedSpec.annual_base_repayment_bn,contributionBase:broadBenchmark,reductionTarget:spec.progressive_target.employee_core_reduction_share}));
for(const path of linkedPaths)for(const r of path.annual_rows){
 assert.ok(Math.abs(r.realized_interest_saving_bn-r.net_replacement_cost_bn-r.extra_repayment_bn-r.unallocated_interest_bn)<.000003,'Interest double use');
 assert.ok(r.modeled_contribution_reduction_pct<=50.000001);
 assert.ok(r.net_replacement_cost_bn<=r.realized_interest_saving_bn+.000001);
}
const out={version:'2026-09-06-v3',reform_id:'SV-01',status:'conditional_scenarios_with_linked_debt_paths',source_sha256:hashes,
  source_year:2024,payroll_rule_year:2026,activation_year:null,
  progressive_target:{employee_core_reduction_share:.5,target_milestone:'debt_freedom',verified_gross_cost_bn:null,target_financing_proven:false,broad_reference_half_bn:target,reference_scope:'proxy_not_pure_employee_contributions',linked_debt_paths:linkedPaths},
  payroll_examples:payrollRows,
  financing_capacity_scenarios:capacityRows,replacement_cost_scenarios:fundingRows,work_nonwork_sensitivities:comparisons,
  existing_receipts_redirection:{illustrative_redirected_existing_receipts_bn:broadBenchmark,displaced_recipient_receipts_bn:-broadBenchmark,replacement_financing_if_services_preserved_bn:broadBenchmark,additional_external_revenue_bn:0,additional_debt_repayment_capacity_bn:0,basis:spec.existing_receipts_accounting.boundary},
  broad_withholding_reference_bn:broadBenchmark,pure_employee_kv_pv_alv_total_bn:null,verified_reform_cost_bn:null,
  conclusions:{debt_freedom_automatically_finances_reform:false,higher_wage_tax_recaptures_part_of_relief:true,
    insurance_benefits_require_replacement_financing:true,general_same_pay_work_vs_unemployed_claim_proven:false,
    future_earnings_linked_benefit_recalculation_open:true,not_a_current_budget_saving:true}};
const fmt=(n,d=2)=>new Intl.NumberFormat('de-AT',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const table=(h,rs)=>'| '+h.join(' | ')+' |\n| '+h.map(()=>'---').join(' | ')+' |\n'+rs.map(r=>'| '+r.join(' | ')+' |').join('\n')+'\n';
const selected=linkedPaths.find(p=>p.inputs.debt===D&&p.inputs.ratePct===2.5&&p.inputs.interestToReliefShare===1&&p.inputs.taxRecaptureShare===0&&p.inputs.lagYears===1);
const withRecapture=linkedPaths.find(p=>p.inputs.debt===D&&p.inputs.ratePct===2.5&&p.inputs.interestToReliefShare===1&&p.inputs.taxRecaptureShare===.3&&p.inputs.lagYears===1);
let md=`# SV-01 – Weniger Schulden, weniger Zinsen, weniger Arbeitnehmerbeiträge

Stand 6. September 2026. **Neues Ziel: Arbeitnehmer-KV/PV/ALV während des Schuldenabbaus schrittweise senken; bis Schuldenfreiheit um 50 %.** Versicherungsleistungen und erworbene Ansprüche bleiben erhalten. Arbeitgeberbeiträge, AK/WF und nicht beschäftigungsbezogene Regime sind getrennt. Das ersetzt die frühere 15,5-Mrd.-Zielstufe erst nach Schuldenfreiheit.

## 1. Regel für Entlastung und Gegenfinanzierung

Zuerst BUD-01 finanzieren und eine tragfähige Basistilgung sichern. Anschließend darf ein tatsächlich dauerhaft frei werdender Zinsbetrag für Beitragssenkungen eingesetzt werden. **Zinsersparnis = Netto-Ersatzfinanzierung der Beiträge + zusätzliche Tilgung + nicht gebundene Reserve.** Jeder Euro hat genau eine Verwendung. Die normale Basistilgung bleibt geschützt. Ihre nach Schuldenfreiheit entfallende Verwendung wird in diesem Modell nicht zusätzlich für SV angerechnet.

Die Standardrechnung weist sämtliche realisierten Zinsersparnisse bis zum Ziel der Beitragssenkung zu; 50/50-Aufteilung und reine zusätzliche Tilgung sind Vergleichsfälle. Ein konkreter gesetzlicher Aufteilungsschlüssel bleibt auszuarbeiten. Nicht mehr benötigter Zinsbetrag bleibt Reserve. Zusätzliche Lohnsteuer kann die konsolidierte Belastung mindern, ist aber keine nachgewiesene gesamtstaatliche Quote. Die Versicherungszweige brauchen den vollen Bruttoausfall ersetzt.

**Das 50%-Ziel bleibt eine politische Vorgabe; seine vollständige Deckung allein aus Zinsersparnissen ist offen.** Bei fehlender Deckung wird keine ungefinanzierte Senkung vorgezogen. Ein Kalenderdatum wird nicht versprochen. Auch Fälligkeiten, Rezession, steigende Refinanzierungskosten, Lohn-/Beitragsbasis, Demografie und Krisenreserve sind im echten Finanzierungsnachweis zu berücksichtigen.

## 2. Reicht die Zinsersparnis für 50 %?

Die [Statistik-Austria-Lohnzetteltabelle 2024](https://www.statistik.at/statistiken/volkswirtschaft-und-oeffentliche-finanzen/oeffentliche-finanzen/steuerstatistiken/lohnsteuerstatistik) ergibt ${fmt(broadBenchmark,6)} Mrd. € einbehaltene Beiträge einschließlich weiterer Umlagen. 19 Gruppen und ${fmt(source.totals.persons,0)} Personen sind zur gespeicherten Originaldatei abgeglichen. **Diese breite Summe ist keine reine Arbeitnehmer-KV/PV/ALV-Basis.** Ihre Hälfte (${fmt(target,6)} Mrd. €) dient nur als Größenvergleich; die echten Kosten einer Halbierung bleiben offen. Bereits eingehobene Beiträge sind keine zusätzlichen Einnahmen; ihre Umleitung bei vollständigem Ersatz der bestehenden Finanzierung schafft 0 € Tilgungsspielraum.

Unter der bisherigen Annahme von ${fmt(D,1)} Mrd. € Startschuld und 2,5 % vermiedenen Zinsen werden nach vollständiger Wirkung aller Tilgungen jährlich höchstens **${fmt(selected.full_annual_interest_saving_bn,3)} Mrd. €** frei. Gegen die breite Halbierungsreferenz wäre ohne Steuer-Rückfluss eine Lücke von **${fmt(selected.target_financing_shortfall_after_full_interest_effect_bn,3)} Mrd. €** vorhanden. Das ist ein Sensitivitätsvergleich, keine nachgewiesene SV-Finanzierungslücke.

Mit **angenommenen** 30 % zusätzlichem Lohnsteuer-Rückfluss sinkt der Netto-Ersatzbedarf dieser Referenz auf ${fmt(withRecapture.target_net_replacement_cost_bn,3)} Mrd. €. Im statischen Szenario erreicht die Entlastung dann das Referenzziel in Jahr ${withRecapture.target_reached_year}; ohne Rückfluss wird es nicht erreicht. Die 30 % sind keine empirisch ermittelte gesamtstaatliche Quote. Kostensteigerungen und Umsetzungskosten sind noch nicht angesetzt.

Die [OeBFA](https://www.oebfa.at/) weist für das Bundesportfolio zum 31.07.2026 2,10 % effektive Verzinsung und 12,10 Jahre durchschnittliche Restlaufzeit aus. Das ist eine andere Schuldabgrenzung und wird nicht als Gesamtstaatszins verwendet. Eine Durchschnittslaufzeit ersetzt keinen Fälligkeitsplan. Die Szenarien verwenden 1/2,5/4 % und einen bzw. drei Jahre Verzögerung als reine Sensitivitäten.

## 3. Schrittweiser Verlauf im Referenzszenario

${fmt(D,1)} Mrd. € Startschuld (amtliche Projektion 2031, kein festgelegter WERK-Startwert), jährlich 10 Mrd. € dauerhaft finanzierte Basistilgung, 2,5 % Vermeidungssatz, gesamte Zinsersparnis für SV, keine Steuer-Rückflüsse. Zahlung am Jahresende; Zinsentlastung frühestens im Folgejahr. Konstante nominale Werte, keine neuen Defizite oder Stock-Flow-Effekte, keine zusätzlichen Kosten. Prozentwerte beziehen sich ausschließlich auf die breite Referenz, nicht auf gesicherte individuelle Beitragssätze.

`;
md+=table(['Jahr ab Tilgungsstart','Restschuld Mrd. €','Jährliche Zinsersparnis = SV-Finanzierung Mrd. €','Senkung der breiten Referenz'],selected.annual_rows.filter(r=>[1,5,10,20,30,40,selected.repayment_complete_year,selected.repayment_complete_year+1].includes(r.year)).map(r=>[r.year,fmt(r.remaining_debt_bn,3),fmt(r.realized_interest_saving_bn,3),fmt(r.modeled_contribution_reduction_pct,2)+' %']));
md+=`
Die letzte Tilgung im Jahr ${selected.repayment_complete_year} wirkt erst im Folgejahr voll auf die Zinsen. Die Entlastung ist bereits während der Tilgung wirksam, aber das politische 50%-Ziel wird im Fall ohne Rückfluss gegen diese breite Referenz nicht gedeckt. Die gesamte Pfadserie enthält ${linkedPaths.length} Szenarien mit vollständigen Jahresreihen, kumulierten Kosten und einem eigenständigen Zielerreichungscheck.

## 4. Auswirkung auf die Tilgungsdauer

Gleiche Startschuld, 10 Mrd. € Basistilgung, 2,5 % Zinsannahme und ein Jahr Verzögerung; ohne Steuer-Rückfluss:

`;
md+=table(['Zinsersparnis für SV','Zinsersparnis für zusätzliche Tilgung','Tilgungsjahre','Referenzsenkung bei Schuldenfreiheit'],linkedPaths.filter(p=>p.inputs.debt===D&&p.inputs.ratePct===2.5&&p.inputs.taxRecaptureShare===0&&p.inputs.lagYears===1).map(p=>[fmt(p.inputs.interestToReliefShare*100,0)+' %',fmt((1-p.inputs.interestToReliefShare)*100,0)+' %',p.repayment_complete_year,fmt(p.reduction_pct_at_debt_freedom,2)+' %']));
md+=`
Die beschleunigte Tilgungsdauer aus voller Zinsreinvestition darf daher nicht gemeinsam mit voller SV-Finanzierung aus denselben Zinsen versprochen werden. Die bestehenden Post-Tilgungs-Kapazitätsszenarien bleiben im JSON als separate Vergleichsrechnung erhalten; sie sind keine zusätzliche Finanzierung während dieses Pfads.

## 5. Was 50 % weniger Arbeitnehmerbeiträge individuell bewirken könnten

Statischer ASVG-Standardfall nach 2026-Regeln: ganzjährig 14 gleiche Bruttobezüge, außerhalb Wiens; KV/PV/ALV relativ halbiert, AK/WF unverändert. Unveränderter Steuertarif: weniger abzugsfähige Beiträge führen zu mehr Lohnsteuer. **Vor Arbeitnehmerveranlagung, SV-Rückerstattung, Haushaltstransfers und Finanzierungslasten.** Die individuelle Tabelle setzt die erreichte 50%-Senkung voraus und belegt keine gesamtstaatliche Finanzierung.

`;
md+=table(['Monatsbrutto €','Regelmonat netto heute','Netto bei halbem KV/PV/ALV','Mehr im Regelmonat','Mehr im Jahr'],payrollRows.filter(x=>x.region==='outside_vienna'&&x.reduction_share===.5).map(x=>[fmt(x.monthly_gross_eur,0),fmt(x.ordinary_month_net_before_eur),fmt(x.ordinary_month_net_after_eur),fmt(x.ordinary_month_net_gain_eur),fmt(x.annual_net_gain_eur)]));
md+=`
Das JSON erhält auch 25 % als Zwischenstand und 100 % als Vergleich; eine Vollabschaffung ist nicht automatisch vorgesehen. Weniger Beiträge bedeuten keinen gleich hohen Nettozuwachs. Niedrige ALV-Sätze und Beitragsobergrenzen sind berücksichtigt; die abschließende Verteilungsprüfung bleibt offen.

## 6. Vergleich mit Nichterwerbstätigkeit

[AMS](https://www.ams.at/arbeitsuchende/arbeitslos-was-tun/geld-vom-ams/arbeitslosengeld): Grundbetrag grundsätzlich 55 % des gesetzlich berechneten historischen Nettoeinkommens; bedingte Ergänzungsgrenzen 60/80 %. Das ist keine allgemeine Gleichstellung mit Erwerbseinkommen. Arbeitslosengeld ist zeitlich begrenzt. Verglichen werden derselbe Haushalt und Zeitraum: Jahresnetto / 12, Geldleistungen, zusätzliche Arbeitskosten und wegfallende Transfers.

Bei rein angenommenen 1.500 € monatlichen Leistungen ohne Arbeit und 300 € Arbeitskosten/Transferverlusten:

`;
md+=table(['Monatsbrutto','Heutiger Arbeitsvorteil pro Monat','Bei halbem KV/PV/ALV'],comparisons.filter(x=>x.assumed_nonwork_monthly_cash_eur===1500&&x.work_cost_and_lost_transfers_eur===300).map(x=>[fmt(x.monthly_gross_eur,0),fmt(x.current_monthly_work_advantage_eur),fmt(x.reformed_monthly_work_advantage_eur)]));
md+=`
Keine berechneten AMS-Ansprüche; Leistungen werden nur für die isolierte Sensitivität festgehalten. Künftige nettoabhängige Leistungen könnten ebenfalls steigen. Endgültige Veranlagung und tatsächlicher Haushaltsvorteil bleiben offen.

## 7. Offene Nachweise

- Reine Arbeitnehmer-KV/PV/ALV-Beitragsbasis und zukünftiger Leistungsbedarf je Zweig.
- Nachweislich finanzierte Basistilgung, Fälligkeitsplan und dauerhaft realisierbare Nettozinsersparnisse unter Stress.
- Gesetzliche Mittelverteilung, Reserve und Ersatztransfers; keine doppelte Verwendung von Zinsersparnissen.
- Verteilung nach Einkommen, Steuerveranlagung und Haushaltstransfers sowie tatsächliche Umsetzungskosten.

Technische Rechnung vorhanden; **50%-Zieldeckung und Aktivierung bleiben offen**. [Gesamtrechnung](WERK_GESAMTRECHNUNG.md). Reproduzieren mit \`python3 scripts/werk-import-employee-withholding.py\` und \`node scripts/werk-post-debt-sv-contract.mjs\`; Generierung jeweils mit \`--write\`.
`;
for(const [p,s] of Object.entries({'werk-data/post-debt-employee-sv-results.json':JSON.stringify(out,null,2)+'\n','WERK_SV_NACH_SCHULDENFREIHEIT.md':md})){
  if(process.argv.includes('--write'))fs.writeFileSync(p,s);else assert.equal(fs.readFileSync(p,'utf8'),s,`${p}: regenerate`);
}
console.log(`SV-01 calculation OK: ${payrollRows.length} payroll cases, ${capacityRows.length} capacity cases, ${fundingRows.length} replacement cases, ${comparisons.length} household sensitivities; financing gate blocked.`);
