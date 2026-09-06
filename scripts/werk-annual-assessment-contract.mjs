import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {employeeRelief} from './lib/werk-post-debt-sv.mjs';
import {assessedRelief} from './lib/werk-annual-assessment-2026.mjs';
import {round} from './lib/werk-calculation.mjs';
const hashes={};
const read=n=>{const p=`werk-data/${n}.json`,s=fs.readFileSync(p,'utf8');hashes[p]=createHash('sha256').update(s).digest('hex');return JSON.parse(s);};
const rules=read('payroll-annual-assessment-2026'),kernel=read('payroll-employee-kernel-2026'),spec=read('post-debt-employee-sv-model');
assert.equal(rules.rule_year,2026);
assert.deepEqual(rules.annual_tariff_bands,[[13539,0],[21992,.2],[36458,.3],[70365,.4],[104859,.48],[1000000,.5],[null,.55]]);
assert.deepEqual(rules.supplement,{maximum_eur:804,income_full_until_eur:19761,income_zero_from_eur:30259});
assert.deepEqual(rules.sv_refund,{rate:.55,base_cap_eur:496,bonus_cap_eur:804,base_includes_ordinary_and_special_contributions:true,base_includes_ak_wf:true,capped_by_negative_tariff_after_credits:true});
assert.equal(rules.annual_standard_expense_allowance_eur,132);assert.equal(rules.annual_traffic_credit_eur,496);
assert.deepEqual(rules.special_recalculation,{gross_freigrenze_eur:2615,max_sixth_for_cap_eur:25000,free_amount_eur:620,standard_rate:.06,cap_rate:.3,cap_base_threshold_after_contributions_eur:2490});
assert.equal(rules.coverage.complete_household_assessment,'open');
assert.equal(rules.coverage.aggregate_employee_sv_cost,'open');
assert.equal(rules.coverage.empirical_population_tax_recapture,'open');
const rounded=obj=>Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,typeof v==='number'?round(v,6):v]));
const rows=spec.payroll_scenarios.regions.flatMap(region=>spec.payroll_scenarios.monthly_gross_eur.flatMap(monthlyGross=>
  spec.payroll_scenarios.employee_core_reduction_shares.map(reductionShare=>{
    const p=employeeRelief(kernel,{monthlyGross,region,reductionShare}),a=assessedRelief(p,rules);
    assert.ok(Math.abs(a.annual_net_gain_eur-(p.removed_annual_contributions_eur-a.extra_assessed_tax_including_refund_change_eur))<1e-7);
    return {region,monthly_gross_eur:monthlyGross,reduction_share:reductionShare,before:rounded(a.before),after:rounded(a.after),
      annual_withholding_gain_eur:round(p.annual_net_gain_eur,6),annual_assessed_gain_eur:round(a.annual_net_gain_eur,6),
      gain_change_from_withholding_eur:round(a.gain_change_from_withholding_eur,6),
      removed_contributions_eur:round(p.removed_annual_contributions_eur,6),
      extra_assessed_tax_including_refund_change_eur:round(a.extra_assessed_tax_including_refund_change_eur,6),
      illustrative_case_recapture_share:round(a.extra_assessed_tax_including_refund_change_eur/p.removed_annual_contributions_eur,6)};
  })));
const out={version:'2026-09-06-v1',rule_year:2026,source_sha256:hashes,status:'conditional_standard_employee_assessment',
  precision:'Unrounded statutory model; display cents are not exact payslip or whole-euro assessment amounts.',
  empirical_population_recapture_share:null,actual_household_transfer_effect_eur:null,verified_budget_credit_bn:0,rows};
const fmt=n=>new Intl.NumberFormat('de-AT',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
let md=`# SV-01 – Jahresnetto nach Standard-Arbeitnehmerveranlagung

Stand 6. September 2026. Die bestehenden 48 Gehaltsfälle (acht Bruttostufen, Wien/übriges Österreich, 25/50/100 % Beitragssenkung) sind um die jährliche Tarifsteuer, den Verkehrsabsetzbetrag, dessen Zuschlag, SV-Rückerstattung und die Jahreskorrektur der Sonderzahlungen ergänzt. Das politische Ziel bleibt eine schrittweise relative Halbierung der Arbeitnehmer-KV/PV/ALV während des finanzierten Schuldenabbaus.

## Vergleich bei erreichter 50%-Senkung

Ganzjährig zwölf gleiche laufende und zwei gleich hohe Sonderbezüge; Standard-ASVG außerhalb Wiens. AK/WF bleiben unverändert. Steuertarif und Erstattungsrecht 2026 bleiben für den hypothetischen Vergleich unverändert. Die Beträge sind Modellwerte vor Lohnzettel-Centrundung und Ganz-Euro-Rundung des Steuerbescheids; keine persönliche Steuerberechnung.

| Monatsbrutto € | Mehr im Jahr vor Veranlagung € | Mehr im Jahr nach Veranlagung € | Änderung gegenüber bisheriger Rechnung € | Jahresgewinn / 12 € |
| --- | --- | --- | --- | --- |
`;
for(const r of rows.filter(r=>r.region==='outside_vienna'&&r.reduction_share===.5))md+=`| ${fmt(r.monthly_gross_eur)} | ${fmt(r.annual_withholding_gain_eur)} | ${fmt(r.annual_assessed_gain_eur)} | ${fmt(r.gain_change_from_withholding_eur)} | ${fmt(r.annual_assessed_gain_eur/12)} |\n`;
md+=`
Jahresgewinn / 12 ist ein vergleichbarer Monatsdurchschnitt einschließlich Sonderzahlungen und Jahresveranlagung, kein zusätzlicher Betrag auf jedem monatlichen Lohnzettel. Persönliche Transfers, Arbeitskosten und die spätere Finanzierungslast sind darin nicht enthalten.

## Rechenregeln und Gegenfinanzierung

- Laufendes steuerpflichtiges Einkommen = zwölf Monatsbruttos abzüglich laufender abzugsfähiger Beiträge und 132 € Werbungskostenpauschale. Fix besteuerte Sonderbezüge bleiben außerhalb dieses Tarifeinkommens.
- Jahres-Verkehrsabsetzbetrag 496 €; Zuschlag maximal 804 €, voll bis 19.761 € Einkommen, linear auf null bis 30.259 €. Eine Beitragssenkung kann den Zuschlag vermindern.
- Bei negativer Tarifsteuer nach Absetzbeträgen werden 55 % der berücksichtigten Beiträge (laufend und Sonderzahlungen, einschließlich AK/WF) erstattet: maximal 496 € zuzüglich 804 € bei Zuschlagsanspruch und zusätzlich begrenzt auf die negative Steuer. Diese Begrenzungen wirken gleichzeitig.
- Sonderzahlungen: Freigrenze 2.615 € brutto; im betrachteten Bereich maximal 6 % der 620 € übersteigenden Basis nach Beiträgen, begrenzt auf 30 % der 2.490 € übersteigenden Basis nach Beiträgen. 2.615 € und 2.490 € sind verschiedene Grenzen. Die optionale Arbeitgeber-Jahresaufrollung gemäß §77 Abs4 war im bisherigen Vor-Veranlagungswert nicht enthalten; hier erfolgt die Korrektur gemäß §41 Abs4.

**Konsolidierte Identität:** weggefallene Arbeitnehmerbeiträge minus zusätzliche endgültige Steuer einschließlich veränderter SV-Rückerstattung = zusätzlicher Jahresnettobetrag. Jeder Steuer-/Erstattungseffekt wird genau einmal erfasst. Die Versicherungen benötigen weiterhin Ersatz für den vollen Beitragsausfall; der Fiskus erzielt einen Teilrückfluss bzw. spart Erstattungen.

Die einzelnen Rückflussanteile werden im JSON offengelegt. Sie bilden **keine repräsentative gesamtstaatliche Quote**. Es fehlen gemeinsame Personendaten über Bezüge, Beitragsregime und Haushaltsmerkmale. Die bisherige 30%-Finanzierungssensitivität bleibt eine Annahme und wird durch diese Beispiele nicht bewiesen.

## Geprüfte Quellen und weiterhin offene Rechnung

[EStG §33](https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=33&FassungVom=2026-09-06) und [BMF-Absetzbeträge 2026](https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/uebersicht-steuerabsetzbetraege.html) tragen Tarif/Erstattung/Zuschlag; [§16](https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=16&FassungVom=2026-09-06) die Abzüge; [§41 Abs4](https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=41&FassungVom=2026-09-06) die Sonderzahlungs-Jahresrechnung. Die RIS-Fassung ist datiert; 2027-Anmerkungen werden nicht übernommen. Das Steuerbuch 2026 beschreibt die Veranlagung 2025 und liefert hier keine indexierten Jahreswerte.

Die ergänzend geprüften [Dachverbandsstatistiken März 2026](https://www.sozialversicherung.at/cdscontent/load?contentid=10008.805508&version=1776162955) enthalten Zweigeinnahmen, aber keine für SV-01 hinreichende Trennung nach Arbeitnehmer-/Arbeitgeberzahlern und begünstigten Beschäftigtengruppen. Die vorhandene Branchentabelle bleibt getrennt. **31,952625 Mrd. € aus Lohnzetteln sind weiterhin eine breite Referenz einschließlich weiterer Umlagen; keine zusätzlichen Einnahmen und kein belegter reiner KV/PV/ALV-Ausfall.** Median-Beitragsgrundlagen mal Versichertenzahl werden nicht als Beitragssumme verwendet.

Offen bleiben Familien- und Pendlerfälle, andere Einkünfte und Transfers, unterjährige/mehrfache Beschäftigung, zusätzliche Gebühren wie das E-card-Serviceentgelt, repräsentative Gewichtung, zukünftige Lohn-/Beitragsentwicklung und Leistungskosten. Die vorhandenen Schuldenszenarien setzen konstante nominale Werte voraus; ein heutiger persönlicher Jahresgewinn ist keine Prognose über Jahrzehnte. Aktivierung und vollständige Zinsdeckung des 50%-Ziels bleiben offen.

Reproduzieren: \`node scripts/werk-annual-assessment-contract.mjs\`; erzeugen mit \`--write\`. [Gekoppelte Schulden-/SV-Rechnung](WERK_SV_NACH_SCHULDENFREIHEIT.md), [Gesamtrechnung](WERK_GESAMTRECHNUNG.md).
`;
for(const [p,s] of Object.entries({'werk-data/payroll-annual-assessment-results-2026.json':JSON.stringify(out,null,2)+'\n','WERK_SV_JAHRESNETTO.md':md})) {
  if(process.argv.includes('--write'))fs.writeFileSync(p,s);else assert.equal(fs.readFileSync(p,'utf8'),s,`${p}: regenerate`);
}
console.log(`Annual assessment OK: ${rows.length} standard cases; household and aggregate funding gates remain open.`);
