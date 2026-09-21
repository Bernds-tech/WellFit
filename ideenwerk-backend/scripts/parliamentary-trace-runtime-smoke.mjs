import pg from 'pg';
import assert from 'node:assert/strict';
const {Client}=pg;
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const c=new Client({connectionString:process.env.DATABASE_URL});
await c.connect();
async function expectError(sql,params,needle){await c.query('SAVEPOINT exp');let m='';try{await c.query(sql,params)}catch(e){m=String(e?.message||e)}await c.query('ROLLBACK TO SAVEPOINT exp');await c.query('RELEASE SAVEPOINT exp');assert.ok(m.includes(needle),`expected ${needle}, got ${m||'no error'}`)}
try{
  await c.query('BEGIN');
  const acl=await c.query(`SELECT
    has_table_privilege('anon','public.werk_parliamentary_traces','SELECT') anon_select,
    has_table_privilege('authenticated','public.werk_parliamentary_traces','SELECT') auth_select,
    has_function_privilege('anon','public.werk_create_parliamentary_trace(text,text,text,jsonb,uuid)','EXECUTE') anon_exec,
    has_function_privilege('service_role','public.werk_create_parliamentary_trace(text,text,text,jsonb,uuid)','EXECUTE') service_exec`);
  assert.equal(acl.rows[0].anon_select,false);assert.equal(acl.rows[0].auth_select,false);
  assert.equal(acl.rows[0].anon_exec,false);assert.equal(acl.rows[0].service_exec,true);

  const createFn=`select public.werk_create_parliamentary_trace($1,$2,$3,$4::jsonb,$5) data`;
  const a=['DEC-SYN-001','v1','a'.repeat(64),JSON.stringify([{source:'synthetic'}]),null];
  const first=await c.query(createFn,a);assert.equal(first.rows[0].data.replayed,false);
  const traceId=first.rows[0].data.trace_id;assert.match(traceId,/^WTRACE-[A-F0-9]{20}$/);
  const replay=await c.query(createFn,a);assert.equal(replay.rows[0].data.replayed,true);
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
  assert.equal(snap.rows[0].data.events.length,7);
  assert.equal(snap.rows[0].data.boundary,'descriptive_trace_only_no_actor_score_no_law_claim');

  await c.query('ROLLBACK');
  console.log('Parliamentary trace runtime smoke: PASS');
}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{await c.end()}
