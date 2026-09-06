import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {employeeRelief,postDebtCapacity,replacementCost} from './lib/werk-post-debt-sv.mjs';
import {round,finite} from './lib/werk-calculation.mjs';
const hashes={};
const read=n=>{const p=`werk-data/${n}.json`,s=fs.readFileSync(p,'utf8');hashes[p]=createHash('sha256').update(s).digest('hex');return JSON.parse(s);};
const spec=read('post-debt-employee-sv-model'),kernel=read('payroll-employee-kernel-2026'),debt=read('debt-model'),source=read('employee-payroll-withholding-2024');
const reforms=read('reforms').reforms;
assert.ok(reforms.some(x=>x.id==='SV-01'));assert.equal(spec.reform_id,'SV-01');
for(const k of ['requires_debt_free_general_government','requires_sustainable_replacement_financing','requires_preserved_insurance_entitlements','requires_household_distribution_review'])assert.equal(spec.activation[k],true);
assert.equal(spec.activation.currently_active,false);assert.equal(spec.activation.calendar_year,null);
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
const comparisons=spec.work_vs_nonwork_scenarios.monthly_gross_eur.flatMap(gross=>{
  const r=employeeRelief(kernel,{monthlyGross:gross});
  return spec.work_vs_nonwork_scenarios.assumed_monthly_cash_benefits_eur.flatMap(benefit=>
    spec.work_vs_nonwork_scenarios.additional_monthly_work_costs_and_transfer_losses_eur.map(cost=>{
      assert.ok(finite(benefit)>=0&&finite(cost)>=0);
      return {monthly_gross_eur:gross,assumed_nonwork_monthly_cash_eur:benefit,work_cost_and_lost_transfers_eur:cost,
        current_monthly_work_advantage_eur:round(r.before.payrollNetBeforeAssessment/12-benefit-cost,2),
        reformed_monthly_work_advantage_eur:round(r.after.payrollNetBeforeAssessment/12-benefit-cost,2),
        actual_ams_entitlement_eur:null,actual_household_gain_eur:null};
    }));
});
const out={version:'2026-09-06-v1',reform_id:'SV-01',status:'conditional_static_scenarios',source_sha256:hashes,
  source_year:2024,payroll_rule_year:2026,activation_year:null,payroll_examples:payrollRows,
  financing_capacity_scenarios:capacityRows,replacement_cost_scenarios:fundingRows,work_nonwork_sensitivities:comparisons,
  existing_receipts_redirection:{illustrative_redirected_existing_receipts_bn:broadBenchmark,displaced_recipient_receipts_bn:-broadBenchmark,replacement_financing_if_services_preserved_bn:broadBenchmark,additional_external_revenue_bn:0,additional_debt_repayment_capacity_bn:0,basis:spec.existing_receipts_accounting.boundary},
  broad_withholding_reference_bn:broadBenchmark,pure_employee_kv_pv_alv_total_bn:null,verified_reform_cost_bn:null,
  conclusions:{debt_freedom_automatically_finances_reform:false,higher_wage_tax_recaptures_part_of_relief:true,
    insurance_benefits_require_replacement_financing:true,general_same_pay_work_vs_unemployed_claim_proven:false,
    future_earnings_linked_benefit_recalculation_open:true,not_a_current_budget_saving:true}};
const fmt=(n,d=2)=>new Intl.NumberFormat('de-AT',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const table=(h,rs)=>'| '+h.join(' | ')+' |\n| '+h.map(()=>'---').join(' | ')+' |\n'+rs.map(r=>'| '+r.join(' | ')+' |').join('\n')+'\n';
let md=`# SV-01 – Mehr Netto nach Schuldenfreiheit\n\nStand 6. September 2026. Neu aufgenommene politische Zielstufe nach BUD-01 (Budgetbalance) und BUD-02 (Schuldenabbau). **Ziel: Arbeitnehmer-KV/PV/ALV auf Lohn und Gehalt abschaffen, Versicherungsleistungen und erworbene Pensionsansprüche erhalten.** Arbeitgeberbeiträge, AK/Wohnbauförderung und Selbständigen-/Pensionsbeiträge sind eigenständige Fragen.\n\nAktivierung erst bei schuldenfreiem Gesamtstaat, dauerhaft gesicherter Ersatzfinanzierung und geprüfter Verteilung. Ein Startjahr oder eine bereits finanzierte Reform wird nicht behauptet.\n\n## 1. Nettoeffekt der vollständigen Arbeitnehmerentlastung\n\nStatischer Vergleich mit dem bestehenden 2026-Regelkern, gleicher Bruttolohn und unverändertem Steuertarif. ASVG-Standardfall, außerhalb Wiens, ganzjährig 14 gleich hohe Bruttobezüge. Lohnsteuer steigt, weil nur die verbleibenden Beiträge abzugsfähig sind. **Vor Arbeitnehmerveranlagung, SV-Rückerstattung, Haushaltstransfers und Finanzierungslasten.** Regelmonat und Jahresdurchschnitt sind unterschiedliche Größen.\n\n`;
md+=table(['Monatsbrutto €','Regelmonat netto heute','Regelmonat netto ohne DN-KV/PV/ALV','Mehr im Regelmonat','Mehr im Jahr'],payrollRows.filter(x=>x.region==='outside_vienna'&&x.reduction_share===1).map(x=>[fmt(x.monthly_gross_eur,0),fmt(x.ordinary_month_net_before_eur),fmt(x.ordinary_month_net_after_eur),fmt(x.ordinary_month_net_gain_eur),fmt(x.annual_net_gain_eur)]));
md+=`\nDer volle Standard-DN-Kernbeitrag beträgt 3,87 % KV + 10,25 % PV + bis zu 2,95 % ALV = **bis zu 17,07 %** der Beitragsgrundlage. Die oft genannten 18,07 % enthalten außerhalb Wiens zusätzlich AK und Wohnbauförderung. Niedrige ALV-Sätze und Beitragsobergrenzen bleiben im Ausgangsfall berücksichtigt. Das JSON enthält ${payrollRows.length} Beispiele für 25/50/100 % Entlastung in und außerhalb Wiens. Höhere Einkommen erhalten in Euro zunächst mehr Entlastung; Fairness für kleine Einkommen muss nach Veranlagung und Transfers geprüft werden.\n\n## 2. Welche Einnahmen müssten ersetzt werden?\n\n[Statistik Austria, Lohnsteuerstatistik 2024, Tabelle 16](https://www.statistik.at/statistiken/volkswirtschaft-und-oeffentliche-finanzen/oeffentliche-finanzen/steuerstatistiken/lohnsteuerstatistik): Aus Beschäftigungsverhältnissen wurden **${fmt(broadBenchmark,3)} Mrd. €** an Beiträgen einschließlich weiterer Lohnzettel-Umlagen einbehalten. Die gespeicherte Original-ODS enthält 19 Bruttobezugsgruppen und ${fmt(source.totals.persons,0)} Personen mit Beschäftigungsbezügen.\n\nDies ist eine Größenordnungsreferenz, **keine exakte KV/PV/ALV-Reformkostensumme**: AK/Wohnbauförderung und unterschiedliche Beitragsregime sind enthalten; reine Pensionslohnzettel ausgeschlossen. Die Überblickstabelle mit Personenklassifikation nennt 31,955 Mrd. €; sie hat eine andere Abgrenzung. Arbeitgeberbeiträge werden nicht hinzugerechnet. 2024 ist kein automatisch fortgeschriebener Wert für die spätere Schuldenfreiheit.\n\nBei unveränderten Leistungen müssen die ausgefallenen Beiträge in der Versicherungsfinanzierung vollständig ersetzt werden. Zusätzliche Lohnsteuer kann einen Teil davon im konsolidierten Staatshaushalt finanzieren. Die Aufteilung zwischen Bund/Ländern/Gemeinden und Versicherungsträgern muss geregelt werden.\n\n**Die bereits einbehaltenen Beiträge sind keine zusätzlichen Einnahmen für die Schuldentilgung.** Eine bloße Umleitung der breiten Referenzsumme in einen Tilgungstopf bringt dort rechnerisch +${fmt(broadBenchmark,3)} Mrd. €, entzieht den bisherigen Empfängern aber dieselbe Summe. Werden Leistungen und Ansprüche erhalten, ist dieser Ausfall zu ersetzen: +${fmt(broadBenchmark,3)} − ${fmt(broadBenchmark,3)} = **0 Mrd. € zusätzlicher Tilgungsspielraum**. Ohne Ersatz bleibt eine Finanzierungslücke; eine neue Verschuldung dafür verlagert Schulden lediglich. Tatsächliche Ausgabensenkungen oder zusätzliche externe Einnahmen wären eigenständig zu belegen. Das ist eine Zahlungsstrom-Gegenrechnung einschließlich aller bisherigen Empfänger, keine neue ESVG-Sektorensumme.\n\nReine Finanzierungssensitivitäten, vollständige sofortige Entlastung, nominal konstante Werte; tatsächliche Anlauf-/Mehrkosten noch offen:\n\n`;
md+=table(['Angenommener Bruttoausfall Mrd. €/Jahr','Angenommener Lohnsteuer-Rückfluss','Netto/Jahr','Netto 5 Jahre','Netto 10 Jahre'],fundingRows.filter(x=>x.tax_recapture_share===0.3).map(x=>[fmt(x.gross_loss_bn,3)+(x.basis.startsWith('2024')?' (breite 2024-Referenz)':''),'30 %',fmt(x.net_replacement_need_bn,3),fmt(x.cumulative_net_need_bn[5],3),fmt(x.cumulative_net_need_bn[10],3)]));
md+=`\nDie 30 % sind **keine empirisch berechnete gesamtstaatliche Rückflussquote**. Individuelle Payroll-Fälle werden nicht auf alle Beschäftigten hochgerechnet. Ergebnisse für 0/20/30/40 % stehen im JSON. Unbekannte tatsächliche Reformkosten bleiben als offen ausgewiesen.\n\n## 3. Finanzierung nach Ende der Schuldentilgung\n\nIm bisherigen vereinfachten Tilgungsmodell mit ${fmt(D,1)} Mrd. € Startschuld und dauerhaft 10 Mrd. € Basis-Nettotilgung entspricht der später freie Primärüberschuss rechnerisch **10 + Startschuld × angenommener vermiedener Zinssatz**. Das setzt unveränderte sonstige Einnahmen/Ausgaben und eine tatsächlich dauerhaft finanzierte Tilgungsbasis voraus. Bei 2,5 % sind das **23,13 Mrd. €/Jahr**.\n\nDas ist derselbe Spielraum, der während der Tilgung durch Zinsreinvestition die Tilgung beschleunigt. Er wird **einmal** verwendet: weder kumulierte historische Zinsersparnisse noch die letzte, verkürzte Tilgungsrate werden zusätzlich als Dauerertrag addiert. Wenn die Reformen nur genau den bereits zinsbereinigten Überschuss von 10 Mrd. € sichern, darf der Zinsvorteil nicht nochmals addiert werden.\n\nBedingte finanzierbare Brutto-Beitragsentlastung bei angenommenen 30 % Lohnsteuer-Rückfluss und ohne zusätzliche Umsetzungskosten:\n\n`;
md+=table(['Vermeidungszins','Reserve','Freier Haushaltsspielraum Mrd. €/Jahr','Finanzierbarer Bruttoausfall Mrd. €/Jahr'],capacityRows.filter(x=>x.tax_recapture_share===0.3).map(x=>[fmt(x.interest_pct,1)+' %',fmt(x.reserve_share*100,0)+' %',fmt(x.available_bn,3),fmt(x.affordable_gross_loss_bn,3)]));
md+=`\nBei 2,5 % und 20 % zurückbehaltenem Spielraum für andere Bedarfe stehen **18,504 Mrd. €/Jahr** zur Verfügung. Bei 30 % Rückfluss könnte das **26,434 Mrd. € Brutto-Beitragsausfall** tragen. Gegenüber der breiten 2024-Referenz wäre der Nettofinanzierungsbedarf ${fmt(broadBenchmark*0.7,3)} Mrd. €, also ${fmt(broadBenchmark*0.7-18.504,3)} Mrd. € höher. Das ist ein Größenordnungsvergleich, kein Beweis einer tatsächlichen Finanzierungslücke von SV-01. Bis dahin können Demografie, Leistungen, Löhne, Zinsen und Steuern erheblich anders sein.\n\n## 4. Arbeit gegenüber Arbeitslosigkeit\n\n[AMS, aktualisiert 05.08.2026](https://www.ams.at/arbeitsuchende/arbeitslos-was-tun/geld-vom-ams/arbeitslosengeld): Grundbetrag grundsätzlich 55 % des gesetzlich ermittelten Nettoeinkommens; Ergänzung begrenzt auf 60 %, mit Familienzuschlägen auf 80 %. Grundlage sind historische Beitragsgrundlagen samt Aufwertung, pauschalem Sonderzahlungsanteil und eigener Nettoumrechnung. **Das belegt nicht, dass Arbeitslose generell gleich viel erhalten wie Beschäftigte.** Arbeitslosengeld ist grundsätzlich zeitlich begrenzt; Sozialhilfe und weitere Haushaltshilfen sind getrennte Leistungen.\n\nDer relevante Arbeitsanreiz lautet: Jahresnetto aus Beschäftigung / 12 minus vergleichbare monatliche Geldleistungen ohne Erwerbsarbeit minus zusätzliche Arbeitskosten und wegfallende Transfers. Gleicher Haushalt, gleiche Wohn-/Familienlage und gleicher Zeitraum; gemeinsame Transfers nicht doppelt zählen.\n\nBeispiel mit **ausdrücklich angenommenen** 1.500 € monatlichen Geldleistungen ohne Arbeit sowie 300 € zusätzlichen Arbeitskosten/Transferverlusten:\n\n`;
md+=table(['Monatsbrutto bei Arbeit','Heutiger Arbeitsvorteil pro Monat','Arbeitsvorteil ohne DN-KV/PV/ALV'],comparisons.filter(x=>x.assumed_nonwork_monthly_cash_eur===1500&&x.work_cost_and_lost_transfers_eur===300).map(x=>[fmt(x.monthly_gross_eur,0),fmt(x.current_monthly_work_advantage_eur),fmt(x.reformed_monthly_work_advantage_eur)]));
md+=`\nDiese Leistungsbeträge sind keine errechneten AMS-Ansprüche. Der Arbeitsvorteil nach endgültiger Veranlagung und konkreten Haushaltstransfers bleibt offen. Würde künftiges Arbeitslosengeld weiterhin prozentuell vom reformbedingt höheren Netto abhängen, könnte auch die Leistung steigen; ein unveränderter Leistungsbetrag ist deshalb nur eine isolierte Szenarioannahme. Das JSON enthält ${comparisons.length} Vergleichsfälle.\n\n## 5. Verbindlich festgehaltene nächste Rechenschritte\n\n- KV/PV/ALV nach Arbeitnehmergruppe und Beitragsgrundlage von AK/WF und anderen Umlagen trennen; Pensionist:innen/Selbständige eigenständig behandeln.\n- Steuer-/Transfermodell einschließlich SV-Rückerstattung, Verkehrsabsetzbetragszuschlag und zukünftiger ALG-Bemessung vervollständigen.\n- Versicherungsansprüche, Ersatztransfers, Umsetzungskosten und demografischen Leistungsbedarf über den tatsächlichen Reformstart hinaus sichern.\n- Vollständige Abschaffung mit gestufter Entlastung und gezielter Erwerbsgutschrift vergleichen. Die Zielstufe bleibt nach Schuldenfreiheit; ein früherer Start wird nicht angenommen.\n\nSV-01 ist eine Entlastungsreform mit Finanzierungsbedarf und wird nicht als Sparbeitrag auf die aktuelle Budgetlücke gebucht. Vollständige [Gesamtrechnung](WERK_GESAMTRECHNUNG.md).\n\nReproduzieren: \`python scripts/werk-import-employee-withholding.py\`, \`node scripts/werk-post-debt-sv-contract.mjs\`; mit \`--write\` werden die jeweiligen Artefakte neu erzeugt. Quellen und Regeln sind im JSON versioniert.\n`;
for(const [p,s] of Object.entries({'werk-data/post-debt-employee-sv-results.json':JSON.stringify(out,null,2)+'\n','WERK_SV_NACH_SCHULDENFREIHEIT.md':md})){
  if(process.argv.includes('--write'))fs.writeFileSync(p,s);else assert.equal(fs.readFileSync(p,'utf8'),s,`${p}: regenerate`);
}
console.log(`SV-01 calculation OK: ${payrollRows.length} payroll cases, ${capacityRows.length} capacity cases, ${fundingRows.length} replacement cases, ${comparisons.length} household sensitivities; financing gate blocked.`);
