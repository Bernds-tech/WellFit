import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {debtLinkedRelief} from './lib/werk-post-debt-sv.mjs';
const hashes={};
const hash=p=>{const s=fs.readFileSync(p,'utf8');hashes[p]=createHash('sha256').update(s).digest('hex');return s;};
const read=n=>JSON.parse(hash(`werk-data/${n}.json`));
const spec=read('employee-sv-growth-stress-model'),debt=read('debt-model'),source=read('employee-payroll-withholding-2024'),policy=read('post-debt-employee-sv-model');
hash('scripts/lib/werk-post-debt-sv.mjs');hash('scripts/lib/werk-calculation.mjs');
const s=spec.inputs;
assert.deepEqual(s,{contribution_growth_pct_cases:[0,1,2,3],rate_pct_cases:[1,2.5,4],tax_recapture_share_cases:[0,.3],base_repayment_bn:10,indexed_base_growth_pct:2,years_after_debt_freedom:10,max_years:100,lag_years:1,stress_lag_years:3,reduction_target:.5,interest_to_relief_share:1});
assert.equal(spec.reference_scope.debt_baseline,'adopted_policy_projection_2031');
assert.equal(source.pure_employee_kv_pv_alv_total_eur,null);
assert.equal(spec.funding_boundary.verified_pure_employee_contribution_base_bn,null);
assert.equal(spec.funding_boundary.empirical_tax_recapture_share,null);
assert.equal(spec.funding_boundary.funded_base_repayment_verified,false);
assert.equal(spec.funding_boundary.perpetual_financing_verified,false);
assert.equal(spec.funding_boundary.current_budget_credit_bn,0);
assert.equal(policy.progressive_target.employee_core_reduction_share,s.reduction_target);
assert.equal(policy.progressive_target.end_target_financing_proven,false);
assert.equal(policy.activation.currently_active,false);
const D=debt.baselines[spec.reference_scope.debt_baseline].debt_eur_billion;
const C=source.totals.withheld_contributions_and_levies_thousand_eur/1e6;
const inputs=[];
for(const contributionGrowthPct of s.contribution_growth_pct_cases)for(const ratePct of s.rate_pct_cases)for(const taxRecaptureShare of s.tax_recapture_share_cases)
  inputs.push({contributionGrowthPct,baseRepaymentGrowthPct:0,ratePct,taxRecaptureShare,lagYears:1});
for(const contributionGrowthPct of s.contribution_growth_pct_cases)for(const taxRecaptureShare of s.tax_recapture_share_cases)
  inputs.push({contributionGrowthPct,baseRepaymentGrowthPct:2,ratePct:2.5,taxRecaptureShare,lagYears:1});
for(const contributionGrowthPct of [0,2])for(const taxRecaptureShare of s.tax_recapture_share_cases)
  inputs.push({contributionGrowthPct,baseRepaymentGrowthPct:0,ratePct:2.5,taxRecaptureShare,lagYears:3});
const paths=inputs.map(({contributionGrowthPct,baseRepaymentGrowthPct,...rest},i)=>({id:`SV-GROW-${String(i+1).padStart(2,'0')}`,
  ...debtLinkedRelief({debt:D,annualBase:s.base_repayment_bn,contributionBase:C,reductionTarget:s.reduction_target,
    interestToReliefShare:s.interest_to_relief_share,maxYears:s.max_years,...rest,
    growthStress:{contributionGrowthPct,baseRepaymentGrowthPct,yearsAfterDebtFree:s.years_after_debt_freedom}})}));
for(const p of paths) {
  assert.equal(p.required_post_debt_horizon_observed,true);
  let lastRate=0;
  for(const r of p.annual_rows) {
    const tolerance=.000003;
    assert.ok(Math.abs(r.realized_interest_saving_bn-r.net_replacement_cost_bn-r.extra_repayment_bn-r.unallocated_interest_bn)<tolerance);
    assert.ok(Math.abs(r.realized_interest_saving_bn-r.fundable_nondecreasing_net_cost_bn-r.extra_repayment_bn-r.fundable_nondecreasing_unallocated_interest_bn)<tolerance);
    assert.ok(r.fundable_nondecreasing_net_cost_bn<=r.realized_interest_saving_bn*p.inputs.interestToReliefShare+tolerance);
    assert.ok(r.fundable_nondecreasing_reduction_pct<=r.modeled_contribution_reduction_pct+tolerance);
    assert.ok(r.fundable_nondecreasing_reduction_pct>=lastRate-tolerance);lastRate=r.fundable_nondecreasing_reduction_pct;
  }
}
const out={version:'2026-09-07-v1',source_sha256:hashes,status:'finite_horizon_capacity_stress',
  reference_debt_bn:D,broad_reference_contributions_bn:C,actual_employee_contribution_base_bn:null,
  activation_allowed:false,current_budget_credit_bn:0,perpetual_financing_verified:false,
  scenario_count:paths.length,paths};
const f=(x,d=2)=>new Intl.NumberFormat('de-AT',{minimumFractionDigits:d,maximumFractionDigits:d}).format(x);
const table=(h,rs)=>'| '+h.join(' | ')+' |\n| '+h.map(()=>'---').join(' | ')+' |\n'+rs.map(r=>'| '+r.join(' | ')+' |').join('\n')+'\n';
const select=(growth,base=0,recapture=.3)=>paths.find(p=>p.inputs.ratePct===2.5&&p.inputs.taxRecaptureShare===recapture&&p.inputs.lagYears===1&&p.inputs.growthStress.contributionGrowthPct===growth&&p.inputs.growthStress.baseRepaymentGrowthPct===base);
let md=`# SV-01 – Wachsende Beitragsbasis und dauerhafte Zinsdeckung

Stand 7. September 2026. **Einmalige Zielerreichung beweist keine dauerhafte Finanzierung.** Der bestehende gemeinsame Schulden-/SV-Rechner ist um nominales Wachstum der Beitragsreferenz, separat wachsende finanzierte Basistilgung und zehn Jahre nach Schuldenfreiheit erweitert. Das Ziel bleibt eine schrittweise relative Halbierung der Arbeitnehmer-KV/PV/ALV bei erhaltenen Leistungen.

## Annahmen und Abgrenzung

${paths.length} Pfade: jährliches Wachstum der Beitragsreferenz 0/1/2/3 %, Vermeidungssatz 1/2,5/4 %, angenommener Steuer-Rückfluss 0/30 %, anfangs 10 Mrd. € separat finanzierte Basistilgung, entweder nominal konstant oder +2 % jährlich. Zinsersparnisse wirken nach einem bzw. drei Jahren. Die Szenarien weisen alle Zinsersparnisse der SV-Finanzierung zu; einmaliges Restgeld wird nicht als dauerhafte Einnahme verwendet.

Startreferenzen: ${f(D,1)} Mrd. € Schulden aus der amtlichen Projektion 2031 und ${f(C,6)} Mrd. € breite einbehaltene Beiträge/Umlagen aus Lohnzetteln 2024. **Diese verschieden datierten Größen sind hier synthetische Modellanker, kein gemeinsamer amtlicher Jahresstand.** Keine Hochrechnung auf ein behauptetes Startjahr. Die reine Arbeitnehmer-KV/PV/ALV-Basis ist weiter unbekannt. Die Wachstumsannahme gilt für das gesamte hypothetische Aufkommen bei unveränderten Sätzen; Löhne, Beschäftigung, Höchstbeitragsgrundlagen und Zusammensetzung können es verändern.

Die [OeNB-Juni-Prognose](https://www.oenb.at/Presse/Pressearchiv/2026/20260612.html) enthält HVPI-Inflation von 3,2/2,4/2,1 % für 2026–2028. Das sind weder Beitragswachstum noch Jahrzehntprognosen. Die [BMF-Langfristprognose 2025](https://www.bmf.gv.at/en/services/starting_page_budget/lfp2025.html) behandelt Zins- und Demografierisiken bis 2060; sie hat einen anderen Politikstand als unsere Juli-2026-Budgetbaseline. Ihre Zahlenpfade werden nicht zusammengestückelt.

## Was Beitragswachstum am 50%-Ziel ändert

2,5 % angenommene vermiedene Zinsen, **30 % nur angenommener Steuer-Rückfluss**, feste Basistilgung 10 Mrd. € pro Jahr. „Finanzierbare Senkung“ ist der höchstens aus den jeweiligen Jahreszinsen gedeckte Anteil der breiten Referenz, kein gesicherter individueller Satz. Die Basistilgung ist noch nicht als realer Budgetüberschuss nachgewiesen.

`;
md+=table(['Beitragswachstum pro Jahr','Schuldenfrei in Modelljahr','Senkung im Jahr der Schuldenfreiheit','Senkung zehn Jahre danach','50%-Nettoersatzbedarf zehn Jahre danach, Mrd. €','Dann fehlende Jahresdeckung, Mrd. €'],s.contribution_growth_pct_cases.map(g=>{
  const p=select(g),r=p.annual_rows.at(-1);return [f(g,0)+' %',p.repayment_complete_year,f(p.reduction_pct_at_debt_freedom)+' %',f(r.modeled_contribution_reduction_pct)+' %',f(r.target_net_replacement_cost_bn),f(r.target_financing_shortfall_bn)];
}));
md+=`
Nach voller Wirkung aller Tilgungen bleiben in diesem fest verzinsten Vergleich ${f(D*.025)} Mrd. € jährliche vermiedene Zinsen. Die Referenzkosten einer halben Beitragsquote wachsen mit der Beitragsbasis. Deshalb ist die frühere Aussage „bei konstanten Werten und 30 % Rückfluss Ziel in Jahr 46“ weiterhin rechnerisch richtig, aber ausdrücklich **keine robuste Zusage unter Wachstum**.

## Was eine ebenfalls wachsende Basistilgung bewirkt

Gleiche 2,5%-Zins- und 30%-Rückflussannahme, Beitragswachstum 2 %. Jährlich +2 % Tilgungsbudget ist eine zusätzlich zu finanzierende Annahme. Wachsende nominale Steuereinnahmen sind wegen gleichzeitig steigender Ausgaben nicht automatisch frei verfügbar.

`;
md+=table(['Basistilgung','Schuldenfrei in Modelljahr','Senkung dann','Bis zehn Jahre danach haltbare Senkung ab Schuldenfreiheit'],[0,2].map(b=>{const p=select(2,b);return [b===0?'10 Mrd. € jährlich':'10 Mrd. € anfangs, +2 % jährlich',p.repayment_complete_year,f(p.reduction_pct_at_debt_freedom)+' %',f(p.maximum_durable_reduction_pct_at_debt_freedom_through_horizon)+' %'];}));
md+=`
## Dauerhaft senken statt spätere Beitragserhöhungen einplanen

Die rohe Jahreskapazität kann wieder sinken. Sie wird nicht als zulässiger Beitragspfad ausgegeben. Für jeden Pfad werden daher drei zusätzliche Größen berechnet:

1. Das erste Jahr, in dem die höchste bisher finanzierbare Senkung nicht mehr gedeckt wäre, samt jährlichem zusätzlichem Finanzierungsbedarf zum Halten dieser Quote.
2. Erstmaliges Erreichen und späterer Verlust der 50%-Deckung. Der Zielcheck an der Schuldenfreiheit betrachtet die tatsächliche Deckung in diesem Jahr, nicht bloß ein früheres Erreichen.
3. Eine innerhalb des beobachteten Horizonts finanzierbare, nicht sinkende Senkungsfolge: pro Jahr das Minimum der heutigen und aller späteren Jahreskapazitäten. Sie bleibt stets durch die aktuellen Jahreszinsen gedeckt. Ungenutzte Kapazität wird nicht nochmals zur Tilgung addiert.

Diese Folge berücksichtigt künftige Kosten, ohne künftige Zinsersparnisse vorzeitig auszugeben. Sie ist nur unter den jeweiligen Annahmen bis zum angegebenen Endjahr gedeckt. **Zehn Jahre Nachprüfung bedeuten keine unbegrenzte Finanzierungsgarantie.** Bei dauerhaft positivem Beitragswachstum und einer festen nominalen Zinsersparnis kann ohne zusätzliche Finanzierungsquelle kein positiver konstanter Entlastungsanteil auf unbegrenzte Zeit allein so finanziert werden.

## Rechenidentitäten

- Referenzbeiträge im Jahr t = Startreferenz × (1 + Beitragswachstum)^(t−1).
- Geplante Basistilgung = Starttilgung × (1 + Tilgungswachstum)^(t−1), tatsächliche Tilgung höchstens Restschuld.
- Ziel-Nettoersatz = aktuelle Referenzbeiträge × 50 % × (1 − angenommener Rückfluss).
- Jahreszinsersparnis stammt nur aus bereits wirksam getilgtem Kapital × angenommenem Vermeidungssatz.
- Zinsersparnis = Entlastungs-Nettoersatz + zusätzliche Tilgung + nicht gebundener Rest. Jeder Euro genau einmal.

Die Versicherungszweige benötigen den vollen Beitragsausfall ersetzt; Steuer-Rückfluss reduziert nur die konsolidierte Nettobelastung. Höhere Pensionen, Gesundheits-/Pflegebedarf, Umsetzungskosten und Krisen können zusätzliche Mittel erfordern und sind hier nicht als finanziert angesetzt. Nach Schuldenfreiheit werden die bisherigen Basistilgungsmittel in diesen Pfaden nicht zusätzlich zur SV umgeleitet. Eine solche andere Finanzierung müsste separat entschieden und geprüft werden.

**Ergebnis für WERK:** Das 50%-Ziel bleibt bestehen; jede Stufe braucht einen wiederkehrenden, wachsenden und unter Stress haltbaren Ersatzfinanzierungsnachweis. Aktuelle Aktivierung und Finanzierungsgutschrift bleiben gesperrt. Die genaue Beitragsbasis, repräsentative Netto-Rückflüsse, Fälligkeiten und Ausgabenentwicklung sind weiterhin offene Nachweise.

Reproduzieren: \`node scripts/werk-sv-growth-stress-contract.mjs\`; erzeugen mit \`--write\`. [Bestehende Schulden-/SV-Rechnung](WERK_SV_NACH_SCHULDENFREIHEIT.md), [persönliches Jahresnetto](WERK_SV_JAHRESNETTO.md), [Gesamtrechnung](WERK_GESAMTRECHNUNG.md).
`;
// One compact path per line keeps full annual evidence reviewable without huge formatting noise.
const {paths:_,...meta}=out;
const json=JSON.stringify(meta,null,2).slice(0,-2)+',\n  "paths": [\n'+paths.map(p=>'    '+JSON.stringify(p)).join(',\n')+'\n  ]\n}\n';
for(const [p,v] of Object.entries({'werk-data/employee-sv-growth-stress-results.json':json,'WERK_SV_WACHSTUMSSTRESS.md':md})) {
  if(process.argv.includes('--write'))fs.writeFileSync(p,v);else assert.equal(fs.readFileSync(p,'utf8'),v,`${p}: regenerate`);
}
console.log(`SV growth stress OK: ${paths.length} complete paths; funding and perpetual coverage remain unproven.`);
