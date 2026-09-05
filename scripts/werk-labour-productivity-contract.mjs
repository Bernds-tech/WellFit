import fs from 'node:fs';

const d=JSON.parse(fs.readFileSync('werk-data/labour-productivity-baseline-2025-2026.json','utf8'));
const m=JSON.parse(fs.readFileSync('werk-data/labour-matching-baseline-2025-2026.json','utf8'));
const p=JSON.parse(fs.readFileSync('werk-data/labour-matching-matrix-priority-groups.json','utf8'));
const fail=x=>{throw new Error(x)};
const near=(a,b,t,msg)=>{if(Math.abs(a-b)>t)fail(`${msg}: ${a} != ${b}`)};

if(d.status!=='official_actuals_plus_separately_labeled_forecast') fail('Unexpected labour baseline status');
if(!Array.isArray(d.concept_guardrails)||d.concept_guardrails.length<6) fail('Concept guardrails incomplete');
const guard=d.concept_guardrails.join(' ').toLowerCase();
for(const word of ['ilo','ams','quartals','offene stellen','teilzeit','prognosen']) if(!guard.includes(word)) fail(`Missing concept guard ${word}`);

const ilo=d.actuals?.ilo_q2_2026;
if(!ilo)fail('ILO Q2 2026 block missing');
near(ilo.derived_labour_force_persons,ilo.employed_persons+ilo.unemployed_persons,0.1,'ILO labour force identity');
near(ilo.derived_unemployment_rate_pct,ilo.unemployed_persons/ilo.derived_labour_force_persons*100,0.01,'ILO unemployment rate identity');

const vac=d.actuals?.vacancies_q2_2026;
if(!vac)fail('Vacancy Q2 block missing');
const v=vac.sector_vacancies_persons||{};
near(vac.vacancies_persons,(v.production||0)+(v.trade_and_services||0)+(v.public_and_social||0),0.1,'Vacancy sector sum');
if(vac.full_time_share_pct<0||vac.full_time_share_pct>100)fail('Vacancy full-time share invalid');

const a=d.actuals?.annual_2025;
if(!a)fail('Annual 2025 block missing');
near(a.part_time_persons,a.part_time_women_persons+a.part_time_men_persons,0.1,'Part-time sex sum');
near(a.part_time_rate_total_pct,a.part_time_persons/a.employed_persons*100,0.1,'Part-time rate vs employed persons');
if(!(a.part_time_rate_women_pct>a.part_time_rate_men_pct))fail('Part-time sex relationship unexpected');

const costs=d.actuals?.labour_costs;
if(!costs||!String(costs.scope_note||'').toLowerCase().includes('nicht additiv'))fail('Labour-cost definition guard missing');

const f=d.forecast_layer;
if(!f||f.not_actual!==true)fail('Forecast layer must be explicitly not actual');
const n=f.years?.length||0;
for(const key of ['total_employment_growth_pct','total_hours_worked_growth_pct','eurostat_unemployment_rate_pct','ams_unemployment_rate_pct','real_gross_employee_compensation_per_person_growth_pct']){
  if(!Array.isArray(f[key])||f[key].length!==n||f[key].some(x=>!Number.isFinite(x)))fail(`Invalid forecast series ${key}`);
}

const src=d.sources||[];
const ids=new Set();
for(const s of src){if(!s.id||ids.has(s.id))fail(`Duplicate/missing source id ${s.id}`);ids.add(s.id);if(!s.url||!s.checked_at)fail(`Incomplete source ${s.id}`)}
for(const id of ['STAT-LAB-ILO-Q2-2026','AMS-LAB-AUG-2026','STAT-VAC-Q2-2026','STAT-LAB-COST','STAT-GDP-Q2-2026','PROD-REPORT-2025','OENB-FORECAST-JUN-2026']) if(!ids.has(id))fail(`Required source missing ${id}`);
if(!Array.isArray(d.open_gates)||d.open_gates.length<5)fail('Open labour gates must remain visible');

if(m.status!=='partial_matching_baseline_no_reform_effect_yet')fail('Unexpected matching baseline status');
const matchGuard=(m.rules||[]).join(' ').toLowerCase();
for(const term of ['kein matching-score','ams-gemeldete offene stellen','arbeitszeit','gesundheitliche']) if(!matchGuard.includes(term))fail(`Matching guard missing ${term}`);
const nat=m.national_demand_profile_2025;
if(!nat)fail('National demand profile 2025 missing');
near(nat.vacancies_annual_average,(nat.sector_counts?.trade_and_services||0)+(nat.sector_counts?.production||0)+(nat.sector_counts?.public_and_social||0),0.1,'2025 vacancy sector identity');
if(!String(nat.minimum_education_share_pct?.note||'').includes('nicht als additive 100-%-Zerlegung'))fail('Education-share non-additivity guard missing');
const current=m.current_demand_direction_q2_2026;
near(current.vacancies,d.actuals.vacancies_q2_2026.vacancies_persons,0.1,'Q2 vacancies mismatch between labour and matching baselines');
near(current.vacancy_rate_pct,d.actuals.vacancies_q2_2026.vacancy_rate_pct,0.001,'Q2 vacancy-rate mismatch');

const regions=m.regional_ams_snapshots_august_2026||[];
if(regions.length!==9)fail(`Expected 9 regional snapshots, got ${regions.length}`);
const regionNames=new Set(regions.map(r=>r.region));
if(regionNames.size!==9)fail('Regional snapshot names not unique');
let comparable=0;const ratios=[];
for(const r of regions){
  if(r.registered_unemployed!=null&&r.registered_vacancies!=null){
    comparable++;
    const calc=r.registered_unemployed/r.registered_vacancies;
    near(r.derived_unemployed_per_registered_vacancy,calc,0.01,`${r.region} unemployment/vacancy ratio`);
    ratios.push({region:r.region,value:r.derived_unemployed_per_registered_vacancy});
  } else if(r.derived_unemployed_per_registered_vacancy!=null) fail(`${r.region}: ratio must be null when stock input is missing`);
}
if(comparable!==m.derived_regional_diagnostics?.regions_with_comparable_unemployment_and_vacancy_stock)fail('Comparable-region count mismatch');
ratios.sort((x,y)=>x.value-y.value);
if(ratios[0].region!==m.derived_regional_diagnostics.lowest_unemployed_per_registered_vacancy.region)fail('Lowest regional ratio mismatch');
if(ratios.at(-1).region!==m.derived_regional_diagnostics.highest_unemployed_per_registered_vacancy.region)fail('Highest regional ratio mismatch');
if(!String(m.derived_regional_diagnostics?.warning||'').toLowerCase().includes('sagen nichts darüber aus'))fail('Regional-ratio warning missing');

const dims=new Map((m.matching_dimensions||[]).map(x=>[x.id,x]));
for(const id of ['MATCH-OCC','MATCH-EDU','MATCH-REG','MATCH-TIME','MATCH-HEALTH','MATCH-WAGE','MATCH-SKILL'])if(!dims.has(id))fail(`Matching dimension missing ${id}`);
if(dims.get('MATCH-EDU')?.artifact!=='labour-matching-matrix-priority-groups.json')fail('MATCH-EDU must point to priority-group artifact');
if(m.werk_reform_gate?.status!=='blocked')fail('Labour reform gate must remain blocked');
if(m.werk_reform_gate?.next_artifact!=='labour-occupation-region-matching-matrix.json')fail('Matching gate must advance to occupation-region matrix');

if(p.status!=='education_layer_verified_occupation_region_time_pending')fail('Unexpected priority-group status');
if(p.reference_period!=='2026-07')fail('Priority-group reference period mismatch');
const rows=p.detailed_rows||[];
if(rows.length!==12)fail(`Expected 12 education detail rows, got ${rows.length}`);
const rowIds=new Set();
let sumU=0,sumV=0;
for(const r of rows){
  if(!r.id||rowIds.has(r.id))fail(`Duplicate education row ${r.id}`);rowIds.add(r.id);
  sumU+=r.registered_unemployed;sumV+=r.registered_vacancies;
  near(r.derived_unemployed_per_vacancy,r.registered_unemployed/r.registered_vacancies,0.01,`${r.id} education ratio`);
}
near(sumU,p.reconciliation.detailed_unemployed_sum,0.1,'Education unemployed detail sum');
near(sumV,p.reconciliation.detailed_vacancy_sum,0.1,'Education vacancy detail sum');
near(p.reconciliation.published_unemployed_total-sumU,p.reconciliation.unallocated_difference,0.1,'Unallocated education unemployment difference');
near(sumV,p.published_totals.registered_vacancies,0.1,'Education vacancy published total');
if(p.reconciliation.unallocated_difference<=0)fail('Expected explicit positive unallocated unemployment difference');
if(!String(p.reconciliation.rule||'').includes('nicht erfunden'))fail('Education reconciliation must prohibit invented allocation');
const groups=new Map((p.aggregated_priority_groups||[]).map(x=>[x.id,x]));
for(const id of ['PRIO-LOW-EDU','PRIO-APPRENTICESHIP','PRIO-BMS','PRIO-AHS','PRIO-BHS','PRIO-TERTIARY'])if(!groups.has(id))fail(`Priority group missing ${id}`);
const bms=groups.get('PRIO-BMS');near(bms.registered_unemployed,1759+6247+7801,0.1,'BMS unemployment aggregate');near(bms.registered_vacancies,153+114+2439,0.1,'BMS vacancy aggregate');
const bhs=groups.get('PRIO-BHS');near(bhs.registered_unemployed,7108+6720+9215,0.1,'BHS unemployment aggregate');near(bhs.registered_vacancies,2933+710+3396,0.1,'BHS vacancy aggregate');
const ter=groups.get('PRIO-TERTIARY');near(ter.registered_unemployed,980+5347+30972,0.1,'Tertiary unemployment aggregate');near(ter.registered_vacancies,290+1640+2595,0.1,'Tertiary vacancy aggregate');
if(!Array.isArray(p.next_required_layers)||p.next_required_layers.length<5)fail('Priority matching next layers incomplete');

console.log(`WERK labour/productivity contract OK: ILO/AMS scopes separated; 9 regional snapshots (${comparable} comparable stock ratios); 12 education detail rows + 6 priority groups reconcile; 869-person education residual remains explicit; reform gate advanced to occupation×region matching.`);
