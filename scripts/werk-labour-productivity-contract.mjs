import fs from 'node:fs';

const d=JSON.parse(fs.readFileSync('werk-data/labour-productivity-baseline-2025-2026.json','utf8'));
const fail=m=>{throw new Error(m)};
const near=(a,b,t,m)=>{if(Math.abs(a-b)>t)fail(`${m}: ${a} != ${b}`)};

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

console.log('WERK labour/productivity baseline OK: ILO/AMS scopes separated; vacancy and part-time identities reconcile; forecast remains non-actual; open matching/productivity gates visible.');
