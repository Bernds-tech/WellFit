// Fault injection against the actual data checks, isolated from the checkout.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-labour-negative-'));
const labour='scripts/werk-labour-productivity-contract.mjs';
const sourceCheck='scripts/werk-import-occupation-evidence.py';
const regionalCheck='scripts/werk-import-regional-labour.py';
const qtCheck='scripts/werk-import-qualification-time.py';
const qt='werk-data/labour-qualification-working-time-2026-08.json';
const supplyCheck='scripts/werk-import-occupation-supply.py';
const baseline='werk-data/labour-productivity-baseline-2025-2026.json';
const education='werk-data/labour-matching-matrix-priority-groups.json';
const occupation='werk-data/labour-occupation-region-matching-matrix.json';
const closure='werk-data/analysis-data-closure-register.json';
const matching='werk-data/labour-matching-baseline-2025-2026.json';
const supply='werk-data/labour-occupation-supply-2026-08.json';
const run=source=>spawnSync(source?'python3':process.execPath,source?[source===true?sourceCheck:source,'--check']:[labour],{cwd:tmp,encoding:'utf8'});
const cases=[
  ['invented joint education and occupation',qt,d=>d.scope.education_occupation_joint_observed=true,/Unproven qualification/],
  ['synthetic qualification cells',qt,d=>d.joint_matching_cells.push({region:'Wien'}),/Synthetic qualification/],
  ['invented feasible hours',qt,d=>d.matching_gate.feasible_additional_working_hours=0,/effects and feasible hours must remain null/],
  ['duplicate regional education',qt,d=>d.education_records.push(d.education_records[0]),/Duplicate\/invalid regional education/],
  ['zero-filled unpublished education',qt,d=>d.education_records.find(r=>r.registered_immediate_vacancies===null).registered_immediate_vacancies=0,/Unobserved education side must remain null/],
  ['duplicate working-time category',qt,d=>d.working_time_records.push(d.working_time_records[0]),/Duplicate\/invalid working-time key/],
  ['flexible vacancies double counted',qt,d=>d.national_working_time['V - Vollzeit']+=d.national_working_time['B - Beides (Vollzeit oder Teilzeit)'],/Working-time national category total/],
  ['non-immediate vacancies admitted',qt,d=>d.scope.vacancy_availability_filter='all',/Working-time\/availability guard changed/],
  ['unclear education allocated',qt,d=>d.july_residual_audit.allocated_to_known_education=true,/July residual must remain/],
  ['mixed qualification source month',qt,d=>d.sources[0].reference_date='2026-07-31',/Qualification\/time source date mismatch/,qtCheck],
  ['qualification source label drift',qt,d=>d.education_records[0].supply_label='wrong',/Qualification\/time extraction mismatch: education_records/,qtCheck],
  ['sum-preserving education allocation drift',qt,d=>{const r=d.education_records.filter(x=>x.region==='Wien'&&x.registered_unemployed>1);r[0].registered_unemployed++;r[1].registered_unemployed--;},/Qualification\/time extraction mismatch: education_records/,qtCheck],
  ['missing numeric operand',baseline,d=>delete d.actuals.ilo_q2_2026.derived_labour_force_persons,/ILO labour force identity/],
  ['null source count',education,d=>d.detailed_rows[0].registered_unemployed=null,/Invalid count/],
  ['wrong group ratio',education,d=>d.aggregated_priority_groups[0].derived_unemployed_per_vacancy=0,/group ratio/],
  ['overlapping education members',education,d=>d.aggregated_priority_groups[1].member_row_ids=['EDU-PS'],/duplicate or unknown member/],
  ['mixed reference month',matching,d=>d.regional_ams_snapshots_august_2026[0].reference_period='2026-07',/wrong snapshot period/],
  ['duplicate occupation row',occupation,d=>d.records.push(d.records[0]),/Duplicate occupation-region key/],
  ['invented employment effect',occupation,d=>d.matching_gate.employment_effect_persons=1000,/effects must remain null/],
  ['falsely closed qualification gate',closure,d=>d.priority_1_data_gaps.find(x=>x.id==='GAP-LAB-01').subgates.find(x=>x.id==='LAB-E').status='geschlossen',/Unverified matching subgate closed/],
  ['source value drift',occupation,d=>d.records[0].ams_vacancies_quarter_average+=1,/Source extraction mismatch: records/,true],
  ['source locator drift',occupation,d=>d.records[0].source_row+=1,/Source extraction mismatch: records/,true],
  ['regional workbook value drift',matching,d=>d.regional_ams_snapshots_august_2026.find(r=>r.region==='Oberösterreich').registered_vacancies+=1,/Regional source mismatch/,regionalCheck],
  ['regional workbook locator drift',matching,d=>d.regional_ams_snapshots_august_2026[0].source_locator.row+=1,/Regional source mismatch/,regionalCheck],
  ['regional subgroup drift',matching,d=>d.regional_ams_snapshots_august_2026[0].unemployed_age_50_plus+=1,/Regional subgroup total/],
  ['duplicate monthly occupation',supply,d=>d.records.push(d.records[0]),/Duplicate occupation supply key/],
  ['zero-filled unpublished vacancy',supply,d=>d.records.find(r=>r.observation_status==='al_only').registered_immediate_vacancies=0,/Unobserved occupation side must remain null/],
  ['monthly stocks used for quarterly shortage',supply,d=>d.scope.q2_shortage_join_allowed=true,/not joint qualification or Q2 matching/],
  ['invented joint qualification',supply,d=>d.scope.education_cross_tab_available=true,/not joint qualification or Q2 matching/],
  ['invented monthly budget effect',supply,d=>d.matching_gate.budget_effect_eur=0,/effects must remain null and blocked/],
  ['monthly occupation source label drift',supply,d=>d.records[0].supply_label='incorrect label',/Occupation supply extraction mismatch: records/,supplyCheck],
  ['mixed occupation month',supply,d=>d.source_date='2026-07-31',/Occupation supply scope\/period mismatch/],
  ['sum-preserving occupation allocation drift',supply,d=>{
    const rows=d.records.filter(r=>r.region==='Wien'&&r.registered_unemployed_occupation_wish>1);
    rows[0].registered_unemployed_occupation_wish+=1;rows[1].registered_unemployed_occupation_wish-=1;
  },/Occupation supply extraction mismatch: records/,supplyCheck],
];

try{
  fs.cpSync('werk-data',path.join(tmp,'werk-data'),{recursive:true});
  fs.mkdirSync(path.join(tmp,'scripts'));
  for(const script of [labour,sourceCheck,regionalCheck,supplyCheck,qtCheck])fs.copyFileSync(script,path.join(tmp,script));
  for(const source of [false,true,regionalCheck,supplyCheck,qtCheck]){
    const r=run(source);assert.equal(r.status,0,`Unmodified baseline failed: ${r.stderr}`);
  }
  for(const [name,file,mutate,error,source=false] of cases){
    const target=path.join(tmp,file),original=fs.readFileSync(target,'utf8');
    try{
      const data=JSON.parse(original);mutate(data);fs.writeFileSync(target,JSON.stringify(data));
      const r=run(source);
      assert.notEqual(r.status,null,`${name}: process failed to run`);
      assert.notEqual(r.status,0,`${name}: invalid input was accepted`);
      assert.match(r.stderr+r.stdout,error,`${name}: failed for wrong reason`);
    }finally{fs.writeFileSync(target,original);}
  }
  console.log(`WERK labour negative checks OK: ${cases.length} malformed/false-closure/source-drift cases rejected; checkout unchanged.`);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
