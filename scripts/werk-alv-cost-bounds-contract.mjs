import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {paymentCostBound,annualContributionExample} from './lib/werk-alv-cost-bounds.mjs';
const hashes={};
const read=p=>{const b=fs.readFileSync(p);hashes[p]=createHash('sha256').update(b).digest('hex');return JSON.parse(b);};
const spec=read('werk-data/employee-alv-transition-model.json'),distribution=read('werk-data/employee-contribution-distribution-2024.json');
for(const p of ['scripts/lib/werk-alv-transition.mjs','scripts/lib/werk-alv-cost-bounds.mjs','scripts/werk-import-contribution-distribution.py',distribution.source.local_file])hashes[p]=createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(distribution.data_year,2024);assert.equal(distribution.observation_unit,'person_annual_contributions_normalized_to_30_insurance_days');
assert.equal(distribution.includes_special_payments,true);assert.equal(distribution.actual_monthly_payment_distribution,false);
assert.equal(distribution.national_transition_cost_identified,false);assert.equal(distribution.person_count,null);assert.equal(distribution.actual_alv_eligible_payment_count,null);
assert.equal(distribution.verified_budget_credit_eur,0);assert.equal(distribution.rows.length,129);assert.equal(distribution.quantile_values,1161);
assert.equal(spec.status,'unadopted_unfunded_design_candidates');assert.equal(spec.verified_budget_credit_eur,0);
const schedules=[{id:'2026',thresholds:spec.sources[0].thresholds,rates:spec.sources[0].rates},
 {id:'2027_existing_provisional',...spec.sources[1].existing_on_2026_12_31},
 {id:'2027_new_provisional',...spec.sources[1].new_from_2027_01_01}];
assert.deepEqual(schedules[0].thresholds,[2225,2427,2630]);assert.deepEqual(schedules[0].rates,[0,1,2,2.95]);
assert.equal(spec.sources[1].status,'provisional_variable_values_pending_official_promulgation');
const bounds=[];
for(const schedule of schedules)for(const width of [50,100,150])for(const share of [0,.5]){
 const scaled=[1,1000,14000].map(count=>paymentCostBound(schedule,width,share,{unit:'eligible_separate_payment_records',reference:'conditional_scenario',count}));
 bounds.push({schedule_id:schedule.id,width_eur:width,reduction_share:share,scaled_bounds:scaled});
}
const examples=[];
for(const threshold of schedules[0].thresholds)for(const width of [50,100,150])for(const share of [0,.5]){
 const fixed=Array(12).fill(threshold+25),variable=[...Array(6).fill(threshold-25),...Array(6).fill(threshold+75)],special=Array(2).fill(threshold+25);
 const a=annualContributionExample(schedules[0],width,share,fixed,special),b=annualContributionExample(schedules[0],width,share,variable,special);
 assert.equal(a.normalized_monthly_income_eur,b.normalized_monthly_income_eur);
 assert.ok(Math.abs(a.annual_smoothing_contribution_loss_eur-b.annual_smoothing_contribution_loss_eur)>1);
 examples.push({threshold_eur:threshold,width_eur:width,reduction_share:share,ordinary_fixed_eur:fixed,ordinary_variable_eur:variable,
  special_eur:special,fixed:a,variable:b});
}
assert.equal(bounds.length,18);assert.equal(examples.length,18);
const round=x=>Math.round(x*1e8)/1e8;
const out=JSON.parse(JSON.stringify({version:1,source_hashes:hashes,status:'conditional_payment_bounds_not_national_cost',
  observed_distribution_year:2024,payment_rule_years:[2026,2027],population_year_bridge:'not_identified_no_2024_to_2026_or_2027_projection',
  scope:'Gross incremental ALV smoothing cost; standard cent-valued separate payment records in 1500–3500 EUR scope; no annual net for variable payments.',
  national_affected_persons:null,national_eligible_payment_records:null,national_annual_gross_cost_eur:null,national_annual_net_cost_eur:null,
  administration_cost_eur:null,employment_effect_persons:null,verified_budget_credit_eur:0,bounds,non_identification_examples:examples},(_k,v)=>typeof v==='number'?round(v):v));
const fmt=x=>x.toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2});
const upperFmt=x=>fmt(Math.ceil(x*100)/100);
let md=`# WERK — Beitragsverteilung und belastbare Kostengrenzen

Stand: 8. September 2026. **1.161 amtliche Verteilungswerte ergänzt; eine nationale Kostensumme ist damit noch nicht identifiziert.** Zusätzlich sind 18 bedingte Kostengrenzen und 18 Gegenbeispiele zur Verwendung von Jahresdurchschnitten berechnet.

## Neue amtliche Datenbasis

Das [Statistische Handbuch 2025 des Dachverbandes](${distribution.source.url}) enthält für 2024 neun Tabellen mit 129 Zeilen und 1.161 Quartilswerten: Wirtschaftszweige, Bundesländer und Altersgruppen, jeweils für Arbeiter und Angestellte zusammen sowie getrennt, und nach Geschlecht. Lehrlinge sind ausgeschlossen. Jede Zahlenzeile ist auf Tabellenblatt und Zellbereich der gespeicherten Originaldatei zurückführbar; die mehrfach veröffentlichten Österreich-Gesamtwerte stimmen überein.

Die Quelle verwendet personenbezogene Jahresdaten, normiert auf 30 Versicherungstage, einschließlich Sonderzahlungen. Die Werte sind somit keine Verteilung tatsächlich einzelner Monatsabrechnungen. Mediane der Gruppen dürfen weder addiert noch ohne Gruppengrößen zu einem Gesamtmedian gemittelt werden.

| Gruppe, Österreich insgesamt | Unteres Quartil | Median | Oberes Quartil |
|---|---:|---:|---:|
`;
for(const [group,label] of [['workers_and_employees','Arbeiter und Angestellte'],['workers','Arbeiter'],['employees','Angestellte']]){
 const q=distribution.rows.find(r=>r.dimension==='region'&&r.employment_group===group&&r.label==='all').quantiles.all;
 md+=`| ${label} | ${fmt(q.p25_eur)} € | ${fmt(q.p50_eur)} € | ${fmt(q.p75_eur)} € |\n`;
}
md+=`\nDie genannten Werte dürfen weder unmittelbar mit den 2026-ALV-Monatsgrenzen verglichen noch durch eine pauschale Umrechnung in eine tatsächliche Zahl Betroffener verwandelt werden. Die Datenbasis ist historisch 2024; eine Fortschreibung auf 2026 oder 2027 ist nicht belegt.

## Warum derselbe Jahresdurchschnitt unterschiedliche Reformkosten ergibt

Ein konstruiertes Gegenbeispiel, keine beobachteten Beschäftigten: Beide Personen haben 360 Versicherungstage, ein Dienstverhältnis, 31.500 Euro Jahresbrutto und denselben normierten Monatswert von 2.625 Euro. Beide erhalten zwei Sonderzahlungen von je 2.250 Euro in getrennten Beitragszeiträumen. Person A erhält zwölfmal 2.250 Euro laufend; Person B sechsmal 2.200 und sechsmal 2.300 Euro.

Für die 2026-Glättung über 100 Euro, ohne allgemeine Beitragshalbierung:

| Zahlungsprofil | Jährlich entfallende ALV-Beiträge durch Glättung |
|---|---:|
`;
const ex=examples.find(x=>x.threshold_eur===2225&&x.width_eur===100&&x.reduction_share===0);
md+=`| A: gleichmäßiges Monatsgehalt | ${fmt(ex.fixed.annual_smoothing_contribution_loss_eur)} € |\n| B: wechselndes Monatsgehalt | ${fmt(ex.variable.annual_smoothing_contribution_loss_eur)} € |\n`;
md+=`\nDamit ist rechnerisch belegt: Selbst ein vollständiger personenbezogener Jahresdurchschnitt würde diese beiden Kosten nicht unterscheiden. Quartile können es erst recht nicht. Die Steuer-/Nettowirkung der wechselnden Gehälter wird hier nicht mit der bisherigen Funktion für konstante Gehälter berechnet.

## Was sich trotzdem verbindlich begrenzen lässt

Für eine bekannte Zahl M geeigneter, einzeln abzurechnender Zahlungen ist die zusätzliche Bruttoentlastung höchstens M mal der größte Einzelrabatt. Die Rechnung gilt innerhalb des geprüften Standardbereichs von 1.500 bis 3.500 Euro je Zahlung und vor Abrechnungsrundung. Der höchste Rabatt liegt beim ersten Cent oberhalb einer Grenze; seine Formel lautet:

Maximum je Zahlung = max über alle Grenzen { t × (r₁−r₀) × (1−0,01/w) × (1−Entlastungsquote) }.

Es wird das Maximum verwendet, nicht die Summe der drei Grenzrabatte: Eine Zahlung kann nur in einem der getrennten Übergangsbereiche liegen. Die Untergrenze ist null, weil ohne Verteilungsinformation sämtliche Zahlungen außerhalb der Übergangsbereiche liegen können. Diese Grenzen sind bedingte mathematische Grenzen, keine Schätzung und kein statistisches Konfidenzintervall.

| 2026, Übergang über 100 € | Höchstens pro Zahlung | Höchstens für 14.000 Zahlungen pro Jahr |
|---|---:|---:|
`;
for(const share of [0,.5]){
 const b=bounds.find(x=>x.schedule_id==='2026'&&x.width_eur===100&&x.reduction_share===share);
 md+=`| ${share===0?'Ohne allgemeine Beitragshalbierung':'Zusätzlich zu 50 % weniger KV/PV/ALV'} | ${upperFmt(b.scaled_bounds[0].upper_eur)} € | ${upperFmt(b.scaled_bounds[2].upper_eur)} € |\n`;
}
md+=`\n14.000 Zahlungen entsprechen nur im ausdrücklich angenommenen Modell 1.000 ganzjährig Beschäftigten mit genau 14 getrennten Zahlungen. In echten Daten sind Personen, Beschäftigungsverhältnisse, laufende Monatsabrechnungen und Sonderzahlungs-Beitragszeiträume verschiedene Zähleinheiten. Gemeint ist jeweils eine getrennt zu beurteilende Beitragsgrundlage, kein einzelner Banktransfer; zusammengehörige Sonderzahlungen im selben Beitragszeitraum sind entsprechend zusammenzufassen. Die Rechnung setzt keine tatsächliche Betroffenenzahl ein. Die Tabellenobergrenzen sind vorsichtig nach oben auf Cent gerundet; die JSON-Datei enthält die genaueren Modellwerte.

Die Grenze neben einer Beitragshalbierung umfasst ausschließlich die zusätzliche Glättung. Die Finanzierung der 50%-Senkung selbst kommt hinzu. Die ALV braucht bei unveränderten Leistungen Ersatz für die gesamten entfallenden Beiträge; individuelle Steuerrückflüsse, Verwaltungskosten und Verhaltenswirkungen sind keine hier belegte nationale Gegenfinanzierung. Bereits zugeteilte Zinsersparnisse dürfen nicht nochmals verwendet werden.

Die JSON-Ergebnisse enthalten dieselben Grenzen auch für 50 und 150 Euro sowie die beiden getrennten vorläufigen [2027-Referenzgruppen](WERK_SV_STETIGE_BEITRAEGE.md). Diese sind weiterhin Beitragsszenarien, keine 2027-Nettolohnprognose.

## Präziser nächster Datenbedarf

Benötigt werden Häufigkeiten der tatsächlich getrennt abzurechnenden laufenden und besonderen Beitragsgrundlagen, mit Beitragszeitraum, gültigem ALV-Satz, Beschäftigungsgruppe und künftig Bestands-/Neuverhältnis. Für die schmalen Übergänge braucht es feine Betragsintervalle oder ausreichende Intervallsummen; Jahresbruttogruppen und Quartile genügen nicht. Region und Haushaltsmerkmale werden zusätzlich für Steuer- und Nettoverteilung benötigt.

Die öffentliche Dashboard-Darstellung blieb beim Abruf an einem technischen Ladefehler hängen. Die Original-Excel-Tabellen wurden unabhängig über den amtlichen Handbuchdownload bezogen. Es wurden keine personenbezogenen Daten abgerufen und keine Datenanfrage an Dritte versandt.

Gesamtkosten Österreich: **offen**. Verifizierte Finanzierungsgutschrift: **0 Euro**. Alle drei Artefakte erweitern die [Gesamtrechnung](WERK_GESAMTRECHNUNG.md), ohne die bisherigen Schulden-/Zinsszenarien umzubasieren.

Reproduktion: \`python3 scripts/werk-import-contribution-distribution.py\`, \`node scripts/werk-alv-cost-bounds-contract.mjs\` und beide zugehörigen Negative-Checks. Generierung jeweils mit \`--write\`; Originaldatei, Quelldaten und Rechenbibliotheken sind gehasht.
`;
for(const [p,s] of Object.entries({'werk-data/employee-alv-cost-bounds.json':JSON.stringify(out,null,2)+'\n','WERK_SV_VERTEILUNG_KOSTENGRENZEN.md':md})){
 if(process.argv.includes('--write'))fs.writeFileSync(p,s);else assert.equal(fs.readFileSync(p,'utf8'),s,`${p}: regenerate`);
}
console.log('ALV cost bounds OK: 18 conditional bounds, 18 equal-annual-income counterexamples; population and annual net cost remain unidentified.');
