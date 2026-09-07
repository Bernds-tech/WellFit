import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {thresholdCalculator,recoveryGross} from './lib/werk-alv-threshold.mjs';
const hashes={};
const read=path=>{const s=fs.readFileSync(path,'utf8');hashes[path]=createHash('sha256').update(s).digest('hex');return JSON.parse(s);};
const spec=read('werk-data/employee-alv-threshold-model-2026.json');
const kernel=read('werk-data/payroll-employee-kernel-2026.json'),annual=read('werk-data/payroll-annual-assessment-2026.json');
for(const file of ['scripts/lib/werk-alv-threshold.mjs','scripts/lib/werk-post-debt-sv.mjs','scripts/lib/werk-payroll-2026.mjs','scripts/lib/werk-annual-assessment-2026.mjs'])
  hashes[file]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert.equal(spec.rule_year,2026);
assert.deepEqual(spec.source.thresholds_eur,[2225,2427,2630]);
assert.deepEqual(spec.source.employee_rates_pct,[0,1,2,2.95]);
assert.deepEqual(kernel.social_insurance.employee_unemployment_rate_schedule.map(x=>x.rate_pct),spec.source.employee_rates_pct);
assert.deepEqual(kernel.social_insurance.employee_unemployment_rate_schedule.slice(0,3).map(x=>x.gross_upper_eur),spec.source.thresholds_eur);
assert.deepEqual(spec.employee_core_reduction_shares,[0,.1,.25,.5]);
assert.deepEqual(spec.regions,['outside_vienna','vienna']);
assert.deepEqual(spec.monthly_gross_increases_eur,[.01,1,5,10,20,30,50,100]);
for(const key of ['actual_employee_alv_receipts_eur','employment_effect_persons'])assert.equal(spec[key],null);
assert.equal(spec.verified_budget_credit_eur,0);
const round=x=>Math.round(x*1e8)/1e8;
const rows=[];
for(const region of spec.regions)for(const reductionShare of spec.employee_core_reduction_shares)for(const [i,threshold] of spec.source.thresholds_eur.entries()){
  const calc=thresholdCalculator(kernel,annual,{region,reductionShare});
  const at=calc(threshold),above=calc(threshold+.01);
  const recovery=recoveryGross(calc,threshold,spec.source.thresholds_eur[i+1]??3000);
  assert.ok(calc(recovery).annual_net_eur>=at.annual_net_eur);
  assert.ok(calc(recovery-.01).annual_net_eur<at.annual_net_eur);
  const steps=spec.monthly_gross_increases_eur.map(increase=>{
    const p=calc(threshold+increase),grossGain=p.annual_gross_eur-at.annual_gross_eur;
    const contributionChange=p.annual_contributions_eur-at.annual_contributions_eur,taxChange=p.annual_assessed_tax_eur-at.annual_assessed_tax_eur;
    const gain=p.annual_net_eur-at.annual_net_eur;
    assert.ok(Math.abs(grossGain-contributionChange-taxChange-gain)<1e-7);
    return {monthly_gross_increase_eur:increase,annual_gross_increase_eur:round(grossGain),annual_contribution_change_eur:round(contributionChange),annual_tax_change_eur:round(taxChange),annual_net_change_eur:round(gain)};
  });
  rows.push({region,employee_core_reduction_share:reductionShare,threshold_monthly_gross_eur:threshold,
    annual_net_at_threshold_eur:round(at.annual_net_eur),annual_net_above_threshold_eur:round(above.annual_net_eur),
    annual_net_loss_for_one_cent_raise_eur:round(at.annual_net_eur-above.annual_net_eur),
    recovery_monthly_gross_eur:recovery,required_monthly_gross_increase_eur:round(recovery-threshold),steps});
}
assert.equal(rows.length,24);
const out={version:spec.version,rule_year:2026,source_hashes:hashes,scope:spec.scope,future_rule_warning:spec.future_rule_warning,
  result_scope:'24 local threshold diagnostics and 192 gross-increase comparisons, not complete marginal household burden.',
  current_budget_credit_eur:0,employment_effect_persons:null,rows};
const fmt=x=>x.toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2});
let md=`# WERK — Mehr Brutto, zeitweise weniger Netto: ALV-Schwellen 2026

Stand: 7. September 2026. Die schrittweise relative Halbierung der Arbeitnehmer-KV/PV/ALV bleibt das WERK-Ziel bei gesicherter Finanzierung und unveränderten Leistungsansprüchen.

**Eine Beitragssenkung allein beseitigt nicht jede Schwelle, an der Mehrverdienst zunächst weniger Netto bringt.** Der vorhandene 2026-Regelkern wurde jetzt für drei ALV-Grenzen, zwei Regionen und vier Entlastungsstufen durchgerechnet: 24 Schwellenfälle und 192 Vergleiche kleiner Gehaltserhöhungen.

Die [ÖGK-Regeln 2026](${spec.source.url}) sehen abhängig vom Monatsentgelt 0 %, 1 %, 2 % oder 2,95 % Arbeitnehmer-ALV vor. Der höhere Satz erfasst beim Grenzübertritt die gesamte Beitragsgrundlage. Laufende Bezüge und Sonderzahlungen werden getrennt beurteilt. Diese Berechnung verwendet ausschließlich diese 2026-Regeln.

## Ergebnis für den Standardfall außerhalb Wiens

Jeder Fall vergleicht zwei ganzjährige Gehälter: zwölf laufende Bezüge und zwei gleich hohe Sonderzahlungen. „Ein Cent mehr“ bedeutet einen Cent mehr bei jedem der 14 Bezüge; der ausgewiesene Verlust betrifft das gesamte Jahr nach Standard-Veranlagung. Es handelt sich nicht um die Wirkung einer einmaligen Gehaltserhöhung am Jahresende.

| Monatsbrutto an der Schwelle | Jahresnettoverlust bei +0,01 € ohne Reform | Monatsbrutto zur Wiederherstellung des Jahresnettos | Jahresnettoverlust bei +0,01 € mit 50 % weniger KV/PV/ALV | Monatsbrutto zur Wiederherstellung mit Reform |
|---|---:|---:|---:|---:|
`;
for(const threshold of spec.source.thresholds_eur){
 const a=rows.find(x=>x.region==='outside_vienna'&&x.employee_core_reduction_share===0&&x.threshold_monthly_gross_eur===threshold);
 const b=rows.find(x=>x.region==='outside_vienna'&&x.employee_core_reduction_share===.5&&x.threshold_monthly_gross_eur===threshold);
 md+=`| ${fmt(threshold)} € | ${fmt(a.annual_net_loss_for_one_cent_raise_eur)} € | ${fmt(a.recovery_monthly_gross_eur)} € | ${fmt(b.annual_net_loss_for_one_cent_raise_eur)} € | ${fmt(b.recovery_monthly_gross_eur)} € |\n`;
}
md+=`
Die 50%-Spalte vergleicht innerhalb desselben Reformzustands das Gehalt an und knapp über der Grenze. Sie zeigt keinen Verlust durch die Reform gegenüber dem heutigen Netto: Die Reform erhöht im gerechneten Standardfall das Netto, während ein kleiner Bruttoschritt innerhalb des Reformtarifs weiterhin eine kleinere Nettoeinbuße auslösen kann.

Das erforderliche Monatsbrutto wird auf einem Cent-Raster gesucht. Der unmittelbar vorherige Cent muss das alte Jahresnetto noch unterschreiten. Die Steuer- und SV-Rechnung selbst erfolgt wie im bisherigen Regelkern vor Lohnzettel-Cent- und Bescheid-Euro-Rundung; die ausgegebenen Centbeträge sind Modellwerte, keine verbindlichen Lohnabrechnungen.

## Konsequenz für die weitere Reformrechnung

Eine gleichmäßige relative Beitragssenkung verkleinert die Sprünge. Solange der Beitragssatz beim Grenzübertritt auf das gesamte Entgelt angewandt wird, bleiben sie bestehen. Als nächster Gestaltungskandidat kommt ein stetiger Übergang der Beitragsbeträge in Betracht. Dafür müssten Verlauf, Verteilung und Einnahmenwirkung gesondert gerechnet werden; hier wird noch keine solche Regel beschlossen oder als finanziert ausgewiesen.

Familienleistungen, Wohnbeihilfen, Betreuungskosten, Pendeln, andere Absetzbeträge und einzelne Beschäftigungsgruppen sind nicht enthalten. Die Ergebnisse belegen weder individuelle Arbeitsaufnahmeentscheidungen noch eine Beschäftigungswirkung. Die tatsächliche ALV-Arbeitnehmer-Istsumme bleibt nach der Recherche getrennt offen; die [ESSOSS-Beitragsbasis](WERK_SV_BEITRAGSBASIS.md) verwendet weiterhin eine ausdrücklich gekennzeichnete statistische Aufteilung.

Ab 2027 ist die bereits in der Regierungsbaseline verzeichnete gesetzliche Übergangsregel REV-ALV-DN gesondert zu modellieren. Die hier gerechneten Schwellen sind kein Zukunftstarif. Prognostizierte Regierungseinnahmen sind außerdem keine zusätzlichen WERK-Einnahmen.

Reproduktion: \`node scripts/werk-alv-threshold-contract.mjs\`; Generierung mit \`--write\`. Quellen und verwendete Regeldateien sind gehasht. Aktuelle Finanzierungsgutschrift: **0 Euro**.
`;
for(const [p,s] of Object.entries({'werk-data/employee-alv-threshold-results-2026.json':JSON.stringify(out,null,2)+'\n','WERK_SV_ARBEITSANREIZE.md':md})){
 if(process.argv.includes('--write'))fs.writeFileSync(p,s);else assert.equal(fs.readFileSync(p,'utf8'),s,`${p}: regenerate`);
}
console.log('ALV threshold contract OK: 24 local notches, 192 gross steps, cent-minimal recovery; no household/population or future-law claim.');
