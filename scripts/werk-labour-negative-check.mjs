// Fault injection against the actual data checks, isolated from the checkout.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'werk-labour-negative-'));
const labour='scripts/werk-labour-productivity-contract.mjs';
const sourceCheck='scripts/werk-import-occupation-evidence.py';
const baseline='werk-data/labour-productivity-baseline-2025-2026.json';
const education='werk-data/labour-matching-matrix-priority-groups.json';
const occupation='werk-data/labour-occupation-region-matching-matrix.json';
const closure='werk-data/analysis-data-closure-register.json';
const matching='werk-data/labour-matching-baseline-2025-2026.json';
const run=source=>spawnSync(source?'python3':process.execPath,source?[sourceCheck,'--check']:[labour],{cwd:tmp,encoding:'utf8'});
const cases=[
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
];

try{
  fs.cpSync('werk-data',path.join(tmp,'werk-data'),{recursive:true});
  fs.mkdirSync(path.join(tmp,'scripts'));
  for(const script of [labour,sourceCheck])fs.copyFileSync(script,path.join(tmp,script));
  for(const source of [false,true]){
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
