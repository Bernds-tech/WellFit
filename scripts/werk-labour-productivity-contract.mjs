import fs from 'node:fs';
import { createHash } from 'node:crypto';

const d=JSON.parse(fs.readFileSync('werk-data/labour-productivity-baseline-2025-2026.json','utf8'));
const m=JSON.parse(fs.readFileSync('werk-data/labour-matching-baseline-2025-2026.json','utf8'));
const p=JSON.parse(fs.readFileSync('werk-data/labour-matching-matrix-priority-groups.json','utf8'));
const o=JSON.parse(fs.readFileSync('werk-data/labour-occupation-region-matching-matrix.json','utf8'));
const supply=JSON.parse(fs.readFileSync('werk-data/labour-occupation-supply-2026-08.json','utf8'));
const qt=JSON.parse(fs.readFileSync('werk-data/labour-qualification-working-time-2026-08.json','utf8'));
const closure=JSON.parse(fs.readFileSync('werk-data/analysis-data-closure-register.json','utf8'));
const fail=x=>{throw new Error(x)};
const near=(a,b,t,msg)=>{if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>t)fail(`${msg}: ${a} != ${b}`)};
const count=(x,msg)=>{if(!Number.isSafeInteger(x)||x<0)fail(`Invalid count ${msg}: ${x}`)};

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
  count(r.registered_unemployed,`${r.region} unemployed`);
  if(r.reference_period!=='2026-08')fail(`${r.region}: wrong snapshot period`);
  if(r.registered_unemployed!=null&&r.registered_vacancies!=null){
    count(r.registered_vacancies,`${r.region} vacancies`);
    if(r.registered_vacancies===0||r.vacancy_availability!=='sofort verfügbar')fail(`${r.region}: incompatible vacancy denominator`);
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
near(ratios[0].value,m.derived_regional_diagnostics.lowest_unemployed_per_registered_vacancy.value,0.001,'Lowest ratio value');
near(ratios.at(-1).value,m.derived_regional_diagnostics.highest_unemployed_per_registered_vacancy.value,0.001,'Highest ratio value');
const national=m.national_august_reconciliation;
near(regions.reduce((n,r)=>n+r.registered_unemployed,0),national.registered_unemployed_total,0,'National/regional August unemployed total');
near(national.sum_regional_registered_unemployed,national.registered_unemployed_total,0,'Stored August reconciliation');
near(regions.reduce((n,r)=>n+r.registered_vacancies,0),national.registered_vacancies_total,0,'National/regional August vacancy total');
near(national.sum_regional_registered_vacancies,national.registered_vacancies_total,0,'Stored August vacancy reconciliation');
if(comparable!==9)fail('All nine regional vacancy stocks must now be directly observed');
const regionalSource=m.regional_source_evidence;
if(regionalSource.reference_period!=='2026-08'||createHash('sha256').update(fs.readFileSync(regionalSource.source_file)).digest('hex')!==regionalSource.source_sha256)fail('Regional workbook scope/hash mismatch');
for(const field of Object.keys(regionalSource.count_columns)){
  for(const r of regions)count(r[field],`${r.region} ${field}`);
  near(regions.reduce((n,r)=>n+r[field],0),regionalSource.national_record[field],0,`Regional subgroup total ${field}`);
}
for(const r of regions){
  near(r.unemployed_men_and_alternative_gender+r.unemployed_women,r.registered_unemployed,0,'Regional gender identity');
  for(const field of ['unemployed_age_15_24','unemployed_age_50_plus','unemployed_duration_over_one_year'])if(r[field]>r.registered_unemployed)fail('Regional subgroup exceeds unemployment');
}
if(national.reference_period!=='2026-08'||national.regions_with_observed_vacancy_stock!==comparable)fail('Regional scope metadata mismatch');
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
  count(r.registered_unemployed,`${r.id} unemployed`);count(r.registered_vacancies,`${r.id} vacancies`);
  if(r.registered_vacancies===0)fail(`${r.id}: zero denominator`);
  sumU+=r.registered_unemployed;sumV+=r.registered_vacancies;
  near(r.derived_unemployed_per_vacancy,r.registered_unemployed/r.registered_vacancies,0.01,`${r.id} education ratio`);
}
near(sumU,p.reconciliation.detailed_unemployed_sum,0.1,'Education unemployed detail sum');
near(sumV,p.reconciliation.detailed_vacancy_sum,0.1,'Education vacancy detail sum');
near(p.reconciliation.published_unemployed_total-sumU,p.reconciliation.unallocated_difference,0.1,'Unallocated education unemployment difference');
near(p.reconciliation.published_unemployed_total,p.published_totals.registered_unemployed,0,'Education published unemployment totals disagree');
near(p.reconciliation.published_vacancy_total,p.published_totals.registered_vacancies,0,'Education published vacancy totals disagree');
near(sumV,p.published_totals.registered_vacancies,0.1,'Education vacancy published total');
if(p.reconciliation.unallocated_difference<=0)fail('Expected explicit positive unallocated unemployment difference');
if(!String(p.reconciliation.rule||'').includes('nicht erfunden'))fail('Education reconciliation must prohibit invented allocation');
const groups=new Map((p.aggregated_priority_groups||[]).map(x=>[x.id,x]));
for(const id of ['PRIO-LOW-EDU','PRIO-APPRENTICESHIP','PRIO-BMS','PRIO-AHS','PRIO-BHS','PRIO-TERTIARY'])if(!groups.has(id))fail(`Priority group missing ${id}`);
const bms=groups.get('PRIO-BMS');near(bms.registered_unemployed,1759+6247+7801,0.1,'BMS unemployment aggregate');near(bms.registered_vacancies,153+114+2439,0.1,'BMS vacancy aggregate');
const bhs=groups.get('PRIO-BHS');near(bhs.registered_unemployed,7108+6720+9215,0.1,'BHS unemployment aggregate');near(bhs.registered_vacancies,2933+710+3396,0.1,'BHS vacancy aggregate');
const ter=groups.get('PRIO-TERTIARY');near(ter.registered_unemployed,980+5347+30972,0.1,'Tertiary unemployment aggregate');near(ter.registered_vacancies,290+1640+2595,0.1,'Tertiary vacancy aggregate');
if(!Array.isArray(p.next_required_layers)||p.next_required_layers.length<5)fail('Priority matching next layers incomplete');

const usedMembers=new Set();
if(p.aggregated_priority_groups.length!==6)fail('Expected exactly six education groups');
for(const g of p.aggregated_priority_groups){
  if(!g.member_row_ids?.length)fail(`${g.id}: missing source members`);
  const members=g.member_row_ids.map(id=>{
    if(usedMembers.has(id)||!rowIds.has(id))fail(`${g.id}: duplicate or unknown member ${id}`);
    usedMembers.add(id);return rows.find(r=>r.id===id);
  });
  near(g.registered_unemployed,members.reduce((n,r)=>n+r.registered_unemployed,0),0,`${g.id} members unemployed`);
  near(g.registered_vacancies,members.reduce((n,r)=>n+r.registered_vacancies,0),0,`${g.id} members vacancies`);
  near(g.derived_unemployed_per_vacancy,g.registered_unemployed/g.registered_vacancies,0.01,`${g.id} group ratio`);
}
if(usedMembers.size!==rows.length)fail('Education groups do not partition all detail rows');

if(o.status!=='published_shortage_signals_only_joint_matching_blocked'||o.reference_period!=='2026-Q2')fail('Occupation source scope/period mismatch');
if(o.scope.minimum_qualification!=='mindestens Lehre'||o.scope.stock_statistic!=='Quartalsdurchschnitt; keine Monatssumme')fail('Occupation qualification/stock scope changed');
if(o.scope.displayed_stock_includes_agency_discount!==false||o.scope.indicator_agency_weight!==0.9)fail('Displayed stock must remain distinct from adjusted indicator input');
if(o.scope.missing_cell_means!=='not_published_unknown'||o.scope.cross_region_additive!==false||o.scope.cross_occupation_additive!==false)fail('Sparse/hierarchical occupation rows must not be silently added or zero-filled');
if(o.scope.education_cross_tab_available!==false||o.scope.individual_matching_available!==false)fail('Engpass evidence is not joint matching');
const sourceHash=createHash('sha256').update(fs.readFileSync(o.source_file)).digest('hex');
if(sourceHash!==o.source_sha256)fail('Occupation source snapshot hash mismatch');
const keys=new Set(),occCounts=new Map();
for(const r of o.records){
  const key=`${r.region}|${r.occupation_code}`;
  if(keys.has(key))fail(`Duplicate occupation-region key ${key}`);keys.add(key);
  if(!['Österreich',...regionNames].includes(r.region)||!/^(\d{4}|\d{6})$/.test(r.occupation_code))fail(`Invalid occupation key ${key}`);
  if(!Number.isFinite(r.ams_vacancies_quarter_average)||r.ams_vacancies_quarter_average<=0)fail(`Invalid occupation stock ${key}`);
  if(![1,2].includes(r.reported_shortage_score)||![r.reported_t1,r.reported_t2,r.reported_t3].every(x=>[-2,-1,0,1,2].includes(x)))fail(`Invalid published score ${key}`);
  if(typeof r.reported_pressure_below_one_flag!=='boolean'||!['up','unchanged','down'].includes(r.reported_yoy_direction))fail(`Invalid published flag ${key}`);
  if(!Number.isSafeInteger(r.source_row)||r.source_row<7||!r.source_sheet)fail(`Missing source locator ${key}`);
  occCounts.set(r.region,(occCounts.get(r.region)||0)+1);
}
if(occCounts.size!==10||o.records.length!==o.published_row_count)fail('Occupation coverage count mismatch');
for(const [region,n] of Object.entries(o.published_rows_by_region))near(n,occCounts.get(region),0,`${region} source rows`);
if(o.matching_gate.status!=='blocked'||o.matching_gate.employment_effect_persons!==null||o.matching_gate.budget_effect_eur!==null)fail('Unverified occupation effects must remain null and blocked');
if(new Set(o.matching_gate.priority_group_links.map(x=>x.priority_group_id)).size!==6||o.matching_gate.priority_group_links.some(x=>!groups.has(x.priority_group_id)))fail('Occupation links must resolve to all six education groups');

if(supply.reference_period!=='2026-08'||supply.source_date!=='2026-08-31'||supply.status!=='observed_occupation_region_stocks_joint_qualification_blocked')fail('Occupation supply scope/period mismatch');
if(supply.scope.education_cross_tab_available!==false||supply.scope.individual_matching_available!==false||supply.scope.q2_shortage_join_allowed!==false)fail('Occupation supply is not joint qualification or Q2 matching');
if(supply.scope.missing_cell_means!=='not_published_unknown'||supply.scope.zero_means!=='explicitly_reported_zero')fail('Occupation missing/zero semantics changed');
if(supply.matching_gate.status!=='blocked'||supply.matching_gate.employment_effect_persons!==null||supply.matching_gate.budget_effect_eur!==null)fail('Occupation supply effects must remain null and blocked');
const supplyKeys=new Set(),observed={both_observed:0,al_only:0,os_only:0};
for(const r of supply.records){
  const key=`${r.region}|${r.occupation_code}`;
  if(supplyKeys.has(key))fail('Duplicate occupation supply key');supplyKeys.add(key);
  if(!regionNames.has(r.region)||!/^\d{4}$/.test(r.occupation_code))fail('Invalid occupation supply key');
  if(!Object.hasOwn(observed,r.observation_status))fail('Invalid occupation observation status');observed[r.observation_status]++;
  for(const [kind,field,label] of [['al','registered_unemployed_occupation_wish','supply_label'],['os','registered_immediate_vacancies','vacancy_label']]){
    count(r.source_rows[kind],'Occupation source row count');
    const present=r.observation_status==='both_observed'||r.observation_status===`${kind}_only`;
    if(present){
      count(r[field],'Occupation observed count');
      if(r.source_rows[kind]===0||typeof r[label]!=='string'||!r[label])fail('Observed occupation lacks source rows/label');
    }else if(r[field]!==null||r[label]!==null||r.source_rows[kind]!==0)fail('Unobserved occupation side must remain null');
  }
}
near(supply.counts.occupation_region_pairs,supply.records.length,0,'Occupation pair count');
near(supply.counts.both_observed,observed.both_observed,0,'Both observed count');
near(supply.counts.supply_only,observed.al_only,0,'Supply-only count');
near(supply.counts.vacancy_only,observed.os_only,0,'Vacancy-only count');
if(supply.regional_totals.length!==9||new Set(supply.regional_totals.map(r=>r.region)).size!==9)fail('Occupation regional total coverage');
for(const base of regions){
  const rows=supply.records.filter(r=>r.region===base.region),total=supply.regional_totals.find(r=>r.region===base.region);
  for(const [field,baseField] of [['registered_unemployed_occupation_wish','registered_unemployed'],['registered_immediate_vacancies','registered_vacancies']]){
    const sum=rows.filter(r=>r[field]!==null).reduce((n,r)=>n+r[field],0);
    near(sum,base[baseField],0,`Occupation state sum ${base.region} ${field}`);
    near(sum,total[baseField],0,'Stored occupation state sum');
  }
  near(rows.length,total.observed_occupation_pairs,0,'Regional occupation pair count');
}
for(const [kind,field,total] of [['al','registered_unemployed_occupation_wish',national.registered_unemployed_total],['os','registered_immediate_vacancies',national.registered_vacancies_total]]){
  near(supply.records.reduce((n,r)=>n+r.source_rows[kind],0),supply.counts[kind].source_rows,0,'Occupation source row sum');
  near(supply.counts[kind].stock_total,total,0,'Occupation national total');
}

if(qt.reference_period!=='2026-08'||qt.status!=='education_and_vacancy_time_marginals_verified_joint_matching_blocked')fail('Qualification/time scope or period mismatch');
for(const flag of ['education_occupation_joint_observed','education_working_time_joint_observed','supply_feasible_hours_observed','care_schedule_capacity_observed','synthetic_cross_join_allowed','allocation_of_unclear_education_allowed'])if(qt.scope[flag]!==false)fail(`Unproven qualification/time dimension: ${flag}`);
if(qt.scope.flexible_time_counted_once!==true||qt.scope.not_immediate_vacancies_excluded_from_matching_baseline!==true||qt.scope.vacancy_availability_filter!=='Bestand_sofort_verfuegbar')fail('Working-time/availability guard changed');
if(qt.scope.missing_cell_means!=='not_published_unknown'||qt.scope.zero_means!=='explicitly_reported_zero')fail('Qualification missing/zero semantics changed');
if(qt.matching_gate.status!=='blocked'||qt.matching_gate.employment_effect_persons!==null||qt.matching_gate.budget_effect_eur!==null||qt.matching_gate.feasible_additional_working_hours!==null)fail('Qualification/time effects and feasible hours must remain null');
if(!Array.isArray(qt.joint_matching_cells)||qt.joint_matching_cells.length!==0)fail('Synthetic qualification/time joint cells forbidden');
const eduKeys=new Set();
for(const r of qt.education_records){
  const key=`${r.region}|${r.education_code}`;
  if(eduKeys.has(key)||!regionNames.has(r.region)||!/^\w[\w*]$/.test(r.education_code))fail('Duplicate/invalid regional education key');eduKeys.add(key);
  for(const [kind,field,label] of [['al','registered_unemployed','supply_label'],['os','registered_immediate_vacancies','vacancy_label']]){
    count(r.source_rows[kind],'Education source rows');
    if(r.source_rows[kind]>0){count(r[field],'Education observed count');if(typeof r[label]!=='string'||!r[label])fail('Education source label missing');}
    else if(r[field]!==null||r[label]!==null)fail('Unobserved education side must remain null');
  }
}
const timeKeys=new Set(),timeTotals=new Map();
for(const r of qt.working_time_records){
  const key=`${r.region}|${r.employment_type}|${r.working_time}`;
  if(timeKeys.has(key)||!regionNames.has(r.region))fail('Duplicate/invalid working-time key');timeKeys.add(key);
  if(!['V - Vollzeit','T - Teilzeit','B - Beides (Vollzeit oder Teilzeit)'].includes(r.working_time))fail('Unknown working-time category');
  count(r.registered_immediate_vacancies,'Working-time stock');count(r.source_rows,'Working-time source rows');
  if(r.source_rows===0)fail('Working-time row has no source');
  timeTotals.set(r.working_time,(timeTotals.get(r.working_time)||0)+r.registered_immediate_vacancies);
}
if(Object.keys(qt.national_working_time).length!==3)fail('Working-time national category count');
for(const [label,n] of timeTotals)near(qt.national_working_time[label],n,0,'Working-time national category total');
near([...timeTotals.values()].reduce((a,b)=>a+b,0),national.registered_vacancies_total,0,'Working-time national stock, flexible once');
for(const region of regions){
  const er=qt.education_records.filter(r=>r.region===region.region),tr=qt.working_time_records.filter(r=>r.region===region.region);
  near(er.reduce((n,r)=>n+(r.registered_unemployed??0),0),region.registered_unemployed,0,'Education region AL total');
  near(er.reduce((n,r)=>n+(r.registered_immediate_vacancies??0),0),region.registered_vacancies,0,'Education region OS total');
  near(tr.reduce((n,r)=>n+r.registered_immediate_vacancies,0),region.registered_vacancies,0,'Working-time region OS total');
}
const residual=qt.july_residual_audit,explanation=p.reconciliation.source_explanation;
if(residual.reference_period!=='2026-07'||residual.residual_code!=='XX'||residual.residual_label!=='Ungeklärt'||residual.allocated_to_known_education!==false)fail('July residual must remain the unclear education category');
near(residual.residual_count,p.reconciliation.unallocated_difference,0,'July official unclear category count');
near(residual.unexplained_source_difference,0,0,'July source difference now explained');
if(explanation.artifact!=='labour-qualification-working-time-2026-08.json'||explanation.source_code!=='XX'||explanation.allocated_to_priority_groups!==false)fail('July source explanation linkage/allocation invalid');
near(explanation.source_count,residual.residual_count,0,'July linked explanation count');
near(explanation.unexplained_source_difference,residual.unexplained_source_difference,0,'July linked unexplained difference');

const gap=closure.priority_1_data_gaps.find(x=>x.id==='GAP-LAB-01');
if(!gap||gap.status!=='teilweise vorhanden')fail('Labour parent gap must remain partial');
const subgates=new Map((gap.subgates||[]).map(x=>[x.id,x]));
if(subgates.size!==9||gap.subgates.length!==9)fail('Expected nine unique labour subgates');
for(const id of ['LAB-A','LAB-B','LAB-C','LAB-D','LAB-E','LAB-F','LAB-G','LAB-H','LAB-I']){
  const gate=subgates.get(id);
  if(!gate||!closure.status_values.includes(gate.status)||!gate.close_when||!gate.scope)fail(`Incomplete subgate ${id}`);
  if(!Array.isArray(gate.artifacts)||(gate.status==='geschlossen'&&!gate.artifacts.length))fail(`Missing closure evidence ${id}`);
  for(const path of gate.artifacts)if(!fs.existsSync(`werk-data/${path}`))fail(`Missing subgate artifact ${path}`);
}
for(const id of ['LAB-E','LAB-F','LAB-G','LAB-H','LAB-I'])if(subgates.get(id).status==='geschlossen')fail(`Unverified matching subgate closed: ${id}`);
if(gap.effect_gate.status!=='blocked'||gap.effect_gate.employment_effect_persons!==null||gap.effect_gate.budget_effect_eur!==null)fail('Labour budget/employment booking must remain blocked');
if(!closure.closure_order.includes('GAP-LAB-01'))fail('Labour gap omitted from closure order');

console.log(`WERK labour/productivity contract OK: 9 regional AL/OS stocks; 12 July education rows/6 groups with 869 officially unclear; ${o.records.length} Q2 shortage rows; ${supply.records.length} August occupation pairs; ${qt.education_records.length} education and ${qt.working_time_records.length} working-time rows. Joint matching, feasible hours and fiscal effects blocked.`);
