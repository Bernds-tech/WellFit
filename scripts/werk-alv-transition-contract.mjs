import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {contributionCalculator,transitionPayroll2026} from './lib/werk-alv-transition.mjs';
const hashes={};
const read=p=>{const s=fs.readFileSync(p);hashes[p]=createHash('sha256').update(s).digest('hex');return JSON.parse(s);};
const spec=read('werk-data/employee-alv-transition-model.json');
const kernel=read('werk-data/payroll-employee-kernel-2026.json'),annual=read('werk-data/payroll-annual-assessment-2026.json');
for(const p of ['scripts/lib/werk-alv-transition.mjs','scripts/lib/werk-payroll-2026.mjs','scripts/lib/werk-annual-assessment-2026.mjs','scripts/lib/werk-calculation.mjs'])hashes[p]=createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(spec.status,'unadopted_unfunded_design_candidates');assert.equal(spec.rule_year_for_net,2026);
assert.deepEqual(spec.transition_widths_eur,[50,100,150]);assert.deepEqual(spec.employee_core_reduction_shares,[0,.5]);assert.deepEqual(spec.regions,['outside_vienna','vienna']);
assert.equal(spec.verified_budget_credit_eur,0);assert.equal(spec.government_baseline_revenue_is_additional_werk_revenue,false);assert.equal(spec.benefits_preserved,true);
for(const k of ['aggregate_affected_persons','aggregate_annual_contribution_loss_eur','aggregate_annual_net_fiscal_cost_eur','implementation_cost_eur','employment_effect_persons'])assert.equal(spec[k],null);
const current=spec.sources[0],future=spec.sources[1];
assert.deepEqual(current.thresholds,[2225,2427,2630]);assert.deepEqual(current.rates,[0,1,2,2.95]);
assert.equal(future.status,'provisional_variable_values_pending_official_promulgation');
assert.deepEqual(future.existing_on_2026_12_31,{thresholds:[2327,2539,2751],rates:[.5,1.5,2.5,2.95]});
assert.deepEqual(future.new_from_2027_01_01,{thresholds:[2327,2539],rates:[1,2,2.95]});
assert.equal(future.monthly_max_base_eur,7410);assert.equal(future.annual_special_max_base_eur,14820);
const round=x=>Math.round(x*1e8)/1e8;
const clean=x=>JSON.parse(JSON.stringify(x,(_k,v)=>typeof v==='number'?round(v):v));
const rows=[];
for(const width of spec.transition_widths_eur)for(const region of spec.regions)for(const reductionShare of spec.employee_core_reduction_shares)for(const threshold of current.thresholds){
  const calc=transitionPayroll2026(kernel,annual,{width,region,reductionShare});
  const start=calc(threshold);
  const points=[0,.01,10,width/4,width/2,width*3/4,width,width+.01].map(offset=>{
    const p=calc(threshold+offset);
    assert.ok(p.annual_contribution_loss_eur>=-1e-7&&p.annual_net_gain_eur>=-1e-7);
    assert.ok(Math.abs(p.annual_contribution_loss_eur-p.annual_tax_recapture_eur-p.annual_net_gain_eur)<1e-7);
    return {...p,monthly_gross_increase_from_threshold_eur:offset,
      candidate_annual_net_change_from_threshold_eur:p.candidate.annual_net_eur-start.candidate.annual_net_eur,
      baseline_annual_net_change_from_threshold_eur:p.baseline.annual_net_eur-start.baseline.annual_net_eur};
  });
  assert.ok(points[1].candidate_annual_net_change_from_threshold_eur>0);
  assert.equal(points.at(-2).annual_contribution_loss_eur,0);
  rows.push({width_eur:width,region,employee_core_reduction_share:reductionShare,threshold_eur:threshold,points});
}
const futureRows=[];
for(const cohort of ['existing_on_2026_12_31','new_from_2027_01_01'])for(const width of spec.transition_widths_eur){
  const schedule=future[cohort],calc=contributionCalculator({...schedule,width});
  for(const threshold of schedule.thresholds)futureRows.push({cohort,width_eur:width,threshold_eur:threshold,
    points:[0,.01,10,width/2,width].map(offset=>({gross_eur:threshold+offset,...calc(threshold+offset)}))});
}
assert.equal(rows.length,36);assert.equal(futureRows.length,15);
const out=clean({version:1,source_hashes:hashes,status:spec.status,net_rule_year:2026,scope:spec.scope,
  interpretation:'Incremental smoothing cost vs the same core-reduction share; not the cost of the separate 50% reduction. Gross contributions fund unchanged benefits; tax recapture is consolidated-government arithmetic, not an automatic ALV transfer.',
  aggregate_annual_net_fiscal_cost_eur:null,verified_budget_credit_eur:0,rows,provisional_2027_contribution_only:futureRows});
const fmt=x=>x.toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2});
let md=`# WERK — Stetige ALV-Beiträge: berechnete Gestaltungsvarianten

Stand: 8. September 2026. **Drei berechnete Kandidaten, noch keine beschlossene oder finanzierte Zusatzreform.** Das Ziel einer schrittweisen relativen Halbierung der Arbeitnehmer-KV/PV/ALV während finanzierten Schuldenabbaus bleibt bestehen.

Die [bisherige Rechnung](WERK_SV_ARBEITSANREIZE.md) zeigt: An den ALV-Grenzen kann mehr Brutto vorübergehend weniger Jahresnetto ergeben. Hier steigt der Beitragsbetrag ab jeder Grenze stetig über einen Übergangsbereich von 50, 100 oder 150 Euro Monatsbrutto auf den bisherigen Beitrag an. Innerhalb dieses Bereichs liegt er unter dem jeweiligen Vergleichstarif; außerhalb bleibt er gleich. Berechnet sind 36 Varianten mit 288 Gehaltsvergleichen, jeweils ohne und mit 50 % weniger KV/PV/ALV sowie für Wien und außerhalb Wiens.

## Wie der Übergang funktioniert

Für eine Grenze t, Breite w und die Sätze r₀/r₁ als Dezimalzahlen gilt bei t < g < t+w:

Beitrag(g) = r₁ × g − t × (r₁−r₀) × [1−(g−t)/w].

Am Beginn entspricht der Betrag dem bisherigen Beitrag an der Grenze. Am Ende erreicht er den unveränderten höheren Satz auf das gesamte Brutto. Es wird der **Beitragsbetrag** geglättet; eine bloße lineare Änderung des Satzes hätte einen anderen Verlauf. Bei der relativen Halbierung wird der gesamte ALV-Verlauf halbiert, ebenso die KV/PV-Sätze. AK/WF bleiben wie im Referenzmodell. Der zusätzliche Glättungsaufwand ist getrennt von den Kosten dieser Halbierung.

## Zehn Euro mehr Brutto bei 100 Euro Übergangsbreite

Standardfall außerhalb Wiens, ohne allgemeine Beitragshalbierung. Jeder Vergleich gilt für ein ganzjähriges Gehalt mit 14 gleich hohen Bezügen: zehn Euro mehr je Bezug sind 140 Euro mehr Jahresbrutto. Ausgewiesen ist das Jahresnetto nach Standard-Veranlagung, vor Abrechnungsrundung.

| Monatsbrutto von → auf | Änderung Jahresnetto im geltenden 2026-Modell | Änderung mit stetigem Übergang | Zusätzlicher jährlicher Netto-Vorteil gegenüber dem geltenden Modell |
|---|---:|---:|---:|
`;
for(const r of rows.filter(x=>x.width_eur===100&&x.region==='outside_vienna'&&x.employee_core_reduction_share===0)){
 const p=r.points.find(x=>x.monthly_gross_increase_from_threshold_eur===10);
 md+=`| ${fmt(r.threshold_eur)} → ${fmt(r.threshold_eur+10)} € | ${fmt(p.baseline_annual_net_change_from_threshold_eur)} € | ${fmt(p.candidate_annual_net_change_from_threshold_eur)} € | ${fmt(p.annual_net_gain_eur)} € |\n`;
}
md+=`\n## Breite gegen Beitragseinnahmen: derselbe Arbeitnehmer

Bei 2.235 Euro Monatsbrutto, außerhalb Wiens, ohne allgemeine Beitragshalbierung. Die Beträge sind jährliche **zusätzliche** Wirkungen allein der Glättung gegenüber der 2026-Stufe.

| Übergangsbreite | Weniger ALV-Beiträge pro Jahr | Zusätzliche Jahressteuer einschließlich geänderter Erstattung | Mehr Jahresnetto / rechnerische staatliche Nettokosten |
|---|---:|---:|---:|
`;
for(const r of rows.filter(x=>x.threshold_eur===2225&&x.region==='outside_vienna'&&x.employee_core_reduction_share===0)){
 const p=r.points.find(x=>x.monthly_gross_increase_from_threshold_eur===10);
 md+=`| ${r.width_eur} € | ${fmt(p.annual_contribution_loss_eur)} € | ${fmt(p.annual_tax_recapture_eur)} € | ${fmt(p.annual_net_gain_eur)} € |\n`;
}
md+=`\nEin breiterer Übergang senkt in diesen Fällen die Grenzbelastung, entlastet aber mehr Gehaltspositionen und kostet bei derselben betroffenen Person mehr Beitragseinnahmen. Für 1.000 Personen mit genau diesem ganzjährigen Modellgehalt sind die jeweiligen Beträge mit 1.000 zu multiplizieren. Das ist eine reine Skalierung, keine Schätzung der tatsächlich Betroffenen. Eine nationale Summe braucht Häufigkeiten der monatlichen Beitragsgrundlagen einschließlich Sonderzahlungen, Beschäftigungsdauer, Region und Beschäftigungsgruppe. Die bisher vorhandenen breiten Jahresbruttogruppen reichen dafür nicht aus.

Die ALV verliert den ausgewiesenen Bruttobeitrag und braucht bei unveränderten Leistungen entsprechenden Ersatz. Zusätzliche Einkommensteuer verringert lediglich die gesamtstaatlichen Nettokosten; sie fließt nicht automatisch zur ALV. Verwaltungskosten und Verhaltensänderungen sind nicht enthalten. Deshalb bleiben nationale Kosten unbekannt und die Finanzierungsgutschrift **0 Euro**. Zinsersparnisse dürfen nicht zusätzlich zur Finanzierung der allgemeinen Beitragshalbierung nochmals für diesen Übergang verwendet werden.

## Ab 2027: zwei gesonderte Referenzgruppen

Die [ÖGK-Veröffentlichung für 2027](${future.url}) nennt vorläufige Grenzbeträge und unterscheidet bestehende und neue Dienstverhältnisse. Die veränderlichen Werte stehen unter Kundmachungsvorbehalt. Daraus wurden 15 weitere Varianten mit 75 Beitragsvergleichen berechnet; es sind **keine 2027-Nettolöhne**.

| Monatsbrutto | Am 31.12.2026 bestehendes Dienstverhältnis: ALV-DN | Dienstverhältnis ab 01.01.2027: ALV-DN |
|---|---:|---:|
| bis 2.327 € | 0,50 % | 1,00 % |
| über 2.327 bis 2.539 € | 1,50 % | 2,00 % |
| über 2.539 bis 2.751 € | 2,50 % | 2,95 % |
| über 2.751 € | 2,95 % | 2,95 % |

Die Beitragshöchstgrundlagen 2027 betragen laut derselben vorläufigen Veröffentlichung 7.410 Euro monatlich und 14.820 Euro jährlich für Sonderzahlungen. Alle hier berechneten Übergänge liegen darunter. Lehrlinge und andere Sondergruppen bleiben ausgeschlossen. Die vorhandene Regierungsmaßnahme REV-ALV-DN bleibt Bestandteil der Baseline; ihre Einnahmen sind keine neue WERK-Gegenfinanzierung. Eine spätere Gesetzesfassung oder neue Kundmachung erfordert eine neue Referenzprüfung.

## Prüfung und verbleibende Grenzen

Die Gegenprüfung untersucht jeden Cent in den 36 lokalen Übergangsfenstern, einschließlich Beginn und Ende. Sie verlangt steigendes Jahresnetto und keine höheren Beiträge als im jeweiligen Vergleichstarif. Eine unabhängige Rechnung interpoliert direkt zwischen den beiden Beitragsbeträgen; zusätzlich werden falsche Jahre, überlappende Übergänge, ungültige Werte und unzulässig geschlossene Finanzierungsannahmen zurückgewiesen.

Die Aussage gilt für diese Übergangsfenster und den Standardfall. Sie ist keine Aussage über alle Einkommen, Haushaltstransfers, Betreuungskosten oder tatsächliche Arbeitsaufnahme. Eine vollständige repräsentative Verteilungsrechnung und die Finanzierung stehen weiter aus. Auch eine allgemeine Beitragshalbierung allein genügt nicht als Beleg für deren dauerhafte Finanzierbarkeit: siehe [Wachstumsstress](WERK_SV_WACHSTUMSSTRESS.md).

Reproduktion: \`node scripts/werk-alv-transition-contract.mjs\` und \`node scripts/werk-alv-transition-negative-check.mjs\`. Generierung mit \`--write\`; Eingaben und Rechenbibliotheken sind gehasht.
`;
for(const [p,s] of Object.entries({'werk-data/employee-alv-transition-results.json':JSON.stringify(out,null,2)+'\n','WERK_SV_STETIGE_BEITRAEGE.md':md})){
 if(process.argv.includes('--write'))fs.writeFileSync(p,s);else assert.equal(fs.readFileSync(p,'utf8'),s,`${p}: regenerate`);
}
console.log('ALV transition contract OK: 36 net variants / 288 comparisons; 15 provisional 2027 contribution variants / 75 comparisons; aggregate costs open.');
