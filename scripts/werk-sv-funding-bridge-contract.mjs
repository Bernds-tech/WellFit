import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fundingBridge,surplusForDebtReduction} from './lib/werk-sv-funding-bridge.mjs';
const paths=['werk-data/budget-baseline-2026-2031.json','werk-data/employee-essoss-contribution-bridge-2024.json','werk-data/debt-flow-reconciliation-2026-2031.json','scripts/lib/werk-sv-funding-bridge.mjs'];
const [baseline,contributions,flow]=paths.slice(0,3).map(p=>JSON.parse(fs.readFileSync(p)));
paths.push(flow.source.local_file);
const hashes=Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
assert.equal(flow.source.sha256,'55e4e129646b601c37b68aad2c337e55544c0b717d73851d81d708805d416927');
assert.equal(hashes[flow.source.local_file],flow.source.sha256);assert.equal(flow.source.table,23);assert.equal(flow.source.printed_page,69);
assert.equal(flow.status,'official_adopted_policy_forecast_not_werk_effect');
assert.equal(flow.reform_adjustments_identified,false);assert.equal(flow.actual_avoided_interest_bn,null);assert.equal(flow.verified_budget_credit_bn,0);
assert.deepEqual(flow.years,[2025,2026,2027,2028,2029,2030,2031]);
assert.deepEqual(flow.year_status,['STAT_Ist_2025',...Array(6).fill('BMF_policy_forecast')]);
// Independent visual transcription anchors: all six published rows, including
// the 2025 component rounding residual. No invented distribution of residuals.
assert.deepEqual(flow.series,{
 prior_debt_bn:[395.1,418.1,438.2,457.3,473.4,490.3,507.8],
 deficit_positive_bn:[21.5,22.2,19.1,16.9,16.5,17.1,18],
 deficit_debt_adjustment_bn:[1.6,-2.1,.1,-.8,.4,.3,-.6],
 statistical_accrual_adjustment_bn:[1.5,2.1,.6,-.3,.9,.8,-.1],
 stock_flow_adjustment_bn:[0,-4.2,-.5,-.5,-.5,-.5,-.5],
 closing_debt_bn:[418.1,438.2,457.3,473.4,490.3,507.8,525.2]
});
assert.deepEqual(baseline.years,[2026,2027,2028,2029,2030,2031]);
const s=baseline.series;
assert.deepEqual(s.interest_expenditure_bn,[9.4,10.6,11.7,12.9,14.3,15.4]);
assert.deepEqual(s.maastricht_balance_bn,[-22.2,-19.1,-16.9,-16.5,-17.1,-18]);
assert.deepEqual(s.primary_balance_bn,[-12.8,-8.5,-5.2,-3.6,-2.9,-2.6]);
assert.equal(contributions.year,2024);assert.equal(contributions.bridge.core_statistical_employee_pv_kv_alv_mio_eur,29600);
assert.equal(contributions.bridge.exact_policy_eligible_cash_contribution_total_eur,null);
const referenceBase=contributions.bridge.core_statistical_employee_pv_kv_alv_mio_eur/1000;
const round=x=>Math.round(x*1e8)/1e8;
const reconciliation=flow.years.map((year,i)=>({year,
 debt_identity_residual_bn:round(flow.series.closing_debt_bn[i]-flow.series.prior_debt_bn[i]-flow.series.deficit_positive_bn[i]-flow.series.deficit_debt_adjustment_bn[i]),
 adjustment_component_residual_bn:round(flow.series.deficit_debt_adjustment_bn[i]-flow.series.statistical_accrual_adjustment_bn[i]-flow.series.stock_flow_adjustment_bn[i]),
 ...(i?{primary_balance_from_signed_balance_plus_interest_bn:round(s.maastricht_balance_bn[i-1]+s.interest_expenditure_bn[i-1]),
 published_primary_residual_bn:round(s.primary_balance_bn[i-1]-s.maastricht_balance_bn[i-1]-s.interest_expenditure_bn[i-1])}:{})
}));
for(const r of reconciliation){assert.ok(Math.abs(r.debt_identity_residual_bn)<=.1);assert.ok(Math.abs(r.adjustment_component_residual_bn)<=.1);}
for(let i=0;i<6;i++){assert.equal(flow.series.closing_debt_bn[i+1],s.maastricht_debt_bn[i]);assert.equal(flow.series.deficit_positive_bn[i+1],-s.maastricht_balance_bn[i]);}
const cases=[];
for(const [i,year] of baseline.years.entries())for(const cut of [0,.1,.25,.5])for(const recapture of [0,.3])for(const savingShare of [0,.25,.5,1]){
 for(const target of savingShare===1?[0]:[0,10]){
  const input={balance_bn:s.maastricht_balance_bn[i],interest_bn:s.interest_expenditure_bn[i],avoided_interest_bn:s.interest_expenditure_bn[i]*savingShare,
   relief_cost_bn:referenceBase*cut*(1-recapture),target_surplus_bn:target,deficit_debt_adjustment_bn:flow.series.deficit_debt_adjustment_bn[i+1]};
  cases.push({reference_year:year,contribution_reference_year:2024,core_reduction_share:cut,assumed_tax_recapture_share:recapture,
   avoided_interest_share:savingShare,full_interest_removal_is_extreme_accounting_case:savingShare===1,
   input,result:fundingBridge(input)});
 }
}
assert.equal(cases.length,336);
const adjustmentSensitivities=[-2,0,2].map(adjustment=>({assumed_adjustment_bn:adjustment,
 debt_reduction_from_10bn_surplus_bn:10-adjustment,minimum_nonnegative_surplus_for_10bn_debt_reduction_bn:surplusForDebtReduction(10,adjustment)}));
const totals={years:'2026-2031',forecast_deficits_bn:round(flow.series.deficit_positive_bn.slice(1).reduce((a,b)=>a+b,0)),
 forecast_debt_adjustments_bn:round(flow.series.deficit_debt_adjustment_bn.slice(1).reduce((a,b)=>a+b,0)),
 forecast_debt_increase_bn:round(flow.series.closing_debt_bn.at(-1)-flow.series.prior_debt_bn[1])};
assert.equal(totals.forecast_deficits_bn,109.8);assert.equal(totals.forecast_debt_adjustments_bn,-2.7);assert.equal(totals.forecast_debt_increase_bn,107.1);
const out={version:1,status:'conditional_funding_requirement_not_verified_financing',source_hashes:hashes,
 contribution_reference:{year:2024,statistical_core_bn:referenceBase,relative_half_cost_bn:referenceBase*.5,exact_policy_cash_cost_identified:false,nominal_reference_held_constant_not_forecast:true},
 national_actual_reform_cost_bn:null,verified_avoided_interest_bn:null,verified_budget_credit_bn:0,
 official_reconciliation:reconciliation,official_debt_flow_totals:totals,cases,adjustment_sensitivities:adjustmentSensitivities};
const fmt=x=>x.toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2});
let md=`# WERK — Zinsersparnis, Budgetausgleich und SV-Finanzierung

Stand: 8. September 2026. Die Gesamtrechnung enthält jetzt eine **jährliche Finanzierungsbrücke mit 336 bedingten Vergleichen**. Sie trennt den zusätzlichen Bedarf für Budgetausgleich, einen Überschuss und die SV-Senkung. Der Betrag einer Zinsausgabe ist noch kein frei verfügbares Entlastungsbudget.

## Was die amtliche Ausgangslage bedeutet

Der beschlossene [BMF-Budgetbericht, Tabellen 22 und 23](${flow.source.url}) liefert Zinsen, Saldo und Schuldenüberleitung. Die Originaldatei ist gespeichert; Tabelle 23 wurde visuell und über Textauszug geprüft. Die CI kontrolliert den Dateihash, die Zahlentranskription und die Rechenidentitäten, ohne eine automatische PDF-Tabellenerkennung zu behaupten.

| Bezugsjahr | Zinsausgaben | Maastricht-Saldo | Saldo, falls sämtliche Zinsen entfielen |
|---|---:|---:|---:|
`;
for(let i=0;i<6;i++)md+=`| ${baseline.years[i]} | ${fmt(s.interest_expenditure_bn[i])} | ${fmt(s.maastricht_balance_bn[i])} | ${fmt(s.maastricht_balance_bn[i]+s.interest_expenditure_bn[i])} |\n`;
md+=`
Alle Beträge in Mrd. Euro pro Jahr. Die letzte Spalte ist eine extreme Gegenrechnung mit ansonsten unverändertem Haushalt. Sie sagt weder, dass Österreich bis 2031 schuldenfrei wird, noch dass sich sämtliche Zinsausgaben kurzfristig vermeiden lassen. Selbst dann bleibt in jedem Bezugsjahr ein Defizit. Für 2030 ergibt die Addition −2,80 Mrd. Euro; der gesondert publizierte Primärsaldo beträgt −2,90 Mrd. Euro. Die Rundungsabweichung von −0,10 Mrd. Euro bleibt ausdrücklich sichtbar.

## SV-Senkung braucht einen tragfähigen Haushalt

Für die vergleichbare Rechnung verwenden wir die bereits geprüfte historische ESSOSS-Referenz: 29,60 Mrd. Euro Arbeitnehmer-KV/PV/ALV 2024; eine Halbierung entspricht 14,80 Mrd. Euro. Die ALV-Aufteilung ist statistisch angenommen. Dieser Betrag ist **keine genaue Reformkostenschätzung für 2026–2031**. Er bleibt nominal konstant, damit allein die Budgetmechanik sichtbar wird; Lohnwachstum, Demografie, Sonderfälle und Verwaltungskosten sind hier nicht eingerechnet.

| Bezugsjahr | Zusätzliche Verbesserung für Nulldefizit + Referenzhalbierung, ohne Zinsersparnis | Nach hypothetischem vollständigem Zinsentfall | Danach bei zusätzlich angenommenen 30 % Steuerrückfluss |
|---|---:|---:|---:|
`;
for(const year of [2026,2028,2031]){
 const pick=(saving,recap)=>cases.find(c=>c.reference_year===year&&c.core_reduction_share===.5&&c.assumed_tax_recapture_share===recap&&c.avoided_interest_share===saving&&c.input.target_surplus_bn===0).result.required_additional_primary_improvement_bn;
 md+=`| ${year} | ${fmt(pick(0,0))} | ${fmt(pick(1,0))} | ${fmt(pick(1,.3))} |\n`;
}
md+=`
Mrd. Euro jährlich; 30 % Steuerrückfluss ist eine Sensitivität, kein belegter nationaler Rückfluss. Die Werte bezeichnen die noch nötige zusätzliche dauerhafte Verbesserung der übrigen Einnahmen und Ausgaben gegenüber dem jeweiligen Referenzhaushalt. Sie sind keine vorhandene Finanzierung. Die gesonderte ALV-Glättung ist in den 14,80 Mrd. Euro nicht zusätzlich eingerechnet.

Für 2026 ergibt sich ohne angenommene Zinsersparnis: **22,20 Mrd. Euro** bis zum Maastricht-Nulldefizit; **32,20 Mrd. Euro** bis zu einem jährlichen Maastricht-Überschuss von 10 Mrd. Euro; einschließlich der statischen Referenzhalbierung **47,00 Mrd. Euro**. Die drei Werte sind aufeinander aufbauende Gesamtanforderungen und dürfen nicht miteinander addiert werden. Strukturelle Bereinigung und die Überleitung zum tatsächlichen Schuldenstand bleiben zusätzlich erforderlich.

## Jede Ersparnis wird genau einmal verwendet

Die verwendete Identität lautet:

Zusätzlicher Verbesserungsbedarf = max(0; Zielüberschuss + Netto-Entlastungskosten − bisheriger Saldo − tatsächlich nutzbare Zinsersparnis).

Netto-Entlastungskosten = Bruttobeitragsausfall minus gesondert belegbarer Steuermehreinnahmen. Ein bereits in diesen Nettokosten abgezogener Steuerrückfluss darf nicht nochmals als Finanzierung angesetzt werden. Dasselbe gilt für Zinsersparnisse, die bereits in einem aktualisierten Basissaldo enthalten oder anderen Maßnahmen zugeteilt sind. Die gegenwärtige Rechnung arbeitet mit hypothetischen Ersparnisanteilen am unveränderten BMF-Referenzsaldo.

Mit vollständig entfallenen Zinsen wird kein weiterer Tilgungsüberschuss verlangt: Nach Schuldenfreiheit wäre dieser Zweck entfallen. Während der Tilgung werden die Anforderungen für 0 und 10 Mrd. Euro Zielüberschuss getrennt gezeigt. Die Vergleiche sind einzelne Jahresbilanzen, keine Folge von Jahreszuständen oder fertiger Tilgungsplan.

## Ein Budgetüberschuss ist nicht automatisch gleich viel Schuldentilgung

Neu ist die amtliche Schuldenüberleitung. Ihre 42 Werte zeigen für 2026–2031 zusammen 109,80 Mrd. Euro Defizite, −2,70 Mrd. Euro Anpassungen und dadurch 107,10 Mrd. Euro zusätzlichen Schuldenstand. Vorzeichen beachten: Tabelle 23 zeigt das Defizit positiv. Einzelne gerundete Zeilen weisen 0,10 Mrd. Euro Restabweichung auf; diese wird nicht umverteilt.

Schuldenänderung = −Maastricht-Saldo + Deficit-Debt Adjustment.

| Angenommene Schuldenanpassung | Schuldenabbau bei 10 Mrd. € Überschuss | Nötiger Überschuss für 10 Mrd. € Schuldenabbau |
|---|---:|---:|
`;
for(const r of adjustmentSensitivities)md+=`| ${fmt(r.assumed_adjustment_bn)} | ${fmt(r.debt_reduction_from_10bn_surplus_bn)} | ${fmt(r.minimum_nonnegative_surplus_for_10bn_debt_reduction_bn)} |\n`;
md+=`
Diese drei Annahmen sind Sensitivitäten in Mrd. Euro. Die offiziellen Anpassungen dürfen nicht unverändert als Wirkung einer WERK-Reform fortgeschrieben werden. Insbesondere eine Verringerung von Liquidität oder eine innerstaatliche Konsolidierung ist keine wiederkehrende Einnahme, die laufende Sozialversicherung ersetzen könnte. Die bestehenden Tilgungsszenarien mit ausdrücklich null angenommenen Anpassungen bleiben unverändert.

## Konsequenz für dein Ziel

Die schrittweise relative 50%-Senkung der Arbeitnehmer-KV/PV/ALV bleibt das Ziel. Dafür braucht es einen belegten dauerhaften Überschuss vor Zinsen, nachweislich verfügbare jährliche Zinsersparnisse und eine Ersatzfinanzierung, die mit Beitragssummen und Leistungsbedarf mitwächst. Erhaltene Versicherungsansprüche bleiben Voraussetzung.

Die Rechnung macht den noch zu finanzierenden Betrag sichtbar. Sie aktiviert keine Beitragssenkung und schreibt **0 Euro verifizierte zusätzliche Finanzierung** gut. Nächste sachliche Arbeit: konkrete dauerhafte Reformeffekte und deren Vollzug belegen sowie die tatsächliche Zins-/Liquiditäts-/Schuldenüberleitung der Umsetzung erstellen. Weitere frei gewählte Rechenszenarien ersetzen diese Daten nicht.

Reproduktion: \`node scripts/werk-sv-funding-bridge-contract.mjs\` und \`node scripts/werk-sv-funding-bridge-negative-check.mjs\`. [Gesamtrechnung](WERK_GESAMTRECHNUNG.md) · [Beitragsbasis](WERK_SV_BEITRAGSBASIS.md) · [Wachstumsstress](WERK_SV_WACHSTUMSSTRESS.md).
`;
for(const [p,body] of Object.entries({'werk-data/employee-sv-funding-bridge-results.json':JSON.stringify(out,null,2)+'\n','WERK_SV_FINANZIERUNGSBRUECKE.md':md})){
 if(process.argv.includes('--write'))fs.writeFileSync(p,body);else assert.equal(fs.readFileSync(p,'utf8'),body,`${p}: regenerate`);
}
console.log('SV funding bridge OK: 42 official debt-flow values, 336 conditional funding cases, explicit rounding residuals; verified funding remains zero.');
