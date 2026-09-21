import pg from 'pg';
import assert from 'node:assert/strict';

const {Client}=pg;
const connectionString=process.env.DATABASE_URL;
if(!connectionString) throw new Error('DATABASE_URL is required');
const client=new Client({connectionString});
await client.connect();

async function expectPgError(sql,params,needle){
  await client.query('SAVEPOINT expected_error');
  let seen='';
  try{
    await client.query(sql,params);
  }catch(error){seen=String(error?.message||error)}
  await client.query('ROLLBACK TO SAVEPOINT expected_error');
  await client.query('RELEASE SAVEPOINT expected_error');
  assert.ok(seen.includes(needle),`expected ${needle}, got ${seen||'no error'}`);
}

const publicId='IDEA-E0FEEE0000000038';
const tokenHash='a'.repeat(64);
try{
  await client.query('BEGIN');

  const access=await client.query(`
    SELECT
      has_table_privilege('anon','public.ideenwerk_expert_inputs','SELECT') AS anon_select,
      has_table_privilege('authenticated','public.ideenwerk_expert_inputs','SELECT') AS auth_select,
      has_function_privilege('anon','public.ideenwerk_record_expert_input(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text)','EXECUTE') AS anon_exec,
      has_function_privilege('authenticated','public.ideenwerk_record_expert_input(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,boolean,boolean,text)','EXECUTE') AS auth_exec
  `);
  assert.equal(access.rows[0].anon_select,false);
  assert.equal(access.rows[0].auth_select,false);
  assert.equal(access.rows[0].anon_exec,false);
  assert.equal(access.rows[0].auth_exec,false);

  const operator=await client.query(`
    INSERT INTO operators(external_subject_hash,display_name,active)
    VALUES($1,'CI Impact Reviewer',true) RETURNING id
  `,['1'.repeat(64)]);
  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'impact_reviewer')`,[operator.rows[0].id]);

  const wrongOperator=await client.query(`
    INSERT INTO operators(external_subject_hash,display_name,active)
    VALUES($1,'CI Legal Reviewer',true) RETURNING id
  `,['2'.repeat(64)]);
  await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'legal_reviewer')`,[wrongOperator.rows[0].id]);

  const submission=await client.query(`
    INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
    VALUES($1,'ci-expert-input-submission','Die Bürgeridee benötigt belegte Fach- und Betroffenenperspektiven.','Österreich','Demokratie','received')
    RETURNING id
  `,[publicId]);
  await client.query(`INSERT INTO status_access(submission_id,token_hash) VALUES($1,$2)`,[submission.rows[0].id,tokenHash]);

  const args=[
    operator.rows[0].id,publicId,'subject_matter_expert','Öffentliche Haushaltsrechnung',
    'Rechnungshof Bericht','https://example.org/rechnungshof','RH-2026-17',
    'professional','Berufliche Tätigkeit im Fachgebiet, keine finanzielle Beteiligung an der vorgeschlagenen Maßnahme.',
    'Die vorhandene Datengrundlage erlaubt eine fachliche Einordnung, aber noch keine belastbare Aussage zur vollständigen Budgetwirkung.',
    'Die Aussage grenzt Ist-Daten ausdrücklich von einer politischen Wirkungsannahme ab.',
    'Eine Gegenposition weist darauf hin, dass Folgekosten erst mit zusätzlichen Vollzugsdaten bewertet werden können.',
    'Gegenquelle','https://example.org/gegenquelle','GQ-2026-04',
    true,true,'ci-expert-input-00000001'
  ];
  const placeholders=args.map((_,i)=>`$${i+1}`).join(',');
  const fn=`SELECT public.ideenwerk_record_expert_input(${placeholders}) AS result`;
  const first=await client.query(fn,args);
  assert.equal(first.rows[0].result.replayed,false);
  assert.match(first.rows[0].result.expert_input_id,/^EXP-[A-F0-9]{20}$/);

  const replay=await client.query(fn,args);
  assert.equal(replay.rows[0].result.replayed,true);
  assert.equal(replay.rows[0].result.expert_input_id,first.rows[0].result.expert_input_id);

  const changed=[...args];changed[9]='Diese geänderte Aussage muss unter derselben Idempotency-ID fail-closed zurückgewiesen werden.';
  await expectPgError(fn,changed,'EXPERT_INPUT_IDEMPOTENCY_CONFLICT');

  const wrongRole=[...args];wrongRole[0]=wrongOperator.rows[0].id;wrongRole[17]='ci-expert-input-00000002';
  await expectPgError(fn,wrongRole,'EXPERT_INPUT_IMPACT_REVIEWER_REQUIRED');

  const missingSource=[...args];missingSource[5]=null;missingSource[6]=null;missingSource[17]='ci-expert-input-00000003';
  await expectPgError(fn,missingSource,'EXPERT_INPUT_SOURCE_BINDING_REQUIRED');

  await expectPgError(
    `UPDATE public.ideenwerk_expert_inputs SET statement=statement || ' manipuliert' WHERE expert_input_id=$1`,
    [first.rows[0].result.expert_input_id],
    'EXPERT_INPUT_APPEND_ONLY'
  );

  const citizen=await client.query(`SELECT public.ideenwerk_expert_input_citizen_view($1::uuid) AS data`,[submission.rows[0].id]);
  assert.equal(citizen.rows[0].data.length,1);
  const visible=citizen.rows[0].data[0];
  assert.equal(visible.contributor_type,'subject_matter_expert');
  assert.equal(visible.relationship_code,'professional');
  assert.equal(visible.source_reference,'RH-2026-17');
  assert.equal(visible.counterposition.source_reference,'GQ-2026-04');
  assert.equal(Object.hasOwn(visible,'recorded_by_operator_id'),false);
  assert.equal(Object.hasOwn(visible,'idempotency_key'),false);
  assert.equal(Object.hasOwn(visible,'payload_hash'),false);

  const status=await client.query(`SELECT public.ideenwerk_get_private_status($1,$2) AS data`,[publicId,tokenHash]);
  assert.equal(status.rows[0].data.expert_inputs.length,1);
  assert.equal(status.rows[0].data.expert_inputs[0].expert_input_id,first.rows[0].result.expert_input_id);
  assert.equal(Object.hasOwn(status.rows[0].data.expert_inputs[0],'recorded_by_operator_id'),false);

  const exported=await client.query(`SELECT public.ideenwerk_get_privacy_export($1,$2) AS data`,[publicId,tokenHash]);
  assert.equal(exported.rows[0].data.expert_inputs.length,1);

  const transparency=await client.query(`SELECT public.ideenwerk_expert_input_transparency() AS data`);
  assert.equal(transparency.rows[0].data.total_entries,1);
  assert.equal(transparency.rows[0].data.submissions_with_input,1);
  assert.equal(transparency.rows[0].data.by_contributor_type.subject_matter_expert,1);
  assert.equal(JSON.stringify(transparency.rows[0].data).includes('Budgetwirkung'),false);
  assert.equal(JSON.stringify(transparency.rows[0].data).includes(publicId),false);

  const audit=await client.query(`
    SELECT payload FROM audit_events
     WHERE subject_type='submission' AND subject_id=$1 AND event_type='expert_input_recorded'
     ORDER BY created_at DESC LIMIT 1
  `,[publicId]);
  assert.equal(audit.rowCount,1);
  assert.equal(audit.rows[0].payload.boundary,'evidence_input_only_no_veto_no_ranking_no_accept_reject');
  assert.equal(Object.hasOwn(audit.rows[0].payload,'operator_id'),false);

  await client.query('ROLLBACK');
  console.log('expert input DB smoke: PASS');
}catch(error){
  await client.query('ROLLBACK').catch(()=>{});
  throw error;
}finally{
  await client.end();
}
