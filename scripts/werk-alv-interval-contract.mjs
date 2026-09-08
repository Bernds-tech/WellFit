import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {intervalCostBound,costIntervalTable,requestedIntervals} from './lib/werk-alv-interval-cost.mjs';
const paths=['werk-data/employee-alv-transition-model.json','werk-data/employee-alv-interval-spec.json','scripts/lib/werk-alv-transition.mjs','scripts/lib/werk-alv-interval-cost.mjs'];
const hashes=Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const model=JSON.parse(fs.readFileSync(paths[0])),spec=JSON.parse(fs.readFileSync(paths[1]));
assert.equal(spec.status,'draft_aggregate_data_specification_not_sent');
assert.equal(spec.unit,'eligible_separate_payment_records');
assert.equal(spec.reference_for_examples,'conditional_scenario');
assert.equal(spec.standard_scope,'standard_employee_same_rate_and_charge_base_employee_bears_dn');
assert.equal(spec.interval_endpoints,'inclusive_cent_values');
assert.deepEqual(spec.supported_gross_base_range_eur,[1500,3500]);
assert.deepEqual(spec.input_rows_required,['lower_eur','upper_eur','count','base_sum_eur']);
assert.deepEqual(spec.input_table_required,['unit','reference','scope','payment_kind','expected_payment_records','rows']);
assert.equal(spec.candidate_status,'unadopted_unfunded_design_candidates');
for(const k of ['actual_eligible_payment_records','actual_interval_base_sums_eur','actual_alv_employee_cash_receipts_eur','national_annual_gross_cost_eur','national_annual_net_cost_eur'])assert.equal(spec[k],null);
assert.equal(spec.verified_budget_credit_eur,0);assert.equal(model.verified_budget_credit_eur,0);
assert.equal(model.status,'unadopted_unfunded_design_candidates');
assert.equal(model.sources[1].status,'provisional_variable_values_pending_official_promulgation');
assert.equal(spec.excluded_standard_cases.length,6);assert.equal(spec.required_dimensions.length,8);
assert.ok(spec.sources.some(s=>s.url.includes('10007.910372')));
const schedules=[{id:'2026',thresholds:model.sources[0].thresholds,rates:model.sources[0].rates},
 {id:'2027_existing_provisional',...model.sources[1].existing_on_2026_12_31},
 {id:'2027_new_provisional',...model.sources[1].new_from_2027_01_01}];
assert.deepEqual(schedules.map(s=>s.thresholds),[[2225,2427,2630],[2327,2539,2751],[2327,2539]]);
assert.deepEqual(schedules.map(s=>s.rates),[[0,1,2,2.95],[.5,1.5,2.5,2.95],[1,2,2.95]]);
const scope={unit:spec.unit,reference:spec.reference_for_examples,scope:spec.standard_scope,payment_kind:'ordinary'};
const examples=[],partitions=[],tables=[];
for(const schedule of schedules)for(const width of [50,100,150]){
 const bands=requestedIntervals(schedule,width);partitions.push({schedule_id:schedule.id,width_eur:width,bands});
 for(const share of [0,.5]){
  const t=schedule.thresholds[0];
  const cases=[
   {id:'whole_scope_count_only',lower_eur:1500,upper_eur:3500,base_sum_eur:null},
   {id:'narrow_count_only',lower_eur:t+5,upper_eur:t+25,base_sum_eur:null},
   {id:'narrow_exact_sum',lower_eur:t+5,upper_eur:t+25,base_sum_eur:(t+15)*1000},
   {id:'threshold_crossing_with_sum',lower_eur:t,upper_eur:t+50,base_sum_eur:(t+25)*1000}
  ];
  for(const c of cases){const input={...scope,count:1000,...c};examples.push({schedule_id:schedule.id,width_eur:width,reduction_share:share,input,result:intervalCostBound(schedule,width,share,input)});}
  const table={...scope,expected_payment_records:bands.length*2,rows:bands.map(b=>({...b,count:2,base_sum_eur:Math.round((b.lower_eur+b.upper_eur)*100)/100}))};
  const result=costIntervalTable(schedule,width,share,table);assert.notEqual(result.exact_model_cost_eur,null);
  tables.push({schedule_id:schedule.id,width_eur:width,reduction_share:share,input:table,result});
 }
}
assert.equal(examples.length,72);assert.equal(partitions.length,9);assert.equal(tables.length,18);
const out={version:1,source_hashes:hashes,status:'conditional_interval_costs_not_national_estimate',arithmetic:'Exact rational amounts before payroll rounding; outward cent presentation.',
 national_annual_gross_cost_eur:null,national_annual_net_cost_eur:null,employment_effect_persons:null,verified_budget_credit_eur:0,examples,requested_partitions:partitions,table_examples:tables};
const fmt=x=>x.toLocaleString('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2});
let md=`# WERK — ALV-Kosten aus Intervallen und Beitragssummen

Stand: 8. September 2026. Der Rechner kann nun aus **Anzahl und Betragsintervall** belastbare Grenzen ableiten und mit einer passenden **Beitragsgrundlagensumme** exakte Modellkosten berechnen. 72 Intervallfälle, neun lückenlose Intervallraster und 18 summierte Beispielt abellen sind reproduzierbar hinterlegt.

Die Beispiele sind konstruierte Prüfbestände, keine österreichische Beschäftigtenstatistik. Berechnet wird ausschließlich der zusätzliche ALV-Beitragsausfall einer noch nicht beschlossenen Glättung. Die allgemeine 50%-Senkung von Arbeitnehmer-KV/PV/ALV ist separat zu finanzieren.

## Konkrete Rechnung

2026-Regeln, Glättung über 100 Euro, jeweils 1.000 rechtlich getrennte Bemessungsfälle. Alle Fälle sind reguläre Arbeitnehmerfälle mit identischer Grundlage für Satzwahl und Beitragsberechnung. Die Eingaben bezeichnen keine Anzahl von Personen.

| Verfügbare Information | Glättung ohne allgemeine Senkung | Glättung zusätzlich zur 50%-Senkung |
|---|---:|---:|
`;
for(const [id,label] of [['whole_scope_count_only','Nur Anzahl; Grundlagen zwischen 1.500 und 3.500 €'],['narrow_count_only','Anzahl; Grundlagen zwischen 2.230 und 2.250 €'],['narrow_exact_sum','Zusätzlich: Grundlagensumme 2.240.000 €']]){
 const values=[0,.5].map(s=>examples.find(e=>e.schedule_id==='2026'&&e.width_eur===100&&e.reduction_share===s&&e.input.id===id).result);
 md+=`| ${label} | ${values.map(v=>v.exact_model_cost_eur!==null?`${fmt(v.exact_model_cost_eur)} € exakt im Modell`:`${fmt(v.lower_cent_outward/100)} bis ${fmt(v.upper_cent_outward/100)} €`).join(' | ')} |\n`;
}
md+=`
Die Summe bedeutet hier einen Mittelwert von 2.240 Euro innerhalb des vollständig linearen Intervalls. Es wird keine Gleichverteilung unterstellt. Jede beliebige Verteilung mit derselben Anzahl, demselben Intervall und derselben exakten Summe hat hier dieselben Modellkosten. Beiträge und Nettolohn sind verschiedene Größen; eine Steuer- oder Haushaltswirkung wird daraus noch nicht abgeleitet.

## Warum eine Intervallsumme nicht immer reicht

Im Übergang oberhalb einer Grenze t und bis t+w lautet der Zusatzrabatt pro Fall:

Rabatt = t × Satzdifferenz / 100 × (t+w−Beitragsgrundlage) / w × (1−allgemeine Senkung).

Für N Fälle mit Summe S innerhalb desselben linearen Abschnitts ersetzt **N×(t+w)−S** die Summe der einzelnen Klammern. So lässt sich der gesamte Bruttoausfall ohne Einzeldaten genau berechnen.

An der gesetzlichen Grenze selbst ist der Zusatzrabatt null; einen Cent darüber ist er positiv. Ein Intervall, das diese Stelle überschreitet, darf daher nicht einfach mit seinem Mittelwert berechnet werden. Für 1.000 Fälle zwischen 2.225 und 2.275 Euro ergibt selbst die bekannte Grundlagensumme 2.250.000 Euro in dieser Version nur die sichere Grenze aus Anzahl und Intervall. Die Summe wird dort ausdrücklich als ungenutzt gekennzeichnet; sie könnte zusätzliche Einschränkungen erlauben, identifiziert aber allein keine genaue Summe.

Ein direktes Gegenbeispiel: Zwei Fälle mit je 2.250 Euro und zwei Fälle mit 2.225 bzw. 2.275 Euro ergeben jeweils 4.500 Euro Grundlagensumme. Ihr Zusatzrabatt bei 100 Euro Übergang beträgt jedoch **33,375 Euro bzw. 11,125 Euro** vor Rundung. Bei allgemeiner Halbierung halbieren sich beide Beträge.

Die Cent-Raster trennen deshalb die erste Stelle oberhalb jeder gesetzlichen Grenze und das Ende des jeweiligen Übergangs. Jedes Raster deckt 1.500 bis 3.500 Euro genau einmal ab. Grenzen aus ganzen Intervallen sind ohne Zusatzannahmen scharf; bei ungenutzter Summe werden sie nur als sichere, möglicherweise weitere Grenzen bezeichnet. Untergrenzen werden nach unten, Obergrenzen nach oben gerundet; die Rechendatei enthält die exakten rationalen Werte. Abrechnungsrundungen bleiben ein gesonderter Implementierungsschritt.

## Amtlich belegte Abgrenzung der Fälle

Die [ÖGK-Regeln für mehrere Beschäftigungen](${spec.sources[0].url}) zeigen: Ein Tarifblock einer mBGM ist nicht automatisch ein eigenständiger Bemessungsfall. Ob Einkünfte zusammenzurechnen sind, hängt unter anderem davon ab, ob das Dienstverhältnis durchgehend oder eigenständig ist. Erst die rechtlich aufbereiteten Fälle dürfen in Intervalle eingehen.

Die [ÖGK-Sonderregeln](${spec.sources[1].url}) erfordern außerdem zwei getrennte Merkmale: die Grundlage für die Wahl des ALV-Satzes und die tatsächlich belastete Grundlage. Bei Altersteilzeit können diese auseinanderfallen. In bestimmten Fällen trägt der Arbeitgeber gesetzlich auch den Arbeitnehmeranteil. Ein Beitragsausfall ist dann nicht automatisch ein gleich hoher Vorteil für Beschäftigte.

Der Standardrechner weist daher Lehrlings-, abweichende Bemessungs-, Arbeitgebertragungs- und andere nicht geklärte Sonderfälle zurück. Das ist eine klar begrenzte Standardrechnung; diese Fallgruppen bleiben für die Gesamtbewertung zusätzlich aufzuarbeiten.

## Konkrete Spezifikation für die fehlenden Verwaltungsdaten

Die maschinenlesbare Spezifikation [employee-alv-interval-spec.json](werk-data/employee-alv-interval-spec.json) verlangt ausschließlich aggregierte Tabellen:

| Merkmal | Benötigte Information |
|---|---|
| Zeitraum und Rechtsstand | Beitragsmonat/-jahr; 2027 Bestands- und Neuverhältnisse getrennt |
| Einheit | Rechtlich getrennte Bemessungsfälle je laufendem Bezug bzw. Sonderzahlungszeitraum |
| Geltungsbereich | Beschäftigtengruppe, Ausnahmegrund, tatsächlicher Träger des Arbeitnehmeranteils |
| Zwei Grundlagen | Grundlage der Satzwahl und Grundlage des verrechneten Beitrags; Abweichungen separat |
| Intervallwerte | Inklusive Cent-Grenzen, genaue Anzahl, exakte Summe der belasteten Grundlagen oder ausdrücklich unbekannt |
| Beitragsabgleich | Vorgeschriebene Arbeitnehmer-/Arbeitgeber-ALV, getrennte Zahlungseingänge soweit vorhanden, Korrekturen und Erstattungen |
| Vollständigkeit | Eindeutige, überschneidungsfreie Gruppen; Summenabgleich; unterdrückte oder fehlende Werte sichtbar |

Die ausführliche JSON-Spezifikation und die neun generierten Intervallraster sind ein vorbereiteter Datenbedarf; es wurde keine Anfrage versandt. Für amtliche Daten ist vor Import zusätzlich ein geprüfter Quellen-/Einheitenadapter erforderlich. Die aktuelle ausführbare Schnittstelle akzeptiert ausdrücklich bedingte Szenarien. Eine bekannte Null wird akzeptiert; unbekannte oder unterdrückte Anzahlen werden nicht als null Euro gerechnet. Gerundete veröffentlichte Summen dürfen nicht als exakte Cent-Summen eingegeben werden.

Die gezielte Suche in öffentlich zugänglichen Parlaments- und Sozialversicherungsunterlagen hat die benötigte vergleichbare Monatstabelle nicht geliefert. Das beweist nicht, dass die Verwaltungsdaten nicht existieren. Die [bereits importierten amtlichen Jahresquartile](WERK_SV_VERTEILUNG_KOSTENGRENZEN.md) ersetzen sie nicht.

## Einordnung in die gesamte SV-Reform

Die 2027-Bestands-/Neuverhältnis-Szenarien bleiben mit dem vorläufigen ÖGK-Wertestand getrennt; es entsteht keine 2027-Nettoprognose. Die 31,95 Mrd. Euro einbehaltenen Beiträge sind weiterhin bestehende Einnahmen mit breiterem Geltungsbereich, kein zusätzlich verfügbarer Schuldentilgungsbetrag. Bereits gebundene Zinsersparnisse sind nicht erneut für Glättung oder Beitragshalbierung verfügbar.

Dein Ziel bleibt: Arbeitnehmer-KV/PV/ALV mit finanziertem Schuldenabbau schrittweise relativ um bis zu 50 % senken, bei erhaltenen Ansprüchen und tragfähiger Ersatzfinanzierung. Der nationale Brutto- und Nettofinanzierungsbedarf bleibt offen; die verifizierte zusätzliche Finanzierung beträgt **0 Euro**. Die Glättung ist ein ergänzender Gestaltungskandidat, kein bereits beschlossenes Element oder belegter Beschäftigungseffekt.

Reproduktion: \`node scripts/werk-alv-interval-contract.mjs\` und \`node scripts/werk-alv-interval-negative-check.mjs\`. Daten, Bibliothek und Bericht sind in FISCAL-DATA integriert. Zurück zur [Gesamtrechnung](WERK_GESAMTRECHNUNG.md).
`;
md=md.replace('Beispielt abellen','Beispieltabellen');
for(const [p,s] of Object.entries({'werk-data/employee-alv-interval-results.json':JSON.stringify(out,null,2)+'\n','WERK_SV_INTERVALLKOSTEN.md':md})){
 if(process.argv.includes('--write'))fs.writeFileSync(p,s);else assert.equal(fs.readFileSync(p,'utf8'),s,`${p}: regenerate`);
}
console.log('ALV interval contract OK: 72 cases, 9 partitions, 18 aggregate examples; no national estimate.');
