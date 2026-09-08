import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {breakEven} from './lib/werk-tax-enforcement.mjs';
const hashes={};
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>{hashes[p]=hash(p);return JSON.parse(fs.readFileSync(p));};
const e=read('werk-data/tax-enforcement-evidence-2025.json'),m=read('werk-data/tax-enforcement-break-even-model.json'),t=read('werk-data/tax-compliance-model.json');
assert.equal(hash(e.original_path),e.sha256);
// Pinned transcription of rendered pages, not automated extraction from the PDF.
assert.equal(e.sha256,'3540d4e819bc2c4fc316a39531aa5083deaba99666b6c926e1b95c1f3d342ca6');
assert.deepEqual(e.monetary_rows.map(x=>[x.id,x.amount_eur,x.page,x.stage]),[
 ['fines_imposed',44925494,38,'imposed_not_cash'],['tax_investigation_results',84323122,38,'additional_result_not_cash'],
 ['fines_requested_employment',20932646,38,'requested_not_imposed'],['fines_requested_gambling',2111500,38,'requested_not_imposed'],
 ['fines_collected_financial_police',1758972,38,'collected_subset_not_total_tax_cash']]);
assert.equal(e.year,2025);assert.equal(e.personnel.fte_2025,884);assert.equal(e.personnel.page,39);
const b=e.office_budget;
assert.deepEqual([b.page,b.appropriation_eur,b.planned_personnel_eur,b.planned_operations_eur,b.planned_investment_eur,b.planned_loans_advances_eur,b.actual_outlays_eur,b.actual_office_receipts_eur,b.printed_utilization_pct,b.printed_unused_pct,b.printed_unused_amount_raw],[40,79543000,75803000,3642000,38000,60000,78179767,7319,98.35,1.65,'1.311.2365']);
assert.equal(b.appropriation_eur,b.planned_personnel_eur+b.planned_operations_eur+b.planned_investment_eur+b.planned_loans_advances_eur);
for(const k of ['headline_cash_reconciliation','row_overlap_reconciliation','source_budget_discrepancy'])assert.equal(e.boundaries[k],'open');
assert.equal(e.boundaries.tax_only_cash_total_eur,null);assert.equal(e.boundaries.additional_werk_revenue_eur,null);
assert.equal(m.pilot_measurement_spec.verified_annual_funding_credit_eur,0);
assert.deepEqual(m.pilot_measurement_spec.gates,{attributable_additional_cash_verified:false,baseline_overlap_removed:false,refunds_finality_and_displacement_reconciled:false,incremental_all_in_costs_verified:false,recurrence_verified:false});
assert.equal(t.baseline.anti_fraud_office_2025_press_headline_eur_million_lower_bound,154);
assert.equal(t.baseline.anti_fraud_office_2025_verified_tax_cash_eur_million,null);
assert.ok(!('anti_fraud_office_2025_recovered_eur_million_min' in t.baseline));
const a=m.assumptions;
assert.deepEqual(a.horizons_years,[1,5,10]);assert.deepEqual(a.eventual_net_cash_share_cases,[.5,.75,1]);assert.deepEqual(a.whole_year_collection_lag_cases,[0,1,2]);
assert.equal(a.annual_incremental_cost_mio,t.model.default_additional_enforcement_cost_eur_million);
const find=(x,id)=>{if(!x||typeof x!=='object')return; if(x.id===id)return x;for(const v of Object.values(x)){const r=find(v,id);if(r)return r;}};
const excluded=m.government_overlap_exclusions.map(x=>{const d=read(x.artifact),row=find(d,x.id);assert.ok(row,x.id);return {id:x.id,artifact:x.artifact,years:d.years,baseline_row:row,note:x.note};});
assert.deepEqual(excluded.map(x=>x.id),['P25-REV-FRAUD','REV-BBG-TAX','REV-OPEN-FRAUD3']);
const cases=a.horizons_years.flatMap(horizon=>a.eventual_net_cash_share_cases.flatMap(cashShare=>a.whole_year_collection_lag_cases.map(lag=>breakEven({annualCost:a.annual_incremental_cost_mio,initialCost:a.initial_cost_mio,ramp:a.assessment_ramp,cashShare,lag,horizon,discountPct:a.discount_rate_pct}))));
const result={version:'2026-09-08-v1',status:m.status,source_hashes:hashes,source_pdf_sha256:e.sha256,
 evidence_reconciliation:{heterogeneous_row_arithmetic_sum_eur:e.monetary_rows.reduce((s,r)=>s+r.amount_eur,0),sum_is_nonoverlapping_cash:false,actual_office_outlays_eur:b.actual_outlays_eur,appropriation_less_outlays_eur:b.appropriation_eur-b.actual_outlays_eur,computed_utilization_pct:b.actual_outlays_eur/b.appropriation_eur*100,printed_utilization_pct:b.printed_utilization_pct,utilization_residual_percentage_points:b.actual_outlays_eur/b.appropriation_eur*100-b.printed_utilization_pct,printed_unused_amount_raw:b.printed_unused_amount_raw,source_budget_discrepancy:'open',verified_pure_tax_cash_total_eur:null},government_overlap_exclusions:excluded,cases,verified_annual_funding_credit_eur:0};
const fmt=(x,n=2)=>x===null?'keine Einzahlungen im Zeitraum':x.toLocaleString('de-AT',{minimumFractionDigits:n,maximumFractionDigits:n});
const five=cases.filter(c=>c.horizon_years===5&&c.lag_years===1);
const report=`# WERK – Zusätzlichen Steuer-Vollzug belastbar rechnen

Stand 8. September 2026. TAX-001 ergänzt TAX-02 um Quellenabgleich und eine überprüfbare Finanzierungsschwelle. Der Reformfokus auf Gewinnverlagerung bleibt bestehen. Die gesamte ABB-Tätigkeit belegt keinen spezifischen Verrechnungspreisertrag.

## Was die amtliche Quelle trägt

Der [ABB-Jahresbericht 2025](${e.url}) unterscheidet auf Seite 38 fünf Ergebnisarten:

| Ergebnisart | Euro | Einordnung |
|---|---:|---|
${e.monetary_rows.map(r=>`| ${r.label} | ${fmt(r.amount_eur,0)} | ${({imposed_not_cash:'verhängt, Einzahlung nicht nachgewiesen',additional_result_not_cash:'Mehrergebnis, Einzahlung nicht nachgewiesen',requested_not_imposed:'beantragt',collected_subset_not_total_tax_cash:'eingebrachte Teilkategorie'})[r.stage]} |`).join('\n')}

Die rechnerische Summe ist **${fmt(result.evidence_reconciliation.heterogeneous_row_arithmetic_sum_eur,0)} Euro**. Sie liegt nahe der [Presseangabe von mehr als 154 Mio. Euro](https://www.bmf.gv.at/presse/pressemeldungen/2026/februar-2026/abb-bilanz.html). Das ist eine arithmetische Beobachtung, kein Beleg für die Zusammensetzung der Pressezahl oder für überschneidungsfreie Steuereinzahlungen. Die 1,76 Mio. eingebrachter Geldstrafen sind eine Teilkategorie und könnten sich mit verhängten Strafen überschneiden. Sie sind weder das gesamte ABB-Cash-Ergebnis noch reine Steuereinnahmen.

Seiten 39–40: 884 ausgewiesene VZÄ; 79,543 Mio. Euro veranschlagt, 78,180 Mio. tatsächlich ausgezahlt. Die 7.319 Euro Einzahlungen des Verwaltungs-Detailbudgets messen nicht die gesamte Steuer-Einbringung. Plan-Personalkosten dürfen nicht als tatsächlicher Personalaufwand eingesetzt werden; Behördendurchschnitte identifizieren keine Kosten oder Erträge eines zusätzlichen Prüfers.

Auch die Quelle hat eine offene Rechendifferenz: Aus Ansatz minus Auszahlungen folgen **${fmt(result.evidence_reconciliation.appropriation_less_outlays_eur,0)} Euro** und **${fmt(result.evidence_reconciliation.computed_utilization_pct,4)} %** Ausnutzung. Gedruckt sind 98,35 % und der fehlerhaft formatierte Zahlenwert „1.311.2365“. Die Originalangaben bleiben erhalten; die Differenz wird nicht künstlich verteilt. Daraus wird keine neue Einsparung gebucht.

## Welche Schwelle ein zusätzlicher Ausbau erreichen müsste

Bedingte Annahmen: jährlich 20 Mio. Euro zusätzliche Gesamtkosten (bisheriger TAX-02-Szenariowert), einmalig 10 Mio. zu Beginn; Nachforderungsaufbau 25/75/100 % in den ersten drei Jahren. Alle Kostenbeträge, Einbringungsquoten und Verzögerungen sind **unbelegte Sensitivitätsannahmen**, kein angenommener Ist-Ertrag. Die Quote umfasst endgültigen Bestand und Nettoeinbringung nach Erstattungen. Kosten umfassen auch zusätzlich ausgelöste Daten-, Rechtsmittel- und Einbringungsarbeit; ihre tatsächliche Höhe ist offen.

Bei einem Jahr Zahlungsverzögerung müssen innerhalb von fünf Jahren insgesamt 110 Mio. Euro Kosten gedeckt werden. Vier Nachforderungskohorten kommen bis dahin zur Zahlung; deren Rampenfaktoren summieren sich auf 3.

| Dauerhaft netto einbringbarer Anteil | Jährliche zusätzliche Nachforderung bei Vollausbau für laufende Kostendeckung | Für kumulative Kostendeckung bis Jahr 5 | Mit 3 % Abzinsung bis Jahr 5 |
|---|---:|---:|---:|
${five.map(c=>`| ${fmt(c.cash_share*100,0)} % | ${fmt(c.steady_operating_break_even_assessment_mio)} Mio. € | ${fmt(c.required_steady_annual_assessment_mio)} Mio. € | ${fmt(c.required_steady_annual_assessment_npv_mio)} Mio. € |`).join('\n')}

Formeln: laufende Schwelle = Jahreskosten / Quote. Kumulative Schwelle = (Startkosten + Jahre × Jahreskosten) / (Quote × Summe der bis dahin zahlenden Kohortenfaktoren). NPV diskontiert Jahresendkosten und -zahlungen, Startkosten liegen bei t0. Es gibt keine Anfangsforderungen oder erfundenen Restwerte; später eingehende Kohorten zählen erst im späteren Zeitraum. Null Einzahlungsfaktor wird als innerhalb des Horizonts nicht finanzierbar ausgewiesen, nicht als Nullbedarf.

**27 Kombinationen** für 1/5/10 Jahre, 50/75/100 % Quote und 0/1/2 Jahre Verzögerung sind vollständig in tax-enforcement-break-even-results.json gerechnet. Die frühere KÖSt-Prozentsensitivität bleibt separat bestehen; ein angenommener Aufkommensanteil ist kein beobachteter Mehrertrag.

## Konkreter Nachweis vor einer Finanzierungsbuchung

Die neue Messspezifikation fordert aggregierte Nachforderungskohorten mit Bescheid-, Rechtskraft-, Zahlungs-, Erstattungs- und Kostenbrücke. Ein vorab definierter, rechtlich zulässiger Vergleich ähnlicher Fälle oder gestaffelter Einführung muss zusätzliche Wirkung gegenüber der bestehenden Fallauswahl und dem Regierungsprogramm nachweisen. Unterschiede der Fallauswahl und Unsicherheit werden berichtet. Einmaleffekte und bloße Vorverlagerungen decken keine dauerhafte SV-Senkung.

P25-REV-FRAUD, REV-BBG-TAX und REV-OPEN-FRAUD3 bleiben Regierungsbaseline. Die breite Steuer-Maßnahmengruppe ist kein reines Vollzugsbudget; Aggregate und Teilmaßnahmen werden nicht addiert. Bereits erzieltes ABB-Ergebnis, Zoll-Mehrergebnisse, Geldstrafen und zusätzliche SV-Beiträge werden nicht als neue KÖSt-WERK-Einnahmen eingesetzt.

Die nächste fachliche Freigabe braucht tatsächliche zusätzliche Nettoeinzahlungen, bereinigte Überschneidungen, Rechtskraft-/Erstattungsnachweis, Vollkosten und wiederholte Wirkung über mehrere Kohorten. Der Pilot ist ein prüfbarer Vorschlag; seine Ausgaben sind noch nicht finanziert. **Verifiziertes zusätzliches Finanzierungsvolumen bleibt 0 Euro.** Das Ziel, Arbeitnehmerbeiträge mit tragfähigem Schuldenabbau schrittweise um relativ 50 % zu senken, bleibt bestehen; diese Rechnung aktiviert weder Tilgung noch Beitragssenkung.

## Reproduzieren

\`node scripts/werk-tax-enforcement-contract.mjs\` prüft Originalhash, festgehaltene Transkription, Regierungsbaseline, Annahmen und generierte Ergebnisse. \`node scripts/werk-tax-enforcement-negative-check.mjs\` prüft unabhängige Rechenanker, Zahlungszeitpunkte und Fehlerfälle. Änderungen an der Rechnung werden mit \`--write\` neu erzeugt.
`;
for(const [p,content] of [['werk-data/tax-enforcement-break-even-results.json',JSON.stringify(result,null,2)+'\n'],['WERK_STEUERVOLLZUG_RECHNUNG.md',report]]) {
 if(process.argv.includes('--write'))fs.writeFileSync(p,content);else assert.equal(fs.readFileSync(p,'utf8'),content,`${p} stale`);
}
console.log('TAX001: source/stage/budget reconciliation, 27 conditional break-even cases and funding gates passed');
