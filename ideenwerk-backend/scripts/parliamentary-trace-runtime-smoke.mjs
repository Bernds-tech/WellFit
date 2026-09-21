import pg from 'pg';
import assert from 'node:assert/strict';
const {Client}=pg;
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const c=new Client({connectionString:process.env.DATABASE_URL});
await c.connect();
async function expectError(sql,params,needle){await c.query('SAVEPOINT exp');let m='';try{await c.query(sql,params)}catch(e){m=String(e?.message||e)}await c.query('ROLLBACK TO SAVEPOINT exp');await c.query('RELEASE SAVEPOINT exp');assert.ok(m.includes(needle),`expected ${needle}, got ${m||'no error'}`)}
const createFn=`select public.werk_create_parliamentary_trace($1,$2,$3,$4::jsonb,$5) data`;
try{
  const acl=await c.query(`SELECT
    has_table_privilege('anon','public.werk_parliamentary_traces','SELECT') anon_select,
    has_table_privilege('authenticated','public.werk_parliamentary_traces','SELECT') auth_select,
    has_table_privilege('service_role','public.werk_parliamentary_traces','SELECT') service_trace_select,
    has_table_privilege('service_role','public.werk_parliamentary_traces','INSERT') service_trace_insert,
    has_table_privilege('service_role','public.werk_parliamentary_traces','UPDATE') service_trace_update,
    has_table_privilege('service_role','public.werk_parliamentary_traces','DELETE') service_trace_delete,
    has_table_privilege('service_role','public.werk_parliamentary_trace_events','SELECT') service_event_select,
    has_table_privilege('service_role','public.werk_parliamentary_trace_events','INSERT') service_event_insert,
    has_table_privilege('service_role','public.werk_parliamentary_trace_events','UPDATE') service_event_update,
    has_table_privilege('service_role','public.werk_parliamentary_trace_events','DELETE') service_event_delete,
    has_function_privilege('anon','public.werk_create_parliamentary_trace(text,text,text,jsonb,uuid)','EXECUTE') anon_exec,
    has_function_privilege('service_role','public.werk_create_parliamentary_trace(text,text,text,jsonb,uuid)','EXECUTE') service_exec`);
  const p=acl.rows[0];
  assert.equal(p.anon_select,false);assert.equal(p.auth_select,false);assert.equal(p.anon_exec,false);
  assert.equal(p.service_trace_select,true);assert.equal(p.service_event_select,true);assert.equal(p.service_exec,true);
  assert.equal(p.service_trace_insert,false);assert.equal(p.service_trace_update,false);assert.equal(p.service_trace_delete,false);
  assert.equal(p.service_event_insert,false);assert.equal(p.service_event_update,false);assert.equal(p.service_event_delete,false);

  const uniq=await c.query(`select indexdef from pg_indexes where schemaname='public' and indexname='werk_parliamentary_traces_decision_version_uniq'`);
  assert.equal(uniq.rowCount,1);assert.match(uniq.rows[0].indexdef,/CREATE UNIQUE INDEX/);

  await c.query('BEGIN');
  await c.query('SET LOCAL ROLE service_role');
  await expectError(`insert into public.werk_parliamentary_traces(trace_id,source_decision_id,source_decision_version,decision_artifact_hash) values('WTRACE-AAAAAAAAAAAAAAAAAAAA','DIRECT-SYN','v1',$1)`,['a'.repeat(64)],'permission denied');
  await expectError(`update public.werk_parliamentary_traces set current_state=current_state where false`,[],'permission denied');
  await expectError(`delete from public.werk_parliamentary_trace_events where false`,[],'permission denied');

  const a=['DEC-SYN-001','v1','a'.repeat(64),JSON.stringify([{source:'synthetic'}]),null];
  const first=await c.query(createFn,a);assert.equal(first.rows[0].data.replayed,false);
  const traceId=first.rows[0].data.trace_id;assert.match(traceId,/^WTRACE-[A-F0-9]{20}$/);
  const replay=await c.query(createFn,a);assert.equal(replay.rows[0].data.replayed,true);assert.equal(replay.rows[0].data.trace_id,traceId);
  const conflict=[...a]; conflict[2]='b'.repeat(64);
  await expectError(createFn,conflict,'WERK_TRACE_DECISION_VERSION_CONFLICT');

  const advance=`select public.werk_advance_parliamentary_trace($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9::jsonb,$10::jsonb,$11) data`;
  let state='decision_recorded';
  for(const next of ['legal_and_competence_review','implementation_path_defined','proposal_or_measure_prepared','formal_process_in_progress']){
    const r=await c.query(advance,[traceId,state,next,'synthetic_evidence',JSON.stringify([{ref:'SYN'}]),null,null,null,null,null,null]);
    assert.equal(r.rows[0].data.state,next); state=next;
  }
  await expectError(advance,[traceId,state,'implementation_evidence_recorded','skip',JSON.stringify([{ref:'SYN'}]),null,null,null,null,null,null],'WERK_TRACE_TRANSITION_INVALID');
  const out=await c.query(advance,[traceId,state,'formal_outcome_recorded','formal_outcome',JSON.stringify([{ref:'FORMAL-SYN'}]),'synthetic institution','SYN-REF','unknown_requires_evidence',null,null,null]);
  assert.equal(out.rows[0].data.state,'formal_outcome_recorded'); state='formal_outcome_recorded';
  await expectError(advance,[traceId,state,'implementation_evidence_recorded','implementation',JSON.stringify([{ref:'SYN'}]),null,null,null,null,null,null],'WERK_TRACE_IMPLEMENTATION_EVIDENCE_REQUIRED');
  const impl=await c.query(advance,[traceId,state,'implementation_evidence_recorded','implementation',JSON.stringify([{ref:'IMPL-SYN'}]),null,null,null,JSON.stringify([{ref:'IMPL-SYN'}]),null,null]);
  assert.equal(impl.rows[0].data.state,'implementation_evidence_recorded'); state='implementation_evidence_recorded';
  await expectError(advance,[traceId,state,'impact_measurement_linked','impact',JSON.stringify([{ref:'SYN'}]),null,null,null,null,null,null],'WERK_TRACE_IMPACT_LINK_REQUIRED');
  const impact=await c.query(advance,[traceId,state,'impact_measurement_linked','impact',JSON.stringify([{ref:'PLAN-SYN'}]),null,null,null,null,JSON.stringify(['WIMP-SYN']),null]);
  assert.equal(impact.rows[0].data.state,'impact_measurement_linked');

  const snap=await c.query('select public.werk_get_parliamentary_trace($1) data',[traceId]);
  assert.equal(snap.rows[0].data.outcome_code,'unknown_requires_evidence');
  assert.equal(snap.rows[0].data.events.length,8);
  assert.equal(snap.rows[0].data.boundary,'descriptive_trace_only_no_actor_score_no_law_claim');
  await c.query('ROLLBACK');

  const c1=new Client({connectionString:process.env.DATABASE_URL});
  const c2=new Client({connectionString:process.env.DATABASE_URL});
  await Promise.all([c1.connect(),c2.connect()]);
  try{
    await Promise.all([c1.query('SET ROLE service_role'),c2.query('SET ROLE service_role')]);
    const race=['DEC-RACE-SYN-001','v1','c'.repeat(64),JSON.stringify([{source:'synthetic-race'}]),null];
    const [r1,r2]=await Promise.all([c1.query(createFn,race),c2.query(createFn,race)]);
    const results=[r1.rows[0].data,r2.rows[0].data];
    assert.deepEqual(results.map(x=>x.replayed).sort(),[false,true]);
    assert.equal(results[0].trace_id,results[1].trace_id);
  }finally{
    await Promise.all([c1.end(),c2.end()]);
  }
  const raceCount=await c.query(`select count(*)::int n from public.werk_parliamentary_traces where source_decision_id='DEC-RACE-SYN-001' and source_decision_version='v1'`);
  assert.equal(raceCount.rows[0].n,1);
  await c.query(`delete from public.werk_parliamentary_trace_events where trace_id in (select id from public.werk_parliamentary_traces where source_decision_id='DEC-RACE-SYN-001' and source_decision_version='v1')`);
  await c.query(`delete from public.werk_parliamentary_traces where source_decision_id='DEC-RACE-SYN-001' and source_decision_version='v1'`);

  console.log('Parliamentary trace runtime smoke: PASS');
}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{await c.end()}
